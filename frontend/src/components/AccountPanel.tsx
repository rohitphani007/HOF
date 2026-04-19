import { useState, useRef, useEffect } from 'react';
import { User, Pencil, Check, X, Wallet, LogOut, ShieldCheck, Copy } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export default function AccountPanel({ open, onClose, onLogout }: Props) {
  const [name,    setName]    = useState(() => localStorage.getItem('propfi_user_name')  || 'Guest');
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(name);
  const [copied,  setCopied]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const email      = localStorage.getItem('propfi_user_email') || '—';
  const walletAddr = localStorage.getItem('propfi_wallet')     || '';
  const shortWallet = walletAddr
    ? `${walletAddr.slice(0, 8)}...${walletAddr.slice(-6)}`
    : 'Not connected';

  // Derive initials / avatar letter
  const letter = name.trim().charAt(0).toUpperCase() || 'G';

  // Deterministic ID
  const idSource  = email !== '—' ? email : (walletAddr || 'guest');
  const userIdNum = idSource.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 9000 + 1000;
  const userId    = `PRF-${userIdNum}`;

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const saveName = () => {
    const trimmed = draft.trim() || 'Guest';
    setName(trimmed);
    localStorage.setItem('propfi_user_name', trimmed);
    setEditing(false);
    // Fire storage event so Sidebar re-reads without full reload
    window.dispatchEvent(new Event('storage'));
  };

  const cancelEdit = () => {
    setDraft(name);
    setEditing(false);
  };

  const copyWallet = () => {
    if (!walletAddr) return;
    navigator.clipboard.writeText(walletAddr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 8888,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 8889,
        width: 'min(380px, 92vw)',
        background: 'linear-gradient(160deg, rgba(38,27,18,0.98) 0%, rgba(22,14,8,0.99) 100%)',
        borderLeft: '1px solid rgba(200,147,90,0.2)',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.6)',
        display: 'flex', flexDirection: 'column',
        animation: 'slideInRight 0.28s cubic-bezier(0.34,1.2,0.64,1)',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(200,147,90,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#C8935A', fontWeight: 700 }}>
            <User size={18} /> My Account
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Avatar + Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(200,147,90,0.07)', borderRadius: 16, padding: '1.25rem', border: '1px solid rgba(200,147,90,0.14)' }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #C8935A, #E8B84A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.8rem', fontWeight: 900, color: '#110d09',
              boxShadow: '0 4px 20px rgba(200,147,90,0.4)',
            }}>
              {letter}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {editing ? (
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <input
                    ref={inputRef}
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') cancelEdit(); }}
                    maxLength={30}
                    style={{
                      flex: 1, background: 'rgba(200,147,90,0.12)', border: '1px solid rgba(200,147,90,0.4)',
                      borderRadius: 8, padding: '0.4rem 0.7rem', color: '#F2EAE0', fontSize: '1rem',
                      fontWeight: 700, outline: 'none',
                    }}
                  />
                  <button onClick={saveName} style={{ background: 'rgba(126,184,122,0.2)', border: '1px solid rgba(126,184,122,0.4)', borderRadius: 8, padding: '0.35rem 0.5rem', cursor: 'pointer', color: '#7EB87A' }}>
                    <Check size={16} />
                  </button>
                  <button onClick={cancelEdit} style={{ background: 'rgba(200,90,74,0.15)', border: '1px solid rgba(200,90,74,0.3)', borderRadius: 8, padding: '0.35rem 0.5rem', cursor: 'pointer', color: '#C85A4A' }}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#F2EAE0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                  <button
                    onClick={() => { setDraft(name); setEditing(true); }}
                    title="Edit name"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem', flexShrink: 0, transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#C8935A')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              )}
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontFamily: 'monospace' }}>{userId}</div>
            </div>
          </div>

          {/* Email */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '1rem', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Email</div>
            <div style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 500 }}>{email}</div>
          </div>

          {/* Wallet */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '1rem', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Wallet size={11} /> Connected Wallet
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <code style={{ color: walletAddr ? '#C8935A' : 'var(--text-muted)', fontSize: '0.82rem', flex: 1 }}>
                {shortWallet}
              </code>
              {walletAddr && (
                <button onClick={copyWallet} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#7EB87A' : 'var(--text-muted)', transition: 'color 0.2s' }}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              )}
            </div>
          </div>

          {/* Verified badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(126,184,122,0.08)', border: '1px solid rgba(126,184,122,0.2)', borderRadius: 12, padding: '0.85rem 1rem' }}>
            <ShieldCheck size={18} color="#7EB87A" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#7EB87A' }}>KYC Verified</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Identity verified via Polygon ID</div>
            </div>
          </div>
        </div>

        {/* Footer — Sign Out */}
        <div style={{ padding: '1.25rem', borderTop: '1px solid rgba(200,147,90,0.12)' }}>
          <button
            onClick={onLogout}
            style={{
              width: '100%', padding: '0.8rem', borderRadius: 12,
              background: 'rgba(200,90,74,0.12)', border: '1px solid rgba(200,90,74,0.25)',
              color: '#C85A4A', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,90,74,0.22)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(200,90,74,0.12)')}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
