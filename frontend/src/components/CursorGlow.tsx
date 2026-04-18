import { useEffect, useRef } from 'react';

export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -500, y: -500 });
  const raf = useRef<number>(0);

  useEffect(() => {
    const el = glowRef.current;
    if (!el) return;

    // Smooth follow with lerp
    let currentX = -500, currentY = -500;

    const tick = () => {
      const dx = pos.current.x - currentX;
      const dy = pos.current.y - currentY;
      currentX += dx * 0.12;
      currentY += dy * 0.12;
      el.style.transform = `translate(${currentX - 250}px, ${currentY - 250}px)`;
      raf.current = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      el.style.opacity = '1';
    };
    const onLeave = () => { el.style.opacity = '0'; };

    raf.current = requestAnimationFrame(tick);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return <div ref={glowRef} className="cursor-glow" aria-hidden="true" />;
}
