import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Briefcase, ShieldCheck, Download, ExternalLink, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePortfolio, type Holding } from '../context/PortfolioContext';
import { useEffect, useMemo, useState } from 'react';
// @ts-ignore
import PropFiAPI from '../api-client';
import './Portfolio.css';

type LiveSnap = { id: string; currentPrice: number; category: string };
type EnrichedHolding = Holding & { displayCategory: string };

function normalizeAssetCategory(typeRaw?: string | null, landRaw?: string | null): string {
  const t = (typeRaw || '').toLowerCase();
  const land = (landRaw || '').toLowerCase();
  if (t.includes('agricultural') || land.includes('agri')) return 'Agricultural';
  if (t.includes('commercial') || t.includes('office') || t.includes('retail') || t.includes('shop')) return 'Commercial';
  if (t.includes('industrial')) return 'Industrial';
  if (
    t.includes('apartment') ||
    t.includes('studio') ||
    t.includes('flat') ||
    t.includes('villa') ||
    t.includes('residential')
  )
    return 'Residential';
  if (t.includes('plot') || t.includes('land') || land.includes('plot')) return 'Land / Plot';
  if (typeRaw && typeRaw.trim()) return typeRaw.trim();
  return 'Other';
}

/** Mark-to-market portfolio value after each buy, scaled by aggregate appreciation (live TV vs cost). */
function buildGrowthSeries(
  bankStatement: { type: string; description: string; amount: number; timestamp: string }[],
  holdings: Holding[],
  totalInvested: number,
  totalCurrent: number
): { name: string; value: number }[] {
  const purchases = bankStatement
    .filter((e) => e.type === 'DEBIT' && /bought\s+\d+\s+tokens/i.test(e.description))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const scaleValue = (cumulativeCost: number) =>
    totalInvested > 0 ? cumulativeCost * (totalCurrent / totalInvested) : cumulativeCost;

  const points: { name: string; value: number }[] = [];
  let cumulative = 0;
  for (const e of purchases) {
    cumulative += e.amount;
    const d = new Date(e.timestamp);
    points.push({
      name: d.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      value: Math.round(scaleValue(cumulative)),
    });
  }

  if (points.length === 0 && holdings.length > 0) {
    const byDate = [...holdings].sort(
      (a, b) => new Date(a.purchasedAt).getTime() - new Date(b.purchasedAt).getTime()
    );
    let cum = 0;
    for (const h of byDate) {
      cum += h.avgPrice * h.fractions;
      const d = new Date(h.purchasedAt);
      points.push({
        name: d.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        value: Math.round(scaleValue(cum)),
      });
    }
  }

  const roundedTotal = Math.round(totalCurrent);

  if (points.length === 0) {
    return [{ name: 'Current (live)', value: roundedTotal }];
  }

  const last = points[points.length - 1];
  if (last.value === roundedTotal) {
    points[points.length - 1] = { name: 'Current (live)', value: roundedTotal };
    return points;
  }
  points.push({ name: 'Current (live)', value: roundedTotal });
  return points;
}

const ALLOC_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#3B82F6', '#94A3B8', '#F43F5E'];

