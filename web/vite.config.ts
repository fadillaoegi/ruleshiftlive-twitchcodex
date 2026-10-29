import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const backend = new URL(process.env.RULESHIFT_BACKEND_ORIGIN ?? 'http://127.0.0.1:8080');
if (backend.protocol !== 'http:' || !['127.0.0.1', '[::1]'].includes(backend.hostname) || backend.username || backend.password || backend.pathname !== '/') {
  throw new Error('The API proxy must point to a loopback HTTP backend.');
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': backend.origin,
      '/auth': backend.origin,
      '/healthz': backend.origin,
    },
  },
});
