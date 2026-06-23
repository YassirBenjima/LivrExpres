import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://nginx',
        changeOrigin: true,
      },
      '/assets': {
        target: 'http://nginx',
        changeOrigin: true,
      }
    }
  }
})
