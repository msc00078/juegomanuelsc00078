# Changelog - AI Boss Arena (Roguelike Edition)

Todas las novedades y mejoras implementadas en el proyecto.

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
