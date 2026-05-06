import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/LuminaFinance/',
  server: {
    port: 8080,
  },
})
