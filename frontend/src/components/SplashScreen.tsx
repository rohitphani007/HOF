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
          <svg className="splash-logo-svg" viewBox="0 0 64 64" fill="none" style={{width: 96, height: 96}}>
            <defs>
              <linearGradient id="sg1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"  stopColor="#C8935A" />
                <stop offset="100%" stopColor="#E8B84A" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {/* Base platform */}
            <rect x="8" y="28" width="48" height="28" rx="4" fill="url(#sg1)" opacity="0.92" className="s-base" filter="url(#glow)" />
            {/* Left tower */}
            <rect x="10" y="14" width="16" height="16" rx="3" fill="url(#sg1)" className="s-tl" />
            {/* Right tower */}
            <rect x="38" y="20" width="14" height="10" rx="2.5" fill="url(#sg1)" opacity="0.8" className="s-tr" />
            {/* Coin ring */}
            <circle cx="48" cy="13" r="10" stroke="url(#sg1)" strokeWidth="3" fill="rgba(30,18,8,0.6)" className="s-coin" />
            {/* INR symbol */}
            <text x="48" y="17.5" textAnchor="middle" fontSize="10" fontWeight="900" fill="#E8B84A" className="s-coin">₹</text>
            {/* Pulse ring */}
            <circle cx="48" cy="13" r="10" stroke="#C8935A" strokeWidth="1.5" fill="none" opacity="0.5" className="s-pulse" />
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
            {[['₹2,400 Cr+','Total AUM'],['12,000+','Investors'],['99.9%','Uptime']].map(([v,l]) => (
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
