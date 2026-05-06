import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Auth from '../src/components/Auth.jsx';
import * as supabaseAPI from '../src/game/supabase.js';

// Mock del API de supabase que usa el componente Auth
vi.mock('../src/game/supabase.js', () => ({
  signIn: vi.fn().mockResolvedValue({ data: { user: { email: 'test@test.com' } }, error: null }),
  signUp: vi.fn().mockResolvedValue({ data: { user: { email: 'test@test.com' } }, error: null }),
  getLeaderboard: vi.fn().mockResolvedValue({ data: [], error: null })
}));

// react-responsive devuelve siempre false en JSDOM (no es móvil)
vi.mock('react-responsive', () => ({
  useMediaQuery: vi.fn(() => false)
}));

describe('Auth Component Tests', () => {
    it('debería renderizar el formulario de acceso', () => {
        render(<Auth onLogin={() => {}} />);
        
        // Los placeholders reales del componente son "EMAIL" y "PASSWORD"
        expect(screen.getByPlaceholderText('EMAIL')).toBeTruthy();
        expect(screen.getByPlaceholderText('PASSWORD')).toBeTruthy();
        expect(screen.getByText('¿Eres nuevo? Crea un perfil aquí')).toBeTruthy();
    });

    it('debería mostrar el botón de iniciar sesión', () => {
        render(<Auth onLogin={() => {}} />);
        expect(screen.getByText('INICIAR SESIÓN')).toBeTruthy();
    });

    it('debería permitir escribir email y contraseña', () => {
        render(<Auth onLogin={() => {}} />);
        
        const emailInput = screen.getByPlaceholderText('EMAIL');
        const passInput = screen.getByPlaceholderText('PASSWORD');

        fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
        fireEvent.change(passInput, { target: { value: 'password123' } });
        
        expect(emailInput.value).toBe('test@test.com');
        expect(passInput.value).toBe('password123');
    });

    it('debería llamar a signIn al enviar el formulario', async () => {
        const handleLogin = vi.fn();
        render(<Auth onLogin={handleLogin} />);
        
        const emailInput = screen.getByPlaceholderText('EMAIL');
        const passInput = screen.getByPlaceholderText('PASSWORD');
        const form = emailInput.closest('form');

        fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
        fireEvent.change(passInput, { target: { value: 'password123' } });
        fireEvent.submit(form);
        
        await waitFor(() => {
            expect(supabaseAPI.signIn).toHaveBeenCalledWith('test@test.com', 'password123');
            expect(handleLogin).toHaveBeenCalled();
        });
    });

    it('debería cambiar al modo de registro al hacer clic en el toggle', () => {
        render(<Auth onLogin={() => {}} />);
        
        const toggleText = screen.getByText('¿Eres nuevo? Crea un perfil aquí');
        fireEvent.click(toggleText);
        
        // En modo registro aparece el campo USERNAME
        expect(screen.getByPlaceholderText('USERNAME')).toBeTruthy();
        expect(screen.getByText('CREAR PERFIL')).toBeTruthy();
    });
});
