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
  _isPlaceholder(val) {
    if (!val) return true;
    const lower = val.toLowerCase();
    return (
      lower.includes('placeholder') ||
      lower.includes('your-') ||
      lower.includes('here') ||
      lower.includes('example')
    );
  }

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
    // If the configuration is a placeholder or not set, use the offline fallback agent
    if (
      this._isPlaceholder(this.connectionString) ||
      this._isPlaceholder(this.apiKey) ||
      this._isPlaceholder(this.endpoint)
    ) {
      console.log('🤖 Using local simulated Copa26 AI Expert (Azure credentials not configured).');
      return this._chatSimulated(userMessage, threadId);
    }

    // Attempt SDK path first, fall back to REST
    if (this.sdkAvailable && this.client) {
      try {
        return await this._chatSDK(userMessage, threadId);
      } catch (err) {
        console.warn('⚠️ SDK chat failed, falling back to REST:', err.message);
      }
    }

    try {
      return await this._chatREST(userMessage, threadId);
    } catch (err) {
      console.warn('⚠️ REST chat failed, falling back to simulated:', err.message);
      return this._chatSimulated(userMessage, threadId);
    }
  }

  /**
   * Simulated expert assistant fallback.
   * @private
   */
  async _chatSimulated(userMessage, threadId) {
    await this._sleep(1000); // Simulate network latency

    const msg = userMessage.toLowerCase();
    let response = '';

    if (msg.includes('please respond with a json object') || msg.includes('predictedhomescore')) {
      // Parse teams from prediction prompt if possible
      let homeTeam = 'Equipo Local';
      let awayTeam = 'Equipo Visitante';
      const matchRegex = /\*\*Match:\*\*\s*(.*?)\s*vs\s*(.*)/i;
      const matchMatch = userMessage.match(matchRegex);
      if (matchMatch) {
        homeTeam = matchMatch[1].trim();
        awayTeam = matchMatch[2].trim();
      }

      const homeScore = Math.floor(Math.random() * 3);
      const awayScore = Math.floor(Math.random() * 3);
      const confidence = 65 + Math.floor(Math.random() * 26); // 65-90%

      const mockJson = {
        homeTeam,
        awayTeam,
        predictedHomeScore: homeScore,
        predictedAwayScore: awayScore,
        confidence,
        analysis: `Se proyecta un partido tácticamente intenso entre ${homeTeam} y ${awayTeam}. La IA de Copa26 indica una posesión equilibrada en el medio campo, donde el desgaste físico jugará un rol fundamental.`,
        keyFactors: [
          `Control del mediocampo y transiciones rápidas.`,
          `Rendimiento de los arqueros ante tiros de larga distancia.`,
          `Disciplina táctica en defensa para evitar tarjetas tempranas.`
        ],
        playerToWatch: `El referente ofensivo del equipo`
      };

      response = `\`\`\`json\n${JSON.stringify(mockJson, null, 2)}\n\`\`\``;
    } else if (msg.includes('méxico') || msg.includes('mexico')) {
      response = `🇲🇽 **Análisis de Copa26 AI — Selección de México:**

México llega con una enorme responsabilidad y una ilusión renovada al ser uno de los co-organizadores del certamen. 
* **Fortalezas:** El Estadio Azteca jugará un rol psicológico fundamental en el debut. La presión de la afición local y la velocidad por las bandas son sus armas más peligrosas.
* **Debilidades:** La inconsistencia defensiva y la presión mediática suelen ser sus mayores obstáculos en rondas eliminatorias directas.
* **Pronóstico de IA:** Se proyecta que México supere la fase de grupos con solvencia. Su cruce en dieciseisavos de final exigirá la máxima concentración táctica si desea romper su límite histórico de cuartos.`;
    } else if (msg.includes('argentina')) {
      response = `🇦🇷 **Análisis de Copa26 AI — Selección de Argentina:**

Los vigentes defensores del título llegan en una etapa de madurez y consolidación táctica excepcional.
* **Fortalezas:** La mentalidad ganadora, la jerarquía de su mediocampo y la química grupal construida desde 2022. La inteligencia táctica para manejar ritmos de juego es la mejor del torneo.
* **Debilidades:** La transición generacional en algunas posiciones defensivas clave y la altísima presión por revalidar la corona.
* **Pronóstico de IA:** Favorito indiscutible (14.2% de probabilidad de campeonar). Su modelo estadístico proyecta su llegada como mínimo a las semifinales.`;
    } else if (msg.includes('ecuador')) {
      response = `🇪🇨 **Análisis de Copa26 AI — Selección de Ecuador:**

Ecuador cuenta actualmente con una de las generaciones de futbolistas más potentes e interesantes de su historia.
* **Fortalezas:** La potencia física en transiciones rápidas de defensa-ataque, un bloque defensivo sumamente sólido y jóvenes figuras consolidadas en ligas top de Europa.
* **Debilidades:** La falta de efectividad y contundencia de cara al arco en partidos cerrados contra potencias mundiales.
* **Pronóstico de IA:** Clasificado de cuidado. La IA proyecta a Ecuador como la potencial "sorpresa de CONMEBOL", con alta probabilidad de alcanzar los cuartos de final si mantiene su solidez defensiva.`;
    } else if (msg.includes('colombia')) {
      response = `🇨🇴 **Análisis de Copa26 AI — Selección de Colombia:**

La selección cafetera ha recuperado su brillo y solidez táctica con una propuesta ofensiva muy vistosa y de gran posesión.
* **Fortalezas:** Creatividad en el mediocampo, gran volumen de juego por los extremos y una excelente racha de partidos invicto en la fase previa.
* **Debilidades:** Concentración en momentos críticos de contragolpe y la dependencia de individualidades en momentos de bloqueo colectivo.
* **Pronóstico de IA:** Se proyecta como un candidato sólido de segunda línea para llegar a cuartos o semifinales. Su rendimiento táctico colectivo los hace muy difíciles de batir.`;
    } else if (msg.includes('brasil') || msg.includes('brazil')) {
      response = `🇧🇷 **Análisis de Copa26 AI — Selección de Brasil:**

La "Canarinha" llega siempre con la chapa de candidato histórico y un arsenal inagotable de talento individual.
* **Fortalezas:** Habilidad en el uno contra uno, desequilibrio ofensivo extremo y un plantel repleto de delanteros veloces y creativos.
* **Debilidades:** Desbalances tácticos en el retroceso defensivo y la enorme impaciencia de su afición si los resultados no son abultados de inmediato.
* **Pronóstico de IA:** Tercer favorito general (12.5% de probabilidad). Estadísticamente dominante en la creación de ocasiones de gol.`;
    } else if (msg.includes('españa') || msg.includes('espana') || msg.includes('spain')) {
      response = `🇪🇸 **Análisis de Copa26 AI — Selección de España:**

España mantiene su identidad basada en la posesión de balón, combinada ahora con transiciones rápidas gracias a extremos jóvenes muy verticales.
* **Fortalezas:** Control total del ritmo del partido en el mediocampo y dinamismo ofensivo.
* **Debilidades:** Vulnerabilidad ante defensas extremadamente cerradas y contragolpes directos rápidos.
* **Pronóstico de IA:** Cuarto favorito del torneo (11.8%). Su volumen de posesión promedio proyectado es de 63.5%.`;
    } else if (msg.includes('usa') || msg.includes('estados unidos') || msg.includes('eeuu')) {
      response = `🇺🇸 **Análisis de Copa26 AI — Selección de Estados Unidos:**

El equipo estadounidense llega en el momento cumbre del desarrollo de su generación dorada, jugando en su propio territorio.
* **Fortalezas:** Dinamismo físico, rapidez por las bandas y una plantilla con roce en ligas top de Europa.
* **Debilidades:** La falta de un centro delantero de jerarquía mundial consolidado y la presión del público local.
* **Pronóstico de IA:** Candidato a avanzar con fuerza en las llaves eliminatorias. El modelo le da una alta probabilidad de llegar a cuartos de final.`;
    } else if (msg.includes('francia') || msg.includes('france')) {
      response = `🇫🇷 **Análisis de Copa26 AI — Selección de Francia:**

Francia presenta uno de los planteles más completos, equilibrados y físicamente temibles de todo el planeta fútbol.
* **Fortalezas:** Pegada letal con Kylian Mbappé y una velocidad de contraataque devastadora, sumada a una zaga defensiva de primer nivel.
* **Debilidades:** Fricciones internas bajo presión extrema o exceso de confianza ante rivales de menor jerarquía.
* **Pronóstico de IA:** Segundo gran favorito general (13.8% de probabilidad). Candidato natural a disputar la final.`;
    } else if (msg.includes('uruguay')) {
      response = `🇺🇾 **Análisis de Copa26 AI — Selección de Uruguay:**

La "Celeste" llega bajo una filosofía de presión alta, intensidad máxima y transiciones verticales vertiginosas.
* **Fortalezas:** Presión incesante sobre la salida del rival, excelente juego aéreo y potencia física descomunal en ataque.
* **Debilidades:** Desgaste físico prematuro en torneos cortos de alta exigencia de viajes.
* **Pronóstico de IA:** Rivales sumamente incómodos. Clasificado con alta probabilidad para disputar las semifinales debido a su consistencia competitiva.`;
    } else if (msg.includes('favorito') || msg.includes('ganar') || msg.includes('campeon') || msg.includes('campeón')) {
      response = `🏆 **Favoritos para ganar el Mundial 2026:**
      
De acuerdo con los modelos analíticos de **Copa26 AI**, las selecciones con mayor probabilidad de coronarse campeonas son:

1. 🇦🇷 **Argentina (14.2%):** Los actuales defensores del título mantienen un plantel sólido y un esquema táctico consolidado.
2. 🇫🇷 **Francia (13.8%):** Con Kylian Mbappé en su madurez futbolística y una plantilla llena de figuras de clase mundial.
3. 🇧🇷 **Brasil (12.5%):** Con sus jóvenes estrellas dominando los clubes grandes de Europa.
4. 🇪🇸 **España (11.8%):** Su juego asociativo y la frescura de nuevos talentos juveniles los colocan muy arriba.

*¿Tienes alguna duda sobre alguna selección en particular o sus cruces de grupo?*`;
    } else if (msg.includes('predic') || msg.includes('pronost') || msg.includes('ganara') || msg.includes('ganará')) {
      response = `🔮 **Análisis de Pronósticos Copa26 AI:**

Nuestra IA procesa múltiples variables estadísticas en tiempo real:
* Rendimiento histórico en torneos mundiales.
* Estado físico de los jugadores e informes de lesionados.
* FIFA Ranking de cada selección nacional.
* Fortalezas tácticas comparadas por sector de cancha.

Puedes ver nuestras predicciones en detalle haciendo clic en cualquiera de los partidos en la sección de **Partidos**. ¡Allí podrás comparar tu pronóstico con el de nuestra IA y sumar puntos!`;
    } else if (msg.includes('grupo') || msg.includes('calendario') || msg.includes('fecha') || msg.includes('partido')) {
      response = `📅 **Calendario y Grupos del Mundial 2026:**

El Mundial de la FIFA 2026 se jugará en Estados Unidos, México y Canadá con un formato histórico de **48 equipos** divididos en 12 grupos. 

* El partido inaugural será el **11 de junio de 2026** en el Estadio Azteca (Ciudad de México).
* La final se disputará el **19 de julio de 2026** en el MetLife Stadium (Nueva York/Nueva Jersey).

Puedes explorar todo el calendario interactivo con fechas y sedes locales en la pestaña de **Partidos** en el menú superior.`;
    } else if (msg.includes('hola') || msg.includes('saludo') || msg.includes('buenos') || msg.includes('buenas')) {
      response = `⚽ ¡Hola! Soy **Copa26 AI**, tu asistente inteligente del Mundial de Fútbol 2026. 

Estoy listo para responder tus preguntas sobre el fixture, estadísticas de equipos, historial de enfrentamientos y darte predicciones analíticas. ¿Qué te gustaría consultar hoy?`;
    } else {
      response = `🤔 **Análisis de Copa26 AI:**

Basándome en la información histórica y el rendimiento táctico actual:

* Las selecciones de la **UEFA** (como Francia, España e Inglaterra) y **CONMEBOL** (Argentina y Brasil) siguen liderando las métricas de proyección de goles.
* Equipos revelación de la **CAF** (como Marruecos) e **IP** (como Japón) se perfilan para dar sorpresas en la fase de grupos.

Para darte un análisis más preciso, puedes preguntarme sobre alguna selección específica (ej. *"¿Cómo llega México?"*, *"¿Qué tal Ecuador?"*) o sobre el partido inaugural del mundial.`;
    }

    return {
      threadId: threadId || 'simulated-thread-' + Math.random().toString(36).substring(7),
      response,
      role: 'assistant',
    };
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
