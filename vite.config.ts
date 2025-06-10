import { defineConfig } from 'vite';

export default defineConfig(({ command }) => {
  const base = command === 'build' && process.env.BASE_URL ? process.env.BASE_URL : '/';
  
  return {
    base,
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            three: ['three']
          }
        }
      }
    }
  };
});