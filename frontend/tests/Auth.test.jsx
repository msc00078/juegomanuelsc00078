import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Auth from '../src/components/Auth.jsx';
import * as supabaseAPI from '../src/game/supabase.js';

vi.mock('../src/game/supabase.js', () => ({
  signIn: vi.fn().mockResolvedValue({ data: { user: { email: 'test@test.com' } }, error: null }),
  signUp: vi.fn().mockResolvedValue({ data: { user: { email: 'test@test.com' } }, error: null }),
  getLeaderboard: vi.fn().mockResolvedValue({ data: [], error: null })
}));

vi.mock('react-responsive', () => ({
  useMediaQuery: vi.fn(() => false)
}));

const renderAuth = (onLogin = vi.fn()) => render(<Auth onLogin={onLogin} />);

describe('Auth Component Tests', () => {
    it('debería renderizar el formulario de acceso', async () => {
        await act(async () => { renderAuth(); });
        expect(screen.getByPlaceholderText('EMAIL')).toBeTruthy();
        expect(screen.getByPlaceholderText('PASSWORD')).toBeTruthy();
    });

    it('debería mostrar el botón de iniciar sesión', async () => {
        await act(async () => { renderAuth(); });
        expect(screen.getByText('INICIAR SESIÓN')).toBeTruthy();
    });

    it('debería mostrar el ranking al cargar', async () => {
        await act(async () => { renderAuth(); });
        expect(supabaseAPI.getLeaderboard).toHaveBeenCalled();
    });

    it('debería permitir escribir email y contraseña', async () => {
        await act(async () => { renderAuth(); });
        const emailInput = screen.getByPlaceholderText('EMAIL');
        const passInput = screen.getByPlaceholderText('PASSWORD');
        await act(async () => {
            fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
            fireEvent.change(passInput, { target: { value: 'password123' } });
        });
        expect(emailInput.value).toBe('test@test.com');
        expect(passInput.value).toBe('password123');
    });

    it('debería llamar a signIn al enviar el formulario de login', async () => {
        const handleLogin = vi.fn();
        await act(async () => { renderAuth(handleLogin); });

        const emailInput = screen.getByPlaceholderText('EMAIL');
        const passInput = screen.getByPlaceholderText('PASSWORD');
        const form = emailInput.closest('form');

        await act(async () => {
            fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
            fireEvent.change(passInput, { target: { value: 'password123' } });
            fireEvent.submit(form);
        });

        await waitFor(() => {
            expect(supabaseAPI.signIn).toHaveBeenCalledWith('test@test.com', 'password123');
            expect(handleLogin).toHaveBeenCalled();
        });
    });

    it('debería cambiar al modo de registro al hacer clic en el toggle', async () => {
        await act(async () => { renderAuth(); });
        const toggleText = screen.getByText('¿Eres nuevo? Crea un perfil aquí');
        await act(async () => { fireEvent.click(toggleText); });
        expect(screen.getByPlaceholderText('USERNAME')).toBeTruthy();
        expect(screen.getByText('CREAR PERFIL')).toBeTruthy();
    });

    it('debería llamar a signUp en modo registro', async () => {
        const handleLogin = vi.fn();
        await act(async () => { renderAuth(handleLogin); });

        // Cambiar a modo registro
        const toggleText = screen.getByText('¿Eres nuevo? Crea un perfil aquí');
        await act(async () => { fireEvent.click(toggleText); });

        await act(async () => {
            fireEvent.change(screen.getByPlaceholderText('USERNAME'), { target: { value: 'tester' } });
            fireEvent.change(screen.getByPlaceholderText('EMAIL'), { target: { value: 'test@test.com' } });
            fireEvent.change(screen.getByPlaceholderText('PASSWORD'), { target: { value: 'password123' } });
            fireEvent.submit(screen.getByPlaceholderText('EMAIL').closest('form'));
        });

        await waitFor(() => {
            expect(supabaseAPI.signUp).toHaveBeenCalledWith('test@test.com', 'password123', 'tester');
            expect(handleLogin).toHaveBeenCalled();
        });
    });

    it('debería volver a modo login al hacer clic en toggle de registro', async () => {
        await act(async () => { renderAuth(); });
        const toggleA = screen.getByText('¿Eres nuevo? Crea un perfil aquí');
        await act(async () => { fireEvent.click(toggleA); }); // → modo registro
        const toggleB = screen.getByText('¿Ya tienes una cuenta? Inicia sesión');
        await act(async () => { fireEvent.click(toggleB); }); // → vuelta a login
        expect(screen.getByText('INICIAR SESIÓN')).toBeTruthy();
    });
});
