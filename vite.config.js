import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
        }),
        react({
            devTarget: 'esnext',
        }),
    ],
    server: {
        host: '0.0.0.0',
        port: 5173,
        strictPort: true,
        hmr: false,  // Disable HMR temporarily
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
