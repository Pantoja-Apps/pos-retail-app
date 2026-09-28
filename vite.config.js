import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'pwa-splash-logo-512.png',
        'pwa-splash-logo-192.png',
        'pwa-launcher-maskable-512.png',
        'pwa-launcher-maskable-192.png',
        'favicon.ico'
      ],
      manifestFilename: 'manifest.json',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}']
      },
      manifest: {
        name: 'Facilito POS Pro',
        short_name: 'FacilitoPOS',
        description: 'Punto de Venta Profesional para Comercios',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: '/pwa-splash-logo-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-splash-logo-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-launcher-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/pwa-launcher-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ]
});
