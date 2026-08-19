import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, open: true },
  // exceljs вантажиться ліниво — пре-бандлимо одразу, інакше Vite
  // пере-оптимізовує залежності на льоту і dynamic import отримує 504
  optimizeDeps: { include: ['exceljs'] },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'charts': ['recharts'],
          'xlsx': ['xlsx']
        }
      }
    },
    chunkSizeWarningLimit: 800
  }
})
