import { useEffect, useCallback } from 'react';

export function useScrollReveal(ready: boolean) {
    const observe = useCallback(() => {
        if (!ready) return () => { };

        // Wait a tiny bit for React to actually flush the DOM after loading=false
        const timeoutId = setTimeout(() => {
            const elements = document.querySelectorAll('.fade-in-up');
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('is-visible');
                            observer.unobserve(entry.target);
                        }
                    });
                },
                { threshold: 0.12 }
            );
            elements.forEach((el) => observer.observe(el));
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [ready]);

    useEffect(() => {
        const cleanup = observe();
        return cleanup;
    }, [observe]);
}
