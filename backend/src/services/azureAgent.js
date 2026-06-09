/**
 * @fileoverview Azure AI Foundry Agent service.
 *
 * Uses the @azure/ai-projects SDK to interact with a deployed AI agent for:
 *   - Free-form chat about World Cup 2026
 *   - Structured match predictions
 *
 * Includes a REST-based fallback in case the SDK is unavailable or fails.
 */

const POLL_INTERVAL_MS = 1_000;
const MAX_POLL_TIMEOUT_MS = 60_000;

class AzureAgentService {
  constructor() {
    this.connectionString = process.env.AZURE_AI_PROJECT_CONNECTION_STRING;
    this.agentId = process.env.AZURE_AGENT_ID;
    this.apiKey = process.env.AZURE_AI_API_KEY;
    this.endpoint = process.env.AZURE_AI_ENDPOINT;

    /** @type {import('@azure/ai-projects').AIProjectsClient | null} */
    this.client = null;

    /** Whether SDK initialisation succeeded */
    this.sdkAvailable = false;

    this._initSDK();
  }

  // ---------- Initialisation ----------

  /** Try to initialise the Azure AI Projects SDK client. */
  async _initSDK() {
    try {
      const { AIProjectsClient } = require('@azure/ai-projects');

      if (this.connectionString) {
        // Prefer connection-string auth (works with API keys too)
        if (this.apiKey) {
          // Use API key credential
          const { AzureKeyCredential } = require('@azure/core-auth');
          this.client = AIProjectsClient.fromConnectionString(
            this.connectionString,
            new AzureKeyCredential(this.apiKey)
          );
        } else {
          // Use DefaultAzureCredential (managed identity / CLI / env vars)
          const { DefaultAzureCredential } = require('@azure/identity');
          this.client = AIProjectsClient.fromConnectionString(
            this.connectionString,
            new DefaultAzureCredential()
          );
        }
        this.sdkAvailable = true;
        console.log('✅ Azure AI Projects SDK client initialised.');
      } else {
        console.warn(
          '⚠️  AZURE_AI_PROJECT_CONNECTION_STRING not set – SDK unavailable.'
        );
      }
    } catch (err) {
      console.warn('⚠️  Azure AI SDK init failed, will use REST fallback:', err.message);
    }
  }

  // ========================================================================
  //  SDK-Based Methods
  // ========================================================================

  /**
   * Send a chat message to the AI agent and wait for a response.
   *
   * Creates a new thread if `threadId` is not supplied.
   * Polls the run until completion or timeout (60 s).
   *
   * @param {string} userMessage - The user's message text.
   * @param {string} [threadId]  - Optional existing thread ID to continue.
   * @returns {Promise<{ threadId: string, response: string, role: string }>}
   */
  async chat(userMessage, threadId = null) {
    // Attempt SDK path first, fall back to REST
    if (this.sdkAvailable && this.client) {
      try {
        return await this._chatSDK(userMessage, threadId);
      } catch (err) {
        console.warn('⚠️  SDK chat failed, falling back to REST:', err.message);
      }
    }
    return this._chatREST(userMessage, threadId);
  }

  /**
   * Generate a structured match prediction via the agent.
   *
   * @param {string} homeTeam    - Home team name.
   * @param {string} awayTeam    - Away team name.
   * @param {object} [matchContext={}] - Optional extra context (stage, group, etc.).
   * @returns {Promise<{ threadId: string, response: string, role: string }>}
   */
  async getPrediction(homeTeam, awayTeam, matchContext = {}) {
    const prompt = this._buildPredictionPrompt(homeTeam, awayTeam, matchContext);
    return this.chat(prompt);
  }

  // ---------- SDK Implementation ----------

  /**
   * Internal: chat via Azure AI Projects SDK.
   * @private
   */
  async _chatSDK(userMessage, threadId) {
    // Create or reuse thread
    let thread;
    if (threadId) {
      thread = await this.client.agents.getThread(threadId);
    } else {
      thread = await this.client.agents.createThread();
    }

    console.log(`🤖 Agent thread: ${thread.id}`);

    // Post the user message
    await this.client.agents.createMessage(thread.id, {
      role: 'user',
      content: userMessage,
    });

    // Start a run with the configured agent
    let run = await this.client.agents.createRun(thread.id, {
      assistantId: this.agentId,
    });

    console.log(`🏃 Agent run: ${run.id} — status: ${run.status}`);

    // Poll until terminal state or timeout
    const deadline = Date.now() + MAX_POLL_TIMEOUT_MS;

    while (
      !['completed', 'failed', 'cancelled', 'expired'].includes(run.status)
    ) {
      if (Date.now() > deadline) {
        throw new Error('Agent run timed out after 60 seconds.');
      }
      await this._sleep(POLL_INTERVAL_MS);
      run = await this.client.agents.getRun(thread.id, run.id);
      console.log(`   ⏳ Run status: ${run.status}`);
    }

    if (run.status !== 'completed') {
      throw new Error(`Agent run ended with status: ${run.status}`);
    }

    // Retrieve the latest assistant message
    const messages = await this.client.agents.listMessages(thread.id);
    const assistantMessages = messages.data.filter(
      (m) => m.role === 'assistant'
    );

    if (!assistantMessages.length) {
      throw new Error('No assistant response found in thread.');
    }

    const latest = assistantMessages[0];
    const responseText = latest.content
      .filter((c) => c.type === 'text')
      .map((c) => c.text.value)
      .join('\n');

    return {
      threadId: thread.id,
      response: responseText,
      role: 'assistant',
    };
  }

