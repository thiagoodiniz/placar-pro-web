import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST;

export const initAnalytics = () => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (POSTHOG_KEY && POSTHOG_HOST) {
        posthog.init(POSTHOG_KEY, {
            api_host: POSTHOG_HOST,
            // Autocapture clicks and events
            autocapture: true,
            // Opt out of capturing if in localhost
            opt_out_capturing_by_default: isLocalhost,
            loaded: (posthog) => {
                if (isLocalhost) {
                    console.log('PostHog initialized but capturing is DISABLED on localhost.');
                }
            }
        });
    } else {
        console.warn('PostHog key or host missing in environment variables.');
    }
};

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    // Posthog will automatically ignore this if opt_out_capturing is active (e.g. on localhost)
    posthog.capture(eventName, properties);
};
