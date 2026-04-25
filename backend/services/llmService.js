import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

export async function getBossAction(gameState) {
    const { boss_hp, player_hp, distance, boss_type, boss_phase } = gameState;
    
    let personalityInfo = "";
    if (boss_type === "poeta") {
        personalityInfo = "Eres un boss de videojuego con personalidad POETA. Haces ataques suaves y dices frases metafóricas o poéticas sobre el combate y el destino.";
    } else if (boss_type === "logico") {
        personalityInfo = "Eres un boss de videojuego con personalidad LÓGICO. Buscas el ataque óptimo. Eres frío y calculador.";
    } else if (boss_type === "glitch") {
        personalityInfo = "Eres un boss de videojuego con personalidad GLITCH o BUG. Tus decisiones son caóticas y tus frases parecen errores de sistema o código roto.";
    } else {
        personalityInfo = "Eres un boss de videojuego estándar.";
    }

    const prompt = `
${personalityInfo}

Estado actual del combate:
- Fase Actual del Boss: ${boss_phase} (Fase 1: Tranquilo, Fase 2: Agresivo, Fase 3: Desesperado/Minions)
- Vida del Boss: ${boss_hp}%
- Vida del Jugador: ${player_hp}%
- Distancia al jugador: ${distance} (unidades)

Decide la siguiente acción basándote en tu personalidad, tu FASE y el estado del combate. 
Si la distancia es corta, podrías preferir 'area' o 'dash'. Si es larga, 'projectile' o 'dash'.

Responde SOLO con un JSON válido con la siguiente estructura exacta, sin markdown de bloques de código:
{
  "action": "dash" o "projectile" o "area",
  "intensity": número decimal entre 0.0 y 1.0 indicando agresividad de la acción,
  "dialogue": "frase corta de máximo 10 palabras según tu personalidad"
}
`;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant', // Using the current supported Llama 3.1 model on Groq
            response_format: { type: "json_object" }
        });

        const jsonText = chatCompletion.choices[0]?.message?.content || "{}";
        const actionData = JSON.parse(jsonText);
        return actionData;
    } catch (err) {
        console.error("LLM Service Error:", err);
        // Fallback action in case of API error
        return {
            action: "projectile",
            intensity: 0.5,
            dialogue: "..."
        };
    }
}
