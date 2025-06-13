import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@views': fileURLToPath(new URL('./src/views', import.meta.url)),
      '@stores': fileURLToPath(new URL('./src/stores', import.meta.url)),
      '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
      '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
      '@plugins': fileURLToPath(new URL('./src/plugins', import.meta.url))
    }
  },
  server: {
    port: 3000,
    strictPort: true,
    // Configuration pour le mode history
    proxy: {
      // Proxy pour les routes d'API
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      // Gestion du mode history pour les routes de l'application
      '^/(?!@vite|@id|node_modules|src|assets|public).*': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        rewrite: (_path) => '/index.html'
      }
    },
    // Configuration HMR
    hmr: {
      port: 3000,
      protocol: 'ws',
      host: 'localhost',
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  }
})
