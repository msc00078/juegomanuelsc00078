# Instrucciones para Agentes AI (AI Agents Guidelines)
## 1. Estructura del Proyecto
- **Dos paquetes independientes:**
  - `frontend/` — Juego Phaser 3 montado dentro de una shell React (Vite).
  - `backend/` — Servidor Express (Node.js, ESM) que expone `/api/boss-decision` y `/api/save-score`.
- Phaser se inicializa en `App.jsx` (React) dentro de `<div id="phaser-container">`.
- **No hay `opencode.json`.** Toda la configuración por paquete está en sus respectivos `package.json`.
- El estado entre escenas de Phaser **SIEMPRE** viaja por `scene.registry`. Nunca uses variables globales.
- Las escenas se definen en `GameConfig.js:34`. El flujo de arranque es `PreloadScene` → `MenuScene`.
## 2. Comandos de Desarrollo
Ejecuta **siempre desde la raíz del proyecto**, entrando a cada subdirectorio:
| Acción | Comando |
|---|---|
| Iniciar frontend (dev) | `cd frontend; npm run dev` |
| Iniciar backend | `cd backend; node index.js` |
| Build producción | `cd frontend; npm run build` |
| Preview build | `cd frontend; npm run preview` |
| Lint (solo frontend) | `cd frontend; npm run lint` |
| Test frontend | `cd frontend; npm test` |
| Test backend | `cd backend; npm test` |
| Coverage | `cd frontend; npm run coverage` / `cd backend; npm run coverage` |
| Diagnóstico API del boss | `cd backend; npm run test:api` |
- El backend **NO tiene comando `lint`**. Solo el frontend usa ESLint.
- El backend **NO tiene comando `dev` hot-reload**. Reinícialo manualmente tras cambios (`node index.js`).
- Ambos paquetes tienen `"type": "module"`. Usa `import`/`export`, no `require`.
## 3. Dependencia Backend ↔ Frontend
- El frontend llama a `http://localhost:3001/api/boss-decision` (IA del jefe vía Groq) y `http://localhost:3001/api/save-score` (anti-cheat de puntuaciones).
- **Si el backend no está corriendo**, los jefes usan un fallback local (sin diálogo de IA) y el guardado de puntuaciones falla silenciosamente.
- El backend expone también `/api/boss-warmup` (fire-and-forget) para precalentar el modelo Groq antes de la pelea del jefe y reducir latencia.
- El backend usa `groq-sdk` con modelo `llama-3.1-8b-instant`. La respuesta esperada es JSON con `action`, `intensity` y `dialogue`.
## 4. Variables de Entorno
- Ambos paquetes requieren archivos `.env` **separados** (no comparten uno solo).
- **Frontend** (`frontend/.env`):
  - `VITE_SUPABASE_URL` — URL del proyecto Supabase.
  - `VITE_SUPABASE_ANON_KEY` — Clave anónima de Supabase.
- **Backend** (`backend/.env`):
  - `GROQ_API_KEY` — Clave de API de Groq (formato `gsk_...`).
  - `VITE_SUPABASE_URL` — Copia de la URL de Supabase.
  - `VITE_SUPABASE_ANON_KEY` — Copia de la clave anónima de Supabase.
- Las variables del backend se cargan con `dotenv.config()` en `index.js`.
- **NUNCA** comitees archivos `.env` (están en `.gitignore`).
## 5. Testing
- Ambos paquetes usan **Vitest**.
- **Frontend** (`frontend/tests/setup.js`): Phaser es **mockeado globalmente** porque no es compatible con JSDOM. Los tests de entidades de juego (`Player.test.js`, `Boss.test.js`, etc.) no instancian Phaser real.
- **Backend**: El test normal (`npm test`) **excluye** `bossApiDiagnostic.test.js` porque hace llamadas reales a la API de Groq. Para diagnósticos manuales: `npm run test:api`.
- Los mocks del backend usan `vi.mock('groq-sdk', ...)` para aislar las pruebas del LLM.
## 6. Coordinación UI y Responsividad
- **Mobile-First / Responsive Total.** La resolución base es 1280×720 con `Phaser.Scale.FIT`.
- **Regla de Oro:** **NUNCA uses coordenadas hardcodeadas** (`x: 400`, `y: 300`).
- Usa **SIEMPRE** `this.scale.width` y `this.scale.height`. Layout calculado con `cx = W / 2` y `cy = H / 2`.
- Para elementos estáticos del HUD usa `.setScrollFactor(0)` en lugar de recalcular posiciones.
## 7. Rendimiento (Móvil)
- Limita partículas y efectos masivos a cantidades bajas (los móviles no soportan 1000+ sprites).
- Limpia **Timers, Eventos y Tweens** en `shutdown` o al destruir objetos para evitar memory leaks.
## 8. Mantenimiento del CHANGELOG
- **SIEMPRE** actualiza `CHANGELOG.md` al hacer cambios estructurales, nuevas funcionalidades o correcciones de bugs importantes.
- Formato: `[X.Y.Z] - AAAA-MM-DD` con categorías `### Añadido`, `### Corregido`, `### Modificado`.
## 9. Convenciones Generales
- Idioma: **Español** para UI, comentarios de código y logs.
- El juego usa `localStorage` para meta-progresión (cristales). No lo borres sin avisar.
- Supabase se inicializa condicionalmente (`frontend/src/game/supabase.js:7`) — si faltan las claves, `supabase` es `null` y el auth/ranking se desactiva sin crashear.

## 10. Flujo Git
- Cuando el usuario pida explícitamente hacer commit o push, usa `git add .`, luego `git commit -m "mensaje descriptivo"` y finalmente `git push`.
- No hagas commit sin que el usuario lo solicite. No uses `--no-verify` ni `--amend` a menos que el usuario lo autorice.
- Revisa siempre `git status` y `git diff` antes de commitear para saber exactamente qué se incluye.