import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Use /static/ only for production builds (so assets are served under /static)
  // Keep dev server base at '/' so localhost:5173 serves the app normally.
  base: mode === 'production' ? '/static/' : '/',
  build: {
    outDir: 'build',
  },
}))
