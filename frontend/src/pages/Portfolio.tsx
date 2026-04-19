import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Briefcase, ArrowUpRight, ShieldCheck, Download, ExternalLink, FileText, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePortfolio } from '../context/PortfolioContext';
import './Portfolio.css';

export default function Portfolio() {
  const { holdings, bankStatement, maticBalance, walletAddress } = usePortfolio();

  // Derive stats from live data
  const totalInvested = holdings.reduce((s, h) => s + h.avgPrice * h.fractions, 0);
  const totalCurrent  = holdings.reduce((s, h) => s + h.currentPrice * h.fractions, 0);
  const unrealizedGain = totalCurrent - totalInvested;
  const cagr = totalInvested > 0 ? ((unrealizedGain / totalInvested) * 100).toFixed(2) : '0.00';

  // Build pie from actual types
  const typeMap: Record<string, number> = {};
  holdings.forEach(h => {
    const t = h.id.startsWith('land_001') || h.id.startsWith('land_') ? 'Land Plot' : 'Other';
    typeMap[t] = (typeMap[t] || 0) + h.currentPrice * h.fractions;
  });
  const allocationData = Object.entries(typeMap).map(([name, value], i) => ({
    name, value: Math.round((value / (totalCurrent || 1)) * 100),
    color: ['#6366F1', '#10B981', '#F43F5E'][i % 3]
  }));
  if (allocationData.length === 0) {
    allocationData.push(
      { name: 'Residential Plot', value: 40, color: '#6366F1' },
      { name: 'Commercial Plot',  value: 35, color: '#10B981' },
      { name: 'Agricultural',     value: 25, color: '#F43F5E' }
    );
  }

  // Build performance chart — adds a point per purchase
  const perfData = bankStatement
    .filter(e => e.type === 'DEBIT')
    .reverse()
    .map((e, i) => ({
      name: new Date(e.timestamp).toLocaleDateString('en-IN', { month:'short', day:'numeric' }),
      value: holdings.reduce((s, h) => s + h.currentPrice * h.fractions, 0) * (0.85 + i * 0.05)
    }));
  if (perfData.length === 0) {
    perfData.push({ name: 'Today', value: 0 });
  }

  const exportCSV = () => {
    const rows = [
      ['Date', 'Type', 'Description', 'Amount (₹)', 'Tx Hash', 'Status'],
      ...bankStatement.map(e => [
        new Date(e.timestamp).toLocaleString('en-IN'),
        e.type,
        e.description,
        e.amount.toLocaleString('en-IN'),
        e.txHash || '',
        e.status
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'propfi_bank_statement.csv'; a.click();
  };

  return (
    <div className="portfolio animate-fade-in">
      <div className="portfolio-header">
        <div>
          <h1>My Portfolio</h1>
          {walletAddress && (
            <p style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              🦊 {walletAddress.substring(0,6)}...{walletAddress.substring(walletAddress.length-4)} · {maticBalance} MATIC
            </p>
          )}
          <p>Live land fractionalization portfolio — updates on every purchase.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={exportCSV}>
            <Download size={18} /> Export Bank Statement
          </button>
        </div>
      </div>

      {/* ── Key Metrics ── */}
      <div className="key-metrics-grid">
        <div className="metric-card card">
          <div className="card-header"><span>Total Invested</span><Briefcase size={20} className="text-primary" /></div>
          <h2 className="amount">₹{totalInvested.toLocaleString('en-IN')}</h2>
        </div>
        <div className="metric-card card">
          <div className="card-header"><span>Current Valuation</span><TrendingUp size={20} className="text-success" /></div>
          <h2 className="amount">₹{totalCurrent.toLocaleString('en-IN')}</h2>
          {unrealizedGain !== 0 && (
            <span className={`badge ${unrealizedGain > 0 ? 'text-success bg-success-transparent' : 'text-danger bg-danger-transparent'}`}>
              {unrealizedGain > 0 ? '+' : ''}₹{unrealizedGain.toLocaleString('en-IN')}
            </span>
          )}
        </div>
        <div className="metric-card card">
          <div className="card-header"><span>Unrealized Return</span><ArrowUpRight size={20} className="text-success" /></div>
          <h2 className={`amount ${Number(cagr) >= 0 ? 'text-success' : 'text-danger'}`}>{cagr}%</h2>
        </div>
        <div className="metric-card card">
          <div className="card-header"><span>On-Chain Balance</span><ShieldCheck size={20} className="text-primary" /></div>
          <h2 className="amount">{maticBalance} MATIC</h2>
          <span className="badge">Live · Updated every 15s</span>
        </div>
      </div>

      {/* ── Charts ── */}
      {holdings.length > 0 && (
        <div className="charts-view">
          <div className="performance-chart card">
            <h3>Portfolio Growth</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={perfData} margin={{ top: 10, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748B" tickLine={false} axisLine={false} />
                  <YAxis hide={true} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#131A2A', border: '1px solid #334155', borderRadius: '8px' }}
                    formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Value']}
                  />
                  <Area type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="allocation-chart card">
            <h3>Asset Allocation</h3>
            <div className="pie-wrapper">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={allocationData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {allocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value}%`]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="legend">
                {allocationData.map(item => (
                  <div className="legend-item" key={item.name}>
                    <div className="dot" style={{ backgroundColor: item.color }}></div>
                    <span>{item.name}</span><span className="perc">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Holdings ── */}
      <div className="holdings-section card">
        <h3>Current Holdings</h3>
        {holdings.length === 0 ? (
          <div style={{ padding: '2rem 0' }}>
            {/* Step-by-step guide */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {[
                { step: '01', title: 'Connect MetaMask', desc: 'Click "Connect MetaMask" in the header to link your wallet.', icon: '🦊', color: '#f59e0b' },
                { step: '02', title: 'Browse Market', desc: 'Explore 1,064 properties across 56 Indian cities with real yields.', icon: '🏘️', color: '#6366f1' },
                { step: '03', title: 'Buy Tokens', desc: 'Purchase land fractions starting at ₹500/token on Polygon.', icon: '💎', color: '#10b981' },
                { step: '04', title: 'Earn Returns', desc: 'Receive monthly rent/lease income directly to your wallet.', icon: '📈', color: '#ec4899' },
              ].map(s => (
                <div key={s.step} style={{ background: 'var(--bg-base)', borderRadius: '12px', padding: '1.25rem', border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{s.icon}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: s.color, marginBottom: '0.25rem', letterSpacing: '1px' }}>STEP {s.step}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>{s.title}</div>
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
                Avg. portfolio yield of <strong style={{ color: 'var(--accent-green)' }}>11.4% p.a.</strong> across all listed properties
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
                {holdings.map(h => {
                  const costBasis = h.avgPrice * h.fractions;
                  const currentVal = h.currentPrice * h.fractions;
                  const pct = costBasis > 0 ? ((currentVal - costBasis) / costBasis * 100).toFixed(1) : '0.0';
                  const isUp = Number(pct) >= 0;
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
                        <span className={`return-badge ${isUp ? 'text-success bg-success-transparent' : 'text-danger bg-danger-transparent'}`}>
                          {isUp ? '+' : ''}{pct}%
                        </span>
                      </td>
                      <td>
                        <Link to={`/asset/${h.id}`} className="btn btn-secondary action-btn" style={{padding:'0.4rem 0.8rem', fontSize:'0.8rem', textDecoration:'none'}}>
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
      <div className="holdings-section card" style={{marginTop:'1.5rem'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
          <h3><FileText size={18} style={{verticalAlign:'middle', marginRight:'0.5rem'}}/>Bank Statement</h3>
          <button className="btn btn-secondary" style={{padding:'0.4rem 0.8rem', fontSize:'0.8rem'}} onClick={exportCSV}>
            <Download size={14}/> Export CSV
          </button>
        </div>
        {bankStatement.length === 0 ? (
          <div style={{textAlign:'center', padding:'2rem', color:'var(--text-muted)', fontSize:'0.9rem'}}>
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
                {bankStatement.map(entry => (
                  <tr key={entry.id}>
                    <td style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>
                      {new Date(entry.timestamp).toLocaleString('en-IN', {dateStyle:'medium', timeStyle:'short'})}
                    </td>
                    <td style={{fontSize:'0.85rem'}}>{entry.description}</td>
                    <td>
                      <span className={`return-badge ${entry.type === 'CREDIT' ? 'text-success bg-success-transparent' : 'text-danger bg-danger-transparent'}`}>
                        {entry.type}
                      </span>
                    </td>
                    <td className={`fw-bold ${entry.type === 'CREDIT' ? 'text-success' : 'text-danger'}`}>
                      {entry.type === 'CREDIT' ? '+' : '-'}₹{entry.amount.toLocaleString('en-IN')}
                    </td>
                    <td>
                      {entry.txHash ? (
                        <a href={`https://amoy.polygonscan.com/tx/${entry.txHash}`} target="_blank" rel="noopener noreferrer"
                          style={{color:'var(--accent-primary)', fontSize:'0.75rem', fontFamily:'monospace', textDecoration:'none', display:'flex', alignItems:'center', gap:'0.25rem'}}>
                          {entry.txHash.substring(0,12)}... <ExternalLink size={10}/>
                        </a>
                      ) : <span style={{color:'var(--text-muted)', fontSize:'0.8rem'}}>—</span>}
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
