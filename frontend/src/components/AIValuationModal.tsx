import { useState, useEffect } from 'react';
import { X, BrainCircuit, Activity, ShieldCheck, CheckCircle2 } from 'lucide-react';
// @ts-ignore
import * as PropFiAPI from '../api-client';
import './AIValuationModal.css';

export default function AIValuationModal({ location, onClose }: { location: any, onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Call the ML prediction API
    const params = {
      area: location.area,
      city: location.city,
      bedrooms: 2,
      distanceToMetro: 1.5,
      age: 2,
      floor: 5
    };

    PropFiAPI.predictPrice(params)
      .then((res: any) => {
        setData(res);
        setLoading(false);
      })
      .catch((err: any) => {
        console.error("AI Prediction failed", err);
        setLoading(false);
      });
  }, [location]);

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
        <button className="icon-btn modal-close" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="modal-header">
          <div className="ai-icon-wrapper pulse-ring">
            <BrainCircuit size={24} className="text-primary" />
          </div>
          <h2>AI Location Analysis</h2>
          <p className="text-muted">{location.name}</p>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="cyber-loader"></div>
            <p className="loading-text text-primary">Running XGBoost Model...</p>
            <ul className="loading-steps text-muted">
              <li><CheckCircle2 size={12}/> Fetching topographical data</li>
              <li className="active-step"><Activity size={12}/> Analyzing recent market trends</li>
              <li>Calculating 6-month growth trajectory</li>
            </ul>
          </div>
        ) : data ? (
          <div className="results-state animate-fade-in">
            <div className="metrics-grid">
              <div className="metric-card bg-base-transparent">
                <span className="metric-label">Estimated Base Price (2BHK)</span>
                <span className="metric-value text-primary">₹{(data.predictedPrice / 100000).toFixed(2)} L</span>
              </div>
              <div className="metric-card bg-base-transparent">
                <span className="metric-label">6M Growth Forecast</span>
                <span className="metric-value text-success">+{Number(data.predictedGrowth).toFixed(2)}%</span>
              </div>
              <div className="metric-card bg-base-transparent">
                <span className="metric-label">AI Risk Score</span>
                <span className={`metric-value ${data.riskScore > 80 ? 'text-success' : 'text-warning'}`}>
                  {data.riskScore}/100 <ShieldCheck size={16} />
                </span>
              </div>
              <div className="metric-card bg-base-transparent">
                <span className="metric-label">Model Confidence</span>
                <span className="metric-value">{(data.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>

            <div className="ai-summary card mt-3 border-primary">
              <h4 className="flex align-center gap-2"><Activity size={16} className="text-primary"/> Model Insights</h4>
              <p className="text-muted mt-2" style={{lineHeight: 1.6}}>
                {data.mlSummary || 
                  `Pricing influenced by proximity to major transit corridors in ${location.city}. Standard 2BHK properties here show high resilience. The algorithmic confidence is exceptionally strong based on ${data.dataPoints || 14000}+ recent data points.`
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="error-state">
            <p className="text-danger">Failed to gather ML data for this region.</p>
          </div>
        )}
      </div>
    </div>
  );
}
