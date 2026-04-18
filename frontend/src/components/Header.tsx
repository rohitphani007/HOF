import { useState, useEffect } from 'react';
import { Search, Bell, CheckCircle2, TrendingUp, AlertTriangle, Sun, Moon, Menu, User, Wallet, ShieldCheck, Award, X } from 'lucide-react';
import './Header.css';

export default function Header() {
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') !== 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Yield Distributed: Received 120 USDC for BKC-01 fractions.', time: '2 mins ago', icon: CheckCircle2, color: 'text-success' },
    { id: 2, text: 'Proposal Passed: Dispute #PROP-429 resolved in favour of Tenant.', time: '1 hour ago', icon: CheckCircle2, color: 'text-primary' },
    { id: 3, text: 'Price Alert: MUM-IDX futures are up 2.4% today.', time: '3 hours ago', icon: TrendingUp, color: 'text-success' },
    { id: 4, text: 'Margin Warning: Leverage on BLR-TECH near liquidation.', time: '1 day ago', icon: AlertTriangle, color: 'text-danger' },
  ]);

  return (
    <header className="header">
      <div className="search-bar">
        <Search size={16} className="text-muted" aria-hidden="true" />
        <input type="text" placeholder="Search assets, locations, or indexes…" className="search-input" aria-label="Search Assets" />
      </div>

      <div className="header-actions">
        <div className="wallet-balance">
          <span className="label">Wallet Balance</span>
          <span className="amount">₹ 1,50,000</span>
        </div>

        <div className="position-relative" style={{display:'flex',gap:'0.6rem'}}>

          <button className="icon-btn" onClick={() => setIsDark(!isDark)} aria-label="Toggle Theme">
            {isDark ? <Sun size={18}/> : <Moon size={18}/>}
          </button>

          <button className="icon-btn" onClick={() => setShowNotifs(!showNotifs)} aria-label="View Notifications">
            <Bell size={18}/>
            {notifications.length > 0 && <span className="notification-dot animate-pulse-live"/>}
          </button>

          <button className="icon-btn" onClick={() => setShowProfile(true)} aria-label="My Profile">
            <User size={18}/>
          </button>

          <button className="icon-btn mobile-menu-btn" onClick={() => document.body.classList.toggle('sidebar-open')} aria-label="Toggle Menu">
            <Menu size={18}/>
          </button>

          {showNotifs && (
            <div className="notifications-dropdown animate-fade-in">
              <div className="notif-header">
                <h4>Notifications</h4>
                {notifications.length > 0 && (
                  <span className="mark-read" onClick={() => setNotifications([])}>Mark all read</span>
                )}
              </div>
              <div className="notif-list">
                {notifications.length === 0 ? (
                  <p className="text-muted" style={{textAlign:'center',padding:'1.5rem',fontSize:'0.88rem'}}>
                    No new notifications.
                  </p>
                ) : notifications.map(n => (
                  <div className="notif-item" key={n.id}>
                    <div className="notif-icon-wrapper"><n.icon size={15} className={n.color}/></div>
                    <div className="notif-text-box">
                      <p>{n.text}</p>
                      <span className="notif-time">{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* My User Profile Modal */}
      {showProfile && (
        <div className="user-modal-overlay" onClick={() => setShowProfile(false)} style={{zIndex: 9999}}>
          <div className="user-modal-content card" onClick={(e) => e.stopPropagation()}>
            <button className="icon-btn modal-close" onClick={() => setShowProfile(false)} aria-label="Close">
              <X size={16}/>
            </button>
            <div className="user-profile-header">
              <div className="user-avatar" style={{background: 'var(--accent-purple)'}}>
                R
              </div>
              <div>
                <h3 style={{margin:0, fontSize:'1.25rem', fontWeight:700}}>Rohit</h3>
                <span className="text-muted" style={{fontSize:'0.85rem', fontFamily:'monospace'}}>
                  0x7A9B...2F41
                </span>
              </div>
            </div>
            
            <div className="user-stats-grid">
              <div className="user-stat-card">
                <Wallet size={16} style={{color:'var(--accent-blue)'}}/>
                <div className="val">₹1,50,000</div>
                <div className="lbl">Liquid Balance</div>
              </div>
              <div className="user-stat-card">
                <ShieldCheck size={16} className="text-success"/>
                <div className="val text-success">Level 3 KYC</div>
                <div className="lbl">Status</div>
              </div>
            </div>

            <div className="user-badges">
              <h4 style={{fontSize:'0.85rem', color:'var(--text-muted)', marginBottom:'0.75rem'}}>Reputation Badges</h4>
              <div style={{display:'flex', gap:'0.5rem', flexWrap:'wrap'}}>
                <span className="badge badge-early"><Award size={12}/> Genesis Member</span>
                <span className="badge badge-yield"><TrendingUp size={12}/> Top 5% Trader</span>
              </div>
            </div>

            <div style={{borderTop:'1px solid var(--glass-border)', paddingTop:'1rem'}}>
              <button className="btn w-100" style={{background: 'rgba(255,59,48,0.1)', color: 'var(--accent-danger)'}} onClick={() => setShowProfile(false)}>
                Disconnect Wallet
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
