'use client';

import { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    opacity: number;
    opacityDir: number;
    color: string;
}

export default function ParticlesBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animationFrameId = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const initParticles = () => {
            const particleCount = 120; // Increased for a denser starry night
            const colors = ['#FFFFFF', '#FFFFFF', '#00F0FF', '#A855F7', '#6B4FBB']; // Added more white for stars
            particlesRef.current = Array.from({ length: particleCount }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.15, // Slower movement
                vy: (Math.random() - 0.5) * 0.15,
                radius: Math.random() * 1.5 + 0.5, // Slightly smaller sizes on average
                opacity: Math.random() * 0.5 + 0.1,
                opacityDir: Math.random() > 0.5 ? 0.003 : -0.003, // Slower twinkling
                color: colors[Math.floor(Math.random() * colors.length)],
            }));
        };

        resizeCanvas();
        initParticles();
        window.addEventListener('resize', resizeCanvas);

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particlesRef.current.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                p.opacity += p.opacityDir;
                if (p.opacity >= 0.6 || p.opacity <= 0.05) p.opacityDir *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `${p.color}${Math.floor(p.opacity * 255).toString(16).padStart(2, '0')})`;
                // Use rgba for cleaner coloring
                const r = parseInt(p.color.slice(1, 3), 16);
                const g = parseInt(p.color.slice(3, 5), 16);
                const b = parseInt(p.color.slice(5, 7), 16);
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.opacity})`;
                
                ctx.shadowBlur = 8;
                ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
                ctx.fill();
            });
            animationFrameId.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId.current);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ background: 'transparent' }}
        />
    );
}
