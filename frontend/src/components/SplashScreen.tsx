import { useEffect, useRef, useState } from 'react';
import './SplashScreen.css';

/* ── Particle canvas ──────────────────────────────────── */
function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = canvasRef.current!;
    const ctx = cv.getContext('2d')!;
    let W = cv.width = window.innerWidth;
    let H = cv.height = window.innerHeight;
    const resize = () => { W = cv.width = window.innerWidth; H = cv.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    const pts = Array.from({ length: 80 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.8 + 0.4,
      hue: Math.random() > 0.5 ? 210 : 150,
    }));
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},100%,70%,0.7)`;
        ctx.fill();
      });
      // connections
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx*dx+dy*dy);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(100,180,255,${(1-d/120)*0.18})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:0}} />;
}

/* ── Typewriter ───────────────────────────────────────── */
function TypeWriter({ text, delay = 0 }: { text: string; delay?: number }) {
  const [shown, setShown] = useState('');
  useEffect(() => {
    let i = 0;
    const t = setTimeout(() => {
      const iv = setInterval(() => {
        setShown(text.slice(0, ++i));
        if (i >= text.length) clearInterval(iv);
      }, 45);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t);
  }, [text, delay]);
  return <>{shown}<span className="tw-cursor">|</span></>;
}

/* ── Main Splash ──────────────────────────────────────── */
export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');
  const [step, setStep] = useState(0);

  useEffect(() => {
    const ts = [
      setTimeout(() => setPhase('hold'), 200),
      setTimeout(() => setStep(1), 600),
      setTimeout(() => setStep(2), 1100),
      setTimeout(() => setStep(3), 1600),
      setTimeout(() => setPhase('exit'), 3800),
      setTimeout(onDone, 4600),
    ];
    return () => ts.forEach(clearTimeout);
  }, [onDone]);

  return (
    <div className={`splash ${phase}`}>
      <Particles />

      {/* Background orbs */}
      <div className="splash-orb orb-1" />
      <div className="splash-orb orb-2" />
      <div className="splash-orb orb-3" />

      {/* Centre stage */}
      <div className="splash-stage">

        {/* ── Animated SVG Logo ── */}
        <div className={`splash-logo-wrap ${step >= 1 ? 'logo-visible' : ''}`}>
          <svg width="112" height="112" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ boxShadow: '0 12px 32px rgba(200, 147, 90, 0.4)', borderRadius: '16px' }}>
            <defs>
              <linearGradient id="vibrantCoinGradSplash" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFE259" /> {/* Vibrant Bright Gold */}
                <stop offset="100%" stopColor="#FFA751" /> {/* Rich Orange Amber */}
              </linearGradient>
              <linearGradient id="glossGradSplash" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="white" stopOpacity="0.45" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="64" height="64" rx="16" fill="url(#vibrantCoinGradSplash)" />
            <rect x="0" y="0" width="64" height="30" rx="16" fill="url(#glossGradSplash)" />
            <rect x="14" y="32" width="10" height="32" rx="1" fill="#110d09" />
            <rect x="26" y="16" width="12" height="48" rx="1" fill="#110d09" />
            <rect x="40" y="38" width="10" height="26" rx="1" fill="#110d09" />
            <rect x="29.5" y="22" width="5" height="5" rx="1" fill="#7EB87A" />
            <rect x="29.5" y="31" width="5" height="5" rx="1" fill="#7EB87A" />
            <rect x="29.5" y="40" width="5" height="5" rx="1" fill="#7EB87A" />
          </svg>
        </div>

        {/* Brand name */}
        <h1 className={`splash-title ${step >= 2 ? 'title-visible' : ''}`}>PropFi</h1>

        {/* Tagline typewriter */}
        {step >= 3 && (
          <p className="splash-tagline">
            <TypeWriter text="Fractional Real Estate · AI Powered · DeFi Native" delay={0}/>
          </p>
        )}

        {/* Progress */}
        <div className={`splash-bar-wrap ${step >= 2 ? 'bar-visible' : ''}`}>
          <div className="splash-bar" />
          <div className="splash-bar-glow" />
        </div>

        {/* Stats row */}
        {step >= 3 && (
          <div className="splash-stats animate-stats">
            {[['₹3,000 Cr+','Total AUM'],['5,86,000+','Token Holders'],['99.9%','Uptime']].map(([v,l]) => (
              <div className="splash-stat" key={l}>
                <span className="splash-stat-val">{v}</span>
                <span className="splash-stat-label">{l}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Corner badges */}
      <div className="splash-badge top-left">LIVE · MAINNET</div>
      <div className="splash-badge top-right">v2.0 · HACKATHON EDITION</div>
    </div>
  );
}
