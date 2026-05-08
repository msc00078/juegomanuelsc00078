/**
 * Diagnóstico directo de Supabase
 * Ejecutar: node tests/pingSupabase.js
 */
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function main() {
    console.log('\n=== DIAGNÓSTICO SUPABASE ===\n');
    console.log(`URL: ${SUPABASE_URL}`);
    console.log(`Key: ${SUPABASE_KEY?.substring(0, 20)}...\n`);

    // 1. Test si la tabla profiles existe
    console.log('1. Test: leer de profiles (debe devolver datos públicos)');
    try {
        const resp = await axios.get(`${SUPABASE_URL}/rest/v1/profiles?limit=1`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
            }
        });
        console.log(`   ✅ Profiles OK: status ${resp.status}, data: ${JSON.stringify(resp.data)}\n`);
    } catch (err) {
        console.log(`   ❌ Error: ${err.response?.status} - ${JSON.stringify(err.response?.data)}\n`);
    }

    // 2. Test RPC sin auth (con anon key)
    console.log('2. Test: llamar RPC registrar_fin_partida (sin JWT real)');
    try {
        const resp = await axios.post(`${SUPABASE_URL}/rest/v1/rpc/registrar_fin_partida`,
            { p_score: 100, p_sector: 1 },
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                }
            }
        );
        console.log(`   ✅ RPC OK: status ${resp.status}, data: ${JSON.stringify(resp.data)}\n`);
    } catch (err) {
        const detail = err.response?.data;
        console.log(`   ❌ Error: ${err.response?.status}`);
        if (typeof detail === 'object') {
            console.log(`   📄 Detalle: ${JSON.stringify(detail, null, 2)}`);
        } else {
            console.log(`   📄 Detalle: ${detail}`);
        }
        console.log();
    }

    // 3. Test RPC con p_crystals
    console.log('3. Test: RPC con p_crystals');
    try {
        const resp = await axios.post(`${SUPABASE_URL}/rest/v1/rpc/registrar_fin_partida`,
            { p_score: 100, p_sector: 1, p_crystals: 5 },
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                }
            }
        );
        console.log(`   ✅ RPC OK: status ${resp.status}, data: ${JSON.stringify(resp.data)}\n`);
    } catch (err) {
        const detail = err.response?.data;
        console.log(`   ❌ Error: ${err.response?.status}`);
        if (typeof detail === 'object') {
            console.log(`   📄 Detalle: ${JSON.stringify(detail, null, 2)}`);
        } else {
            console.log(`   📄 Detalle: ${detail}`);
        }
        console.log();
    }

    // 4. Test RPC auth_uid - comprobar si auth.uid() funciona
    console.log('4. Test: comprobar si existe la función (listar RPCs)');
    try {
        const resp = await axios.get(`${SUPABASE_URL}/rest/v1/rpc/registrar_fin_partida`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
            }
        });
        console.log(`   ✅ RPC existe: status ${resp.status}\n`);
    } catch (err) {
        if (err.response?.status === 404) {
            console.log(`   ❌ El RPC NO EXISTE. Debes crearlo en Supabase SQL Editor.\n`);
        } else {
            console.log(`   ⚠️  Status ${err.response?.status}: ${JSON.stringify(err.response?.data)}\n`);
        }
    }
}

main().catch(console.error);
