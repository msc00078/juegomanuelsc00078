import { useState, useEffect } from 'react';
import { signUp, signIn, getLeaderboard } from '../game/supabase';
import { useMediaQuery } from 'react-responsive';

export default function Auth({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [showLeaderboardMobile, setShowLeaderboardMobile] = useState(false);
  const isMobile = useMediaQuery({ query: '(max-width: 600px)' });

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data, error } = await getLeaderboard();
        if (!error && data) setLeaderboard(data);
      } catch (err) {
        console.error('No se pudo cargar el ranking', err);
      } finally {
        setLeaderboardLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await signUp(email, password, username);
        if (!error && data?.user) onLogin(data.user);
        else alert(error?.message || 'Error al registrarse. ¿Ejecutaste el código SQL en Supabase?');
      } else {
        const { data, error } = await signIn(email, password);
        if (!error && data?.user) onLogin(data.user);
        else alert(error?.message || 'Error: Credenciales inválidas.');
      }
    } catch (err) {
      console.error(err);
      alert('Error crítico de conexión: ' + (err.message || err) + '\n\n1. ¿Reiniciaste el servidor (npm run dev)?\n2. ¿Pusiste bien tu ANON_KEY en el archivo .env?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-container-flex">
        {/* PANEL DE AUTENTICACIÓN */}
        <div className="auth-box">
          <h2 className="glitch-text">{isSignUp ? 'REGISTRO' : 'ACCESO AL NÚCLEO'}</h2>
          <span className="auth-subtitle">PROTOCOLO DE SEGURIDAD ACTIVADO</span>
          
          <form onSubmit={handleSubmit} className="auth-form">
            {isSignUp && (
              <div className="input-group">
                <input 
                  type="text" 
                  placeholder="USERNAME" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  required 
                />
              </div>
            )}
            <div className="input-group">
              <input 
                type="email" 
                placeholder="EMAIL" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="input-group">
              <input 
                type="password" 
                placeholder="PASSWORD" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
            </div>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'SINCRONIZANDO...' : isSignUp ? 'CREAR PERFIL' : 'INICIAR SESIÓN'}
            </button>
          </form>

          <div className="auth-toggle">
            <p onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? '¿Ya tienes acceso? Entra aquí' : '¿Nuevo sujeto? Regístrate aquí'}
            </p>
          </div>
        </div>

        {/* PANEL DE RANKING GLOBAL */}
        <div className="leaderboard-box">
          <div className="leaderboard-title-flex">
            <h2 className="glitch-text" style={{ fontSize: '1.4rem' }}>RANKING GLOBAL</h2>
            <span style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 'bold' }}>📡 LIVE</span>
          </div>

          <div className="leaderboard-list">
            {leaderboardLoading ? (
              <div className="status-msg">Cargando datos del Núcleo...</div>
            ) : leaderboard.length === 0 ? (
              <div className="status-msg">Aún no hay registros en la simulación.</div>
            ) : (
              leaderboard.map((player, index) => (
                <div key={index} className={`leaderboard-item ${index === 0 ? 'top-1' : ''}`}>
                  <span className="rank">{index === 0 ? '👑' : `#${index + 1}`}</span>
                  <span className="name">{player.username || 'Sujeto Anónimo'}</span>
                  <span className="score">{player.high_score.toLocaleString()} PTS</span>
                  <span className="sector">S.{player.max_sector}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
