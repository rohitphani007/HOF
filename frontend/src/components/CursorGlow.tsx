import { useEffect, useRef } from 'react';

export default function CursorGlow() {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pos     = useRef({ x: -500, y: -500 });
  const raf     = useRef<number>(0);

  useEffect(() => {
    const dot  = dotRef.current!;
    const ring = ringRef.current!;
    if (!dot || !ring) return;

    let cx = -500, cy = -500;

    const tick = () => {
      cx += (pos.current.x - cx) * 0.18;
      cy += (pos.current.y - cy) * 0.18;

      dot.style.transform  = `translate(${cx - 4}px,  ${cy - 4}px)`;
      ring.style.transform = `translate(${cx - 18}px, ${cy - 18}px)`;
      raf.current = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      dot.style.opacity  = '1';
      ring.style.opacity = '1';

      // Text-proximity effect: if hovering near text, enlarge ring + change color
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const isText = el && (
        el.tagName === 'P'    || el.tagName === 'H1' || el.tagName === 'H2' ||
        el.tagName === 'H3'   || el.tagName === 'SPAN' || el.tagName === 'A' ||
        el.tagName === 'LABEL' || el.tagName === 'LI' ||
        window.getComputedStyle(el).cursor === 'text'
      );
      const isClickable = el && (
        el.tagName === 'BUTTON' || el.tagName === 'A' ||
        window.getComputedStyle(el).cursor === 'pointer'
      );

      if (isClickable) {
        ring.style.width   = '48px';
        ring.style.height  = '48px';
        ring.style.borderColor = 'rgba(200,147,90,0.9)';
        ring.style.background  = 'rgba(200,147,90,0.08)';
        dot.style.background   = '#C8935A';
        dot.style.transform    = `translate(${cx - 4}px, ${cy - 4}px) scale(1.5)`;
      } else if (isText) {
        ring.style.width   = '36px';
        ring.style.height  = '36px';
        ring.style.borderColor = 'rgba(232,184,74,0.6)';
        ring.style.background  = 'rgba(232,184,74,0.04)';
        dot.style.background   = '#E8B84A';
        dot.style.transform    = `translate(${cx - 4}px, ${cy - 4}px) scale(0.5)`;
      } else {
        ring.style.width   = '36px';
        ring.style.height  = '36px';
        ring.style.borderColor = 'rgba(200,147,90,0.45)';
        ring.style.background  = 'transparent';
        dot.style.background   = '#C8935A';
        dot.style.transform    = `translate(${cx - 4}px, ${cy - 4}px) scale(1)`;
      }
    };

    const onLeave = () => {
      dot.style.opacity  = '0';
      ring.style.opacity = '0';
    };

    raf.current = requestAnimationFrame(tick);
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <>
      {/* Tight dot — snaps exactly to cursor */}
      <div ref={dotRef}  aria-hidden="true" style={{
        position: 'fixed', top: 0, left: 0, zIndex: 99999,
        width: 8, height: 8, borderRadius: '50%',
        background: '#C8935A',
        pointerEvents: 'none', opacity: 0,
        transition: 'background 0.15s, opacity 0.2s',
        willChange: 'transform',
      }} />
      {/* Lagging ring — follows with soft lerp */}
      <div ref={ringRef} aria-hidden="true" style={{
        position: 'fixed', top: 0, left: 0, zIndex: 99998,
        width: 36, height: 36, borderRadius: '50%',
        border: '1.5px solid rgba(200,147,90,0.45)',
        background: 'transparent',
        pointerEvents: 'none', opacity: 0,
        transition: 'width 0.2s, height 0.2s, border-color 0.2s, background 0.2s, opacity 0.2s',
        willChange: 'transform',
      }} />
    </>
  );
}
