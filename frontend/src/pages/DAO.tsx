import { useState } from 'react';
import { Vote, Bot, ThumbsUp, ThumbsDown, Scale, CheckCircle2 } from 'lucide-react';
import './DAO.css';

export default function DAO() {
  const [landlordPct, setLandlordPct] = useState(12);
  const [tenantPct, setTenantPct] = useState(88);
  const [hasVoted, setHasVoted] = useState<'landlord' | 'tenant' | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [voteReceipt, setVoteReceipt] = useState('');

  const handleVote = (side: 'landlord' | 'tenant') => {
    if (hasVoted || isVoting) return;
    setIsVoting(true);

    setTimeout(() => {
      const weight = 1450; // vPROP voting weight
      const totalVotes = 156800; // simulated total votes
      const shift = Math.round((weight / totalVotes) * 100 * 10) / 10;

      if (side === 'tenant') {
        const newTenant = Math.min(99, tenantPct + shift);
        setTenantPct(Math.round(newTenant * 10) / 10);
        setLandlordPct(Math.round((100 - newTenant) * 10) / 10);
      } else {
        const newLandlord = Math.min(99, landlordPct + shift);
        setLandlordPct(Math.round(newLandlord * 10) / 10);
        setTenantPct(Math.round((100 - newLandlord) * 10) / 10);
      }

      setHasVoted(side);
      setIsVoting(false);
      setVoteReceipt(`0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 8)}`);
    }, 2000);
  };

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
            <span className={`status ${hasVoted ? 'text-success bg-success-transparent' : 'text-danger bg-danger-transparent animate-pulse-live'}`}>
              {hasVoted ? 'Vote Recorded ✓' : 'Active Voting'}
            </span>
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
                <span>Landlord ({landlordPct}%)</span>
                <span>Tenant ({tenantPct}%)</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill landlord" style={{ width: `${landlordPct}%`, transition: 'width 0.8s ease' }}></div>
                <div className="progress-fill tenant" style={{ width: `${tenantPct}%`, transition: 'width 0.8s ease' }}></div>
              </div>
            </div>

            {hasVoted && voteReceipt && (
              <div style={{ 
                background: 'rgba(16,185,129,0.1)', 
                border: '1px solid rgba(16,185,129,0.3)', 
                borderRadius: '10px', 
                padding: '0.65rem 1rem', 
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.78rem'
              }}>
                <CheckCircle2 size={16} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
                <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>
                  Vote cast for {hasVoted === 'tenant' ? 'Tenant' : 'Landlord'} · 1,450 vPROP
                </span>
                <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', fontFamily: 'monospace', fontSize: '0.7rem' }}>
                  TX: {voteReceipt}
                </span>
              </div>
            )}

            <div className="vote-actions">
              <button 
                className="btn btn-secondary vote-btn"
                onClick={() => handleVote('landlord')}
                disabled={!!hasVoted || isVoting}
                style={{ opacity: (hasVoted || isVoting) ? 0.5 : 1, cursor: (hasVoted || isVoting) ? 'not-allowed' : 'pointer' }}
              >
                <ThumbsDown size={18} /> {isVoting ? 'Casting...' : hasVoted === 'landlord' ? 'Voted ✓' : 'Support Landlord'}
              </button>
              <button 
                className="btn btn-primary vote-btn"
                onClick={() => handleVote('tenant')}
                disabled={!!hasVoted || isVoting}
                style={{ opacity: (hasVoted || isVoting) ? 0.5 : 1, cursor: (hasVoted || isVoting) ? 'not-allowed' : 'pointer' }}
              >
                <ThumbsUp size={18} /> {isVoting ? 'Casting...' : hasVoted === 'tenant' ? 'Voted ✓' : 'Support Tenant (AI Choice)'}
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
