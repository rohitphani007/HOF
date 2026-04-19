import { Filter, Search, SlidersHorizontal, MapPin, Home, Leaf, Briefcase, Factory, X, ChevronDown, Building2, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
// @ts-ignore
import * as PropFiAPI from '../api-client';
import PropFiMap from '../components/PropFiMap';
import './Market.css';

const TYPE_FILTERS = [
  { label: 'All Types',    value: '',            icon: SlidersHorizontal },
  { label: 'Residential',  value: 'residential', icon: Home },
  { label: 'Agricultural', value: 'agricultural', icon: Leaf },
  { label: 'Commercial',   value: 'commercial',  icon: Briefcase },
  { label: 'Industrial',   value: 'industrial',  icon: Factory },
  { label: 'Apartments',   value: 'apartment',   icon: Building2 },
];

const SORT_OPTIONS = [
  { label: 'Highest Yield',  key: 'yield' },
  { label: 'Lowest Price',   key: 'price_asc' },
  { label: 'Highest Price',  key: 'price_desc' },
  { label: 'Best Rent',      key: 'rent' },
  { label: 'Risk Score',     key: 'risk' },
];

const PAGE_SIZE = 40; // cards per load

function AssetCard({ asset }: { asset: any }) {
  const yield_ = asset.appreciationYield || asset.rentalYield || 0;
  const isRental = !!asset.monthlyRent && asset.monthlyRent > 0;
  const isLease  = !!asset.leaseIncome && asset.leaseIncome > 0;
  const income   = asset.monthlyRent || asset.leaseIncome || 0;

  return (
    <Link to={`/asset/${asset.id}`} className="asset-card card">
      <div className="asset-image-container">
        <img
          src={asset.image || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80'}
          alt={asset.name}
          className="asset-image"
          loading="lazy"
          decoding="async"
          onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80'; }}
        />
        <div style={{ position: 'absolute', top: '0.6rem', left: '0.6rem', display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
          <span style={{ background: 'rgba(0,0,0,0.72)', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700, backdropFilter: 'blur(4px)' }}>
            {asset.type}
          </span>
          {asset.legalStatus && (
            <span style={{ background: 'rgba(16,185,129,0.85)', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 700 }}>
              ✓ {asset.legalStatus}
            </span>
          )}
        </div>
        <div style={{ position: 'absolute', top: '0.6rem', right: '0.6rem', background: 'rgba(99,102,241,0.88)', color: '#fff', padding: '0.25rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, backdropFilter: 'blur(4px)' }}>
          +{yield_.toFixed(1)}%
        </div>
      </div>

      <div className="asset-content">
        <h3 className="asset-name">{asset.name}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.75rem' }}>
          <MapPin size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{asset.city}, {asset.state}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <div style={{ background: 'var(--bg-base)', borderRadius: '8px', padding: '0.5rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Token Price</div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              ₹{(asset.tokenPrice || 0).toLocaleString('en-IN')}
            </div>
          </div>
          <div style={{ background: 'var(--bg-base)', borderRadius: '8px', padding: '0.5rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
              {isRental ? 'Monthly Rent' : isLease ? 'Lease Income' : 'Appreciation'}
            </div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: income > 0 ? 'var(--accent-green)' : 'var(--text-primary)' }}>
              {income > 0 ? `₹${income.toLocaleString('en-IN')}` : `+${yield_.toFixed(1)}%`}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>
            {asset.plotSqYards ? `📐 ${asset.plotSqYards} sq.yd` :
              asset.plotAcres ? `🌾 ${asset.plotAcres} acres` :
              asset.sqft ? `🏢 ${asset.sqft.toLocaleString('en-IN')} sqft` : ''}
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            {asset.symbolIndex || `PROP-${asset.id?.toUpperCase()}`}
          </span>
        </div>

        <div className="asset-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--glass-border)' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--accent-green)', fontWeight: 600 }}>
            ✓ {asset.legalStatus || (asset.certifications?.[0]) || 'Pending'}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {asset.availableTokens?.toLocaleString('en-IN')} left
          </span>
          <span className="action-text" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
            Trade →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function Market() {
  const navigate = useNavigate();
  // All fetched assets (complete filtered set from API)
  const [allAssets, setAllAssets] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [cities, setCities] = useState<string[]>([]);
  const [showAllCities, setShowAllCities] = useState(false);

  const [typeFilter, setTypeFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('All Cities');
  const [sortBy, setSortBy] = useState('yield');
  const [searchText, setSearchText] = useState('');
  const [showMap, setShowMap] = useState(true);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch CITIES once
  useEffect(() => {
    PropFiAPI.getCities?.()
      .then((data: any[]) => {
        const cityNames = ['All Cities', ...data.map((c: any) => c.city)];
        setCities(cityNames);
      })
      .catch(() => {
        setCities(['All Cities','Mumbai','Bengaluru','Delhi','Hyderabad','Chennai','Pune','Kolkata','Ahmedabad','Jaipur','Kochi','Noida','Gurgaon','Thane','Nagpur','Indore','Surat','Chandigarh','Lucknow','Bhopal','Visakhapatnam','Nashik','Coimbatore','Vadodara','Patna','Raipur','Bhubaneswar','Guwahati','Amritsar','Jodhpur','Dehradun','Mangaluru','Gandhinagar','Mysuru','Rajkot','Varanasi','Meerut','Udaipur','Shimla','Panaji','Madurai','Faridabad','Srinagar','Thiruvananthapuram','Ranchi','Wayanad','Agra','Ludhiana','Vijayawada','Tirupati','Aurangabad','Hooghly','Dewas','Kannur','Nagercoil','Hubli']);
      });
  }, []);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await PropFiAPI.getProperties({
        city: cityFilter !== 'All Cities' ? cityFilter : '',
        type: typeFilter,
        search: searchText,
        sort: sortBy,
        limit: 500, // get up to 500 per fetch
      });
      const data = res?.data || res || [];
      setAllAssets(Array.isArray(data) ? data : []);
      setTotalCount(res?.total || data.length);
      setVisibleCount(PAGE_SIZE);
    } catch { setAllAssets([]); }
    setLoading(false);
  }, [cityFilter, typeFilter, searchText, sortBy]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(fetchAssets, 300);
    return () => clearTimeout(t);
  }, [fetchAssets]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && visibleCount < allAssets.length) {
        setVisibleCount(v => Math.min(v + PAGE_SIZE, allAssets.length));
      }
    }, { rootMargin: '200px' });
    obs.observe(loadMoreRef.current);
    return () => obs.disconnect();
  }, [visibleCount, allAssets.length]);

  const visibleAssets = allAssets.slice(0, visibleCount);
  const mapAssets     = allAssets.slice(0, 200); // limit map pins to 200 for performance

  const CITIES_SHOWN = showAllCities ? cities : cities.slice(0, 22);

  return (
    <div className="market animate-fade-in">
      {/* ── Back navigation bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', padding: '0.65rem 1rem', background: 'var(--glass-bg-light)', border: '1px solid var(--glass-border)', borderRadius: 12 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, padding: '0.25rem 0.5rem', borderRadius: 8, transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <span style={{ color: 'var(--glass-border)', fontSize: '1rem' }}>|</span>
        <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.83rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Home size={13} /> Dashboard
        </Link>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>›</span>
        <span style={{ fontSize: '0.83rem', color: 'var(--text-primary)', fontWeight: 600 }}>Marketplace</span>
      </div>

      <div className="market-header">
        <div>
          <h1>PropFi Marketplace</h1>
          <p>
            <strong style={{ color: 'var(--accent-primary)' }}>{totalCount.toLocaleString('en-IN')} properties</strong> across{' '}
            <strong style={{ color: 'var(--accent-green)' }}>{cities.length > 1 ? cities.length - 1 : 56} Indian cities</strong> —
            Apartments, Plots, Farms &amp; Offices with rent or appreciation income
          </p>
        </div>
      </div>

      {/* ── Search + Sort Bar ── */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search city, type or property name..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: '100%', background: 'var(--glass-bg-light)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '0.65rem 1rem 0.65rem 2.4rem', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none' }}
          />
          {searchText && (
            <button onClick={() => setSearchText('')} style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={14} />
            </button>
          )}
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{ background: 'var(--glass-bg-light)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '0.65rem 1rem', color: 'var(--text-primary)', fontSize: '0.85rem', cursor: 'pointer', outline: 'none' }}
        >
          {SORT_OPTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <button
          onClick={() => setShowMap(m => !m)}
          className="btn btn-secondary"
          style={{ padding: '0.65rem 1rem', fontSize: '0.85rem' }}
        >
          {showMap ? '🗺️ Hide Map' : '🗺️ Show Map'}
        </button>
      </div>

      {/* ── Type Filter Pills ── */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        {TYPE_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setTypeFilter(f.value === typeFilter ? '' : f.value)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.35rem 0.9rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', border: '1px solid',
              background: typeFilter === f.value ? 'var(--accent-primary)' : 'transparent',
              color: typeFilter === f.value ? '#fff' : 'var(--text-muted)',
              borderColor: typeFilter === f.value ? 'var(--accent-primary)' : 'var(--glass-border)',
            }}
          >
            <f.icon size={12} /> {f.label}
          </button>
        ))}
      </div>

      {/* ── City Filter Pills (all 56 cities from API) ── */}
      <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {CITIES_SHOWN.map(city => (
          <button
            key={city}
            onClick={() => setCityFilter(city)}
            style={{
              padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.73rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', border: '1px solid',
              background: cityFilter === city ? 'rgba(16,185,129,0.2)' : 'transparent',
              color: cityFilter === city ? 'var(--accent-green)' : 'var(--text-muted)',
              borderColor: cityFilter === city ? 'var(--accent-green)' : 'var(--glass-border)',
            }}
          >
            {city}
          </button>
        ))}
        {cities.length > 22 && (
          <button
            onClick={() => setShowAllCities(v => !v)}
            style={{
              padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.73rem', fontWeight: 600, cursor: 'pointer', border: '1px dashed var(--glass-border)',
              background: 'transparent', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.25rem',
            }}
          >
            <ChevronDown size={12} style={{ transform: showAllCities ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
            {showAllCities ? 'Show less' : `+${cities.length - 22} more cities`}
          </button>
        )}
      </div>

      {/* ── Map ── */}
      {showMap && (
        <div style={{ marginBottom: '2rem' }}>
          <PropFiMap properties={mapAssets} />
        </div>
      )}

      {/* ── Results count + clear ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Showing <strong style={{ color: 'var(--text-primary)' }}>{visibleCount < allAssets.length ? visibleCount : allAssets.length}</strong> of{' '}
          <strong style={{ color: 'var(--accent-primary)' }}>{totalCount.toLocaleString('en-IN')}</strong> properties
          {cityFilter !== 'All Cities' ? ` in ${cityFilter}` : ' across India'}
        </p>
        {(typeFilter || cityFilter !== 'All Cities' || searchText) && (
          <button onClick={() => { setTypeFilter(''); setCityFilter('All Cities'); setSearchText(''); }}
            style={{ background: 'rgba(255,69,58,0.1)', color: 'var(--accent-red)', border: '1px solid rgba(255,69,58,0.2)', borderRadius: '8px', padding: '0.3rem 0.75rem', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>
            <X size={11} style={{ verticalAlign: 'middle' }} /> Clear Filters
          </button>
        )}
      </div>

      {/* ── Asset Grid ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {[...Array(12)].map((_, i) => (
            <div key={i} style={{ height: '380px', background: 'var(--glass-bg-light)', borderRadius: '16px', animation: 'pulse 1.5s infinite', border: '1px solid var(--glass-border)' }} />
          ))}
        </div>
      ) : allAssets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <Filter size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <p>No properties match your filters. <button onClick={() => { setTypeFilter(''); setCityFilter('All Cities'); setSearchText(''); }} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600 }}>Clear all filters</button></p>
        </div>
      ) : (
        <>
          <div className="asset-grid">
            {visibleAssets.map(asset => <AssetCard key={asset.id} asset={asset} />)}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={loadMoreRef} style={{ padding: '2rem', textAlign: 'center' }}>
            {visibleCount < allAssets.length && (
              <button
                className="btn btn-secondary"
                onClick={() => setVisibleCount(v => Math.min(v + PAGE_SIZE, allAssets.length))}
                style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}
              >
                <ChevronDown size={16} />
                Load More ({allAssets.length - visibleCount} remaining)
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
