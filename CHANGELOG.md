# Changelog - AI Boss Arena (Roguelike Edition)

Todas las novedades y mejoras implementadas en el proyecto.

## [3.2.1] - 2026-05-18
### Modificado
- **Puntuación de React Doctor Perfecta (100/100)**:
  - **Versionado de LocalStorage**: Cambiadas todas las claves de persistencia local (`metaStats`, `loreSeen`, `loreNpcProgress`) a sus contrapartes seguras y versionadas (`metaStats:v1`, `loreSeen:v1`, `loreNpcProgress:v1`) en `MainScene.js`, `UpgradeScene.js`, `MenuScene.js`, `AdminScene.js`, `EventScene.js`, y `LoreManager.js`. Se implementó un robusto sistema de migración automática retrocompatible para asegurar que los jugadores conserven intacta toda su meta-progresión de cristales y diálogos.
  - **Refactorización de Auth.jsx**: Sustitución de los 8 hooks `useState` independientes por un único hook `useReducer` centralizado y predecible. Cambiado el sistema de renderizado de elementos del ranking para usar claves de identificación estables y únicas (`key={player.id || player.username}`) en lugar del índice del array (`key={index}`).
  - **Optimización de Rerenders en App.jsx**: Reemplazado el estado `gameStarted` por una referencia mutable `gameStartedRef` mediante `useRef`, eliminando re-renderizados duplicados al montar el juego o cambiar entre avisos.
  - **Accesibilidad Total (A11y)**: Añadidos atributos de rol interactivo (`role="button"`), soporte de foco por teclado (`tabIndex={0}`) y eventos de tecla (`onKeyDown`) a todos los elementos estáticos del DOM que disponen de listeners click (el selector de registro en `Auth.jsx`, la advertencia en `App.jsx`, y el activador de reproducción de audio).
  - **Estilos de Enfoque Teclado**: Eliminadas las declaraciones `outline: none` en línea y sustituidas por un estilo global en CSS (`*:focus-visible`) que dibuja un elegante anillo de foco cian retro-cyberpunk solo para usuarios de teclado.
  - **Optimización de Ciclos**: Refactorizado el bucle de búsqueda de enemigos objetivo para bombas pegajosas en `CombatManager.js` reduciendo una costosa iteración encadenada `.filter().map()` a una única y directa llamada `.reduce()`.
  - **Corrección de Advertencias Tipográficas**: Reemplazados todos los caracteres de tres puntos suspensivos ("...") en el JSX por la entidad elipsis tipográfica correcta `…`.
