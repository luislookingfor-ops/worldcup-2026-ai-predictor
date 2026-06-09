import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Matches from './pages/Matches';
import MatchDetail from './pages/MatchDetail';
import Chat from './pages/Chat';
import Predictions from './pages/Predictions';
import Leaderboard from './pages/Leaderboard';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

function AppContent() {
  const location = useLocation();

  useEffect(() => {
    const handleMouseMove = (e) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="app">
      <Header />
      <main className="main-content" key={location.pathname}>
        <div className="page-transition">
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/partidos" element={<Matches />} />
            <Route path="/partidos/:id" element={<MatchDetail />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/predicciones" element={<Predictions />} />
            <Route path="/clasificacion" element={<Leaderboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
