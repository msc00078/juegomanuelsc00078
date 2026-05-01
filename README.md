# AI Boss Arena (Cyber-Brutalism Roguelite)

Es un **Action Roguelite 2D de Supervivencia en Arena** con progresión procedural, toques RPG, adaptación total a dispositivos móviles y un sistema de jefe interactivo impulsado por IA.

---

## 🎮 1. Sistema de Juego Core (Gameplay)
El jugador controla a un héroe en arenas cerradas donde debe sobrevivir a oleadas de enemigos, recoger recursos, mejorarse y avanzar nivel tras nivel.

*   **Controles Multplataforma:**
    *   *PC:* Movimiento con `WASD` o Flechas. Dash con `SHIFT`. Ataque con `ESPACIO`. Cambio de armas con `1`, `2`, `3`. Inventario con `TAB` o `I`. Pausa con `ESC` o `P`.
    *   *Móvil:* Joystick virtual dinámico a la izquierda. Botones táctiles de Ataque y Dash a la derecha. Sistema que fuerza el modo panorámico (Landscape) y oculta la barra del navegador (Fullscreen).
*   **Mecánicas del Jugador:**
    *   **Dash (Esquiva):** Otorga invulnerabilidad temporal y un gran impulso de velocidad. Tiene un enfriamiento (cooldown) visible mediante una barra bajo el jugador.
    *   **Magnetismo:** Los orbes de experiencia son atraídos hacia el jugador automáticamente si se acerca lo suficiente.
    *   **Sistema de Combo:** Matar enemigos rápidamente aumenta un multiplicador de combo que otorga más experiencia. Si pasas 3 segundos sin matar, el combo se reinicia.
*   **Fase de Preparación:** Al inicio de cada nivel hay un **contador de 3 segundos** donde todo está congelado, permitiendo al jugador analizar la posición de los enemigos antes de la acción.

## ⚔️ 2. Arsenal y Combate
El jugador puede desbloquear y alternar entre 3 estilos de combate diferentes:
1.  **Espada (Defecto):** Ataque cuerpo a cuerpo continuo.
2.  **Arco (Comprable):** Disparo a distancia con enfriamiento. (Se puede mejorar a disparos múltiples con reliquias).
3.  **Bombas (Comprables):** Explosivos con área de efecto (AoE) que dañan a múltiples enemigos. (Pueden hacerse pegajosas o con mayor radio mediante reliquias).

## 👾 3. Ecosistema de Enemigos
El juego cuenta con una IA enemiga variada que escala en cantidad y dificultad según el nivel:
*   🟢 **Slime (Estándar):** Te persigue implacablemente.
*   🪨 **Orco (Tanque):** Lento, mucha vida, pega duro y suelta más oro.
*   🦇 **Murciélago (Kamikaze):** Extremadamente rápido, poca vida. Si se acerca demasiado, explota causando gran daño en área.
*   🏹 **Arquero (A distancia):** Huye si te acercas mucho, te persigue si te alejas y te dispara flechas periódicamente.
*   🧙‍♂️ **Nigromante (Invocador):** Mantiene una distancia extrema y cada 5 segundos invoca Slimes pequeños para que lo defiendan.

## 🚪 4. Progresión y Rutas (Generación Procedural)
Al superar un nivel, el juego decide automáticamente qué tipo de sala será la siguiente (con probabilidades matemáticas), creando una experiencia única en cada partida:
*   **Combate Normal (40%):** Lucha estándar.
*   **Combate Élite (15%):** El jugador puede elegir entre intentar "Escapar" (50% éxito) o "Luchar" contra un Tanque Élite gigante que otorga grandes recompensas.
*   **Sala del Tesoro (15%):** Una sala de paz donde llueve oro y a veces pociones de vida.
*   **Tienda (15%):** Permite gastar oro para curarse, aumentar Vida Máxima, subir Daño Base, o comprar el Arco y las Bombas.
*   **Evento Misterioso (15%):** Eventos de texto tipo rol donde el jugador toma decisiones con riesgos y recompensas.
*   *Nota: Siempre se garantiza una Tienda o Sala de Reliquias justo antes del nivel del Jefe para prepararse.*

## 💀 5. Jefes Finales Adaptativos
*   **Frecuencia:** Aparece un Jefe Final cada **5 niveles**.
*   **Fases de Combate:** El jefe cambia de patrón al bajar del 60% y del 30% de vida, volviéndose más agresivo (Aura visual, más velocidad, ataques más fuertes).
*   **Ataques Dinámicos:** Puede hacer Dashes hacia ti, disparar proyectiles (o ráfagas triples), crear explosiones en área y, en su última fase, invocar Kamikazes.
*   **Integración de IA (API):** El jefe se comunica con un backend externo (`/api/boss-decision`) pasándole el estado del juego (Vida, Distancia) para recibir un diálogo personalizado y el siguiente movimiento, dándole una "personalidad" única.

## 🧬 6. Sistemas de Mejora Continua (RPG)
La progresión del personaje tiene 3 capas distintas:
1.  **Level Up (XP en Partida):** Recoger orbes azules sube el nivel del jugador durante la partida. Al subir de nivel, se elige entre 3 mejoras inmediatas.
2.  **Reliquias (Pasivas Únicas):** Existen 15 reliquias. Se obtienen tras vencer Élites o antes de Jefes. Cambian drásticamente la forma de jugar.
3.  **Meta-Progresión (Santuario de Mejoras):** Al morir, recibes **Cristales 💎**. Estos cristales se guardan permanentemente en el navegador (LocalStorage) y se gastan en el menú principal para iniciar futuras partidas con más Vida, Daño o Velocidad base.

## 📱 7. Interfaz, Arquitectura y Responsividad
*   **Responsive Total (1280x720 Escala Dinámica):** Toda la UI usa coordenadas matemáticas relativas (`scale.width / 2`). Esto asegura que el juego se vea perfectamente centrado y simétrico ya sea en un monitor ultrapanorámico, una tablet o un teléfono vertical girado.
*   **Físicas y Límites (Bounds):** Las físicas evitan que el jugador o los enemigos se salgan del mapa (clamp de posiciones) y las colisiones calculan el retroceso (knockback) dinámicamente al recibir daño.
