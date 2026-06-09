import ChatPanel from '../components/chat/ChatPanel';

export default function Chat() {
  return (
    <div className="chat-page container animate-fadeIn" style={{ padding: 'var(--space-8) var(--space-4)' }}>
      <header className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
        <h1 className="page-title" style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-2)' }}>
          Copa26 AI Chat Agent
        </h1>
        <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-base)' }}>
          Conversa con nuestro modelo analítico de IA sobre estadísticas, alineaciones, lesionados o el calendario del Mundial 2026.
        </p>
      </header>

      <ChatPanel />
    </div>
  );
}
