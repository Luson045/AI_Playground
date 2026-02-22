import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // load `.env` files so we can reference VITE_API_URL during dev if needed
  // (Vite automatically prefixes variables with VITE_ into import.meta.env).
  const apiUrl = process.env.VITE_API_URL || 'http://localhost:5000';

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  };
});
