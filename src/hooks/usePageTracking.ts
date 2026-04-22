import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import posthog from 'posthog-js';

export const usePageTracking = () => {
    const location = useLocation();

    useEffect(() => {
        // Track pageview on route change
        posthog.capture('$pageview');
    }, [location]);
};
