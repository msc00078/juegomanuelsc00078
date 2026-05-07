# Changelog - AI Boss Arena (Roguelike Edition)

Todas las novedades y mejoras implementadas en el proyecto.
\n## [3.0.0] - 2026-05-07
### Añadido
- **Sistema de Audio Inmersivo**:
  - Implementación de SFX para Espada, Arco y Bombas.
  - Añadido sonido de derrota (Game Over) para mayor feedback.
  - Rotación dinámica de pistas musicales in-game.
- **Estabilidad de Jefes**: 
  - Refactor de `spawnBoss` para evitar crashes en la inicialización de UI.
  - Barra de vida de jefe dual (suma la vida de todos los jefes activos).
- **Kamikazes Letales**: Rediseño de la explosión para que inflija daño real y empuje al jugador.
\n### Corregido
- **Solapamiento de Música**: Limpieza agresiva de instancias de audio para evitar que suenen varias pistas a la vez.
- **Reliquias**: 
  - `Glitch Adhesivo` (Bombas Pegajosas) ahora rastrea jefes y persigue objetivos en movimiento.
  - `Ojo del Debugger` (Sniper) ajustado para activarse a menor distancia y con mayor daño.
- **Fugas de UI**: Eliminación de barras de vida huérfanas tras explosiones kamikaze.

## [2.1.0] - 2026-05-07
### Añadido
- **Modularización de Entidades**: Migración de todos los tipos de enemigos a clases individuales heredando de `EnemyBase`.
- **Arquitectura de Gestores (Managers)**:
  - `InputManager`: Unifica el control táctil y teclado de forma segura.
  - `HUDManager`: Gestiona toda la UI dinámica (vida, XP, oro, combo, armas).
  - `SpawnManager`: Controla la lógica de aparición y escalado de enemigos.
  - `MobileControls`: Desacopla la interfaz de botones para dispositivos móviles.
- **Limpieza de Código Legado**: Eliminación de `Enemy.js` y refactorización masiva de `MainScene.js`.

### Corregido
- **Crash de Inicio de Partida**: Restaurada la lógica de cuenta atrás que desbloquea el bucle de actualización del juego.
- **Seguridad en Mobile**: Añadidas comprobaciones de existencia para el objeto `keyboard` en `InputManager` y `MainScene` para evitar crashes en navegadores móviles.
- **Métodos Restaurados**: Se han recuperado métodos críticos como `cycleWeapon` que se habían perdido durante la refactorización.
- **Vinculación de Controles**: El joystick móvil ahora se vincula correctamente al `InputManager`.

## [2.4.8] - 2026-05-07
### Corregido
- **Crash de Bypass**: Corregido un error crítico que causaba el cierre del juego al fallar el bypass de una anomalía.
- **Restauración de Balance**: Revertidas las probabilidades de las salas a sus valores originales.

## [2.4.7] - 2026-05-06
### Corregido
- **Error de Inicio de Sesión**: Corregido un `TypeError` al acceder al registro antes de tiempo.

... (resto del historial conservado)
