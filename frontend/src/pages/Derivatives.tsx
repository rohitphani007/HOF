import { TrendingUp, TrendingDown, Clock, MoveUpRight, Info } from 'lucide-react';
import './Derivatives.css';

export default function Derivatives() {
  const futures = [
    { symbol: 'MUM-IDX-DEC', name: 'Mumbai Real Estate Index', type: 'Future', expiry: '31 Dec 2026', price: '₹48,200', change: '+2.4%', isUp: true, volume: '₹14Cr' },
    { symbol: 'BLR-TECH-SEP', name: 'Bengaluru Tech Corridors', type: 'Future', expiry: '30 Sep 2026', price: '₹19,450', change: '-1.1%', isUp: false, volume: '₹8.5Cr' },
    { symbol: 'NCR-CM-DEC', name: 'NCR Commercial Basket', type: 'Future', expiry: '31 Dec 2026', price: '₹24,100', change: '+0.8%', isUp: true, volume: '₹11Cr' }
  ];

  return (
    <div className="derivatives animate-fade-in">
      <div className="derivatives-header">
        <div>
          <h1>Property Derivatives</h1>
          <p>Trade market movements without owning physical assets. Decentralized futures & swaps.</p>
        </div>
        <div className="header-stats">
          <div className="stat">
            <span className="label">24h Trading Vol</span>
            <span className="value text-primary">₹142.5 Cr</span>
          </div>
          <div className="stat">
            <span className="label">Open Interest</span>
            <span className="value">₹840 Cr</span>
          </div>
        </div>
      </div>

      <div className="trade-interface-grid">
        <div className="market-list card">
          <div className="list-header">
            <h3>Futures Markets <Info size={16} className="text-muted" /></h3>
          </div>
          
          <div className="contract-list">
            {futures.map(f => (
              <div className="contract-item" key={f.symbol}>
                <div className="contract-info">
                  <span className="symbol">{f.symbol}</span>
                  <span className="name">{f.name}</span>
                </div>
                <div className="contract-stats">
                  <span className="expiry"><Clock size={12}/> {f.expiry}</span>
                  <span className="volume">Vol: {f.volume}</span>
                </div>
                <div className="contract-price">
                  <span className="price">{f.price}</span>
                  <span className={`change ${f.isUp ? 'text-success' : 'text-danger'}`}>
                    {f.isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {f.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="active-trade card">
          {/* Badge inside card — no clipping */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0 }}>Long MUM-IDX-DEC</h3>
            <span className="highlight-badge">AMM Liquidity</span>
          </div>
          
          <div className="leverage-selector">
            <label>Leverage up to 10x</label>
            <div className="slider-wrapper">
              <input type="range" min="1" max="10" defaultValue="5" className="custom-slider" />
              <div className="leverage-labels">
                <span>1x</span>
                <span className="text-primary fw-bold">5x</span>
                <span>10x</span>
              </div>
            </div>
          </div>

          <div className="order-box mt-4">
            <div className="input-group">
              <label>Amount (USDC)</label>
              <input type="text" placeholder="1000" />
            </div>
          </div>

          <div className="trade-summary">
            <div className="summary-row">
              <span>Entry Price</span>
              <span>₹48,200</span>
            </div>
            <div className="summary-row">
              <span>Position Size (5x)</span>
              <span>5,000 USDC</span>
            </div>
            <div className="summary-row">
              <span>Liquidation Price</span>
              <span className="text-danger">₹39,524</span>
            </div>
          </div>

          <button className="btn btn-success action-btn mt-3 w-100">
            <MoveUpRight size={18} /> Open Long Position
          </button>
          
          <p className="risk-warning text-muted mt-3">
            <Info size={14}/> Derivatives trading involves high risk. Your smart contract executes purely on Pyth oracle data.
          </p>
        </div>
      </div>
    </div>
  );
}
