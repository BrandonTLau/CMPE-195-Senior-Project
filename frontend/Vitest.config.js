import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_BACKEND_URL': JSON.stringify('http://localhost:5000'),
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/unit-tests/Setup.js'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/unit-tests/**',
        'src/integration-tests/**',
        'src/e2e-tests/**',
        'src/main.jsx',
        'src/LandingPage.jsx',
        'src/FlashcardsPage.jsx',
        'src/NotesLibrary.jsx',
        'src/api/**',
      ],
      thresholds: { lines: 70, functions: 50, branches: 70, statements: 70 },
    },
  },
});