- **Code-Splitting en Compilación (Rendimiento)**: Configurada la fragmentación en manual chunks en `vite.config.js` para extraer las librerías `phaser` y `@supabase` del bundle principal. El chunk de carga inicial `index.js` ha disminuido drásticamente de **1.76 MB** a tan solo **179 kB** (una optimización de ~90%), acelerando la carga inicial del juego y habilitando la caché prolongada en el cliente.
- **Resolución de Vulnerabilidades (Seguridad)**: Ejecutada una auditoría de dependencias y subsanada la vulnerabilidad de severidad de grado moderado en `brace-expansion` mediante `npm audit fix`, logrando un reporte de 0 vulnerabilidades.
- **Saneamiento de Linter y Código Muerto (Estructura y Patrones)**: Corregidos el 100% de los errores y advertencias de ESLint preexistentes en todo el proyecto:
  - Resuelto el bug `Phaser is not defined` en [TankEnemy.js](file:///c:/Users/marta/OneDrive/Escritorio/manuel/juegomanuelsc00078/frontend/src/game/entities/TankEnemy.js) importando `Phaser` en ES modules.
  - Limpiados parámetros de firma y llamadas sin uso (`playerSprite`) en [Boss.js](file:///c:/Users/marta/OneDrive/Escritorio/manuel/juegomanuelsc00078/frontend/src/game/entities/Boss.js).
  - Eliminados imports muertos de enemigos, funciones de escalado y librerías Phaser en [MainScene.js](file:///c:/Users/marta/OneDrive/Escritorio/manuel/juegomanuelsc00078/frontend/src/game/scenes/MainScene.js) y [HUDManager.js](file:///c:/Users/marta/OneDrive/Escritorio/manuel/juegomanuelsc00078/frontend/src/game/managers/HUDManager.js).
  - Limpiadas variables locales declaradas pero nunca leídas en [MenuScene.js](file:///c:/Users/marta/OneDrive/Escritorio/manuel/juegomanuelsc00078/frontend/src/game/scenes/MenuScene.js), [PreloadScene.js](file:///c:/Users/marta/OneDrive/Escritorio/manuel/juegomanuelsc00078/frontend/src/game/scenes/PreloadScene.js), [UpgradeScene.js](file:///c:/Users/marta/OneDrive/Escritorio/manuel/juegomanuelsc00078/frontend/src/game/scenes/UpgradeScene.js) y [MobileControls.js](file:///c:/Users/marta/OneDrive/Escritorio/manuel/juegomanuelsc00078/frontend/src/game/ui/MobileControls.js).
  - Limpiados imports y parámetros en ficheros de testing ([Auth.test.jsx](file:///c:/Users/marta/OneDrive/Escritorio/manuel/juegomanuelsc00078/frontend/tests/Auth.test.jsx) and [setup.js](file:///c:/Users/marta/OneDrive/Escritorio/manuel/juegomanuelsc00078/frontend/tests/setup.js)).
  - Ajustada la firma del método `update` en [GuardianEnemy.js](file:///c:/Users/marta/OneDrive/Escritorio/manuel/juegomanuelsc00078/frontend/src/game/entities/GuardianEnemy.js) para eliminar el argumento de tiempo no utilizado.
- **Depuración e Higiene de Dependencias**: Utilizadas las herramientas `depcheck` y `knip` para detectar código muerto. Se desinstaló la librería `react-responsive` al estar 100% en desuso, liberando el bundle del juego de dependencias huérfanas adicionales y reduciendo el tamaño compilado del motor Phaser de **1.35 MB** a solo **1.19 MB**.

## [3.2.0] - 2026-05-08
### Añadido
- **Sistema Admin completo**:
  - `frontend/src/game/admin.js` — utilidad `isAdmin()` con whitelist de emails + fallback localStorage.
  - `AdminScene.js` — panel con 30+ botones para: saltar a cualquier nivel, forzar salas (boss, élite, tesoro), ir directamente a cualquier escena (tienda, reliquias, mejoras, evento, mapa), activar God Mode, oro/daño infinitos, insta-kill, cristales meta.
  - Botón `[DEV]` en MenuScene, visible solo para admin (esquina inferior izquierda).
  - Atajo de teclado `` ` `` (backtick) en partida para abrir AdminScene in-game.
  - El objeto `user` de Supabase se expone en `window.__phaserUser` para Phaser.
- **Dev Mode bypass**: Si haces clic en `[DEV MODE]` en la pantalla de login, entras como admin sin necesidad de credenciales Supabase reales. También se activa automáticamente si existe `localStorage` flag.
- **Sistema de cristales vía Supabase**:
  - `saveRunResult(score, sector, crystalsEarned)` — envía cristales al backend, que los acumula en `profiles.total_crystals`.
  - `getCrystals()` / `spendCrystals(amount)` — funciones frontend para sincronizar con Supabase.
  - Cristales endurecidos: `Math.floor(currentLevel / 8)` en vez de `/ 3`.
  - UpgradeScene sincroniza con Supabase al cargar y al gastar.
- **UI del menú principal mejorada**:
  - Leaderboard estilo Auth.jsx: 4 columnas (rank, username, score, S.X), filas individuales, gold para #1, loading/empty states, 10 jugadores.
  - Panel de comandos en 2 columnas (tecla+icono / acción), agrupado con separadores.
- **Mute para móvil arreglado**: target táctil grande (100×36), `toggleMute()` ahora mutea Phaser globalmente.
- **Robustez de audio**: polling de música cada 5s en MainScene.update() + fallback `on('stop')` en AudioManager.
### Corregido
- **Bug "no deja volver a jugar"**: `_startingGame` ahora se resetea a `false` en cada `create()` de MenuScene.
- **Bug "400 Datos incompletos"**: backend rechazaba score=0 porque `!0 === true`. Cambiado a `score == null`.
- **Bug "láser élite no daña"**: El láser rotado usaba AABB de Arcade Physics que no rota con el sprite. Reemplazado por detección manual distancia punto-a-línea.
- **Bug "crates de daño no dañan"**: Dos `physics.add.collider` entre player y crates se cancelaban; eliminado el collider duplicado sin callback (línea 226).
- **Bug "boss escala muy poco"**: `hpMultiplier` de `1 + floor(level/5)*0.20` a `1 + (level/5)*0.7` (2.6x → 6.6x en nivel 40). `damageMult` de `0.8 + level/40` a `0.8 + level/20`.
- **Bug "God Mode se pierde al reanudar"**: Ahora también escribe en registry.
- **Bug "Oro 99999 se pierde al recoger"**: Ahora también setea `mainScene.gold`.
- **Bug "reliquias hermes/titan no aplican en admin"**: AdminScene ahora recalcula velocidad del player.
- **Bug "música de menú no vuelve"**: `playMenuMusic()` ya no depende de `paused`. Añadido `shutdown()` en MainScene que limpia audio. Añadido `window.stopMenuMusic()` en PauseScene.goToMenu().
- **Bug "Pix promete 30 cristales pero nunca los da"**: EventScene.js — opción "¿QUÉ ES EL NÚCLEO?" ahora realmente otorga los 30 cristales.
- **Código muerto eliminado**: `MapScene.js` eliminado (nunca se usaba).

## [3.1.0] - 2026-05-08
### Añadido
- **Seguridad backend (crítico)**:
  - CORS restringido a orígenes conocidos (localhost, dominio producción).
  - Rate limiting en `/api/boss-decision`, `/api/boss-warmup` (30 req/min) y `/api/save-score` (10 req/min).
  - Límite de tamaño de body a 10KB en Express (`express.json({ limit: '10kb' })`).
  - Validación y sanitización de todos los campos en `/api/boss-decision` (`boss_hp`, `player_hp`, `distance`, `boss_phase`, `boss_type`).
  - Middleware `helmet` para cabeceras de seguridad (CSP, X-Frame-Options, HSTS, etc.).
  - `app.disable('x-powered-by')` para ocultar tecnología del servidor.
- **Modularización del frontend**: MainScene.js reducido de 1271 → 611 líneas (-52%).
  - `AudioManager.js` (81 líneas): gestión de música y SFX.
  - `VFXManager.js` (60 líneas): partículas, daño flotante, crítico, pushBack.
  - `BossAIManager.js` (68 líneas): peticiones a la API del jefe y fallback local.
  - `CombatManager.js` (128 líneas): flechas, bombas, proyectiles, ciclo de armas.
  - `LootManager.js` (63 líneas): oro, salud, XP, magnetismo.
  - `ProgressionManager.js` (67 líneas): checkLevelClear, nextLevel, árbol de probabilidades.
  - `ObstacleManager.js` (55 líneas): generación y destrucción de obstáculos.
  - `EliteManager.js` (78 líneas): prompt y spawn de élites.
  - `EnemyManager.js` (32 líneas): muerte de enemigos y barras de vida.
  - Total: 12 managers en `frontend/src/game/managers/`.
### Corregido
- **Tests**: 5 tests desactualizados actualizados (Enemy, Auth, Boss, Player, supabase). Todos en verde (58/58 frontend, 4/4 backend).
- **Bug de daño triple en trampas**: Eliminados overlap redundante y detección manual en `update()`. Ahora solo collider.
- **Bug de método duplicado**: `spawnKamikazeFromBoss()` eliminado de MainScene.js (ya existía en SpawnManager.js). Boss.js redirigido a `spawnManager.spawnKamikazeFromBoss()`.
- **Bug de teclas duplicadas**: Unificados los dos bloques de registro de atajos de teclado (P/ESC/I/TAB).
- **Bug de puerto incorrecto**: Cambiado `localhost:5000` → `localhost:3001` en la llamada a la API del boss.
- **Import muerto**: Eliminado `import cors from 'express'` (línea 2) en `backend/index.js`.

## [3.0.2] - 2026-05-08
### Añadido
- **AGENTS.md**: Nueva sección "Flujo Git" con convención para commit/push.
### Corregido
- **Superposición de música en móvil**: 
  - Reemplazado `setInterval` en `stopMenuMusic()` por `pause()` directo para evitar throttle del navegador móvil.
  - `AudioContext.resume()` ahora es `await` en `handleMusic()` de `MainScene.js`.
  - Añadido `stopMenuMusic()` en `endGame()` para silenciar menú al volver de partida.
  - Añadido guarda anti-doble-click en botón "INICIAR PURGA" en `MenuScene.js`.
  - Al desmutear desde pausa, se restaura el volumen de la pista Phaser actual.

## [3.0.1] - 2026-05-08
### Modificado
- **AGENTS.md**: Renombrado de `agents.md` a `AGENTS.md`. Ampliado con estructura del proyecto, comandos de desarrollo, dependencia backend-frontend, variables de entorno, testing y convenciones generales.

## [3.0.0] - 2026-05-07
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
