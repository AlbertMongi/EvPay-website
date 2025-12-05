import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        contact: resolve(__dirname, 'contact.html'),
        collection: resolve(__dirname, 'collection.html'),
        payout: resolve(__dirname, 'payout.html'),
        card: resolve(__dirname, 'card.html'),
        login: resolve(__dirname, 'login.html'),
        registration: resolve(__dirname, 'registration.html'),
        doc: resolve(__dirname, 'doc.html'),
      },
    },
  },
})
