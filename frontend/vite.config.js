import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      // Proxy requests starting with '/api'
      '/api': {
        target: 'http://localhost:5000', // The backend server address
        changeOrigin: true, // Changes the origin header to the target URL
        rewrite: (path) => path.replace(/^\/api/, ''), // Rewrites the path from '/api/...' to '/...'
      },
    },
  },
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
})
