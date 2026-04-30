import { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';
import { config } from './game/GameConfig';
import './App.css';

function App() {
  const gameRef = useRef(null);
  const [personality, setPersonality] = useState("poeta");
  const [showMobileWarning, setShowMobileWarning] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    // Pasar la personalidad al objeto global window para que Phaser lo lea
    window.gamePersonality = personality;
  }, [personality]);

  useEffect(() => {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent) || navigator.maxTouchPoints > 0;
    if (isMobile) {
      setShowMobileWarning(true);
    } else {
      setGameStarted(true);
    }
  }, []);

  useEffect(() => {
    if (!gameStarted) return;
    
    // Inicializar Phaser
    const game = new Phaser.Game(config);
    gameRef.current = game;

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
      }
    };
  }, [gameStarted]);

  const handleStartMobile = () => {
    // Intentar forzar pantalla completa nativa
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(e => console.log(e));
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen().catch(e => console.log(e));
    }
    
    // Intentar forzar rotación a horizontal (Android)
    if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
      window.screen.orientation.lock('landscape').catch(e => console.log(e));
    }
    
    setShowMobileWarning(false);
    setGameStarted(true);
  };

  return (
    <div className="App">
      {showMobileWarning && (
        <div className="mobile-warning" onClick={handleStartMobile}>
          <h2>📱 GIRA TU MÓVIL</h2>
          <p>Pon el móvil en HORIZONTAL y toca aquí para empezar.</p>
        </div>
      )}
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
      
      <div id="phaser-container" className="game-container"></div>
      
      <div className="instructions">
        <p>🕹️ <strong>WASD / Flechas:</strong> Moverse | ⚔️ <strong>ESPACIO:</strong> Atacar con espada</p>
        <p>El comportamiento de la IA cambiará según la personalidad seleccionada arriba.</p>
      </div>
    </div>
  );
}

export default App;
