import { useState, useRef, useEffect } from 'react';
import { chatWithAgent } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import './ChatPanel.css';

const QUICK_QUESTIONS = [
  '¿Quién es el favorito para ganar el Mundial 2026?',
  '¿Cómo funciona el nuevo formato de 48 equipos?',
  'Predice el partido inaugural',
  '¿Cuáles son las sedes del Mundial?',
];

export default function ChatPanel() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: '¡Hola! Soy **Copa26 AI**, tu asistente experto para el Mundial de Fútbol 2026. Pregúntame sobre cualquier selección, calendario, predicciones de partidos o estadísticas históricas. ¿De qué te gustaría hablar hoy?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [threadId, setThreadId] = useState(null);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    if (!textToSend || !textToSend.trim() || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await chatWithAgent(userMsg.content, threadId);
      if (res.success && res.data) {
        setThreadId(res.data.threadId);
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: res.data.role || 'assistant',
            content: res.data.response,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '⚠️ Lo siento, he tenido un problema al procesar tu solicitud. Por favor, vuelve a intentarlo en unos instantes.',
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  // Simple formatter for bold text, lists, and line breaks
  const formatMessage = (text) => {
    if (!text) return '';
    
    // Replace markdown headings
    let formatted = text
      .replace(/^### (.*$)/gim, '<h4>$1</h4>')
      .replace(/^## (.*$)/gim, '<h3>$1</h3>')
      .replace(/^# (.*$)/gim, '<h2>$1</h2>');

    // Replace bold text
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Replace lists
    formatted = formatted.replace(/^\s*[-*]\s+(.*)$/gim, '<li>$1</li>');
    
    // Wrap lists in ul
    // This is a naive regex but works for simple lists in AI outputs
    const lines = formatted.split('\n');
    let inList = false;
    const processedLines = lines.map(line => {
      if (line.startsWith('<li>') && !inList) {
        inList = true;
        return '<ul>' + line;
      }
      if (!line.startsWith('<li>') && inList) {
        inList = false;
        return '</ul>' + line;
      }
      return line;
    });
    
    if (inList) {
      processedLines.push('</ul>');
    }

    // Join lines and replace line breaks (excluding list tags)
    return processedLines.join('\n').replace(/\n/g, '<br />');
  };

  return (
    <div className="chat-panel glass-card">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-ai-info">
          <div className="chat-avatar">⚽</div>
          <div>
            <h4 className="chat-bot-name">Copa26 AI</h4>
            <span className="chat-bot-status">En línea — Experto del Mundial</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages-container">
        {messages.map(msg => (
          <div key={msg.id} className={`chat-message-row chat-message-row--${msg.role}`}>
            {msg.role === 'assistant' && <div className="chat-message-avatar">🤖</div>}
            <div className={`chat-message-bubble chat-message-bubble--${msg.role} ${msg.isError ? 'chat-message-bubble--error' : ''}`}>
              <div 
                className="chat-message-text"
                dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
              />
              <span className="chat-message-time">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {msg.role === 'user' && <div className="chat-message-avatar chat-message-avatar--user">👤</div>}
          </div>
        ))}

        {loading && (
          <div className="chat-message-row chat-message-row--assistant">
            <div className="chat-message-avatar">🤖</div>
            <div className="chat-message-bubble chat-message-bubble--assistant chat-message-bubble--typing">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length === 1 && (
        <div className="chat-suggestions">
          <p className="suggestions-title">Preguntas sugeridas:</p>
          <div className="suggestions-list">
            {QUICK_QUESTIONS.map((q, idx) => (
              <button 
                key={idx} 
                className="suggestion-chip"
                onClick={() => handleSendMessage(q)}
                disabled={loading}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="chat-input-field"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pregúntale a Copa26 AI sobre partidos, grupos..."
          disabled={loading}
          maxLength={1000}
        />
        <Button 
          type="submit" 
          variant="primary" 
          className="chat-send-btn"
          disabled={loading || !input.trim()}
        >
          Enviar
        </Button>
      </form>
    </div>
  );
}
