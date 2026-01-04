import '../css/app.css';
import './echo';

import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { ThemeProvider } from './contexts/ThemeContext';
import PageTransition from './Components/PageTransition';

createInertiaApp({
    title: (title) => `${title} - Attendance System`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx')
        ),
    setup({ el, App, props }) {
        createRoot(el).render(
            <ThemeProvider>
                <PageTransition>
                    <App {...props} />
                </PageTransition>
            </ThemeProvider>
        );
    },
    progress: {
        color: '#3b82f6',
        showSpinner: true,
        includeCSS: true,
        delay: 0,
    },
});

