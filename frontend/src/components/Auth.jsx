import { useState } from 'react';
import { signUp, signIn } from '../game/supabase';

export default function Auth({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (isSignUp) {
      const { data, error } = await signUp(email, password, username);
      if (!error && data.user) onLogin(data.user);
      else alert(error?.message || "Error al registrarse");
    } else {
      const { data, error } = await signIn(email, password);
      if (!error && data.user) onLogin(data.user);
      else alert("Error: Credenciales inválidas o cuenta no confirmada.");
    }
    setLoading(false);
  };

  return (
    <div className="auth-overlay">
      <div className="auth-box neon-border">
        <h2 className="glitch-text">{isSignUp ? 'REGISTRO DE USUARIO' : 'ACCESO AL NÚCLEO'}</h2>
        <p className="auth-subtitle">IDENTIFÍCATE PARA ENTRAR EN LA SIMULACIÓN</p>
        
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
            {loading ? 'CARGANDO...' : (isSignUp ? 'CREAR PERFIL' : 'INICIAR SESIÓN')}
          </button>
        </form>
        
        <div className="auth-toggle">
          <p onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? '¿Ya tienes una cuenta? Inicia sesión' : '¿Eres nuevo? Crea un perfil aquí'}
          </p>
        </div>
      </div>
    </div>
  );
}
