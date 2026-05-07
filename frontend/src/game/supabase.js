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
        // Usamos una función RPC de Supabase para que el servidor calcule los cristales
        // y aplique límites de seguridad, evitando que el usuario los manipule en el cliente.
        const { error } = await supabase.rpc('registrar_fin_partida', {
            p_score: Math.floor(score || 0),
            p_sector: Math.floor(sector || 1)
        });
            
        if (error) {
            console.error("Error validando partida en servidor:", error);
            // Si el error es que la función no existe, es que el usuario no ha ejecutado el SQL
            if (error.code === 'P0001') {
                alert("⚠️ Error de seguridad: " + error.message);
            }
        } else {
            console.log("🛡️ Puntuación validada y guardada por el servidor.");
        }
    } catch (err) {
        console.error("Error crítico en comunicación con servidor:", err);
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

