import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Briefcase, ArrowUpRight, ShieldCheck, Download, EyeOff, Coins } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Portfolio.css';

const performanceData = [
  { name: 'Jan', value: 480000 },
  { name: 'Feb', value: 512000 },
  { name: 'Mar', value: 540000 },
  { name: 'Apr', value: 535000 },
  { name: 'May', value: 580000 },
  { name: 'Jun', value: 642800 }
];

const allocationData = [
  { name: 'Commercial', value: 55, color: '#6366F1' },
  { name: 'Retail', value: 25, color: '#10B981' },
  { name: 'Mixed Use', value: 20, color: '#F43F5E' }
];

export default function Portfolio() {
  const myHoldings = [
    { id: '1', symbol: 'BKC-01', name: 'Bandra Kurla Complex Plot', fractions: 120, avgPrice: '₹38,000', ltp: '₹42,500', value: '₹51,00,000', return: '+11.8%', isUp: true },
    { id: '2', symbol: 'WTP-88', name: 'Whitefield Tech Park', fractions: 45, avgPrice: '₹19,000', ltp: '₹18,200', value: '₹8,19,000', return: '-4.2%', isUp: false },
    { id: '4', symbol: 'KRM-05', name: 'Koramangala Retail Hub', fractions: 20, avgPrice: '₹24,500', ltp: '₹25,600', value: '₹5,12,000', return: '+4.5%', isUp: true },
  ];

  return (
    <div className="portfolio animate-fade-in">
      <div className="portfolio-header">
        <div>
          <h1>My Portfolio</h1>
          <p>Track your fractional real estate returns and asset allocation.</p>
        </div>
        <div style={{display: 'flex', gap: '1rem'}}>
          <button className="btn btn-primary animate-pulse-live" style={{backgroundColor: '#8B5CF6', boxShadow: 'none'}}>
            <EyeOff size={18} /> ZK Proof Generator
          </button>
          <button className="btn btn-secondary">
            <Download size={18} />
            Export Report
          </button>
        </div>
      </div>

      <div className="key-metrics-grid">
        <div className="metric-card card">
          <div className="card-header">
            <span>Total Invested Value</span>
            <Briefcase size={20} className="text-primary" />
          </div>
          <h2 className="amount">₹ 58,05,000</h2>
        </div>
        <div className="metric-card card">
          <div className="card-header">
            <span>Current Valuation</span>
            <br />
          </div>
          <h2 className="amount">₹ 64,31,000</h2>
          <span className="badge text-success bg-success-transparent">+₹ 6,26,000</span>
        </div>
        <div className="metric-card card">
          <div className="card-header">
            <span>Unrealized CAGR</span>
            <ArrowUpRight size={20} className="text-success" />
          </div>
          <h2 className="amount text-success">14.2%</h2>
        </div>
        <div className="metric-card card">
          <div className="card-header">
            <span>Safety Score</span>
            <ShieldCheck size={20} className="text-primary" />
          </div>
          <h2 className="amount">92/100</h2>
          <span className="badge">Diversified</span>
        </div>
      </div>

      <div className="charts-view">
        <div className="performance-chart card">
          <h3>Growth History (6M)</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={performanceData} margin={{ top: 10, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" tickLine={false} axisLine={false} />
                <YAxis hide={true} domain={['dataMin - 10000', 'dataMax + 20000']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#131A2A', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#F8FAFC' }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Value']}
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
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1A2235', border: '1px solid #334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#F8FAFC' }}
                    formatter={(value: any) => [`${value}%`]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="legend">
              {allocationData.map((item) => (
                <div className="legend-item" key={item.name}>
                  <div className="dot" style={{ backgroundColor: item.color }}></div>
                  <span>{item.name}</span>
                  <span className="perc">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="holdings-section card">
        <h3>Current Holdings</h3>
        <div className="table-responsive">
          <table className="holdings-table">
            <thead>
              <tr>
                <th>Asset / Symbol</th>
                <th>Fractions Owned</th>
                <th>Avg. Price</th>
                <th>LTP</th>
                <th>Current Value</th>
                <th>Return</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {myHoldings.map((asset) => (
                <tr key={asset.id}>
                  <td>
                    <div className="asset-cell">
                      <span className="symbol">{asset.symbol}</span>
                      <span className="name">{asset.name}</span>
                    </div>
                  </td>
                  <td>{asset.fractions} sqft</td>
                  <td>{asset.avgPrice}</td>
                  <td>{asset.ltp}</td>
                  <td className="fw-bold">{asset.value}</td>
                  <td>
                    <span className={`return-badge ${asset.isUp ? 'text-success bg-success-transparent' : 'text-danger bg-danger-transparent'}`}>
                      {asset.return}
                    </span>
                  </td>
                  <td style={{display: 'flex', gap: '0.5rem'}}>
                    <button className="btn btn-success bg-success-transparent text-success" style={{border: '1px solid #10B981', padding: '0.4rem 0.6rem', fontSize: '0.8rem'}}>
                      <Coins size={14}/> Claim Auto-Rent
                    </button>
                    <Link to={`/asset/${asset.id}`} className="btn btn-secondary action-btn" style={{padding: '0.4rem 0.6rem', fontSize: '0.8rem'}}>Trade</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
