import { useState, useEffect } from 'react';
import { Home, LineChart, PieChart, ArrowRightLeft, Landmark } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

export default function Sidebar() {
  const [activeId, setActiveId] = useState('dashboard');
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', icon: Home, id: 'dashboard' },
    { name: 'Market', icon: LineChart, id: 'market' },
    { name: 'Portfolio', icon: PieChart, id: 'portfolio' },
    { name: 'Derivatives', icon: ArrowRightLeft, id: 'derivatives' },
    { name: 'Governance', icon: Landmark, id: 'dao' },
  ];

  useEffect(() => {
    if (location.pathname !== '/') return;
    
    // Automatically flag active section based on scroll position
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    }, { threshold: 0.15, rootMargin: "-20% 0px -40% 0px" });

    const timeout = setTimeout(() => {
      document.querySelectorAll('.nav-section').forEach(el => observer.observe(el));
    }, 500);

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [location.pathname]);

  // Jump to hash if returning from /asset view
  useEffect(() => {
    if (location.pathname === '/' && location.hash) {
      setTimeout(() => {
        document.querySelector(location.hash)?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  }, [location.pathname, location.hash]);

  return (
    <aside className="sidebar">
      <Link to="/" className="logo-container" style={{ textDecoration: 'none' }}>
        {/* Animated SVG Logo */}
        <svg className="propfi-logo" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#00FFA3" />
            </linearGradient>
          </defs>
          {/* Base building */}
          <rect className="logo-base" x="6" y="20" width="32" height="18" rx="2" fill="url(#logoGrad)" opacity="0.9"/>
          {/* Tower left */}
          <rect className="logo-tower-l" x="8"  y="10" width="10" height="12" rx="1.5" fill="url(#logoGrad)"/>
          {/* Tower right */}
          <rect className="logo-tower-r" x="26" y="14" width="10" height="8"  rx="1.5" fill="url(#logoGrad)" opacity="0.8"/>
          {/* Coin ring */}
          <circle className="logo-coin" cx="32" cy="10" r="7" stroke="url(#logoGrad)" strokeWidth="2.5" fill="none"/>
          <text x="32" y="14" textAnchor="middle" fontSize="8" fontWeight="bold" fill="url(#logoGrad)">₹</text>
          {/* Glow pulse ring */}
          <circle className="logo-pulse" cx="32" cy="10" r="7" stroke="#3B82F6" strokeWidth="1.5" fill="none" opacity="0.5"/>
        </svg>
        <span className="logo-text">PropFi</span>
      </Link>

      <nav className="nav-menu">
        {navItems.map((item) => {
          const isActive = location.pathname === '/' ? activeId === item.id : false;
          return (
            <Link
              key={item.id}
              to={`/#${item.id}`}
              onClick={(e) => {
                document.body.classList.remove('sidebar-open');
                if (location.pathname === '/') {
                  e.preventDefault();
                  document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile card" style={{padding: '0.75rem', background: 'transparent', border: 'none', boxShadow: 'none'}}>
          <div className="avatar" style={{background: 'var(--accent-purple)', fontSize: '0.9rem'}}>R</div>
          <div className="user-info">
            <span className="name" style={{fontSize: '0.85rem'}}>Rohit</span>
            <span className="id" style={{fontSize: '0.7rem'}}>ID: PRF-8842</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
