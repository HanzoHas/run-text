import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: 'all', // Allow any host to connect
    host: true // Bind to all network interfaces
  }
})