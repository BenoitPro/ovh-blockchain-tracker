'use client';

import { useEffect, useRef } from 'react';
import { CHAINS, ChainId } from '@/lib/chains';

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

interface ParticlesBackgroundProps {
    network?: string;
}

const hexToRgb = (hex: string) => {
    let r = 255, g = 255, b = 255;
    if (hex.startsWith('#')) {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
    }
    return { r, g, b };
};

export default function ParticlesBackground({ network = 'solana' }: ParticlesBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animationFrameId = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const currentChain = CHAINS[network as ChainId] || CHAINS.solana;
        const accent = currentChain.accent;
        const { r, g, b } = hexToRgb(accent);

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const initParticles = () => {
            const particleCount = 120;
            const colors = [accent, '#FFFFFF', '#FFFFFF', accent, accent];

            particlesRef.current = Array.from({ length: particleCount }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.15,
                vy: (Math.random() - 0.5) * 0.15,
                radius: Math.random() * 1.5 + 0.5,
                opacity: Math.random() * 0.5 + 0.05,
                opacityDir: Math.random() > 0.5 ? 0.003 : -0.003,
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
                
                // Keep white particles white, others accent
                if (p.color === '#FFFFFF') {
                    ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
                    ctx.shadowBlur = 2;
                    ctx.shadowColor = `rgba(255, 255, 255, 0.4)`;
                } else {
                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.opacity})`;
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
                }
                
                ctx.fill();
            });
            animationFrameId.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId.current);
        };
    }, [network]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ background: 'transparent' }}
        />
    );
}
