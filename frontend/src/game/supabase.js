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

// Función para guardar puntuación y progreso
export const saveRunResult = async (score, sector, crystalsEarned) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Primero obtenemos los datos actuales para sumar los cristales
    const { data: profile } = await supabase
        .from('profiles')
        .select('total_crystals, high_score, max_sector')
        .eq('id', user.id)
        .single();

    if (profile) {
        const newHighScore = Math.max(profile.high_score, score);
        const newMaxSector = Math.max(profile.max_sector, sector);
        const newTotalCrystals = (profile.total_crystals || 0) + crystalsEarned;

        await supabase
            .from('profiles')
            .update({ 
                high_score: newHighScore, 
                max_sector: newMaxSector,
                total_crystals: newTotalCrystals,
                updated_at: new Date()
            })
            .eq('id', user.id);
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

