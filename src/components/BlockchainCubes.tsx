'use client';

import { useEffect, useRef } from 'react';

interface Cube {
    x: number;
    y: number;
    baseX: number;
    baseY: number;
    z: number;
    rotationX: number;
    rotationY: number;
    rotationZ: number;
    size: number;
    speed: number;
    opacity: number;
    parallaxFactor: number;
}

interface BlockchainCubesProps {
    opacity?: number;
    network?: 'solana' | 'ethereum';
}

export default function BlockchainCubes({ opacity = 0.6, network = 'solana' }: BlockchainCubesProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cubesRef = useRef<Cube[]>([]);
    const animationFrameRef = useRef<number | undefined>(undefined);
    const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Track mouse position (normalized -0.5 to 0.5)
        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = {
                x: e.clientX / window.innerWidth - 0.5,
                y: e.clientY / window.innerHeight - 0.5,
            };
        };
        window.addEventListener('mousemove', handleMouseMove);

        // Initialize cubes (with parcimony - only 5-6 cubes)
        const initCubes = () => {
            cubesRef.current = Array.from({ length: 6 }, () => {
                const bx = Math.random() * canvas.width;
                const by = Math.random() * canvas.height;
                return {
                    x: bx,
                    y: by,
                    baseX: bx,
                    baseY: by,
                    z: Math.random() * 500,
                    rotationX: Math.random() * Math.PI * 2,
                    rotationY: Math.random() * Math.PI * 2,
                    rotationZ: Math.random() * Math.PI * 2,
                    size: 15 + Math.random() * 30,
                    speed: 0.001 + Math.random() * 0.002,
                    opacity: 0.05 + Math.random() * 0.15,
                    parallaxFactor: 5 + Math.random() * 10,
                };
            });
        };
        initCubes();

        // Draw a 3D cube
        const drawCube = (cube: Cube) => {
            ctx.save();
            ctx.translate(cube.x, cube.y);

            const { rotationX, rotationY, rotationZ, size, opacity: cubeOpacity } = cube;

            // 3D projection matrix (simplified)
            const cos = Math.cos;
            const sin = Math.sin;

            // Define cube vertices
            const vertices = [
                [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
                [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
            ];

            // Rotate and project vertices
            const projected = vertices.map(([x, y, z]) => {
                // Rotate around X
                let y1 = y * cos(rotationX) - z * sin(rotationX);
                let z1 = y * sin(rotationX) + z * cos(rotationX);

                // Rotate around Y
                let x1 = x * cos(rotationY) + z1 * sin(rotationY);
                let z2 = -x * sin(rotationY) + z1 * cos(rotationY);

                // Rotate around Z
                let x2 = x1 * cos(rotationZ) - y1 * sin(rotationZ);
                let y2 = x1 * sin(rotationZ) + y1 * cos(rotationZ);

                // Scale
                x2 *= size / 2;
                y2 *= size / 2;

                return [x2, y2, z2];
            });

            // Define faces
            const faces = [
                [0, 1, 2, 3], // front
                [4, 5, 6, 7], // back
                [0, 1, 5, 4], // bottom
                [2, 3, 7, 6], // top
                [0, 3, 7, 4], // left
                [1, 2, 6, 5], // right
            ];

            // Draw faces
            faces.forEach((face, index) => {
                ctx.beginPath();
                const [p1, p2, p3, p4] = face.map(i => projected[i]);

                ctx.moveTo(p1[0], p1[1]);
                ctx.lineTo(p2[0], p2[1]);
                ctx.lineTo(p3[0], p3[1]);
                ctx.lineTo(p4[0], p4[1]);
                ctx.closePath();

                // Gradient fill with purple/blue tones
                const gradient = ctx.createLinearGradient(
                    p1[0], p1[1], p3[0], p3[1]
                );

                if (network === 'ethereum') {
                    // Ethereum: Indigo/Purple/Violet
                    if (index % 2 === 0) {
                        gradient.addColorStop(0, `rgba(98, 126, 234, ${cubeOpacity})`); // Eth Blue/Indigo
                        gradient.addColorStop(1, `rgba(168, 85, 247, ${cubeOpacity * 0.65})`); // Purple
                    } else {
                        gradient.addColorStop(0, `rgba(168, 85, 247, ${cubeOpacity})`); // Purple
                        gradient.addColorStop(1, `rgba(139, 92, 246, ${cubeOpacity * 0.65})`); // Violet
                    }
                } else {
                    // Solana: Purple/Cyan (Current)
                    if (index % 2 === 0) {
                        gradient.addColorStop(0, `rgba(107, 79, 187, ${cubeOpacity})`); // Purple
                        gradient.addColorStop(1, `rgba(0, 191, 255, ${cubeOpacity * 0.6})`); // Cyan
                    } else {
                        gradient.addColorStop(0, `rgba(0, 191, 255, ${cubeOpacity})`); // Cyan
                        gradient.addColorStop(1, `rgba(107, 79, 187, ${cubeOpacity * 0.6})`); // Purple
                    }
                }

                ctx.fillStyle = gradient;
                ctx.fill();

                // Glowing edges
                ctx.strokeStyle = network === 'ethereum' 
                    ? `rgba(98, 126, 234, ${cubeOpacity * 1.8})` // Slightly stronger for eth light theme
                    : `rgba(0, 240, 255, ${cubeOpacity * 1.5})`; 
                ctx.lineWidth = 1.5;
                ctx.shadowBlur = network === 'ethereum' ? 10 : 15;
                ctx.shadowColor = network === 'ethereum' 
                    ? 'rgba(98, 126, 234, 0.7)' 
                    : 'rgba(0, 240, 255, 0.8)';
                ctx.stroke();
            });

            ctx.restore();
        };

        // Draw connections between cubes
        const drawConnections = () => {
            const cubes = cubesRef.current;
            ctx.strokeStyle = network === 'ethereum' 
                ? 'rgba(98, 126, 234, 0.12)' 
                : 'rgba(0, 240, 255, 0.15)';
            ctx.lineWidth = 1;
            ctx.shadowBlur = 10;
            ctx.shadowColor = network === 'ethereum' 
                ? 'rgba(98, 126, 234, 0.4)' 
                : 'rgba(0, 240, 255, 0.5)';

            for (let i = 0; i < cubes.length; i++) {
                for (let j = i + 1; j < cubes.length; j++) {
                    const distance = Math.hypot(
                        cubes[i].x - cubes[j].x,
                        cubes[i].y - cubes[j].y
                    );

                    // Only draw connections for nearby cubes
                    if (distance < 400) {
                        ctx.beginPath();
                        ctx.moveTo(cubes[i].x, cubes[i].y);
                        ctx.lineTo(cubes[j].x, cubes[j].y);
                        ctx.stroke();
                    }
                }
            }
        };

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw connections first (behind cubes)
            drawConnections();

            // Update and draw cubes
            cubesRef.current.forEach(cube => {
                // Rotate
                cube.rotationX += cube.speed;
                cube.rotationY += cube.speed * 0.7;
                cube.rotationZ += cube.speed * 0.5;

                // Slow floating drift on base position
                cube.baseY += Math.sin(Date.now() * 0.0005 + cube.baseX) * 0.3;
                cube.baseX += Math.cos(Date.now() * 0.0003 + cube.baseY) * 0.2;

                // Wrap base position around screen
                if (cube.baseX < -100) cube.baseX = canvas.width + 100;
                if (cube.baseX > canvas.width + 100) cube.baseX = -100;
                if (cube.baseY < -100) cube.baseY = canvas.height + 100;
                if (cube.baseY > canvas.height + 100) cube.baseY = -100;

                // Apply parallax offset from mouse (5–15px max)
                cube.x = cube.baseX + mouseRef.current.x * cube.parallaxFactor;
                cube.y = cube.baseY + mouseRef.current.y * cube.parallaxFactor;

                drawCube(cube);
            });

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ opacity }}
        />
    );
}
