import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Wali — Financial Guardian',
        short_name: 'Wali',
        description: 'Your Islamic financial guardian',
        theme_color: '#0a0f0d',
        background_color: '#0a0f0d',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          // You will need to add these images to your /public folder later
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
})