  // ========================================================================
  //  REST Fallback
  // ========================================================================

  /**
   * Internal: chat via direct REST API calls (fallback).
   * Uses the OpenAI-compatible Assistants API on Azure.
   * @private
   */
  async _chatREST(userMessage, threadId) {
    if (!this.endpoint || !this.apiKey) {
      throw new Error(
        'Azure REST fallback requires AZURE_AI_ENDPOINT and AZURE_AI_API_KEY.'
      );
    }

    const baseUrl = this.endpoint.replace(/\/+$/, '');
    const headers = {
      'Content-Type': 'application/json',
      'api-key': this.apiKey,
      Authorization: `Bearer ${this.apiKey}`,
    };

    // 1. Create or reuse a thread
    let currentThreadId = threadId;
    if (!currentThreadId) {
      const threadRes = await fetch(`${baseUrl}/openai/threads?api-version=2024-05-01-preview`, {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
      });
      if (!threadRes.ok) {
        throw new Error(`REST create thread failed: ${threadRes.status} ${await threadRes.text()}`);
      }
      const threadData = await threadRes.json();
      currentThreadId = threadData.id;
    }

    console.log(`🤖 REST thread: ${currentThreadId}`);

    // 2. Post user message
    const msgRes = await fetch(
      `${baseUrl}/openai/threads/${currentThreadId}/messages?api-version=2024-05-01-preview`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ role: 'user', content: userMessage }),
      }
    );
    if (!msgRes.ok) {
      throw new Error(`REST create message failed: ${msgRes.status} ${await msgRes.text()}`);
    }

    // 3. Create a run
    const runRes = await fetch(
      `${baseUrl}/openai/threads/${currentThreadId}/runs?api-version=2024-05-01-preview`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ assistant_id: this.agentId }),
      }
    );
    if (!runRes.ok) {
      throw new Error(`REST create run failed: ${runRes.status} ${await runRes.text()}`);
    }
    let run = await runRes.json();
    console.log(`🏃 REST run: ${run.id} — status: ${run.status}`);

    // 4. Poll for completion
    const deadline = Date.now() + MAX_POLL_TIMEOUT_MS;
    while (
      !['completed', 'failed', 'cancelled', 'expired'].includes(run.status)
    ) {
      if (Date.now() > deadline) {
        throw new Error('Agent run timed out after 60 seconds.');
      }
      await this._sleep(POLL_INTERVAL_MS);
      const pollRes = await fetch(
        `${baseUrl}/openai/threads/${currentThreadId}/runs/${run.id}?api-version=2024-05-01-preview`,
        { headers }
      );
      run = await pollRes.json();
      console.log(`   ⏳ REST run status: ${run.status}`);
    }

    if (run.status !== 'completed') {
      throw new Error(`Agent run ended with status: ${run.status}`);
    }

    // 5. Retrieve messages
    const msgsRes = await fetch(
      `${baseUrl}/openai/threads/${currentThreadId}/messages?api-version=2024-05-01-preview`,
      { headers }
    );
    const msgsData = await msgsRes.json();
    const assistantMsgs = msgsData.data.filter((m) => m.role === 'assistant');

    if (!assistantMsgs.length) {
      throw new Error('No assistant response from REST fallback.');
    }

    const latest = assistantMsgs[0];
    const responseText = latest.content
      .filter((c) => c.type === 'text')
      .map((c) => c.text.value)
      .join('\n');

    return {
      threadId: currentThreadId,
      response: responseText,
      role: 'assistant',
    };
  }

  // ---------- Helpers ----------

  /**
   * Build a structured prediction prompt.
   * @private
   */
  _buildPredictionPrompt(homeTeam, awayTeam, context) {
    const contextLines = Object.entries(context)
      .map(([k, v]) => `- ${k}: ${v}`)
      .join('\n');

    return `
You are a football analytics expert. Provide a detailed prediction for this World Cup 2026 match.

**Match:** ${homeTeam} vs ${awayTeam}
${contextLines ? `**Context:**\n${contextLines}` : ''}

Please respond with a JSON object inside a code block:
\`\`\`json
{
  "homeTeam": "${homeTeam}",
  "awayTeam": "${awayTeam}",
  "predictedHomeScore": <number>,
  "predictedAwayScore": <number>,
  "confidence": <number 0-100>,
  "analysis": "<string with your reasoning>",
  "keyFactors": ["<factor1>", "<factor2>", "<factor3>"],
  "playerToWatch": "<name>"
}
\`\`\`
    `.trim();
  }

  /**
   * Promise-based sleep.
   * @param {number} ms
   * @returns {Promise<void>}
   * @private
   */
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton
module.exports = new AzureAgentService();
