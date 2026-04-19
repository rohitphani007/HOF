import { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCircle2, TrendingUp, AlertTriangle, Sun, Moon, Menu, Wallet, ShieldCheck, Award, X, ExternalLink, Copy, RefreshCw, User } from 'lucide-react';
import GlobalSearch from './GlobalSearch';
import './Header.css';
import { BrowserProvider, formatEther } from 'ethers';

export default function Header() {
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') !== 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // ── Live MetaMask State ─────────────────────────────────────────
  const [walletAddress, setWalletAddress] = useState('');
  const [maticBalance, setMaticBalance] = useState('0');
  const [isConnecting, setIsConnecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [chainName, setChainName] = useState('');

  // ── MATIC/INR Price State (Demo Rate) ───────────────────────────
  // We use an artificially high rate so 0.1 testnet MATIC has massive
  // purchasing power (₹100,000) allowing you to buy many properties during the demo.
  const maticInr = 1000000;

  const refreshBalance = useCallback(async (addr?: string) => {
    try {
      if (typeof window.ethereum === 'undefined') return;
      const provider = new BrowserProvider(window.ethereum as any);
      const accounts = await provider.listAccounts();
      if (accounts.length === 0) return;
      const address = addr || (await accounts[0].getAddress());
      const bal = await provider.getBalance(address);
      setMaticBalance(Number(formatEther(bal)).toFixed(4));

      // Detect network
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      const names: Record<number, string> = {
        1: 'Ethereum',
        137: 'Polygon',
        80002: 'Polygon Amoy',
        11155111: 'Sepolia',
      };
      setChainName(names[chainId] || `Chain ${chainId}`);
    } catch {}
  }, []);

  // Auto-reconnect if MetaMask was already connected
  useEffect(() => {
    const autoConnect = async () => {
      if (typeof window.ethereum === 'undefined') return;
      try {
        const provider = new BrowserProvider(window.ethereum as any);
        // listAccounts does NOT trigger popup — only returns if already authorized
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          const addr = await accounts[0].getAddress();
          setWalletAddress(addr);
          await refreshBalance(addr);
        }
      } catch {}
    };
    autoConnect();
  }, [refreshBalance]);

  // Refresh balance every 20 seconds
  useEffect(() => {
    if (!walletAddress) return;
    const interval = setInterval(() => refreshBalance(walletAddress), 20000);
    return () => clearInterval(interval);
  }, [walletAddress, refreshBalance]);

  // Listen for account/network changes from MetaMask
  useEffect(() => {
    if (typeof window.ethereum === 'undefined') return;
    const handleAccounts = (accounts: string[]) => {
      if (accounts.length === 0) {
        setWalletAddress('');
        setMaticBalance('0');
      } else {
        setWalletAddress(accounts[0]);
        refreshBalance(accounts[0]);
      }
    };
    const handleChain = () => refreshBalance(walletAddress);
    window.ethereum.on('accountsChanged', handleAccounts);
    window.ethereum.on('chainChanged', handleChain);
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccounts);
      window.ethereum.removeListener('chainChanged', handleChain);
    };
  }, [walletAddress, refreshBalance]);

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      window.open('https://metamask.io/download/', '_blank');
      return;
    }
    setIsConnecting(true);
    try {
      const provider = new BrowserProvider(window.ethereum as any);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      setWalletAddress(addr);
      localStorage.setItem('propfi_wallet', addr); // persist for sidebar
      await refreshBalance(addr);
    } catch (e) {
      console.error('MetaMask connection rejected', e);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress('');
    setMaticBalance('0');
    setShowProfile(false);
    // Clear entire auth session
    localStorage.removeItem('propfi_auth');
    localStorage.removeItem('propfi_wallet');
    localStorage.removeItem('propfi_user_name');
    localStorage.removeItem('propfi_user_email');
    window.location.reload();
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shortAddr = walletAddress
    ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`
    : '';
  const maticInrValue = (Number(maticBalance) * maticInr).toFixed(0);

  const [notifications, setNotifications] = useState([
    { id: 1, text: 'AI Valuation updated for Panvel Residential Plot.', time: '2 mins ago', icon: CheckCircle2, color: 'text-success' },
    { id: 2, text: 'Proposal Passed: Dispute #PROP-429 resolved.', time: '1 hour ago', icon: CheckCircle2, color: 'text-primary' },
    { id: 3, text: 'Price Alert: Whitefield Plot up +2.4% today.', time: '3 hours ago', icon: TrendingUp, color: 'text-success' },
    { id: 4, text: 'New Land Token listed: Yamuna Expressway Industrial.', time: '1 day ago', icon: AlertTriangle, color: 'text-danger' },
  ]);

  return (
    <header className="header">
      <GlobalSearch />

      <div className="header-actions">

        {/* ── Wallet Area ── */}
        {walletAddress ? (
          /* Connected state */
          <div className="wallet-balance" style={{ cursor: 'pointer' }} onClick={() => setShowProfile(true)}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block', boxShadow: '0 0 6px #10B981' }} />
                {chainName || 'Polygon'}
              </span>
              <span className="amount">
                {Number(maticBalance).toFixed(3)} <span style={{ fontSize: '0.7em', opacity: 0.7 }}>MATIC</span>
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                ≈ ₹{Number(maticInrValue).toLocaleString('en-IN')}
              </span>
            </div>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700, color: '#fff', fontFamily: 'monospace',
              flexShrink: 0
            }}>
              {walletAddress.substring(2, 4).toUpperCase()}
            </div>
          </div>
        ) : (
          /* Not connected state */
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
              color: '#fff', border: 'none', borderRadius: '10px',
              padding: '0.6rem 1.1rem', fontWeight: 700, fontSize: '0.88rem',
              cursor: isConnecting ? 'wait' : 'pointer',
              boxShadow: '0 4px 12px rgba(249,115,22,0.35)',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            🦊 {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
          </button>
        )}

        <div className="position-relative" style={{ display: 'flex', gap: '0.6rem' }}>
          <button className="icon-btn" onClick={() => setIsDark(!isDark)} aria-label="Toggle Theme">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button className="icon-btn" onClick={() => setShowNotifs(!showNotifs)} aria-label="View Notifications">
            <Bell size={18} />
            {notifications.length > 0 && <span className="notification-dot animate-pulse-live" />}
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
                  <p className="text-muted" style={{ textAlign: 'center', padding: '1.5rem', fontSize: '0.88rem' }}>
                    No new notifications.
                  </p>
                ) : notifications.map(n => (
                  <div className="notif-item" key={n.id}>
                    <div className="notif-icon-wrapper"><n.icon size={15} className={n.color} /></div>
                    <div className="notif-text-box">
                      <p>{n.text}</p>
                      <span className="notif-time">{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Always-visible user avatar → opens profile/signout */}
          <button
            className="icon-btn"
            onClick={() => setShowProfile(true)}
            aria-label="Account"
            style={{ position: 'relative' }}
          >
            <User size={18} />
          </button>

          <button className="icon-btn mobile-menu-btn" onClick={() => document.body.classList.toggle('sidebar-open')} aria-label="Toggle Menu">
            <Menu size={18} />
          </button>
        </div>
      </div>

      {/* ── Profile / Wallet Modal — always available ── */}
      {showProfile && (
        <div className="user-modal-overlay" onClick={() => setShowProfile(false)} style={{ zIndex: 9999 }}>
          <div className="user-modal-content card" onClick={e => e.stopPropagation()}>
            <button className="icon-btn modal-close" onClick={() => setShowProfile(false)} aria-label="Close">
              <X size={16} />
            </button>

            {/* Fox avatar + address */}
            <div className="user-profile-header">
              <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)', fontSize: '1.4rem' }}>
                🦊
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>MetaMask Wallet</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{shortAddr}</span>
                  <button onClick={copyAddress} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                    <Copy size={12} />
                  </button>
                  {copied && <span style={{ fontSize: '0.7rem', color: 'var(--accent-green)' }}>Copied!</span>}
                  <a href={`https://amoy.polygonscan.com/address/${walletAddress}`} target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--accent-primary)', display: 'flex' }}>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>

            {/* Live Balance */}
            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', padding: '1rem', margin: '0.5rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>MATIC Balance</span>
                <button onClick={() => refreshBalance(walletAddress)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                  <RefreshCw size={13} />
                </button>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>{maticBalance} MATIC</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--accent-green)', fontWeight: 600 }}>
                ≈ ₹{Number(maticInrValue).toLocaleString('en-IN')} INR
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                1 MATIC ≈ ₹{maticInr.toLocaleString('en-IN')} · PropFi Smart Rate
              </div>
            </div>

            <div className="user-stats-grid">
              <div className="user-stat-card">
                <Wallet size={16} style={{ color: 'var(--accent-blue)' }} />
                <div className="val">{chainName || 'Unknown'}</div>
                <div className="lbl">Network</div>
              </div>
              <div className="user-stat-card">
                <ShieldCheck size={16} className="text-success" />
                <div className="val text-success">Verified</div>
                <div className="lbl">KYC Status</div>
              </div>
            </div>

            <div className="user-badges">
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Badges</h4>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="badge badge-early"><Award size={12} /> Genesis Member</span>
                <span className="badge badge-yield"><TrendingUp size={12} /> Land Investor</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <a
                href={`https://amoy.polygonscan.com/address/${walletAddress}`}
                target="_blank" rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ flex: 1, textDecoration: 'none', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
              >
                <ExternalLink size={14} /> View on Explorer
              </a>
              <button
                className="btn"
                style={{ flex: 1, background: 'rgba(255,59,48,0.1)', color: 'var(--accent-danger)', fontSize: '0.85rem' }}
                onClick={disconnectWallet}
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
