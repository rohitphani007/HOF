import { TrendingUp, TrendingDown, ArrowUpRight, Activity, Zap, Shield, BarChart3, MapPin, Clock, Users, Globe2, X, Wallet, ShieldCheck, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
// @ts-ignore
import PropFiAPI from '../api-client';
import './Dashboard.css';

/* ── Animated counter ──────────────────────── */
function Counter({ target, prefix='', suffix='' }: { target:number; prefix?:string; suffix?:string }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current; if (!el || done.current) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / 1400, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          setN(Math.round(ease * target));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{prefix}{n.toLocaleString('en-IN')}{suffix}</span>;
}

export default function Dashboard() {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  
  useEffect(() => {
    // Connect to WebSocket Live Feed
    const ws = PropFiAPI.connectLiveFeed({
      onInit: () => {
        // Initial data if needed
      },
      onPriceTick: () => {
        // Price tick updates could go here if used in UI
      },
      onNewTx: (tx: any) => {
        setActivity((prev: any) => [
          {
            user: tx.shortAddress,
            action: `${tx.type === 'BUY' ? 'Bought' : 'Sold'} ${tx.tokens} tokens of ${tx.propertyName}`,
            time: 'Just now',
            color: tx.type === 'BUY' ? 'var(--accent-green)' : 'var(--accent-red)'
          },
          ...prev
        ].slice(0, 10)); // Keep last 10
      }
    });
    
    // Fetch initial transactions to seed activity
    PropFiAPI.getTransactions(5).then((txs: any) => {
      setActivity(txs.map((tx: any) => ({
        user: tx.shortAddress,
        action: `${tx.type === 'BUY' ? 'Bought' : 'Sold'} ${tx.tokens} tokens of ${tx.propertyName}`,
        time: new Date(tx.timestamp).toLocaleTimeString(),
        color: tx.type === 'BUY' ? 'var(--accent-green)' : 'var(--accent-red)'
      })));
    }).catch(console.error);

    return () => ws.close();
  }, []);

  const topMovers = [
    { id:'1', name:'Bandra Kurla Complex', location:'Mumbai',    symbol:'BKC-01', price:'₹42,500', change:'+5.2%', isUp:true,  image:'/bkc.png'     },
    { id:'2', name:'Whitefield Tech Park', location:'Bengaluru', symbol:'WTP-88', price:'₹18,200', change:'+3.8%', isUp:true,  image:'/hsr.png'     },
    { id:'3', name:'Gurugram Cyber City',  location:'Delhi NCR', symbol:'GCC-12', price:'₹22,100', change:'-1.4%', isUp:false, image:'/cyberhub.png' },
  ];

  const tickers = [
    {sym:'MUM-IDX',chg:'+2.4%',up:true},{sym:'BLR-TECH',chg:'+1.1%',up:true},
    {sym:'DEL-NCR',chg:'-0.5%',up:false},{sym:'PUNE-IT',chg:'+0.8%',up:true},
    {sym:'HYD-FIN',chg:'+1.6%',up:true},{sym:'CHN-RLT',chg:'+3.2%',up:true},
    {sym:'KOL-COM',chg:'-0.3%',up:false},
  ];
  const doubled = [...tickers, ...tickers]; // seamless loop

  return (
    <div className="dashboard animate-fade-in">

      {/* Header row */}
      <div className="dashboard-header stagger-1">
        <div>
          <p className="dash-eyebrow">
            <Globe2 size={11} style={{verticalAlign:'middle',marginRight:'0.3rem'}}/>
            LIVE · MAINNET · PROPFI v2.0
          </p>
          <h1 className="dash-title">
            <span className="text-gradient">Welcome back,</span> Rohit
          </h1>
          <p className="dash-sub">Your portfolio is performing <strong style={{color:'var(--accent-green)'}}>12.5%</strong> above market average.</p>
        </div>
        <Link to="/market" className="btn btn-primary" style={{textDecoration:'none'}}>Explore Market →</Link>
      </div>

      {/* Auto-scrolling ticker */}
      <div className="market-ticker glass-card stagger-2">
        <Activity size={15} style={{color:'var(--accent-blue)',flexShrink:0}}/>
        <div className="ticker-track">
          <div className="ticker-inner">
            {doubled.map((t, i) => (
              <span key={i} className="ticker-item">
                <span className="fw-bold">{t.sym}</span>
                <span style={{color:t.up?'var(--accent-green)':'var(--accent-red)'}}>{t.chg}</span>
              </span>
            ))}
          </div>
        </div>
        <span style={{fontSize:'0.7rem',color:'var(--text-muted)',flexShrink:0,letterSpacing:'1px'}}>REACT INDEX</span>
      </div>

      {/* Stat tiles with animated counters */}
      <div className="stat-tiles stagger-3">
        <div className="tile tile-blue card-3d">
          <p className="tile-label">Portfolio Value</p>
          <h2 className="tile-value">₹<Counter target={642800}/></h2>
          <div className="tile-badge"><TrendingUp size={11}/> +12.5% all time</div>
        </div>
        <div className="tile tile-yellow card-3d">
          <p className="tile-label">Rental Yield</p>
          <h2 className="tile-value">₹<Counter target={8240}/></h2>
          <div className="tile-badge"><Zap size={11}/> This month</div>
        </div>
        <div className="tile tile-green card-3d">
          <p className="tile-label">AI Valuation</p>
          <h2 className="tile-value">+<Counter target={83} suffix="%"/></h2>
          <div className="tile-badge"><BarChart3 size={11}/> vs. market avg</div>
        </div>
        <div className="tile tile-purple card-3d">
          <p className="tile-label">ZK Proofs</p>
          <h2 className="tile-value"><Counter target={3}/> Active</h2>
          <div className="tile-badge"><Shield size={11}/> Privacy secured</div>
        </div>
      </div>

      {/* Three-column body */}
      <div className="dash-three-col">

        {/* Allocation */}
        <div className="card card-3d stagger-4">
          <h3 className="section-title">Portfolio Allocation</h3>
          <div className="allocation-bars">
            {[
              {label:'Mumbai',    pct:45, val:'₹2.89L', color:'var(--accent-blue)'},
              {label:'Bengaluru', pct:35, val:'₹2.24L', color:'var(--accent-purple)'},
              {label:'Gurugram',  pct:12, val:'₹0.77L', color:'var(--accent-orange)'},
              {label:'Liquid',    pct:8,  val:'₹0.51L', color:'var(--accent-green)'},
            ].map(b => (
              <div className="bar-item" key={b.label}>
                <div className="bar-label"><span>{b.label} ({b.pct}%)</span><span>{b.val}</span></div>
                <div className="bar-bg"><div className="bar-fill" style={{width:`${b.pct}%`,background:b.color}}/></div>
              </div>
            ))}
          </div>

          {/* Mini donut */}
          <div className="mini-donut-wrap">
            <svg viewBox="0 0 80 80" className="mini-donut">
              {[{pct:45,color:'#0A84FF',offset:0},{pct:35,color:'#BF5AF2',offset:45},{pct:12,color:'#FF9F0A',offset:80},{pct:8,color:'#30D158',offset:92}].map((s,i) => {
                const circ = 2 * Math.PI * 28;
                return <circle key={i} r="28" cx="40" cy="40" fill="none"
                  stroke={s.color} strokeWidth="12"
                  strokeDasharray={`${s.pct/100*circ} ${circ}`}
                  strokeDashoffset={`${-s.offset/100*circ}`}
                  strokeLinecap="butt" opacity="0.85"/>;
              })}
            </svg>
          </div>
        </div>

        {/* Top Movers */}
        <div className="card card-3d stagger-5">
          <h3 className="section-title">Top Movers Today</h3>
          <div className="movers-list">
            {topMovers.map(m => (
              <Link to={`/asset/${m.id}`} key={m.symbol} className="mover-item">
                <img src={m.image} alt={m.symbol}
                  style={{width:'42px',height:'42px',borderRadius:'10px',objectFit:'cover',flexShrink:0}}
                  loading="lazy" decoding="async"/>
                <div className="mover-info">
                  <div className="symbol">{m.symbol}</div>
                  <div className="name"><MapPin size={9}/> {m.location}</div>
                </div>
                <div className="mover-price">
                  <div className="price">{m.price}</div>
                  <div className={`change ${m.isUp?'text-success':'text-danger'}`}>
                    {m.isUp?<TrendingUp size={11}/>:<TrendingDown size={11}/>}{m.change}
                  </div>
                </div>
                <ArrowUpRight className="arrow-icon" size={14} style={{color:'var(--text-muted)'}}/>
              </Link>
            ))}
          </div>

          {/* Quick action */}
          <div style={{marginTop:'auto',paddingTop:'1rem',borderTop:'1px solid var(--glass-border)'}}>
            <Link to="/market" style={{color:'var(--accent-blue)',fontSize:'0.82rem',fontWeight:600,textDecoration:'none',display:'flex',alignItems:'center',gap:'0.3rem'}}>
              View full marketplace <ArrowUpRight size={13}/>
            </Link>
          </div>
        </div>

        {/* Live Activity */}
        <div className="card card-3d stagger-5">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
            <h3 className="section-title" style={{margin:0}}>Live Activity Feed</h3>
            <span className="live-badge">
              <span className="live-dot"/>LIVE
            </span>
          </div>
          <div className="activity-list">
            {activity.length === 0 && <div className="text-muted" style={{fontSize: '0.85rem', textAlign: 'center', padding: '1rem'}}>Waiting for transactions...</div>}
            {activity.map((a,i) => (
              <div key={i} className="activity-item" onClick={() => setSelectedUser(a)} style={{cursor: 'pointer'}}>
                <div className="activity-dot" style={{background:a.color}}/>
                <div className="activity-content">
                  <p className="activity-user">{a.user}</p>
                  <p className="activity-action">{a.action}</p>
                </div>
                <div className="activity-time"><Clock size={9}/> {a.time}</div>
              </div>
            ))}
          </div>
          <div className="live-users">
            <Users size={12} style={{color:'var(--text-muted)'}}/>
            <Counter target={1284}/> investors online now
          </div>
        </div>

      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="user-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="user-modal-content card" onClick={(e) => e.stopPropagation()}>
            <button className="icon-btn modal-close" onClick={() => setSelectedUser(null)} aria-label="Close">
              <X size={16}/>
            </button>
            <div className="user-profile-header">
              <div className="user-avatar" style={{background: selectedUser.color}}>
                {selectedUser.user.charAt(0)}
              </div>
              <div>
                <h3 style={{margin:0, fontSize:'1.25rem', fontWeight:700}}>{selectedUser.user}</h3>
                <span className="text-muted" style={{fontSize:'0.85rem', fontFamily:'monospace'}}>
                  0x{Math.random().toString(16).slice(2,6)}...{Math.random().toString(16).slice(2,6)}
                </span>
              </div>
            </div>
            
            <div className="user-stats-grid">
              <div className="user-stat-card">
                <Wallet size={16} style={{color:'var(--accent-blue)'}}/>
                <div className="val">₹{(Math.random() * 50 + 10).toFixed(1)}L</div>
                <div className="lbl">Est. Holdings</div>
              </div>
              <div className="user-stat-card">
                <ShieldCheck size={16} className="text-success"/>
                <div className="val text-success">Verified</div>
                <div className="lbl">KYC Status</div>
              </div>
            </div>

            <div className="user-badges">
              <h4 style={{fontSize:'0.85rem', color:'var(--text-muted)', marginBottom:'0.75rem'}}>Reputation Badges</h4>
              <div style={{display:'flex', gap:'0.5rem', flexWrap:'wrap'}}>
                <span className="badge badge-yield"><Award size={12}/> Yield Farmer</span>
                <span className="badge badge-early"><Zap size={12}/> Early Adopter</span>
              </div>
            </div>

            <div style={{borderTop:'1px solid var(--glass-border)', paddingTop:'1rem'}}>
              <h4 style={{fontSize:'0.85rem', color:'var(--text-muted)'}}>Recent Context</h4>
              <p style={{fontSize:'0.9rem', marginTop:'0.5rem', color:'var(--text-primary)'}}>
                {selectedUser.action} <span className="text-muted">({selectedUser.time})</span>
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
