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
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Primero obtenemos los datos actuales para sumar los cristales
        const { data: profile } = await supabase
            .from('profiles')
            .select('total_crystals, high_score, max_sector')
            .eq('id', user.id)
            .single();

        let newHighScore = score || 0;
        let newMaxSector = sector || 1;
        let newTotalCrystals = crystalsEarned || 0;

        if (profile) {
            newHighScore = Math.max(profile.high_score || 0, score || 0);
            newMaxSector = Math.max(profile.max_sector || 1, sector || 1);
            newTotalCrystals = (profile.total_crystals || 0) + (crystalsEarned || 0);
        }

        const { error } = await supabase
            .from('profiles')
            .upsert({ 
                id: user.id,
                username: profile?.username || user.email.split('@')[0],
                high_score: newHighScore, 
                max_sector: newMaxSector,
                total_crystals: newTotalCrystals,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
            
        if (error) {
            console.error("Error guardando run:", error);
            alert("⚠️ Error guardando tu puntuación en Supabase: " + error.message + "\n\n¿Tienes configuradas las políticas RLS de INSERT/UPDATE para la tabla 'profiles'?");
        }
    } catch (err) {
        console.error("Error crítico en saveRunResult:", err);
        alert("⚠️ Error crítico conectando con el ranking: " + err.message);
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

