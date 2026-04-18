import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Share2, Info, Building, BrainCircuit, Droplets, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
// @ts-ignore
import { PROPFI_MASTER_ADDRESS, PROPFI_MASTER_ABI, USDC_ADDRESS, USDC_ABI } from '../contracts/constants';
import './AssetDetail.css';

declare global {
  interface Window {
    ethereum: any;
  }
}

export default function AssetDetail() {
  const { id } = useParams();
  const [asset, setAsset] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payAmount, setPayAmount] = useState(100);

  useEffect(() => {
    // 1. Fetch featured properties to find this one
    fetch('http://localhost:8001/api/v1/properties/featured')
      .then(res => res.json())
      .then(data => {
        const properties = data.properties || [];
        const found = properties.find((p: any) => p.id === Number(id));
        if (found) {
          setAsset(found);
          // 2. Run AI Analysis
          return fetch('http://localhost:8001/api/v1/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              property_id: found.id,
              ...found.features,
              investment_horizon_yrs: 5
            })
          });
        } else {
          throw new Error('Property not found in AI backend');
        }
      })
      .then(res => {
        if (!res.ok) return res.json().then(err => { throw new Error(err.detail || 'API Error') });
        return res.json();
      })
      .then(aiData => {
        if (aiData && !aiData.detail) setAnalysis(aiData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load asset details:', err);
        setLoading(false);
      });
  }, [id]);

  const handleSwap = async () => {
    if (!window.ethereum) return alert('Please install MetaMask!');
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const propfi = new ethers.Contract(PROPFI_MASTER_ADDRESS, PROPFI_MASTER_ABI, signer);
      
      const pricePerToken = ethers.parseUnits("100", 6); // Mocked for now, should read from contract
      const totalCost = pricePerToken * BigInt(receiveAmount);
      
      console.log('Approving USDC...');
      const approveTx = await usdc.approve(PROPFI_MASTER_ADDRESS, totalCost);
      await approveTx.wait();
      
      console.log('Buying tokens...');
      const buyTx = await propfi.buyFractionalToken(Number(id), receiveAmount);
      await buyTx.wait();
      
      alert('Successfully purchased fractions!');
    } catch (err) {
      console.error(err);
      alert('Transaction failed. See console.');
    }
  };

  if (loading) {
    return (
      <div className="asset-detail animate-fade-in" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh'}}>
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!asset) {
    return <div className="asset-detail animate-fade-in"><h2>Asset not found</h2></div>;
  }

  // Derive graph data from AI forecast
  const graphData = (analysis && analysis.forecast) ? [
    { name: 'Current', price: analysis.total_estimated_price },
    { name: '3 Months', price: analysis.total_estimated_price * (1 + analysis.forecast['3_months_pct']/100) },
    { name: '6 Months', price: analysis.total_estimated_price * (1 + analysis.forecast['6_months_pct']/100) },
    { name: '12 Months', price: analysis.total_estimated_price * (1 + analysis.forecast['12_months_pct']/100) }
  ] : [];

  const receiveAmount = Math.floor(payAmount / 100);

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
            <span className="symbol-badge">PROP-{asset.id}</span>
            <h1>{asset.title}</h1>
            <p className="location-text">
              <Building size={16} /> {asset.address}
            </p>
          </div>

          <div className="price-area">
            <h2 className="current-price">{analysis?.formatted_price || asset.price_range}</h2>
            <span className={`change-badge text-success bg-success-transparent`}>
              {analysis ? `+${analysis.annual_appreciation_pct}% Expected 1Y` : 'AI Verified'}
            </span>
          </div>

          <div className="chart-container card">
            <h3 className="chart-title">AI Price Forecast</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={graphData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748B" tickLine={false} axisLine={false} />
                  <YAxis domain={['auto', 'auto']} stroke="#64748B" tickFormatter={(v) => `₹${(v/100000).toFixed(1)}L`} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#131A2A', border: '1px solid #334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#F8FAFC' }}
                    formatter={(val: any) => `₹${val.toLocaleString()}`}
                  />
                  <Line type="monotone" dataKey="price" stroke="#6366F1" strokeWidth={3} dot={{ fill: '#6366F1', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="about-asset card">
            <h3>About This Asset</h3>
            <p>{asset.description}</p>
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
                  <input type="number" value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value) || 0)} min={100} />
                </div>
              </div>

              <div className="input-group">
                <label>Receive (Fractions - sqft)</label>
                <div className="input-wrapper">
                  <input type="number" value={receiveAmount} readOnly style={{backgroundColor: 'var(--bg-base)', opacity: 0.8}} />
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

              <button className="btn btn-success action-btn" style={{marginTop: '1rem'}} onClick={handleSwap}>
                Confirm Swap
              </button>
            </div>
          </div>

          {analysis && (
            <div className="ai-prediction-card glass-panel" style={{padding: '1.5rem', marginBottom: '1.5rem', borderLeft: `4px solid ${analysis.recommendation_color || '#10B981'}`}}>
              <div className="ai-title text-primary" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '1rem'}}>
                <BrainCircuit size={18} /> AI Valuation Engine
              </div>
              <div className="prediction-content">
                <h3 className="text-success">{analysis.recommendation}</h3>
                <p className="text-muted" style={{fontSize: '0.85rem', marginBottom: '0.5rem'}}>Risk Score: {analysis.risk_label} {analysis.risk_icon}</p>
                <p style={{fontSize: '0.9rem', lineHeight: 1.5}}>
                  {analysis.summary}
                </p>
              </div>
            </div>
          )}

          <div className="stats-card card">
            <h3>Asset Statistics <Info size={16} className="text-muted" /></h3>
            <div className="stat-row">
              <span>Total Area</span>
              <span>{asset.features?.land_area_sqft || 'N/A'} sqft</span>
            </div>
            <div className="stat-row">
              <span>Developer</span>
              <span>{asset.builder || 'N/A'}</span>
            </div>
            <div className="stat-row">
              <span>Proj. Yield</span>
              <span className="text-success">{analysis?.rental_yield_pct ? `${analysis.rental_yield_pct}%` : asset.rental_yield_pct}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
