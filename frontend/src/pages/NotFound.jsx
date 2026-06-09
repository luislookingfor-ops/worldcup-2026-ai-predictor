import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

export default function NotFound() {
  return (
    <div className="not-found-page container animate-fadeIn" style={{ padding: 'var(--space-16) var(--space-4)', textAlign: 'center' }}>
      <div className="glass-card" style={{ padding: 'var(--space-12) var(--space-6)', maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-6)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
        <span style={{ fontSize: '4rem' }}>🚩⚽</span>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-4xl)' }}>¡Fuera de Juego!</h1>
        <h2 style={{ fontSize: 'var(--text-xl)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Error 404 — Página no encontrada</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', lineHeight: 1.6, maxWidth: '360px' }}>
          El árbitro ha pitado fuera de juego. La sección o el partido que estás buscando ha sido anulado o no existe.
        </p>
        <Link to="/">
          <Button variant="primary">Volver al Inicio</Button>
        </Link>
      </div>
    </div>
  );
}
