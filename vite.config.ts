import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  publicDir: 'static',
  build: {
    target: 'es2022',
  },
});
