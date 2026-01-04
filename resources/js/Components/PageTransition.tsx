import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';

interface PageTransitionProps {
    children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
    const [isNavigating, setIsNavigating] = useState(false);

    useEffect(() => {
        const removeStartListener = router.on('start', () => {
            setIsNavigating(true);
        });

        const removeFinishListener = router.on('finish', () => {
            setIsNavigating(false);
        });

        return () => {
            removeStartListener();
            removeFinishListener();
        };
    }, []);

    // Subtle transition - just slight opacity change, no layout shift
    return (
        <div
            style={{
                opacity: isNavigating ? 0.7 : 1,
                transition: 'opacity 100ms ease-out',
            }}
        >
            {children}
        </div>
    );
}
