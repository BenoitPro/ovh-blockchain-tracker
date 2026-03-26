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

interface ParticlesBackgroundProps {
    network?: 'ethereum' | 'solana';
}

export default function ParticlesBackground({ network = 'solana' }: ParticlesBackgroundProps) {
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
            const particleCount = network === 'ethereum' ? 150 : 120; // Slightly more for Eth as they are subtler
            const colors = network === 'ethereum'
                ? ['#627EEA', '#818CF8', '#C7D2FE', '#A5B4FC', '#6366F1']
                : ['#FFFFFF', '#FFFFFF', '#00F0FF', '#A855F7', '#6B4FBB']; // Solana colors

            particlesRef.current = Array.from({ length: particleCount }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * (network === 'ethereum' ? 0.12 : 0.15), // Slightly slower for Eth
                vy: (Math.random() - 0.5) * (network === 'ethereum' ? 0.12 : 0.15),
                radius: Math.random() * (network === 'ethereum' ? 1.2 : 1.5) + 0.5,
                opacity: Math.random() * (network === 'ethereum' ? 0.18 : 0.5) + 0.05,
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
                if (network === 'ethereum') {
                    if (p.opacity >= 0.25 || p.opacity <= 0.04) p.opacityDir *= -1;
                } else {
                    if (p.opacity >= 0.6 || p.opacity <= 0.05) p.opacityDir *= -1;
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                
                // Convert hex to rgb
                const r = parseInt(p.color.slice(1, 3), 16);
                const g = parseInt(p.color.slice(3, 5), 16);
                const b = parseInt(p.color.slice(5, 7), 16);
                
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.opacity})`;
                
                if (network === 'solana') {
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
                } else {
                    // Less glow for Ethereum to keep it "clear" and subtle
                    ctx.shadowBlur = 2;
                    ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.25)`;
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
