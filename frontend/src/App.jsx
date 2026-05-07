import { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';
import { config } from './game/GameConfig';
import Auth from './components/Auth';
import './App.css';

function App() {
  const gameRef = useRef(null);
  const audioRef = useRef(null);
  const [showMobileWarning, setShowMobileWarning] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [user, setUser] = useState(null);

  // Función para iniciar la música (el navegador exige interacción previa)
  const playMusic = () => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch(e => console.log("Auto-play bloqueado hasta interacción:", e));
    }
  };

  // Exponer funciones globales de audio para que Phaser pueda controlar la música
  useEffect(() => {
    window.isMuted = false;

    window.playMenuMusic = () => {
      if (audioRef.current && audioRef.current.paused && !window.isMuted) {
        audioRef.current.volume = 0.5;
        audioRef.current.play().catch(e => console.log(e));
      }
    };

    window.stopMenuMusic = () => {
      if (audioRef.current) {
        const fadeOut = setInterval(() => {
          if (audioRef.current && audioRef.current.volume > 0.05) {
            audioRef.current.volume -= 0.05;
          } else {
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.volume = 0.5;
            }
            clearInterval(fadeOut);
          }
        }, 50);
      }
    };

    // Silenciar / Activar toda la música
    window.toggleMute = () => {
      window.isMuted = !window.isMuted;
      if (audioRef.current) {
        if (window.isMuted) {
          audioRef.current.volume = 0;
        } else {
          audioRef.current.volume = 0.5;
          audioRef.current.play().catch(e => console.log(e));
        }
      }
      return window.isMuted;
    };
  }, []);

  // Detectar móvil al montar
  useEffect(() => {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent) || navigator.maxTouchPoints > 0;
    if (isMobile) {
      setShowMobileWarning(true);
    } else {
      setGameStarted(true);
    }
  }, []);

  // Arrancar Phaser SOLO cuando gameStarted y user sean true
  useEffect(() => {
    if (!gameStarted || !user) return;

    const timeout = setTimeout(() => {
      const game = new Phaser.Game(config);
      gameRef.current = game;
    }, 100);

    return () => {
      clearTimeout(timeout);
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [gameStarted, user]);

  const handleStartMobile = async () => {
    playMusic(); // Iniciar música al tocar el aviso móvil
    try {
      // 1) Solicitar pantalla completa (elimina barra del navegador)
      const el = document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      }
    } catch (e) {
      console.log('Fullscreen no disponible:', e);
    }

    try {
      // 2) Bloquear orientación en horizontal (funciona en Chrome Android)
      if (window.screen?.orientation?.lock) {
        await window.screen.orientation.lock('landscape');
      }
    } catch (e) {
      console.log('Orientation lock no disponible:', e);
    }

    setShowMobileWarning(false);
    setGameStarted(true);
  };

  return (
    <div className="App">

      {/* Música de Menú Global */}
      <audio ref={audioRef} src="/assets/audio/menu_theme.mp3" loop />

      {/* ---- Pantalla de aviso móvil ---- */}
      {showMobileWarning && (
        <div className="mobile-warning" onClick={handleStartMobile}>
          <div className="rotate-icon">📱</div>
          <h2>GIRA TU MÓVIL</h2>
          <p>Para la mejor experiencia, pon el móvil en <strong>horizontal</strong> y toca la pantalla.</p>
          <div className="tap-prompt">▶ TOCA PARA EMPEZAR</div>
        </div>
      )}
      
      {/* ---- Pantalla de Login (Supabase) ---- */}
      {!user && !showMobileWarning && (
        <div onClick={playMusic}>
          <Auth onLogin={(user) => setUser(user)} />
        </div>
      )}


      {/* ---- Canvas del juego ---- */}
      <div id="phaser-container" className="game-container"></div>

    </div>
  );
}

export default App;
