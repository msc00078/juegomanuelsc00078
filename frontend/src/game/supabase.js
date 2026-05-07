import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Inicializar solo si las llaves no son los placeholders
export const supabase = (supabaseUrl && supabaseKey && supabaseKey !== 'TU_ANON_KEY_AQUI') 
    ? createClient(supabaseUrl, supabaseKey) 
    : null;


// Función para registrarse
export const signUp = async (email, password, username) => {
    if (!supabase) throw new Error("Supabase no está inicializado. Verifica las llaves en el .env.");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error };
    
    if (data.user) {
        // Creamos su perfil en la tabla de profiles
        const { error: profileError } = await supabase.from('profiles').insert([
            { id: data.user.id, username: username }
        ]);
        if (profileError) console.error("Error creando perfil:", profileError);
    }
    return { data };
};

// Función para Login
export const signIn = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
};

// Función para guardar puntuación y progreso de forma SEGURA (Validado en Servidor)
export const saveRunResult = async (score, sector) => {
    if (!supabase) return;
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Llamamos a nuestro backend en lugar de a Supabase directamente
        // Esto añade una capa de validación humana/lógica que el "amigo" no podrá saltarse fácilmente
        const response = await fetch('http://localhost:3001/api/save-score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
                score: Math.floor(score || 0),
                sector: Math.floor(sector || 1),
                userId: session.user.id
            })
        });

        const result = await response.json();
            
        if (!response.ok) {
            console.error("⚠️ Fallo de validación:", result.error);
            if (result.hacker_detected) {
                alert("🚨 PROTOCOLO DE SEGURIDAD ACTIVADO:\nPuntuación anómala detectada. Los datos han sido descartados.");
            }
        } else {
            console.log("🛡️ " + result.message);
        }
    } catch (err) {
        console.error("Error crítico en comunicación con servidor de validación:", err);
    }
};

// Función para obtener el Top 10 del Ranking
export const getLeaderboard = async () => {
    const { data, error } = await supabase
        .from('profiles')
        .select('username, high_score, max_sector')
        .order('high_score', { ascending: false })
        .limit(10);
    
    return { data, error };
};

