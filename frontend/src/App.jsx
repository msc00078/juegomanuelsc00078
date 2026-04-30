import { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';
import { config } from './game/GameConfig';
import './App.css';

function App() {
  const gameRef = useRef(null);
  const [personality, setPersonality] = useState("poeta");
  const [showMobileWarning, setShowMobileWarning] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Sincronizar personalidad con el motor del juego
  useEffect(() => {
    window.gamePersonality = personality;
  }, [personality]);

  // Detectar móvil al montar
  useEffect(() => {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent) || navigator.maxTouchPoints > 0;
    if (isMobile) {
      setShowMobileWarning(true);
    } else {
      setGameStarted(true);
    }
  }, []);

  // Arrancar Phaser SOLO cuando gameStarted sea true
  useEffect(() => {
    if (!gameStarted) return;

    // Breve timeout para que el DOM actualice el tamaño del contenedor
    // ANTES de que Phaser lea las dimensiones del parent
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
  }, [gameStarted]);

  const handleStartMobile = async () => {
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

      {/* ---- Pantalla de aviso móvil ---- */}
      {showMobileWarning && (
        <div className="mobile-warning" onClick={handleStartMobile}>
          <div className="rotate-icon">📱</div>
          <h2>GIRA TU MÓVIL</h2>
          <p>Para la mejor experiencia, pon el móvil en <strong>horizontal</strong> y toca la pantalla.</p>
          <div className="tap-prompt">▶ TOCA PARA EMPEZAR</div>
        </div>
      )}

      {/* ---- Cabecera (solo escritorio) ---- */}
      {!showMobileWarning && (
        <header className="App-header">
          <h1>AI Boss Arena</h1>
          <div className="controls-panel">
            <label>Personalidad IA del Boss: </label>
            <select value={personality} onChange={(e) => setPersonality(e.target.value)}>
              <option value="poeta">Poeta (Equilibrado)</option>
              <option value="logico">Lógico (Calculador)</option>
              <option value="glitch">Glitch (Caótico)</option>
            </select>
          </div>
        </header>
      )}

      {/* ---- Canvas del juego ---- */}
      <div id="phaser-container" className="game-container"></div>

      {/* ---- Instrucciones (solo escritorio) ---- */}
      {!showMobileWarning && (
        <div className="instructions">
          <p>🕹️ <strong>WASD / Flechas:</strong> Moverse | ⚔️ <strong>ESPACIO:</strong> Atacar con espada</p>
          <p>El comportamiento de la IA cambiará según la personalidad seleccionada arriba.</p>
        </div>
      )}
    </div>
  );
}

export default App;
