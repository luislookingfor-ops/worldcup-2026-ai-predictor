import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-inner container">
        <div className="footer-brand">
          <span className="footer-logo">⚽ Copa26 AI</span>
          <p className="footer-tagline">Predicciones inteligentes para el Mundial 2026</p>
        </div>

        <div className="footer-links">
          <div className="footer-column">
            <h4 className="footer-column-title">Plataforma</h4>
            <a href="/partidos">Partidos</a>
            <a href="/chat">Chat IA</a>
            <a href="/predicciones">Predicciones</a>
            <a href="/clasificacion">Clasificación</a>
          </div>
          <div className="footer-column">
            <h4 className="footer-column-title">Tecnología</h4>
            <span>Azure AI Agent Service</span>
            <span>Football-Data.org</span>
            <span>React + Vite</span>
            <span>Supabase</span>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">
            © 2026 Copa26 AI — Creado con 💚 para el fútbol
          </p>
          <div className="footer-powered">
            <span>Impulsado por</span>
            <span className="badge badge-secondary">Azure AI</span>
            <span className="badge badge-primary">Football-Data.org</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
