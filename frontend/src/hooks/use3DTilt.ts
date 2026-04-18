import { useEffect } from 'react';

/**
 * Attaches a realistic magnetic 3D perspective tilt to every
 * element matching the selector (default '.card-3d, .tile').
 * Cards tilt toward the mouse and spring back on mouse-leave.
 */
export default function use3DTilt(selector = '.card-3d, .tile') {
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>(selector);

    const onMove = (e: MouseEvent) => {
      const card = e.currentTarget as HTMLElement;
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);  // -1 … +1
      const dy = (e.clientY - cy) / (rect.height / 2); // -1 … +1
      const maxTilt = 12;
      const rx =  dy * maxTilt * -1;
      const ry =  dx * maxTilt;
      card.style.transform =
        `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.03) translateZ(10px)`;
      card.style.boxShadow =
        `${-ry * 1.5}px ${rx * 1.5}px 40px rgba(0,0,0,0.5),
         inset 0 1px 0 rgba(255,255,255,0.12)`;
      card.style.borderColor = `rgba(255,255,255,0.18)`;
      // Dynamic highlight shimmer
      const px = ((e.clientX - rect.left) / rect.width) * 100;
      const py = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.backgroundImage =
        `radial-gradient(circle at ${px}% ${py}%, rgba(255,255,255,0.06) 0%, transparent 60%)`;
    };

    const onLeave = (e: MouseEvent) => {
      const card = e.currentTarget as HTMLElement;
      card.style.transform = '';
      card.style.boxShadow = '';
      card.style.borderColor = '';
      card.style.backgroundImage = '';
    };

    cards.forEach(c => {
      c.addEventListener('mousemove', onMove);
      c.addEventListener('mouseleave', onLeave);
    });

    return () => {
      cards.forEach(c => {
        c.removeEventListener('mousemove', onMove);
        c.removeEventListener('mouseleave', onLeave);
      });
    };
  });
}
