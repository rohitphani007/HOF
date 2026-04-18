import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollRevealObserver() {
  const location = useLocation();

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // Add staggering effect based on DOM appearance
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-shown');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

    // Wait for the route components to finish rendering their DOM nodes
    const timeout = setTimeout(() => {
      const nodes = document.querySelectorAll('.card, .stat, .contract-item, .bar-item, .activity-item, .tile, .table-row, .ticker-item');
      nodes.forEach((el) => {
        if (!el.classList.contains('reveal-node')) {
          el.classList.add('reveal-node');
          // Add a tiny inline delay based on horizontal/vertical placement to create a cascading spatial effect
          const rect = el.getBoundingClientRect();
          const delay = (rect.top * 0.05 + rect.left * 0.1) % 400; 
          (el as HTMLElement).style.transitionDelay = `${delay}ms`;
          observer.observe(el);
        }
      });
    }, 150);

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [location.pathname]);

  return null;
}
