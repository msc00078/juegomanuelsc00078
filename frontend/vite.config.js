import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('phaser')) {
              return 'phaser';
            }
            if (id.includes('@supabase') || id.includes('supabase')) {
              return 'supabase';
            }
            return 'vendor';
          }
        }
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.js',
    env: {
      VITE_SUPABASE_URL: 'http://localhost',
      VITE_SUPABASE_ANON_KEY: 'test-key'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'dist/'
      ]
    }
  }
})
