import { Link } from 'react-router-dom';
import { ArrowLeft, Share2, Info, Building, BrainCircuit, Droplets } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './AssetDetail.css';

const data = [
  { name: 'Jan', price: 38000 },
  { name: 'Feb', price: 38500 },
  { name: 'Mar', price: 39200 },
  { name: 'Apr', price: 39000 },
  { name: 'May', price: 41000 },
  { name: 'Jun', price: 42500 }
];

export default function AssetDetail() {
  // const { id } = useParams();

  // In a real app, you would fetch data using the 'id'
  const asset = {
    name: 'Bandra Kurla Complex Plot',
    location: 'Mumbai, Maharashtra',
    symbol: 'BKC-01',
    price: 42500,
    change: '+5.2%',
    isUp: true,
    totalArea: '15,000 sqft',
    availableFractions: '4,200',
    developer: 'Prestige Group',
    yield: '7.8% p.a.'
  };

  return (
    <div className="asset-detail animate-fade-in">
      <div className="detail-header">
        <Link to="/market" className="back-link">
          <ArrowLeft size={16} /> Back to Market
        </Link>
        <button className="icon-btn">
          <Share2 size={18} />
        </button>
      </div>

      <div className="detail-grid">
        <div className="main-col">
          <div className="asset-title-area">
            <span className="symbol-badge">{asset.symbol}</span>
            <h1>{asset.name}</h1>
            <p className="location-text">
              <Building size={16} /> {asset.location}
            </p>
          </div>

          <div className="price-area">
            <h2 className="current-price">₹{asset.price.toLocaleString()}/sqft</h2>
            <span className={`change-badge ${asset.isUp ? 'text-success bg-success-transparent' : 'text-danger bg-danger-transparent'}`}>
              {asset.change} (Past 6 months)
            </span>
          </div>

          <div className="chart-container card">
            <h3 className="chart-title">Price History</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748B" tickLine={false} axisLine={false} />
                  <YAxis domain={['dataMin - 1000', 'dataMax + 1000']} stroke="#64748B" tickFormatter={(v) => `₹${v/1000}k`} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#131A2A', border: '1px solid #334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#F8FAFC' }}
                  />
                  <Line type="monotone" dataKey="price" stroke="#6366F1" strokeWidth={3} dot={{ fill: '#6366F1', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="about-asset card">
            <h3>About This Asset</h3>
            <p>
              This prime commercial plot located in the heart of BKC offers unparalleled connectivity and infrastructure. Zoned for mixed-use commercial development, it presents a lucrative opportunity for steady rental yields and significant capital appreciation.
            </p>
          </div>
        </div>

        <div className="side-col">
          <div className="trading-card card position-relative" style={{marginBottom: '1.5rem'}}>
            <div className="badge-corner highlight-badge bg-primary" style={{top: '-12px', right: '20px', position: 'absolute', background: 'linear-gradient(90deg, #6366F1, #8B5CF6)', padding: '0.25rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700}}>
              <Droplets size={12} style={{marginRight: '4px', display: 'inline-block', verticalAlign: 'text-bottom'}}/> AMM Liquidity
            </div>
            <div className="tabs">
              <button className="tab active">Swap USDC &rarr; PROP</button>
              <button className="tab">Swap PROP &rarr; USDC</button>
            </div>

            <div className="order-form" style={{marginTop: '1.5rem'}}>
              <div className="input-group">
                <label>Pay (USDC)</label>
                <div className="input-wrapper">
                  <input type="number" defaultValue={425000} min={100} />
                </div>
              </div>

              <div className="input-group">
                <label>Receive (Fractions - sqft)</label>
                <div className="input-wrapper">
                  <input type="number" defaultValue={10} readOnly style={{backgroundColor: 'var(--bg-base)', opacity: 0.8}} />
                </div>
              </div>

              <div className="summary">
                <div className="summary-row">
                  <span>Price Impact</span>
                  <span className="text-success">&lt; 0.01%</span>
                </div>
                <div className="summary-row">
                  <span>Liquidity Provider Fee</span>
                  <span>0.30%</span>
                </div>
              </div>

              <button className="btn btn-success action-btn" style={{marginTop: '1rem'}}>
                Confirm Swap
              </button>
            </div>
          </div>

          <div className="ai-prediction-card glass-panel" style={{padding: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #10B981'}}>
            <div className="ai-title text-primary" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '1rem'}}>
              <BrainCircuit size={18} /> AI Valuation Engine
            </div>
            <div className="prediction-content">
              <h3 className="text-success">+8.5% Expected Growth</h3>
              <p className="text-muted" style={{fontSize: '0.85rem', marginBottom: '0.5rem'}}>Confidence Score: 94%</p>
              <p style={{fontSize: '0.9rem', lineHeight: 1.5}}>
                XGBoost analysis implies strong upward price action driven by the recently approved metro line 3 extension (dist: 400m).
              </p>
            </div>
          </div>

          <div className="stats-card card">
            <h3>Asset Statistics <Info size={16} className="text-muted" /></h3>
            <div className="stat-row">
              <span>Total Area</span>
              <span>{asset.totalArea}</span>
            </div>
            <div className="stat-row">
              <span>Available Fractions</span>
              <span>{asset.availableFractions}</span>
            </div>
            <div className="stat-row">
              <span>Developer</span>
              <span>{asset.developer}</span>
            </div>
            <div className="stat-row">
              <span>Proj. Yield</span>
              <span className="text-success">{asset.yield}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
