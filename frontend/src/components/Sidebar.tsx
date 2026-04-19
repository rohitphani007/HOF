import { useState, useEffect, useCallback } from 'react';
import { Home, LineChart, PieChart, ArrowRightLeft, Landmark, ChevronRight } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AccountPanel from './AccountPanel';
import './Sidebar.css';

const HEADER_HEIGHT = 68;

const navItems = [
  { name: 'Dashboard',   icon: Home,           id: 'dashboard',   href: null },
  { name: 'Market',      icon: LineChart,       id: 'market',      href: '/market' },
  { name: 'Portfolio',   icon: PieChart,        id: 'portfolio',   href: null },
  { name: 'Derivatives', icon: ArrowRightLeft,  id: 'derivatives', href: null },
  { name: 'Governance',  icon: Landmark,        id: 'dao',         href: null },
];

function scrollToSection(id: string): boolean {
  const el = document.getElementById(id);
  if (!el) return false;
  const top = el.getBoundingClientRect().top + window.scrollY - HEADER_HEIGHT - 8;
  window.scrollTo({ top, behavior: 'smooth' });
  return true;
}

function getActiveSection(): string {
  const midY = window.scrollY + window.innerHeight * 0.35;
  let active = navItems[0].id;
  for (const item of navItems) {
    const el = document.getElementById(item.id);
    if (!el) continue;
    const top = el.getBoundingClientRect().top + window.scrollY;
    if (top <= midY) active = item.id;
  }
  return active;
}

/** Read user display info from localStorage */
function readUserInfo() {
  const storedName  = localStorage.getItem('propfi_user_name')  || '';
  const storedEmail = localStorage.getItem('propfi_user_email') || '';
  const walletAddr  = localStorage.getItem('propfi_wallet')     ||
                      localStorage.getItem('walletAddress')      || '';
  const displayName  = storedName || (walletAddr ? `${walletAddr.slice(0,6)}…${walletAddr.slice(-4)}` : 'Guest');
  const avatarLetter = displayName.charAt(0).toUpperCase() || 'G';
  const idSource     = storedEmail || walletAddr || 'guest';
  const userIdNum    = idSource.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % 9000 + 1000;
  return { displayName, avatarLetter, userId: `PRF-${userIdNum}` };
}

export default function Sidebar() {
  const [activeId,      setActiveId]      = useState('dashboard');
  const [showAccount,   setShowAccount]   = useState(false);
  const [userInfo,      setUserInfo]      = useState(() => readUserInfo());
  const location  = useLocation();
  const navigate  = useNavigate();

  // Re-read name whenever localStorage changes (after AccountPanel saves)
  useEffect(() => {
    const sync = () => setUserInfo(readUserInfo());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  // Scroll tracking
  const handleScroll = useCallback(() => { setActiveId(getActiveSection()); }, []);
  useEffect(() => {
    if (location.pathname !== '/') return;
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname, handleScroll]);

  // Navigate home → then scroll
  const goHome = useCallback((sectionId: string) => {
    document.body.classList.remove('sidebar-open');
    setActiveId(sectionId);
    if (location.pathname === '/') {
      scrollToSection(sectionId);
    } else {
      navigate('/');
      setTimeout(() => scrollToSection(sectionId), 300);
    }
  }, [location.pathname, navigate]);

  const handleLogout = () => {
    setShowAccount(false);
    localStorage.removeItem('propfi_auth');
    localStorage.removeItem('propfi_wallet');
    localStorage.removeItem('propfi_user_name');
    localStorage.removeItem('propfi_user_email');
    window.location.reload();
  };

  return (
    <>
      <aside className="sidebar">
        {/* Logo */}
        <Link to="/" className="logo-container" style={{ textDecoration: 'none', gap: '0.65rem' }}>
          <svg width="48" height="48" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="vibrantCoinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFE259" /> {/* Vibrant Bright Gold */}
                <stop offset="100%" stopColor="#FFA751" /> {/* Rich Orange Amber */}
              </linearGradient>
              <linearGradient id="glossGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="white" stopOpacity="0.45" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* The Solid Square Coin */}
            <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#vibrantCoinGrad)" />
            {/* Glossy Sheen Overlay */}
            <rect x="2" y="2" width="60" height="28" rx="16" fill="url(#glossGrad)" />
            {/* The Skyline Inside (Espresso colored to punch out shapes) */}
            <rect x="14" y="32" width="10" height="30" rx="1" fill="#110d09" />
            <rect x="26" y="16" width="12" height="46" rx="1" fill="#110d09" />
            <rect x="40" y="38" width="10" height="24" rx="1" fill="#110d09" />
            {/* Windows in Center Tower */}
            <rect x="29.5" y="22" width="5" height="5" rx="1" fill="#7EB87A" />
            <rect x="29.5" y="31" width="5" height="5" rx="1" fill="#7EB87A" />
            <rect x="29.5" y="40" width="5" height="5" rx="1" fill="#7EB87A" />
          </svg>
          <span className="logo-text" style={{ fontSize: '1.4rem' }}>PropFi</span>
        </Link>

        {/* Nav */}
        <nav className="nav-menu">
          {navItems.map((item) => {
            const isActive = item.href
              ? location.pathname === item.href
              : location.pathname === '/' && activeId === item.id;

            if (item.href) {
              return (
                <Link key={item.id} to={item.href}
                  onClick={() => document.body.classList.remove('sidebar-open')}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                >
                  <item.icon size={20} />
                  <span>{item.name}</span>
                </Link>
              );
            }
            return (
              <button key={item.id}
                onClick={() => goHome(item.id)}
                className={`nav-item ${isActive ? 'active' : ''}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* User profile — click to open AccountPanel */}
        <div className="sidebar-footer">
          <button
            onClick={() => setShowAccount(true)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '0.875rem',
              padding: '0.875rem', borderRadius: 'var(--radius-lg)',
              background: 'rgba(200,147,90,0.07)', border: '1px solid rgba(200,147,90,0.16)',
              cursor: 'pointer', transition: 'background 0.2s, border-color 0.2s', textAlign: 'left',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(200,147,90,0.14)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(200,147,90,0.3)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(200,147,90,0.07)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(200,147,90,0.16)'; }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #C8935A, #E8B84A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '1rem', color: '#110d09',
            }}>
              {userInfo.avatarLetter}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userInfo.displayName}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{userInfo.userId}</span>
            </div>
            <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          </button>
        </div>
      </aside>

      {/* Account panel slide-in */}
      <AccountPanel
        open={showAccount}
        onClose={() => setShowAccount(false)}
        onLogout={handleLogout}
      />
    </>
  );
}
