import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseKey && supabaseKey !== 'TU_ANON_KEY_AQUI')
    ? createClient(supabaseUrl, supabaseKey)
    : null;

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001'
    : 'https://juegomanuelsc00078.onrender.com';

export const signUp = async (email, password, username) => {
    if (!supabase) throw new Error("Supabase no está inicializado. Verifica las llaves en el .env.");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error };

    if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert([
            { id: data.user.id, username: username }
        ]);
        if (profileError) console.error("Error creando perfil:", profileError);
    }
    return { data };
};

export const signIn = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
};

export const saveRunResult = async (score, sector, crystalsEarned = 0) => {
    if (!supabase) return;
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const response = await fetch(`${API_BASE}/api/save-score`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
                score: Math.floor(score || 0),
                sector: Math.floor(sector || 1),
                crystalsEarned: Math.floor(crystalsEarned || 0),
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

export const getCrystals = async () => {
    if (!supabase) return null;
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;
        const { data, error } = await supabase
            .from('profiles')
            .select('total_crystals')
            .eq('id', session.user.id)
            .single();
        return error ? null : (data?.total_crystals ?? 0);
    } catch {
        return null;
    }
};

export const spendCrystals = async (amount) => {
    if (!supabase) return { error: 'No auth' };
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return { error: 'No session' };
        const { data, error } = await supabase
            .rpc('spend_crystals', { p_amount: amount });
        return { data, error };
    } catch (err) {
        return { error: err.message };
    }
};

export const getLeaderboard = async () => {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, username, high_score, max_sector')
        .order('high_score', { ascending: false })
        .limit(10);

    return { data, error };
};
