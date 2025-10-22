import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: false, // Disable source maps to prevent missing map warnings
  },
  css: {
    devSourcemap: false, // Disable CSS source maps in development
  },
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..'],
    },
    sourcemapIgnoreList: (sourcePath: string, sourcemapPath: string) => {
      // Ignore source maps for node_modules, especially lucide-react
      return (
        sourcePath.includes('node_modules') ||
        sourcePath.includes('lucide-react')
      );
    },
  },
  // Completely disable source map generation for dependencies
  optimizeDeps: {
    exclude: [],
    include: ['lucide-react'],
    esbuildOptions: {
      sourcemap: false,
    },
  },
});
