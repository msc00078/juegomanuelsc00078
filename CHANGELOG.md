# Changelog - AI Boss Arena (Roguelike Edition)

Todas las novedades y mejoras implementadas en el proyecto.

## [2.1.0] - 2026-05-07
### Añadido
- **Modularización de Entidades**: Migración de todos los tipos de enemigos a clases individuales heredando de `EnemyBase`.
- **Arquitectura de Gestores (Managers)**:
  - `InputManager`: Unifica el control táctil y teclado.
  - `HUDManager`: Gestiona toda la UI dinámica (vida, XP, oro, combo, armas).
  - `SpawnManager`: Controla la lógica de aparición y escalado de enemigos.
  - `MobileControls`: Desacopla la interfaz de botones para dispositivos móviles.
- **Limpieza de Código Legado**: Eliminación de `Enemy.js` y refactorización masiva de `MainScene.js`.

## [2.0.0] - 2026-05-06
> **Versión mayor** — Sistema de enemigos completamente renovado, Boss con IA mejorada y nuevo ecosistema de escalado de dificultad.
### Añadido
- **Reliquia LLAVE MAESTRA**: Añadida una nueva reliquia (`bypass_key`) que incrementa en un 25% la probabilidad de evadir exitosamente a un Élite.
- **Probabilidad Dinámica de Evasión**: La probabilidad base de evadir a un Élite ahora varía de manera aleatoria entre el 30% y el 70% (con un máximo de 95% si se posee la Llave Maestra).
- **Sistema de Variantes de Enemigos**: Los enemigos escalan visualmente y en estadísticas según el nivel actual.
  - Niveles 1-5: variante **Normal**.
  - Niveles 6-10: variante **Mejorado** (+40% HP, +10% velocidad, borde naranja).
  - Nivel 11+: variante **Élite** (+100% HP, +25% velocidad, borde rojo + aura).
- **Enemigos Alpha** (5% de probabilidad): 3× vida, 2× daño de contacto, aura dorada pulsante, sueltan 3 orbes de XP al morir.
- **4 Nuevos tipos de enemigos**:
  - **Fase Corrupta (Teletransportador)**: Se teletransporta detrás del jugador cada ~4.5s. Alto daño de contacto (18). Disponible desde nivel 6.
  - **Parche de Sistema (Sanador)**: Cura 8 HP a los aliados en radio 160 cada 3.5s. Siempre huye del jugador. Disponible desde nivel 10.
  - **Centinela Blindado (Guardián)**: Escudo frontal que bloquea el daño de la espada. Completamente vulnerable por la espalda. Se mueve lentamente hacia el jugador. Disponible desde nivel 10.
  - **Glitch Trampa (Trampero)**: Coloca zonas de ralentización que reducen la velocidad del jugador al 45% durante 5 segundos. Mantiene distancia media. Disponible desde nivel 6.
- **Mejoras del Boss (IA + Dificultad)**:
  - Movimiento autónomo entre llamadas a la API (ya no es estático).
  - Targeting predictivo: los proyectiles apuntan a donde estará el jugador.
  - En fase 2 el intervalo de llamadas a la API baja a 2s (más ataques).
  - En fase 3 el intervalo baja a 1.2s, los proyectiles son rafágas de 4 y el boss invoca 2 kamikazes al entrar en la fase.
  - Las ondas de área en fase 3 son dobles y concéntricas.
- **Variedad de Enemigos (Rare Spawns)**: Implementada una probabilidad muy baja (1-3%) de que aparezcan enemigos avanzados en niveles tempranos, mejorando la sorpresa y variedad táctica.
- **Nuevo Ataque Élite (Láser)**: El Élite de Bypass ahora tiene un ataque de rayo de energía con indicador de carga previa.