export default function Portfolio() {
  const { holdings, bankStatement, maticBalance, walletAddress } = usePortfolio();
  const [liveSnaps, setLiveSnaps] = useState<LiveSnap[]>([]);

  const holdingsWithLive = useMemo((): EnrichedHolding[] => {
    return holdings.map((h) => {
      const snap = liveSnaps.find((s) => s.id === h.id);
      const price = snap?.currentPrice ?? h.currentPrice;
      const category = snap?.category ?? normalizeAssetCategory(h.assetType, null);
      return { ...h, currentPrice: price, displayCategory: category };
    });
  }, [holdings, liveSnaps]);

  // Live mark & categories from API (refresh on load + every 30s)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (holdings.length === 0) {
        setLiveSnaps([]);
        return;
      }
      const snaps = await Promise.all(
        holdings.map(async (h) => {
          try {
            const p: any = await PropFiAPI.getProperty(h.id);
            const category = normalizeAssetCategory(p?.type ?? h.assetType, p?.landCategory);
            return {
              id: h.id,
              currentPrice: Number(p?.tokenPrice ?? h.currentPrice),
              category,
            };
          } catch {
            return {
              id: h.id,
              currentPrice: h.currentPrice,
              category: normalizeAssetCategory(h.assetType, null),
            };
          }
        })
      );
      if (!cancelled) setLiveSnaps(snaps);
    };
    load();
    const t = window.setInterval(load, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [holdings]);

  const totalInvested = holdingsWithLive.reduce((s, h) => s + h.avgPrice * h.fractions, 0);
  const totalCurrent = holdingsWithLive.reduce((s, h) => s + h.currentPrice * h.fractions, 0);
  const unrealizedGain = totalCurrent - totalInvested;
  const returnPct = totalInvested > 0 ? (unrealizedGain / totalInvested) * 100 : 0;
  const returnLabel = `${returnPct >= 0 ? '+' : ''}${returnPct.toFixed(2)}%`;

  const allocationData = useMemo(() => {
    const bucket: Record<string, number> = {};
    holdingsWithLive.forEach((h) => {
      const cat = h.displayCategory || 'Other';
      bucket[cat] = (bucket[cat] || 0) + h.currentPrice * h.fractions;
    });
    const entries = Object.entries(bucket)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1]);
    return entries.map(([name, valueInr], i) => ({
      name,
      valueInr,
      color: ALLOC_COLORS[i % ALLOC_COLORS.length],
    }));
  }, [holdingsWithLive]);

  const perfData = useMemo(
    () => buildGrowthSeries(bankStatement, holdings, totalInvested, totalCurrent),
    [bankStatement, holdings, totalInvested, totalCurrent]
  );

  const exportCSV = () => {
    const rows = [
      ['Date', 'Type', 'Description', 'Amount (₹)', 'Tx Hash', 'Status'],
      ...bankStatement.map((e) => [
        new Date(e.timestamp).toLocaleString('en-IN'),
        e.type,
        e.description,
        e.amount.toLocaleString('en-IN'),
        e.txHash || '',
        e.status,
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'propfi_bank_statement.csv';
    a.click();
  };

  const isUp = unrealizedGain >= 0;
  const TrendIcon = isUp ? TrendingUp : TrendingDown;
  const trendClass = isUp ? 'text-success' : 'text-danger';

  return (
    <div className="portfolio animate-fade-in">
      <div className="portfolio-header">
        <div>
          <h1>My Portfolio</h1>
          {walletAddress && (
            <p
              style={{
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginTop: '0.25rem',
              }}
            >
              🦊 {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)} ·{' '}
              {maticBalance} MATIC
            </p>
          )}
          <p>Live land fractionalization portfolio — TVL refreshes from the marketplace API.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={exportCSV}>
            <Download size={18} /> Export Bank Statement
          </button>
        </div>
      </div>

      {/* ── Key Metrics ── */}
      <div className="key-metrics-grid">
        <div className="metric-card card metric-card-uniform">
          <div className="card-header">
            <span>Total Invested</span>
            <Briefcase size={20} className="text-primary" />
          </div>
          <h2 className="amount">₹{totalInvested.toLocaleString('en-IN')}</h2>
        </div>
        <div className="metric-card card metric-card-uniform">
          <div className="card-header">
            <span>Current Valuation</span>
            <TrendIcon size={20} className={trendClass} />
          </div>
          <h2 className="amount">₹{totalCurrent.toLocaleString('en-IN')}</h2>
          {unrealizedGain !== 0 && (
            <span
              className={`badge ${unrealizedGain > 0 ? 'text-success bg-success-transparent' : 'text-danger bg-danger-transparent'}`}
            >
              {unrealizedGain > 0 ? '+' : ''}₹{unrealizedGain.toLocaleString('en-IN')}
            </span>
          )}
        </div>
        <div className="metric-card card metric-card-uniform">
          <div className="card-header">
            <span>Unrealized Return</span>
            {returnPct >= 0 ? (
              <TrendingUp size={20} className="text-success" />
            ) : (
              <TrendingDown size={20} className="text-danger" />
            )}
          </div>
          <h2 className={`amount ${returnPct >= 0 ? 'text-success' : 'text-danger'}`}>{returnLabel}</h2>
        </div>
        <div className="metric-card card metric-card-uniform">
          <div className="card-header">
            <span>On-Chain Balance</span>
            <ShieldCheck size={20} className="text-primary" />
          </div>
          <h2 className="amount">{maticBalance} MATIC</h2>
          <span className="badge">Live · Updated every 15s</span>
        </div>
      </div>

      {/* ── Charts ── */}
      {holdings.length > 0 && (
        <div className="charts-view charts-view-uniform">
          <div className="performance-chart card chart-card-tall">
            <h3>Portfolio Growth</h3>
            <p className="chart-sub">Mark-to-market vs. time (from purchase history × live token prices).</p>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={perfData} margin={{ top: 10, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748B" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis hide={true} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#131A2A',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                    formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Portfolio value']}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#6366F1"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                    isAnimationActive={true}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="allocation-chart card chart-card-tall">
            <h3>Asset Allocation</h3>
            <p className="chart-sub">By property type · weights from live token price × your tokens.</p>
            <div className="pie-wrapper">
              {allocationData.length === 0 ? (
                <div className="text-muted" style={{ padding: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>
                  No allocation data.
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={allocationData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="valueInr"
                        nameKey="name"
                      >
                        {allocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => {
                          const v = typeof value === 'number' ? value : Number(value);
                          const total = allocationData.reduce((s, x) => s + x.valueInr, 0) || 1;
                          const pct = ((v / total) * 100).toFixed(1);
                          return [`₹${v.toLocaleString('en-IN')} (${pct}%)`, String(name ?? '')];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="legend">
                    {allocationData.map((item) => {
                      const total = allocationData.reduce((s, x) => s + x.valueInr, 0) || 1;
                      const pct = ((item.valueInr / total) * 100).toFixed(1);
                      return (
                        <div className="legend-item" key={item.name}>
                          <div className="dot" style={{ backgroundColor: item.color }} />
                          <span>{item.name}</span>
                          <span className="perc">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Holdings ── */}
      <div className="holdings-section card">
        <h3>Current Holdings</h3>
        {holdings.length === 0 ? (
          <div style={{ padding: '2rem 0' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem',
              }}
            >
              {[
                {
                  step: '01',
                  title: 'Connect MetaMask',
                  desc: 'Click "Connect MetaMask" in the header to link your wallet.',
                  icon: '🦊',
                  color: '#f59e0b',
                },
                {
                  step: '02',
                  title: 'Browse Market',
                  desc: 'Explore 1,064 properties across 56 Indian cities with real yields.',
                  icon: '🏘️',
                  color: '#6366f1',
                },
                {
                  step: '03',
                  title: 'Buy Tokens',
                  desc: 'Purchase land fractions starting at ₹500/token on Polygon.',
                  icon: '💎',
                  color: '#10b981',
                },
                {
                  step: '04',
                  title: 'Earn Returns',
                  desc: 'Receive monthly rent/lease income directly to your wallet.',
                  icon: '📈',
                  color: '#ec4899',
                },
              ].map((s) => (
                <div
                  key={s.step}
                  style={{
                    background: 'var(--bg-base)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    border: '1px solid var(--glass-border)',
                  }}
                >
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{s.icon}</div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      color: s.color,
                      marginBottom: '0.25rem',
                      letterSpacing: '1px',
                    }}
                  >
                    STEP {s.step}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center' }}>
              <Link
                to="/#market"
                onClick={() => document.getElementById('market')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn btn-primary"
                style={{ textDecoration: 'none', display: 'inline-flex', gap: '0.5rem', padding: '0.85rem 2rem', fontSize: '1rem' }}
              >
                🔍 Browse Land Marketplace →
              </Link>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                Avg. portfolio yield of <strong style={{ color: 'var(--accent-green)' }}>11.4% p.a.</strong> across all listed
                properties
              </p>
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="holdings-table">
              <thead>
                <tr>
                  <th>Asset / Symbol</th>
                  <th>Tokens</th>
                  <th>Avg. Price</th>
                  <th>Current Value</th>
                  <th>Return</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {holdingsWithLive.map((h) => {
                  const costBasis = h.avgPrice * h.fractions;
                  const currentVal = h.currentPrice * h.fractions;
                  const pct = costBasis > 0 ? ((currentVal - costBasis) / costBasis) * 100 : 0;
                  const rowUp = pct >= 0;
                  return (
                    <tr key={h.id}>
                      <td>
                        <div className="asset-cell">
                          <span className="symbol">{h.symbol || `PROP-${h.id}`}</span>
                          <span className="name">{h.name}</span>
                        </div>
                      </td>
                      <td>{h.fractions} tokens</td>
                      <td>₹{h.avgPrice.toLocaleString('en-IN')}</td>
                      <td className="fw-bold">₹{currentVal.toLocaleString('en-IN')}</td>
                      <td>
                        <span
                          className={`return-badge ${rowUp ? 'text-success bg-success-transparent' : 'text-danger bg-danger-transparent'}`}
                        >
                          {rowUp ? '+' : ''}
                          {pct.toFixed(1)}%
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/asset/${h.id}`}
                          className="btn btn-secondary action-btn"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', textDecoration: 'none' }}
                        >
                          Trade
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Bank Statement ── */}
      <div className="holdings-section card" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>
            <FileText size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
            Bank Statement
          </h3>
          <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </button>
        </div>
        {bankStatement.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No transactions yet. Buy a land token to see your statement here.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="holdings-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Amount (₹)</th>
                  <th>Tx Hash</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bankStatement.map((entry) => (
                  <tr key={entry.id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(entry.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{entry.description}</td>
                    <td>
                      <span
                        className={`return-badge ${entry.type === 'CREDIT' ? 'text-success bg-success-transparent' : 'text-danger bg-danger-transparent'}`}
                      >
                        {entry.type}
                      </span>
                    </td>
                    <td className={`fw-bold ${entry.type === 'CREDIT' ? 'text-success' : 'text-danger'}`}>
                      {entry.type === 'CREDIT' ? '+' : '-'}₹{entry.amount.toLocaleString('en-IN')}
                    </td>
                    <td>
                      {entry.txHash ? (
                        <a
                          href={`https://amoy.polygonscan.com/tx/${entry.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: 'var(--accent-primary)',
                            fontSize: '0.75rem',
                            fontFamily: 'monospace',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          {entry.txHash.substring(0, 12)}... <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className={`return-badge ${entry.status === 'CONFIRMED' ? 'text-success bg-success-transparent' : 'text-warning'}`}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
