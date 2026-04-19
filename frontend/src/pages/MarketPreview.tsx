/**
 * MarketPreview — compact 6-card preview of the marketplace
 * Used in the stacked home layout so the page remains scrollable.
 * The full Market (with filters, map, 1000+ cards) lives at /market.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, TrendingUp, Building2, Leaf, ChevronRight } from 'lucide-react';
// @ts-ignore
import * as PropFiAPI from '../api-client';

function MiniCard({ asset }: { asset: any }) {
  const yield_ = asset.appreciationYield || asset.rentalYield || 0;
  const income  = asset.monthlyRent || asset.leaseIncome || 0;
  const isRental = income > 0;

  return (
    <Link to={`/asset/${asset.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'var(--glass-bg-light)', border: '1px solid var(--glass-border)',
        borderRadius: 14, overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(0,0,0,0.18)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
      >
        <div style={{ position: 'relative', height: 140 }}>
          <img
            src={asset.image || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80'}
            alt={asset.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
            onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80'; }}
          />
          <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 20, backdropFilter: 'blur(4px)' }}>
            {asset.type}
          </div>
          <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(99,102,241,0.85)', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 20 }}>
            +{yield_.toFixed(1)}%
          </div>
        </div>
        <div style={{ padding: '0.85rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {asset.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <MapPin size={10} /> {asset.city}, {asset.state}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>₹{(asset.tokenPrice || 0).toLocaleString('en-IN')}</span>
            <span style={{ fontSize: '0.72rem', color: isRental ? 'var(--accent-green)' : 'var(--accent-blue)', fontWeight: 600 }}>
              {isRental ? `₹${income.toLocaleString('en-IN')}/mo` : `+${yield_.toFixed(1)}% p.a.`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function MarketPreview() {
  const [featured, setFeatured] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    PropFiAPI.getProperties({ sort: 'yield', limit: 6 })
      .then((res: any) => {
        const data = Array.isArray(res) ? res : (res?.data || []);
        setFeatured(data.slice(0, 6));
        setTotalCount(res?.total || data.length);
      })
      .catch(() => setFeatured([]))
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { icon: Building2, label: 'Total Properties', value: totalCount.toLocaleString('en-IN'), color: '#6366f1' },
    { icon: Leaf,      label: 'Cities Covered',   value: '56',   color: '#10b981' },
    { icon: TrendingUp, label: 'Avg. Yield',      value: '11.4% p.a.', color: '#f59e0b' },
  ];

  return (
    <div className="market animate-fade-in" style={{ paddingBottom: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.4rem' }}>Land Marketplace</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <strong style={{ color: 'var(--accent-primary)' }}>{totalCount.toLocaleString('en-IN')} properties</strong> across{' '}
            <strong style={{ color: 'var(--accent-green)' }}>56 Indian cities</strong> — tokenized on Polygon
          </p>
        </div>
        <Link
          to="/market"
          className="btn btn-primary"
          style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center', textDecoration: 'none', padding: '0.65rem 1.5rem' }}
        >
          Explore All <ArrowRight size={16} />
        </Link>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: 'var(--glass-bg-light)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: '0.85rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <s.icon size={20} color={s.color} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>{s.value}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 6 featured cards */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
          {[...Array(6)].map((_, i) => <div key={i} style={{ height: 220, background: 'var(--glass-bg-light)', borderRadius: 14, animation: 'pulse 1.5s infinite', border: '1px solid var(--glass-border)' }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          {featured.map(a => <MiniCard key={a.id} asset={a} />)}
        </div>
      )}

      {/* See all CTA */}
      <div style={{ textAlign: 'center', paddingTop: '0.5rem' }}>
        <Link
          to="/market"
          style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center', color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}
        >
          Browse all {totalCount.toLocaleString('en-IN')} properties <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
}
