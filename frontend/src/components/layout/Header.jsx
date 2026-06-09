import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

const NAV_LINKS = [
  { to: '/', label: 'Inicio', icon: '🏠' },
  { to: '/partidos', label: 'Partidos', icon: '⚽' },
  { to: '/chat', label: 'Chat IA', icon: '🤖' },
  { to: '/predicciones', label: 'Predicciones', icon: '🎯' },
  { to: '/clasificacion', label: 'Clasificación', icon: '🏆' },
];

export default function Header() {
  const { user, isAuthenticated, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setMenuOpen(false);
  };

  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Usuario';

  return (
    <header className="header" role="banner">
      <div className="header-inner container">
        {/* Logo */}
        <Link to="/" className="header-logo" aria-label="Copa26 AI - Inicio">
          <span className="logo-icon">⚽</span>
          <span className="logo-text gradient-text">Copa26 AI</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="header-nav" role="navigation" aria-label="Navegación principal">
          {NAV_LINKS.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`}
            >
              <span className="nav-link-icon">{link.icon}</span>
              <span className="nav-link-label">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Auth Section */}
        <div className="header-auth">
          {isAuthenticated ? (
            <div className="auth-user">
              <div className="user-avatar" aria-hidden="true">
                {username.charAt(0).toUpperCase()}
              </div>
              <span className="user-name">{username}</span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleSignOut}
                aria-label="Cerrar sesión"
              >
                Salir
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">
              Iniciar Sesión
            </Link>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className={`hamburger ${menuOpen ? 'hamburger--open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${menuOpen ? 'mobile-menu--open' : ''}`} role="navigation" aria-label="Menú móvil">
        <nav className="mobile-nav">
          {NAV_LINKS.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => `mobile-nav-link ${isActive ? 'mobile-nav-link--active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="nav-link-icon">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
          <div className="mobile-auth">
            {isAuthenticated ? (
              <button className="btn btn-ghost" onClick={handleSignOut} style={{ width: '100%' }}>
                Cerrar Sesión
              </button>
            ) : (
              <Link to="/login" className="btn btn-primary" onClick={() => setMenuOpen(false)} style={{ width: '100%' }}>
                Iniciar Sesión
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
