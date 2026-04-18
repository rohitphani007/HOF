import { useEffect, useRef } from 'react';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  hue: number;
  opacity: number;
}

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current!;
    const ctx = cv.getContext('2d')!;
    let W = cv.width = window.innerWidth;
    let H = cv.height = window.innerHeight;
    let raf: number;
    let mouseX = W / 2, mouseY = H / 2;

    const resize = () => {
      W = cv.width = window.innerWidth;
      H = cv.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);

    const onMouse = (e: MouseEvent) => { mouseX = e.clientX; mouseY = e.clientY; };
    window.addEventListener('mousemove', onMouse);

    // Generate particles base data
    const pts: Particle[] = Array.from({ length: 60 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r:  Math.random() * 1.5 + 0.6,
      hue: Math.random() > 0.5 ? 215 : 160, // defaults for dark
      opacity: Math.random() * 0.6 + 0.2,
    }));

    let frame = 0;
    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, W, H);

      // Dynamic theme checking
      const isLightMode = document.documentElement.getAttribute('data-theme') === 'light';

      // Vibrant mouse-glow on canvas
      const grad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 450);
      grad.addColorStop(0, isLightMode ? 'rgba(175,82,222,0.06)' : 'rgba(10,132,255,0.04)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      pts.forEach(p => {
        // gentle mouse attraction
        const dx = mouseX - p.x, dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          p.vx += dx / dist * 0.003;
          p.vy += dy / dist * 0.003;
        }
        // damping
        p.vx *= 0.99; p.vy *= 0.99;
        p.x += p.vx; p.y += p.vy;

        // wrap edges
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

        // Elegant, high-performance styling
        // Dark theme -> Deep cyan / Emerald hints
        // Light theme -> Crisp vibrant Indigo/Blue
        const baseHue = isLightMode ? (p.hue === 215 ? 225 : 240) : p.hue;
        const sat = isLightMode ? 85 : 80;
        const lit = isLightMode ? 35 : 55;
        const pulse = Math.min(1, p.opacity + Math.sin(frame * 0.02 + p.hue) * 0.15);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${baseHue},${sat}%,${lit}%,${pulse})`;
        ctx.fill();
      });

      // Draw connections
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 150) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            const alpha = (1 - d / 150) * (isLightMode ? 0.08 : 0.04);
            const lineRGB = isLightMode ? '40,60,140' : '80,160,255';
            ctx.strokeStyle = `rgba(${lineRGB},${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: -1, /* explicitly behind everything */
        opacity: 1, /* full opacity */
      }}
      aria-hidden="true"
    />
  );
}
