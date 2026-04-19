import { TrendingUp, ArrowUpRight, Activity, Zap, Shield, BarChart3, MapPin, Clock, Users, Globe2, X, Wallet, ShieldCheck, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
// @ts-ignore
import PropFiAPI from '../api-client';
import './Dashboard.css';

function Counter({ target, prefix = '', suffix = '' }: { target: number; prefix?: string; suffix?: string }) {
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

type AllocationRow = { label: string; pct: number; val: string; color: string };

function bucketCityIndex(cityRaw: string): number {
  const c = (cityRaw || '').toLowerCase().trim();
  // Mumbai Metropolitan Region (tier-1 liquidity proxy)
  if (/mumbai|thane|navi mumbai|palghar|vasai|virar|kalyan|dombiv|ulhas|bhiwandi/.test(c)) return 0;
  if (/bengaluru|bangalore/.test(c)) return 1;
  if (/delhi|new delhi|gurugram|gurgaon|noida|ghaziabad|faridabad|greater noida/.test(c)) return 2;
  if (/hyderabad|secunderabad/.test(c)) return 3;
  return 4;
}

/** Integer percentages that sum to 100 (largest remainder). */
function allocatePercents(sums: number[]): number[] {
  const total = sums.reduce((a, b) => a + b, 0);
  if (total <= 0) return sums.map(() => 0);
  const exact = sums.map((s) => (s / total) * 100);
  const floor = exact.map((x) => Math.floor(x));
  let diff = 100 - floor.reduce((a, b) => a + b, 0);
  const order = exact
    .map((x, i) => ({ i, r: x - floor[i] }))
    .sort((a, b) => b.r - a.r);
  for (let d = 0; d < diff; d++) floor[order[d % order.length].i]++;
  return floor;
}

const ALLOCATION_META: { label: string; color: string }[] = [
  { label: 'Mumbai MMR', color: '#6366f1' },
  { label: 'Bengaluru', color: '#eab308' },
  { label: 'Delhi NCR', color: '#f59e0b' },
  { label: 'Hyderabad', color: '#10b981' },
  { label: 'Other Cities', color: '#f43f5e' },
];

export default function Dashboard() {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [activity,     setActivity]     = useState<any[]>([]);
  const [topMovers,    setTopMovers]    = useState<any[]>([]);
  const [allocationCities, setAllocationCities] = useState<AllocationRow[]>([]);
  const [metrics, setMetrics] = useState({
    totalProperties: 1064,
    totalHolders: 586598,
    avgYield: 10.0,
    tvl: 30_78_98_35_689,
    totalCities: 56,
  });

  // Fetch real properties for top movers
  useEffect(() => {
    PropFiAPI.getProperties({ limit: 2000 })
      .then((res: any) => {
        // API now returns { data: [...], total, ... } — extract the array
        const data: any[] = Array.isArray(res) ? res : (res?.data || []);
        if (!data || data.length === 0) return;
        // Pick highest appreciationYield or rentalYield properties as "top movers"
        const sorted = [...data]
          .sort((a, b) => {
            const ya = a.appreciationYield || a.rentalYield || 0;
            const yb = b.appreciationYield || b.rentalYield || 0;
            return yb - ya;
          })
          .slice(0, 5);
        setTopMovers(sorted.map(p => ({
          id: p.id,
          name: p.name,
          location: `${p.city}, ${p.state}`,
          symbol: p.symbolIndex || `PROP-${p.id.toUpperCase()}`,
          price: `₹${(p.tokenPrice || 0).toLocaleString('en-IN')}`,
          change: `+${(p.appreciationYield || p.rentalYield || 0).toFixed(1)}%`,
          isUp: true,
          type: p.type,
          image: p.image,
          monthlyRent: p.monthlyRent || p.leaseIncome || 0,
        })));
        // Derive live metrics from full dataset
        const avgYield = data.reduce((s: number, p: any) => s + (p.appreciationYield || p.rentalYield || 0), 0) / data.length;
        const totalTvl = data.reduce((s: number, p: any) => s + (p.totalValue || 0), 0);
        const totalHolders = data.reduce((s: number, p: any) => s + (p.tokenHolders || 0), 0);
        const uniqueCities = new Set(data.map((p: any) => p.city)).size;
        setMetrics({ totalProperties: data.length, totalHolders, avgYield: Math.round(avgYield * 10) / 10, tvl: totalTvl, totalCities: uniqueCities });

        const sums = [0, 0, 0, 0, 0];
        for (const p of data) {
          const idx = bucketCityIndex(String(p.city || ''));
          sums[idx] += p.totalValue || 0;
        }
        const pcts = allocatePercents(sums);
        const rows: AllocationRow[] = ALLOCATION_META.map((m, i) => ({
          label: m.label,
          pct: pcts[i],
          val: sums[i] > 0 ? `₹${(sums[i] / 1e7).toFixed(1)}Cr` : '₹0Cr',
          color: m.color,
        }));
        setAllocationCities(rows);
      })
      .catch(console.error);
  }, []);

  // Live activity feed via WebSocket
  useEffect(() => {
    const ws = PropFiAPI.connectLiveFeed({
      onInit: () => {},
      onPriceTick: () => {},
      onNewTx: (tx: any) => {
        setActivity(prev => [{
          user: tx.shortAddress,
          action: `${tx.type === 'BUY' ? 'Bought' : 'Sold'} ${tx.tokens} tokens of ${tx.propertyName}`,
          amount: `₹${(tx.totalAmount || 0).toLocaleString('en-IN')}`,
          time: 'Just now',
          color: tx.type === 'BUY' ? 'var(--accent-green)' : 'var(--accent-red)',
          txType: tx.type,
        }, ...prev].slice(0, 12));
      }
    });

    PropFiAPI.getTransactions(8).then((txs: any) => {
      setActivity(txs.map((tx: any) => ({
        user: tx.shortAddress,
        action: `${tx.type === 'BUY' ? 'Bought' : 'Sold'} ${tx.tokens} tokens of ${tx.propertyName}`,
        amount: `₹${(tx.totalAmount || 0).toLocaleString('en-IN')}`,
        time: new Date(tx.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        color: tx.type === 'BUY' ? 'var(--accent-green)' : 'var(--accent-red)',
        txType: tx.type,
      })));
    }).catch(console.error);

    return () => ws.close();
  }, []);

  const tickers = [
    { sym: 'MUM-IDX', chg: '+2.4%', up: true }, { sym: 'BLR-TECH', chg: '+1.1%', up: true },
    { sym: 'DEL-NCR', chg: '-0.5%', up: false }, { sym: 'PUNE-IT', chg: '+0.8%', up: true },
    { sym: 'HYD-FIN', chg: '+1.6%', up: true }, { sym: 'CHN-RLT', chg: '+3.2%', up: true },
    { sym: 'KOL-COM', chg: '-0.3%', up: false }, { sym: 'JPR-LND', chg: '+4.1%', up: true },
    { sym: 'KCH-OFS', chg: '+2.8%', up: true }, { sym: 'AHM-GFT', chg: '+5.2%', up: true },
  ];
  const doubled = [...tickers, ...tickers];

  return (
    <div className="dashboard animate-fade-in">

      {/* Header */}
      <div className="dashboard-header stagger-1">
        <div>
          <p className="dash-eyebrow">
            <Globe2 size={11} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
            LIVE · POLYGON AMOY · PROPFI v2.0
          </p>
          <h1 className="dash-title">
            <span className="text-gradient">Namaste,</span> Land Investor 🇮🇳
          </h1>
          <p className="dash-sub">
            Tracking <strong style={{ color: 'var(--accent-primary)' }}>{metrics.totalProperties} properties</strong> across{' '}
            <strong style={{ color: 'var(--accent-green)' }}>{metrics.totalCities} Indian cities</strong> · avg yield{' '}
            <strong style={{ color: 'var(--accent-green)' }}>{metrics.avgYield}%</strong>
          </p>
        </div>
        <Link to="/market" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          Explore Market →
        </Link>
      </div>

      {/* Live ticker */}
      <div className="market-ticker glass-card stagger-2">
        <Activity size={15} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
        <div className="ticker-track">
          <div className="ticker-inner">
            {doubled.map((t, i) => (
              <span key={i} className="ticker-item">
                <span className="fw-bold">{t.sym}</span>
                <span style={{ color: t.up ? 'var(--accent-green)' : 'var(--accent-red)' }}>{t.chg}</span>
              </span>
            ))}
          </div>
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0, letterSpacing: '1px' }}>PROPFI INDEX</span>
      </div>

      {/* Key stat tiles */}
      <div className="stat-tiles stagger-3">
        <div className="tile tile-blue card-3d">
          <p className="tile-label">Total Market TVL</p>
          <h2 className="tile-value">
            ₹<Counter target={Math.round(metrics.tvl / 100000)} suffix="L" />
          </h2>
          <div className="tile-badge"><TrendingUp size={11} /> Across {metrics.totalProperties} properties</div>
        </div>
        <div className="tile tile-yellow card-3d">
          <p className="tile-label">Avg. Projected Yield</p>
          <h2 className="tile-value">+{metrics.avgYield.toFixed(1)}<span style={{fontSize:'0.55em'}}>%</span></h2>
          <div className="tile-badge"><Zap size={11} /> Annual Projected</div>
        </div>
        <div className="tile tile-green card-3d">
          <p className="tile-label">Total Token Holders</p>
          <h2 className="tile-value"><Counter target={metrics.totalHolders} /></h2>
          <div className="tile-badge"><Shield size={11} /> On-chain verified</div>
        </div>
        <div className="tile tile-purple card-3d">
          <p className="tile-label">Indian Cities Listed</p>
          <h2 className="tile-value"><Counter target={metrics.totalCities} /></h2>
          <div className="tile-badge"><BarChart3 size={11} /> Tier 1 + Tier 2 + Tier 3</div>
        </div>
      </div>

      {/* Three-column body */}
      <div className="dash-three-col">

        {/* Allocation by city */}
        <div className="card card-3d stagger-4">
          <h3 className="section-title">Market Allocation by City</h3>
          {allocationCities.length === 0 ? (
            <div className="text-muted" style={{ fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem' }}>
              Loading allocation from live listings…
            </div>
          ) : (
          <div className="allocation-bars">
            {allocationCities.map(b => (
              <div className="bar-item" key={b.label}>
                <div className="bar-label">
                  <span>{b.label} ({b.pct}%)</span>
                  <span>{b.val}</span>
                </div>
                <div className="bar-bg">
                  <div className="bar-fill bar-fill-uniform" style={{ background: b.color }} />
                </div>
              </div>
            ))}
          </div>
          )}
          {allocationCities.length > 0 && (
          <div className="mini-donut-wrap">
            <svg viewBox="0 0 80 80" className="mini-donut">
              {allocationCities.map((s, i) => {
                const circ = 2 * Math.PI * 28;
                const offset = allocationCities.slice(0, i).reduce((sum, x) => sum + x.pct, 0);
                return <circle key={i} r="28" cx="40" cy="40" fill="none"
                  stroke={s.color} strokeWidth="12"
                  strokeDasharray={`${s.pct / 100 * circ} ${circ}`}
                  strokeDashoffset={`${-offset / 100 * circ}`}
                  strokeLinecap="butt" opacity="0.85" />;
              })}
            </svg>
          </div>
          )}
        </div>

        {/* Top Movers — from API */}
        <div className="card card-3d stagger-5">
          <h3 className="section-title">Top Yielding Properties</h3>
          <div className="movers-list">
            {topMovers.length === 0 && (
              <div className="text-muted" style={{ fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>
                Loading live data...
              </div>
            )}
            {topMovers.map(m => (
              <Link to={`/asset/${m.id}`} key={m.id} className="mover-item">
                <img src={m.image} alt={m.symbol}
                  style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                  loading="lazy" decoding="async" />
                <div className="mover-info">
                  <div className="symbol">{m.symbol}</div>
                  <div className="name"><MapPin size={9} /> {m.location}</div>
                  {m.monthlyRent > 0 && (
                    <div style={{ fontSize: '0.68rem', color: 'var(--accent-green)', marginTop: '0.1rem' }}>
                      ₹{m.monthlyRent.toLocaleString('en-IN')}/mo rent
                    </div>
                  )}
                </div>
                <div className="mover-price">
                  <div className="price">{m.price}</div>
                  <div className="change text-success">
                    <TrendingUp size={11} />{m.change}
                  </div>
                </div>
                <ArrowUpRight className="arrow-icon" size={14} style={{ color: 'var(--text-muted)' }} />
              </Link>
            ))}
          </div>
          <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
            <Link to="/market" style={{ color: 'var(--accent-blue)', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              View full marketplace <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="card card-3d stagger-5">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="section-title" style={{ margin: 0 }}>Live Activity Feed</h3>
            <span className="live-badge"><span className="live-dot" />LIVE</span>
          </div>
          <div className="activity-list">
            {activity.length === 0 && (
              <div className="text-muted" style={{ fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
                Waiting for transactions...
              </div>
            )}
            {activity.map((a, i) => (
              <div key={i} className="activity-item" onClick={() => setSelectedUser(a)} style={{ cursor: 'pointer' }}>
                <div className="activity-dot" style={{ background: a.color }} />
                <div className="activity-content">
                  <p className="activity-user">{a.user}</p>
                  <p className="activity-action">{a.action}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: a.txType === 'BUY' ? 'var(--accent-green)' : 'var(--accent-red)' }}>{a.amount}</div>
                  <div className="activity-time"><Clock size={9} /> {a.time}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="live-users">
            <Users size={12} style={{ color: 'var(--text-muted)' }} />
            <Counter target={metrics.totalHolders} /> active investors
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="user-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="user-modal-content card" onClick={e => e.stopPropagation()}>
            <button className="icon-btn modal-close" onClick={() => setSelectedUser(null)} aria-label="Close">
              <X size={16} />
            </button>
            <div className="user-profile-header">
              <div className="user-avatar" style={{ background: selectedUser.color }}>{selectedUser.user?.charAt(2) || 'A'}</div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace' }}>{selectedUser.user}</h3>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>Anonymous · On-chain Verified</span>
              </div>
            </div>
            <div className="user-stats-grid">
              <div className="user-stat-card">
                <Wallet size={16} style={{ color: 'var(--accent-blue)' }} />
                <div className="val">{selectedUser.amount}</div>
                <div className="lbl">Transaction</div>
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
                <span className="badge badge-yield"><Award size={12} /> Land Investor</span>
                <span className="badge badge-early"><Zap size={12} /> Early Adopter</span>
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {selectedUser.action} <span className="text-muted">({selectedUser.time})</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
