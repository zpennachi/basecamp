import { defineConfig } from 'vite'

export default defineConfig({
  // Use /basecamp/ base for GitHub Pages; '/' for local dev
  base: process.env.NODE_ENV === 'production' ? '/basecamp/' : '/',
})
