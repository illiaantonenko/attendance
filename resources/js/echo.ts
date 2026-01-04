import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Make Pusher available globally for Echo
window.Pusher = Pusher;

// Get configuration from environment
const wsHost = import.meta.env.VITE_PUSHER_HOST || window.location.hostname;
const wsPort = parseInt(import.meta.env.VITE_PUSHER_PORT || '6001');
const wsScheme = import.meta.env.VITE_PUSHER_SCHEME || 'http';
const forceTLS = wsScheme === 'https';

// Configure Echo to connect to Soketi
const echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY || 'attendance-key',
    cluster: 'mt1',
    wsHost: wsHost,
    wsPort: forceTLS ? 443 : wsPort,
    wssPort: forceTLS ? 443 : wsPort,
    forceTLS: forceTLS,
    disableStats: true,
    enabledTransports: ['ws', 'wss'],
});

export default echo;

// Add types for window
declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo: Echo;
    }
}

window.Echo = echo;

