import { Filter, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './Market.css';

export default function Market() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8001/api/v1/properties/featured')
      .then(res => res.json())
      .then(data => {
        setAssets(data.properties || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch from AI backend:', err);
        // Fallback to empty if server not running
        setAssets([]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="market animate-fade-in" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh'}}>
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="market animate-fade-in">
      <div className="market-header">
        <div>
          <h1>Marketplace</h1>
          <p>Explore fractional real estate opportunities across India.</p>
        </div>
        
        <div className="filters">
          <button className="btn btn-secondary">
            <Filter size={18} />
            Filters
          </button>
        </div>
      </div>

      <div className="asset-grid">
        {assets.map((asset, index) => (
          <Link to={`/asset/${asset.id}`} key={asset.id} className={`asset-card card stagger-${(index % 5) + 1}`}>
            <div className="asset-image-container">
              <img src={asset.images[0]?.url || '/bkc.png'} alt={asset.title} className="asset-image" loading="lazy" decoding="async" />
            </div>
            
            <div className="asset-content">
              <div className="asset-tags">
                <span className="tag">{asset.type}</span>
                <span className="symbol-tag">PROP-{asset.id}</span>
              </div>
              
              <h3 className="asset-name">{asset.title}</h3>
              
              <div className="asset-metrics">
                <div className="metric">
                  <span className="label">Current Price</span>
                  <span className="value">{asset.price_range}</span>
                </div>
                <div className="metric">
                  <span className="label">Expected Yield</span>
                  <span className="value text-success">{asset.rental_yield_pct}</span>
                </div>
              </div>
              
              <div className="asset-footer">
                <span className={`change text-success bg-success-transparent`}>
                  AI Verified ✓
                </span>
                <span className="action-text">Trade Now &rarr;</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
