import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  server: {
    proxy: {
      // Frontend calls /api/* and Vite forwards to the Python backend on port 8000
      '/api': 'http://localhost:8000',
    },
  },
})
