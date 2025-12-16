import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { compression } from 'vite-plugin-compression2'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Gzip compression for production
    mode === 'production' && compression({
      algorithm: 'gzip',
      exclude: [/\.(br)$/, /\.(gz)$/],
    }),
  ].filter(Boolean),
  
  build: {
    // Production optimizations
    outDir: 'dist',
    sourcemap: mode !== 'production', // Désactiver sourcemaps en prod
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production', // Enlever console.log en prod
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
          'i18n-vendor': ['i18next', 'react-i18next'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  
  // Optimizations
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios'],
  },
}))

