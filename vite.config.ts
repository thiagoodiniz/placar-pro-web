import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/proxy-img': {
                target: 'https://api.sofascore.app/api/v1',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/proxy-img/, '')
            }
        }
    }
})
