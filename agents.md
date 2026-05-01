# Instrucciones para Agentes AI (AI Agents Guidelines)

## 1. Mantenimiento del CHANGELOG
- **SIEMPRE** que realices un cambio estructural, añadas una funcionalidad o corrijas un bug importante, debes actualizar el archivo `CHANGELOG.md`.
- Sigue el formato estándar de versionado Semántico (Ej. `[1.6.0] - AAAA-MM-DD`).
- Agrupa los cambios bajo las categorías `### Añadido`, `### Corregido` o `### Modificado`.

## 2. Coordinación UI y Responsividad
- El juego está diseñado bajo la filosofía **Mobile-First / Responsive Total**.
- **Regla de Oro:** **NUNCA uses coordenadas hardcodeadas** (como `x: 400`, `y: 300`) en nuevas escenas o menús.
- Utiliza **SIEMPRE** referencias dinámicas relativas a la pantalla: `this.scale.width` y `this.scale.height`. 
- Todo el layout se calcula en base a `cx = W / 2` y `cy = H / 2`.

## 3. Estilo de Código (Phaser 3)
- Evita usar clases globales a menos que sea estrictamente necesario. Usa el `scene.registry` para compartir estado entre escenas.
- Limpia los Timers, Eventos y Tweens generados cuando destruyas un objeto para evitar fugas de memoria (memory leaks).
- Mantén el idioma principal de la UI, comentarios del código y logs en **Español**, dado el público objetivo y la base del código actual.

## 4. Prioridad de Rendimiento (Móvil)
- Si vas a añadir partículas o efectos masivos, pon límites o "quantity" bajos pensando en que los dispositivos móviles no puedan renderizar 1000 sprites al mismo tiempo sin bajar los FPS.
- Utiliza `.setScrollFactor(0)` para los elementos estáticos del HUD en lugar de recalcular posiciones.
