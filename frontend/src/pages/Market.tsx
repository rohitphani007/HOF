import { Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Market.css';

export default function Market() {
  const assets = [
    { id: '1', name: 'Bandra Kurla Complex Plot', location: 'Mumbai', symbol: 'BKC-01', price: '₹42,500/sqft', cap: '₹120 Cr', change: '+5.2%', isUp: true, type: 'Commercial', image: '/bkc.png' },
    { id: '2', name: 'Whitefield Tech Park', location: 'Bengaluru', symbol: 'WTP-88', price: '₹18,200/sqft', cap: '₹85 Cr', change: '+3.8%', isUp: true, type: 'Commercial', image: '/hsr.png' },
    { id: '3', name: 'Gurugram Cyber City', location: 'Delhi NCR', symbol: 'GCC-12', price: '₹22,100/sqft', cap: '₹150 Cr', change: '-1.4%', isUp: false, type: 'Mixed Use', image: '/cyberhub.png' },
    { id: '4', name: 'Koramangala Retail Hub', location: 'Bengaluru', symbol: 'KRM-05', price: '₹25,600/sqft', cap: '₹40 Cr', change: '+1.2%', isUp: true, type: 'Retail', image: '/hsr.png' },
    { id: '5', name: 'Hinjewadi IT Phase 3', location: 'Pune', symbol: 'HIN-33', price: '₹9,800/sqft', cap: '₹60 Cr', change: '+8.4%', isUp: true, type: 'Commercial', image: '/bkc.png' },
    { id: '6', name: 'Gachibowli Financial District', location: 'Hyderabad', symbol: 'GBD-09', price: '₹14,500/sqft', cap: '₹95 Cr', change: '-0.8%', isUp: false, type: 'Commercial', image: '/cyberhub.png' },
  ];

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
              <img src={asset.image} alt={asset.name} className="asset-image" loading="lazy" decoding="async" />
            </div>
            
            <div className="asset-content">
              <div className="asset-tags">
                <span className="tag">{asset.type}</span>
                <span className="symbol-tag">{asset.symbol}</span>
              </div>
              
              <h3 className="asset-name">{asset.name}</h3>
              
              <div className="asset-metrics">
                <div className="metric">
                  <span className="label">Current Price</span>
                  <span className="value">{asset.price}</span>
                </div>
                <div className="metric">
                  <span className="label">Market Cap</span>
                  <span className="value">{asset.cap}</span>
                </div>
              </div>
              
              <div className="asset-footer">
                <span className={`change ${asset.isUp ? 'text-success' : 'text-danger'} bg-${asset.isUp ? 'success' : 'danger'}-transparent`}>
                  {asset.change} (24h)
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
