# 🗄️ Resumen de Integración Supabase - Neón Sagrado

Este documento registra todas las tablas, esquemas y funciones que hemos implementado en Supabase hasta la fecha para el backend del juego.

---

## 1. Sistema de Usuarios (Auth & Perfiles)

El juego utiliza el sistema de autenticación nativo de Supabase (`auth.users`) conectado a una tabla pública `profiles` para gestionar los datos públicos y el ranking.

### Tabla: `profiles`
Almacena el progreso del jugador. Se actualiza automáticamente cada vez que el jugador muere.

```sql
CREATE TABLE profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  total_crystals INT DEFAULT 0,
  max_sector INT DEFAULT 1,
  high_score INT DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
```

**Políticas de Seguridad (RLS):**
- **Lectura**: Pública (`true`). Todo el mundo puede ver el ranking.
- **Escritura**: Restringida. Solo el propio usuario (`auth.uid() = id`) puede actualizar su récord.

---

## 2. Sistema de Lore Masivo

Para evitar que el juego sea repetitivo, el lore está separado del código y se aloja en Supabase. El juego consulta esta tabla para generar eventos narrativos dependiendo del sector del jugador.

### Tabla: `lore_events`
Almacena diálogos y decisiones.

```sql
CREATE TABLE lore_events (
  id SERIAL PRIMARY KEY,
  npc_name TEXT NOT NULL,       -- Nombre del NPC (Pix, Krak-7, Don Byte)
  title TEXT NOT NULL,          -- Título del evento
  dialogues TEXT[] NOT NULL,    -- Array de frases para conversaciones largas
  min_sector INT DEFAULT 1,     -- Nivel mínimo para que aparezca
  max_sector INT DEFAULT 100,   -- Nivel máximo
  choices JSONB                 -- Opciones disponibles y sus efectos (JSON)
);
```

---

## 3. Lógica del Cliente (`supabase.js`)

En el frontend (Vite), hemos implementado los siguientes métodos para interactuar con la base de datos:

- `signUp(email, password, username)`: Crea el usuario en `auth.users` y automáticamente genera su fila en `profiles`.
- `signIn(email, password)`: Autentica al usuario.
- `saveRunResult(score, sector, crystalsEarned)`: Obtiene los datos actuales del usuario y suma los cristales obtenidos, además de guardar el récord si es mayor al anterior.
- `getLeaderboard()`: Devuelve el Top 10 de jugadores ordenados por `high_score`.

---

**Siguientes pasos recomendados:**
- Implementar la validación de servidor para evitar que los jugadores envíen una puntuación falsa manipulando la llamada a la API (pasando la lógica crítica a Edge Functions o al backend Node.js).
