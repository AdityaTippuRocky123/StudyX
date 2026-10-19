import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
}

export default function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const colors = [
      '#FACC15', // yellow-400
      '#EAB308', // yellow-500
      '#CA8A04', // yellow-600
      '#FFFFFF', // white
      '#D4D4D8', // zinc-300
      '#FEF08A', // yellow-200
    ];

    const createParticles = (x: number, y: number, count = 100) => {
      const newParticles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        newParticles.push({
          x,
          y,
          size: Math.random() * 8 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          speedX: (Math.random() - 0.5) * 15,
          speedY: -Math.random() * 12 - 5,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
        });
      }
      particlesRef.current = [...particlesRef.current, ...newParticles];
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.speedY += 0.3; // gravity
        p.speedX *= 0.98; // friction
        p.rotation += p.rotationSpeed;

        // Draw particle
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        // Rectangular confetti
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
        ctx.restore();

        // Remove off-screen particles
        if (p.y > canvas.height + 50) {
          particles.splice(i, 1);
        }
      }

      if (particles.length > 0) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = null;
      }
    };

    const handleTriggerConfetti = (e: Event) => {
      const customEvent = e as CustomEvent<{ x?: number; y?: number }>;
      const x = customEvent.detail?.x ?? window.innerWidth / 2;
      const y = customEvent.detail?.y ?? window.innerHeight / 2 - 100;
      createParticles(x, y);

      if (!animationFrameRef.current) {
        animate();
      }
    };

    window.addEventListener('trigger-confetti', handleTriggerConfetti);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('trigger-confetti', handleTriggerConfetti);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="confetti-canvas"
      className="fixed inset-0 pointer-events-none z-50 w-screen h-screen"
    />
  );
}

// Helper to trigger confetti from anywhere
export function triggerConfetti(x?: number, y?: number) {
  const event = new CustomEvent('trigger-confetti', { detail: { x, y } });
  window.dispatchEvent(event);
}
