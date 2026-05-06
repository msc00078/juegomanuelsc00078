# Changelog - AI Boss Arena (Roguelike Edition)

Todas las novedades y mejoras implementadas en el proyecto.

## [1.6.3] - 2026-05-06
### Corregido
- **Bug de cambio de arma en HUD**: Al hacer clic en el indicador de arma en la pantalla de juego, el ciclo de armas ahora solo pasa a armas que el jugador haya comprado (`hasBow`, `hasBombs`). Antes ciclaba libremente entre espada, arco y bombas independientemente de si se habían adquirido.


### Añadido
- **Suite de Tests Completa (58 tests, 7 suites)**: Todos los tests pasan en verde.
  - **Backend (4 tests):** `boss.test.js`, `bossRoute.test.js`. Cobertura del 88%.
  - **Frontend (54 tests en 6 suites):**
    - `Boss.test.js`: 9 tests (daño, fases, muerte, idempotencia)
    - `Enemy.test.js`: 14 tests (lógica base + 5 subclases: Standard, Tank, Kamikaze, Ranged, Summoner)
    - `Player.test.js`: 15 tests (daño, invulnerabilidad, reliquias, game over)
    - `Auth.test.jsx`: 8 tests (login, registro, toggle, getLeaderboard)
    - `supabase.test.js`: 6 tests (signUp, signIn, saveRunResult, manejo de errores)
    - `GameConfig.test.js`: 5 tests (tipo, escala 1280x720, física, escenas)

### Modificado
- **`Player.js`**, **`Enemy.js`**, **`Boss.js`**: Se usó optional chaining (`?.`) en llamadas a métodos de escena (`showDamageNumber`, `createParticles`, `cameras`, etc.) para que las clases sean seguras de instanciar fuera de Phaser (en tests).


- **Entorno de Testing y Cobertura**: Se integró `Vitest` y `@vitest/coverage-v8` tanto en el `frontend` como en el `backend`. Esto permite realizar pruebas unitarias y medir el porcentaje de código cubierto.
  - Scripts configurados: `npm run test` y `npm run coverage`.
  - Se añadieron tests de ejemplo para ilustrar el funcionamiento (ej. `boss.test.js`).

### Eliminado
- **Archivos de Prueba Huérfanos**: Se eliminaron los archivos `test_boss_fix.js`, `test_enemy_fix.js` y `test_sword_fix.js` en el `frontend` al no tener uso.
- **Directorio de Trabajo (`@workspace`)**: Se eliminó la carpeta completa `@workspace` que contenía scripts de prueba obsoletos y resúmenes de correcciones antiguos que ya no son relevantes para el proyecto.

### Modificado
- **Revisión de Código**: Auditoría completa de `backend` y `frontend`, confirmando que todas las funciones exportadas están en uso.

## [1.6.0] - 2026-04-30
### Añadido
- **Optimización Móvil (Responsive Total)**: Todo el juego ha pasado de una resolución fija (800x600) a un ratio panorámico 16:9 (`1280x720`) dinámico usando `FIT`. Todos los menús (Tiendas, Inventario, Nivel, Eventos, Pausa) ahora usan coordenadas relativas al tamaño de pantalla.
- **Modo Paisaje Obligatorio (Mobile-First)**: Pantalla de aviso (`.mobile-warning`) que fuerza al usuario a girar el teléfono e inicializa el modo Fullscreen nativo antes de cargar el motor gráfico.
- **Controles Táctiles Mejorados**: Se ha ajustado la posición del Joystick virtual y botones para que respeten los márgenes inferiores en dispositivos móviles.
- **Navegación de Reliquias**: Las reliquias que no caben en pantalla pequeña ahora disponen de flechas de navegación y funcionalidad de **Swipe Táctil**.
- **Contador de Preparación**: Al iniciar un nivel (o reanudar), hay un contador de **3 segundos** ("3... 2... 1... ¡ACCIÓN!") donde el tiempo se congela para que el jugador pueda ver el posicionamiento enemigo.

### Modificado
- **Frecuencia de la Tienda**: Incrementada la probabilidad de que aparezca una Tienda o Evento (del 10% al 15%).
- **Garantía pre-Jefe**: Antes del nivel del Jefe (niveles 5, 10, 15...), siempre se forzará la aparición de una Tienda (70%) o una Sala de Reliquias (30%) para asegurar que el jugador esté preparado.

