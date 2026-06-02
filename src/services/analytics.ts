import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST;
const BLOCK_EMAILS = (import.meta.env.VITE_POSTHOG_BLOCK_EMAILS || '').split(',').map((e: string) => e.trim().toLowerCase());

const isUserBlocked = () => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return false;
    try {
        const user = JSON.parse(storedUser);
        return user.email && BLOCK_EMAILS.includes(user.email.toLowerCase());
    } catch {
        return false;
    }
};

export const initAnalytics = () => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isBlocked = isUserBlocked();

    if (POSTHOG_KEY && POSTHOG_HOST) {
        posthog.init(POSTHOG_KEY, {
            api_host: POSTHOG_HOST,
            ui_host: 'https://us.posthog.com',
            autocapture: true,
            // Opt out if on localhost OR if user is in blocklist
            opt_out_capturing_by_default: isLocalhost || isBlocked,
            loaded: (ph) => {
                if (isLocalhost) {
                    console.log('PostHog: Desativado em localhost.');
                } else if (isBlocked) {
                    console.log('PostHog: Desativado para este usuário (Blocklist).');
                    ph.opt_out_capturing();
                }
            }
        });
    } else {
        console.warn('PostHog key or host missing in environment variables.');
    }
};

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    if (isUserBlocked()) return;
    posthog.capture(eventName, properties);
};
