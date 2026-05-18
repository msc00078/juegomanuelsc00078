import { useReducer, useEffect } from 'react';
import { signUp, signIn, getLeaderboard } from '../game/supabase';

const initialState = {
  email: '',
  password: '',
  username: '',
  isSignUp: false,
  loading: false,
  leaderboard: [],
  leaderboardLoading: true,
  showLeaderboardMobile: false,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'TOGGLE_SIGN_UP':
      return { ...state, isSignUp: !state.isSignUp };
    case 'SET_LOADING':
      return { ...state, loading: action.value };
    case 'SET_LEADERBOARD_SUCCESS':
      return { ...state, leaderboard: action.payload, leaderboardLoading: false };
    case 'SET_LEADERBOARD_LOADING':
      return { ...state, leaderboardLoading: action.value };
    case 'SET_SHOW_LEADERBOARD_MOBILE':
      return { ...state, showLeaderboardMobile: action.value };
    case 'RESET_FORM':
      return { ...state, email: '', password: '', username: '' };
    default:
      return state;
  }
}

export default function Auth({ onLogin }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const {
    email,
    password,
    username,
    isSignUp,
    loading,
    leaderboard,
    leaderboardLoading,
  } = state;

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data, error } = await getLeaderboard();
        if (!error && data) {
          dispatch({ type: 'SET_LEADERBOARD_SUCCESS', payload: data });
        } else {
          dispatch({ type: 'SET_LEADERBOARD_LOADING', value: false });
        }
      } catch (err) {
        console.error('No se pudo cargar el ranking', err);
        dispatch({ type: 'SET_LEADERBOARD_LOADING', value: false });
      }
    };
    fetchLeaderboard();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch({ type: 'SET_LOADING', value: true });
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
      dispatch({ type: 'SET_LOADING', value: false });
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
                  onChange={e => dispatch({ type: 'SET_FIELD', field: 'username', value: e.target.value })} 
                  required 
                />
              </div>
            )}
            <div className="input-group">
              <input 
                type="email" 
                placeholder="EMAIL" 
                value={email} 
                onChange={e => dispatch({ type: 'SET_FIELD', field: 'email', value: e.target.value })} 
                required 
              />
            </div>
            <div className="input-group">
              <input 
                type="password" 
                placeholder="PASSWORD" 
                value={password} 
                onChange={e => dispatch({ type: 'SET_FIELD', field: 'password', value: e.target.value })} 
                required 
              />
            </div>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'SINCRONIZANDO…' : isSignUp ? 'CREAR PERFIL' : 'INICIAR SESIÓN'}
            </button>
          </form>

          <div className="auth-toggle">
            <p 
              onClick={() => dispatch({ type: 'TOGGLE_SIGN_UP' })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  dispatch({ type: 'TOGGLE_SIGN_UP' });
                }
              }}
              role="button"
              tabIndex={0}
            >
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
              <div className="status-msg">Cargando datos del Núcleo…</div>
            ) : leaderboard.length === 0 ? (
              <div className="status-msg">Aún no hay registros en la simulación.</div>
            ) : (
              leaderboard.map((player, index) => (
                <div key={player.id || player.username || index} className={`leaderboard-item ${index === 0 ? 'top-1' : ''}`}>
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
