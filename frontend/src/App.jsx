import { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';
import { config } from './game/GameConfig';
import './App.css';

function App() {
  const gameRef = useRef(null);
  const [personality, setPersonality] = useState("poeta");

  useEffect(() => {
    // Pasar la personalidad al objeto global window para que Phaser lo lea
    window.gamePersonality = personality;
  }, [personality]);

  useEffect(() => {
    // Inicializar Phaser
    const game = new Phaser.Game(config);
    gameRef.current = game;

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
      }
    };
  }, []);

  return (
    <div className="App">
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
