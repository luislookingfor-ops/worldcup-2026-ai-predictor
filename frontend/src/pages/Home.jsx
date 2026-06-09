import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMatches } from '../services/api';
import MatchCard from '../components/matches/MatchCard';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';
import './Home.css';

export default function Home() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadMatches() {
      try {
        setLoading(true);
        // Load scheduled matches for homepage
        const res = await getMatches({ status: 'SCHEDULED' });
        if (res.success && res.data) {
          // Take first 3 matches
          setMatches(res.data.slice(0, 3));
        }
      } catch (err) {
        setError(err.message || 'Error al cargar los próximos partidos');
      } finally {
        setLoading(false);
      }
    }

    loadMatches();
  }, []);

  return (
    <div className="home-page container animate-fadeIn">
      {/* Hero Section */}
      <section className="hero-section glass-card">
        <div className="hero-content">
          <span className="hero-badge badge badge-primary animate-pulse">Mundial FIFA 2026</span>
          <h1 className="hero-title">
            Pronostica con <span className="gradient-text">Inteligencia Artificial</span>
          </h1>
          <p className="hero-subtitle">
            Únete a la plataforma de predicciones definitiva para el Mundial de Fútbol 2026. Analiza partidos, obtén predicciones tácticas y de probabilidad de Copa26 AI y compite con amigos en la clasificación general.
          </p>
          <div className="hero-ctas">
            <Link to="/partidos">
              <Button variant="primary" size="lg">Hacer Pronósticos</Button>
            </Link>
            <Link to="/chat">
              <Button variant="secondary" size="lg">Chatear con la IA</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Tournament Stats */}
      <section className="stats-section">
        <h2 className="section-title text-center">Mundial en Cifras</h2>
        <div className="grid-stats">
          <div className="stat-card glass-card">
            <span className="stat-num gradient-text">48</span>
            <span className="stat-label">Selecciones</span>
          </div>
          <div className="stat-card glass-card">
            <span className="stat-num gradient-text">104</span>
            <span className="stat-label">Partidos</span>
          </div>
          <div className="stat-card glass-card">
            <span className="stat-num gradient-text">16</span>
            <span className="stat-label">Ciudades Sedes</span>
          </div>
          <div className="stat-card glass-card">
            <span className="stat-num gradient-text">3</span>
            <span className="stat-label">Países Anfitriones</span>
          </div>
        </div>
      </section>

      {/* Featured matches / Upcoming matches */}
      <section className="upcoming-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Próximos Partidos</h2>
            <p className="section-subtitle">
              Los siguientes encuentros están listos para ser pronosticados. Pon a prueba tus conocimientos contra Copa26 AI.
            </p>
          </div>
          <Link to="/partidos" className="view-all-link">
            Ver Todos los Partidos →
          </Link>
        </div>

        {loading ? (
          <Loading text="Cargando próximos partidos..." />
        ) : error ? (
          <div className="error-card glass-card">
            <p>{error}</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="empty-state glass-card">
            <div className="empty-state-icon">⚽</div>
            <h3 className="empty-state-title">No hay partidos próximos programados</h3>
            <p className="empty-state-text">
              Vuelve más tarde para ver la programación oficial de los partidos del Mundial.
            </p>
          </div>
        ) : (
          <div className="grid-matches">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </section>

      {/* AI Grounding Feature Info */}
      <section className="ai-feature-section glass-card">
        <div className="ai-feature-grid">
          <div className="ai-feature-content">
            <span className="badge badge-accent">Tecnología de Punta</span>
            <h3 className="feature-title">¿Cómo funciona nuestro Agente IA?</h3>
            <p className="feature-text">
              Utilizamos los modelos avanzados de <strong>Azure AI Foundry</strong> potenciados con búsqueda en la web en tiempo real. Copa26 AI no solo analiza estadísticas históricas, sino que se mantiene al tanto de las lesiones de última hora, conferencias de prensa y estado de forma de los jugadores.
            </p>
            <ul className="feature-list">
              <li>⚽ <strong>Búsqueda Grounding:</strong> Respuestas basadas en la web de hoy día.</li>
              <li>📊 <strong>Cálculo de Probabilidad:</strong> Porcentajes de victoria y empates ponderados.</li>
              <li>🧠 <strong>Predicción de Marcador Exacto:</strong> Basado en debilidades y fortalezas tácticas.</li>
            </ul>
          </div>
          <div className="ai-feature-visual">
            <div className="visual-circle">
              <span className="visual-logo">🤖⚽</span>
              <div className="visual-pulse"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
