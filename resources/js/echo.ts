import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Make Pusher available globally for Echo
window.Pusher = Pusher;

// Get configuration from environment
const wsHost = import.meta.env.VITE_PUSHER_HOST || window.location.hostname;
const forceTLS = window.location.protocol === 'https:';
// Use same port as the current page (works for both dev :8000 and prod :80/:443)
const wsPort = parseInt(window.location.port) || (forceTLS ? 443 : 80);

// Configure Echo to connect to Soketi via Nginx proxy
// WebSocket is proxied through /app path on the same host/port as the main app
const echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY || 'attendance-key',
    cluster: 'mt1',
    wsHost: wsHost,
    wsPort: wsPort,
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

