import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ROUTES = ['/', '/market', '/portfolio', '/derivatives', '/dao'];

export default function GlobalScrollHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const isTransitioning = useRef(false);

  useEffect(() => {
    // Force scroll to top on normal route changes via sidebar as well
    if (!isTransitioning.current) {
        window.scrollTo(0, 0); 
    }
    
    let touchStartY = 0;

    const checkScroll = (deltaY: number) => {
      if (isTransitioning.current) return;
      
      const currentIdx = ROUTES.indexOf(location.pathname);
      if (currentIdx === -1) return; // Ignore handler if exploring a specific asset (e.g. /asset/:id)

      // Buffer constraints
      const atBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 50;
      const atTop = window.scrollY <= 20;

      // Detect strong downward scroll intent at the bottom of the page
      if (deltaY > 15 && atBottom) {
        if (currentIdx < ROUTES.length - 1) {
          performTransition(ROUTES[currentIdx + 1]);
        }
      } 
      // Detect strong upward scroll intent at the top of the page
      else if (deltaY < -15 && atTop) {
        if (currentIdx > 0) {
          performTransition(ROUTES[currentIdx - 1]);
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      checkScroll(e.deltaY);
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touchEndY = e.touches[0].clientY;
      const deltaY = touchStartY - touchEndY; // Positive means scrolling down
      if (Math.abs(deltaY) > 20) {
        checkScroll(deltaY);
        touchStartY = touchEndY; // Reset baseline
      }
    };

    const performTransition = (path: string) => {
      isTransitioning.current = true;
      navigate(path);
      
      // Instantly jump to top and allow React's natural page mounting fade animations
      window.scrollTo(0, 0);
      
      // Debounce to prevent users flying through all 5 pages in a single violent scroll
      setTimeout(() => {
        isTransitioning.current = false;
      }, 1000);
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [location.pathname, navigate]);

  return null;
}
