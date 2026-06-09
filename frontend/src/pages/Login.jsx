import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import './Login.css';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
        navigate(from, { replace: true });
      } else {
        if (!username || username.trim().length < 3) {
          throw new Error('El nombre de usuario debe tener al menos 3 caracteres');
        }
        await signUp(email, password, username.trim().toLowerCase());
        setSuccessMsg('¡Registro exitoso! Por favor verifica tu correo electrónico si es requerido, o inicia sesión.');
        setIsLogin(true); // Switch to login tab
      }
    } catch (err) {
      setErrorMsg(err.message || 'Ocurrió un error al procesar tu solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page container animate-fadeIn">
      <div className="login-card glass-card">
        {/* Tab Header */}
        <div className="login-tabs">
          <button 
            type="button" 
            className={`login-tab ${isLogin ? 'login-tab--active' : ''}`}
            onClick={() => {
              setIsLogin(true);
              setErrorMsg('');
            }}
          >
            Iniciar Sesión
          </button>
          <button 
            type="button" 
            className={`login-tab ${!isLogin ? 'login-tab--active' : ''}`}
            onClick={() => {
              setIsLogin(false);
              setErrorMsg('');
            }}
          >
            Registrarse
          </button>
        </div>

        {/* Title */}
        <div className="login-header">
          <span className="login-logo">⚽</span>
          <h2 className="login-title">
            {isLogin ? 'Bienvenido a Copa26 AI' : 'Crea tu Cuenta'}
          </h2>
          <p className="login-subtitle">
            {isLogin 
              ? 'Ingresa tus credenciales para hacer pronósticos.' 
              : 'Únete para pronosticar partidos y sumar puntos.'}
          </p>
        </div>

        {/* Status Messages */}
        {successMsg && <div className="login-message login-message--success">{successMsg}</div>}
        {errorMsg && <div className="login-message login-message--error">⚠️ {errorMsg}</div>}

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label" htmlFor="username">Nombre de usuario</label>
              <input
                id="username"
                type="text"
                className="form-input"
                placeholder="ej. lucho10"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={!isLogin}
                disabled={loading}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            size="lg" 
            loading={loading}
            className="login-submit-btn"
          >
            {isLogin ? 'Ingresar' : 'Registrarse'}
          </Button>
        </form>
      </div>
    </div>
  );
}