### Modificado
- **Balanceo Crítico de Élites**: Reducida drásticamente la dificultad de los enemigos Élite (nerfeo extremo). El bonus de nivel bajó a +2, el multiplicador de HP a 1.2x y el daño a 1.1x.
- **Reliquia GLITCH ADHESIVO**: Corregida la lógica de física de las bombas para que ahora sí se desplacen hacia los enemigos como se esperaba.
- **Lógica de Spawn de Enemigos**: Refactorizado el sistema de selección de enemigos para priorizar el chequeo de probabilidades bajas, evitando el error de código muerto en las condiciones.
- **Pool de spawn de enemigos**: Ahora se expande progresivamente según el nivel (3 rangos: niveles <3, 3-5, 6-9, 10+).
- **`contactDamage` por tipo**: El daño de colisión ya no es fijo (5 para todos) sino que depende del tipo de enemigo.
- **`Player._baseSpeed`**: Se guarda la velocidad inicial del jugador para poder restaurarla después de efectos de ralentización.


### Añadido
- **Optimización de IA (Boss Warmup)**: Se implementó un sistema de precalentamiento para la API del Boss.
  - Nuevo endpoint `/api/boss-warmup` en el backend para despertar el modelo de Groq/Render.
  - Llamadas anticipadas desde `MapScene.js` al seleccionar el nodo de jefe para evitar latencias de "cold start".
- **Test de Diagnóstico de API Real**: Se creó `backend/tests/bossApiDiagnostic.test.js` para monitorizar tiempos de respuesta y coherencia de la IA en producción.
- **Suite de Tests Completa (58 tests, 7 suites)**: Todos los tests pasan en verde.
  - **Backend (4 tests):** `boss.test.js`, `bossRoute.test.js`. Cobertura del 88%.
  - **Frontend (54 tests en 6 suites):**
    - `Boss.test.js`: 9 tests (daño, fases, muerte, idempotencia)
    - `Enemy.test.js`: 14 tests (lógica base + 5 subclases: Standard, Tank, Kamikaze, Ranged, Summoner)
    - `Player.test.js`: 15 tests (daño, invulnerabilidad, reliquias, game over)
    - `Auth.test.jsx`: 8 tests (login, registro, toggle, getLeaderboard)
    - `supabase.test.js`: 6 tests (signUp, signIn, saveRunResult, manejo de errores)
    - `GameConfig.test.js`: 5 tests (tipo, escala 1280x720, física, escenas)

### Corregido
- **Crash al evadir un Élite**: Se solucionó un error que provocaba que el juego colapsara (crash) o generara comportamientos inesperados al hacer clic repetidamente en el botón de evasión ("Bypass") del encuentro con un Élite. Se han deshabilitado las interacciones de los botones tras el primer clic.
- **Daño Fantasma del Boss**: Se corrigió un problema donde el jefe seguía haciendo daño al jugador después de morir si este caminaba sobre su posición o sobre ataques de área residuales. Ahora, al morir el jefe:
  - Se desactiva su cuerpo físico inmediatamente.
  - Se limpian todos sus ataques activos (`attacks.clear()`).
  - Se añadieron comprobaciones de vida (`hp > 0`) en los handlers de colisión de la escena.
- **Bug de cambio de arma en HUD**: Al hacer clic en el indicador de arma en la pantalla de juego, el ciclo de armas ahora solo pasa a armas que el jugador haya comprado (`hasBow`, `hasBombs`). Antes ciclaba libremente entre espada, arco y bombas independientemente de si se habían adquirido.
- **Robustez de Entidades**: Se aplicó optional chaining (`?.`) en `Player.js`, `Enemy.js` y `Boss.js` para permitir instanciación segura en tests sin una escena Phaser real.
- **Dependencias de Backend**: Instalada `axios` en el backend para permitir la ejecución de tests de diagnóstico de API.

### Modificado
- **Timeout de API del Boss**: Aumentado de 2500ms a 8000ms en `MainScene.js` para dar margen de respuesta durante el primer contacto tras el warmup.


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
