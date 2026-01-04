import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
        }),
        react({
            fastRefresh: false,  // Disable Fast Refresh for Docker compatibility
        }),
    ],
    server: {
        host: '0.0.0.0',
        port: 5173,
        strictPort: true,
        origin: 'http://localhost:5173',
        hmr: {
            protocol: 'ws',
            host: 'localhost',
            port: 5173,
            clientPort: 5173,
        },
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
        cors: true,
    },
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
});
