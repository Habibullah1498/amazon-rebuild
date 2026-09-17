import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base: './' keeps asset URLs relative so the same build works on GitHub Pages
// (served from /<repo>/), Netlify, and file://.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
});