### Corregido
- **Bug de Combate Hacia Arriba**: Corregido el hitbox del jugador que fallaba al golpear hacia la dirección superior debido a un mal offset de la espada física.
- **Enemigos Escapan del Mapa**: Arreglado un error donde la colisión impulsaba a los enemigos fuera del límite (`Bounds`). Ahora existe un límite de fuerza de retroceso (`pushBack`) y un clamp físico absoluto en el update.
- **Menús Descentrados**: Rescritos todos los menús (`ShopScene`, `RelicScene`, `EventScene`, `LevelUpScene`, `InventoryScene`, `UpgradeScene`) eliminando coordenadas fijas (800x600) y reemplazándolas por fórmulas relativas.

## [1.5.0] - 2026-04-24
### Añadido
- **Golpes Críticos**: 15% de probabilidad de hacer daño doble con un efecto visual de "CRIT!".
- **Objetos Destruibles**: Cajas esparcidas por los niveles que contienen oro o vida.
- **Barra de Cooldown de Dash**: Pequeño indicador visual bajo el jugador para saber cuándo puedes volver a esquivar.
- **Magnetismo de XP mejorado**: Los orbes de XP ahora vuelan hacia el jugador cuando está cerca.
- **Barras de Vida de Enemigos**: Ahora cada enemigo tiene una mini-barra de vida sobre su cabeza.
- **Sistema de Combo**: Multiplicador de XP basado en la velocidad de eliminaciones consecutivas.
- **Barra de Boss de Élite**: Interfaz dedicada para la vida del jefe en la parte inferior.

### Corregido
- **Crash de Muerte**: Solucionado el error de acceso a la física de la espada al morir.
- **Sistema de XP**: Reconstrucción de la lógica de colisión de orbes para asegurar su correcto funcionamiento.

## [1.4.0] - 2026-04-24
### Añadido
- **Nuevo Enemigo: Invocador**: Un nigromante que invoca pequeños slimes y huye del jugador.
- **Sala del Tesoro**: Nueva variante de sala que recompensa al jugador con abundantes monedas de oro.
- **Efecto de Dash Mejorado**: Rastro visual semi-transparente que da una sensación de mayor velocidad y fluidez.
- **Ajustes de Aparición**: Reequilibrado de probabilidades de salas para una progresión más variada.

## [1.3.0] - 2026-04-24
### Añadido
- **Sistema de Experiencia (XP)**: Los enemigos sueltan orbes de XP al morir.
- **Nivel del Run**: Barra de XP en el HUD y sistema de niveles durante la partida.
- **Pantalla de Subida de Nivel**: Nueva escena (`LevelUpScene`) que ofrece 3 mejoras aleatorias al subir de nivel (Vida, Daño o Velocidad).
- **Números de Daño**: Texto flotante al golpear enemigos para un mejor feedback de combate.
- **Changelog**: Creación de este archivo para seguimiento de cambios.

## [1.2.0] - 2026-04-24
### Añadido
- **Sistema de Inventario**: Nueva escena funcional (TAB/I) para ver estadísticas, armas y reliquias.
- **Menú de Pausa**: Nueva escena (ESC/P) para gestionar la sesión de juego.
- **Barra de Vida Gráfica**: HUD dinámico con colores reactivos a la salud del jugador.
- **Cinemática de Boss**: Efectos de flash y temblor al iniciar un combate contra un jefe.
- **Feedback de Daño**: Screen Shake al recibir impactos.
- **Efecto de Viñeta**: Mejora visual de inmersión en los bordes de la pantalla.

### Corregido
- **Bug de Prompt de Élite**: Se eliminan correctamente todos los botones y textos tras la elección.
- **Error NaN en Vida/Daño**: Blindaje del sistema de registro para evitar valores no numéricos.
- **Crash de Escena**: Registro correcto de todas las escenas en el GameConfig.
- **Error de Desaparición de Enemigos**: Reestructuración de la lógica de muerte para asegurar la destrucción inmediata del sprite.

## [1.1.0] - 2026-04-24
### Añadido
- **Sistema de Dash**: Implementación de esquiva con frames de invulnerabilidad (SHIFT).
- **Reliquias**: Sistema básico de obtención de poderes tras derrotar élites o jefes.
- **Meta-Progreso**: Tienda de mejoras permanentes usando cristales.

### Corregido
- **Física de la Espada**: Corregido error de posicionamiento del cuerpo físico del arma.
- **IA de Enemigos**: Mejoras en el pathfinding básico de los monstruos.

## [1.0.0] - Versión Inicial
- Mecánicas básicas de combate, enemigos estándar y primer boss.
