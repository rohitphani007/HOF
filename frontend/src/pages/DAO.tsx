import { Vote, Bot, ThumbsUp, ThumbsDown, Scale } from 'lucide-react';
import './DAO.css';

export default function DAO() {
  return (
    <div className="dao animate-fade-in">
      <div className="dao-header">
        <div>
          <h1>Decentralized Dispute Resolution</h1>
          <p>AI + Community voting for property arbitration. Self-governing ecosystem.</p>
        </div>
        <div className="dao-stats">
          <div className="rep-badge">
            <Scale size={16} /> My Voting Weight: 1,450 vPROP
          </div>
        </div>
      </div>

      <div className="dispute-grid">
        <div className="dispute-card card">
          <div className="dispute-header">
            <span className="case-id">Case #PROP-429</span>
            <span className="status text-danger bg-danger-transparent animate-pulse-live">Active Voting</span>
          </div>
          
          <h2>Tenant Eviction Dispute - BKC Plot Commercial</h2>
          <p className="description text-muted">
            Landlord claims tenant has defaulted on rent payment for 2 months (April, May). Tenant claims the smart contract auto-deduction failed due to liquidity constraints injected by the landlord's updated yield farming protocol...
          </p>

          <div className="ai-analysis glass-panel">
            <div className="ai-title">
              <Bot size={18} className="text-primary"/> AI Evidence Analyzer (BERT)
            </div>
            <p>
              <strong>Analysis:</strong> On-chain logs confirm the tenant's wallet had sufficient USDC, but the landlord's upgraded contract triggered a generic REVERT error. Previous precedents (Case #PROP-112) suggest the fault lies with the landlord's un-audited upgrade.
            </p>
            <div className="ai-recommendation text-success">
              Suggested Resolution: Rule in favor of Tenant. Waive late fees.
            </div>
          </div>

          <div className="voting-section">
            <div className="progress-container">
              <div className="progress-labels">
                <span>Landlord (12%)</span>
                <span>Tenant (88%)</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill landlord" style={{ width: '12%' }}></div>
                <div className="progress-fill tenant" style={{ width: '88%' }}></div>
              </div>
            </div>

            <div className="vote-actions">
              <button className="btn btn-secondary vote-btn">
                <ThumbsDown size={18} /> Support Landlord
              </button>
              <button className="btn btn-primary vote-btn">
                <ThumbsUp size={18} /> Support Tenant (AI Choice)
              </button>
            </div>
          </div>
        </div>

        <div className="side-proposals">
          <h3 className="section-title">Other Active Proposals</h3>
          
          <div className="mini-proposal card">
            <span className="tag text-primary bg-primary-transparent">Upgrade</span>
            <h4>Update pricing oracle to v2.5</h4>
            <p>Implement XGBoost v2 for property valuation...</p>
            <div className="mini-vote">
              <Vote size={14} /> 1.2M Votes Cast
            </div>
          </div>

          <div className="mini-proposal card">
            <span className="tag text-success bg-success-transparent">Renovation</span>
            <h4>Approve ₹5L Repair budget for Whitefield IT Park</h4>
            <p>Token holders must vote on spending Treasury funds...</p>
            <div className="mini-vote">
              <Vote size={14} /> 450K Votes Cast
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
