import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;

// Color-coded markers by property type
function createColorMarker(color: string, emoji: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${color};
      width:34px;height:34px;border-radius:50% 50% 50% 0%;transform:rotate(-45deg);
      border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);
      display:flex;align-items:center;justify-content:center;
    "><span style="transform:rotate(45deg);font-size:14px;line-height:1">${emoji}</span></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  });
}

function getMarker(type: string) {
  switch (type) {
    case 'Agricultural Land': return createColorMarker('#22c55e', '🌾');
    case 'Residential Plot':  return createColorMarker('#6366f1', '🏠');
    case 'Commercial Plot':
    case 'Commercial Shop':
    case 'Commercial Office':
    case 'Commercial IT Park': return createColorMarker('#f59e0b', '🏢');
    case 'Industrial Plot':   return createColorMarker('#ef4444', '🏭');
    case 'Luxury Apartment':
    case 'Premium Apartment':
    case 'Apartment':         return createColorMarker('#3b82f6', '🏙️');
    case 'Luxury Villa':
    case 'Villa':             return createColorMarker('#a855f7', '🏡');
    case 'Penthouse':         return createColorMarker('#ec4899', '🌆');
    case 'Studio Apartment':  return createColorMarker('#14b8a6', '🛏️');
    case 'Independent House': return createColorMarker('#84cc16', '🏘️');
    default: return createColorMarker('#64748b', '📍');
  }
}

function FitBounds({ properties }: { properties: any[] }) {
  const map = useMap();
  useEffect(() => {
    if (properties.length === 0) return;
    const bounds = L.latLngBounds(properties.map(p => [p.location.lat, p.location.lng]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [properties, map]);
  return null;
}

export default function PropFiMap({ properties, totalCount }: { properties: any[], totalCount?: number }) {
  const valid = properties.filter(p => p.location?.lat && p.location?.lng);
  const displayCount = totalCount !== undefined ? totalCount : valid.length;

  // India's geographic bounds — always start here, then fit to pins if available
  const INDIA_BOUNDS: [[number, number], [number, number]] = [
    [8.0, 68.0],   // SW corner
    [37.6, 97.4],  // NE corner
  ];

  return (
    <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)' }}>
      <MapContainer
        key={valid.length > 0 ? 'loaded' : 'empty'}
        bounds={INDIA_BOUNDS}
        boundsOptions={{ padding: [20, 20] }}
        style={{ height: '480px', width: '100%', background: '#0f1117' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          maxZoom={19}
        />
        {valid.length > 0 && <FitBounds properties={valid} />}
        {valid.map(p => (
          <Marker
            key={p.id}
            position={[p.location.lat, p.location.lng]}
            icon={getMarker(p.type)}
          >
            <Popup maxWidth={280}>
              <div style={{ fontFamily: 'Inter, sans-serif', padding: '0.25rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ background: '#6366f1', color: '#fff', padding: '0.15rem 0.5rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700 }}>
                    {p.type}
                  </span>
                  <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '0.15rem 0.5rem', borderRadius: '20px', fontSize: '0.7rem', border: '1px solid #bbf7d0' }}>
                    {p.appreciationYield ? `+${p.appreciationYield}% appreciation` : `${p.rentalYield}% rental`}
                  </span>
                </div>
                <strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: '0.25rem', color: '#1e293b' }}>{p.name}</strong>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>📍 {p.city}, {p.state}</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b' }}>₹{p.tokenPrice?.toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>per token</div>
                  </div>
                  {p.monthlyRent > 0 && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#16a34a' }}>₹{p.monthlyRent?.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>monthly rent</div>
                    </div>
                  )}
                  {p.leaseIncome > 0 && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#16a34a' }}>₹{p.leaseIncome?.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>monthly lease</div>
                    </div>
                  )}
                </div>
                <Link to={`/asset/${p.id}`}
                  style={{ display: 'block', marginTop: '0.6rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', padding: '0.4rem', borderRadius: '8px', textAlign: 'center', fontWeight: 700, fontSize: '0.82rem', textDecoration: 'none' }}>
                  View & Trade →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: '1rem', left: '1rem', zIndex: 1000,
        background: 'rgba(15,17,23,0.88)', backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
        padding: '0.6rem 0.85rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
        maxWidth: '420px',
      }}>
        {[
          { color: '#6366f1', emoji: '🏠', label: 'Residential' },
          { color: '#3b82f6', emoji: '🏙️', label: 'Apartment' },
          { color: '#f59e0b', emoji: '🏢', label: 'Commercial' },
          { color: '#22c55e', emoji: '🌾', label: 'Agricultural' },
          { color: '#ef4444', emoji: '🏭', label: 'Industrial' },
          { color: '#a855f7', emoji: '🏡', label: 'Villa' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: '#cbd5e1' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, display: 'inline-block', flexShrink: 0 }} />
            {item.label}
          </div>
        ))}
      </div>

      {/* Count badge */}
      <div style={{
        position: 'absolute', top: '1rem', right: '1rem', zIndex: 1000,
        background: 'rgba(99,102,241,0.9)', color: '#fff', borderRadius: '20px',
        padding: '0.3rem 0.85rem', fontSize: '0.78rem', fontWeight: 700,
      }}>
        {displayCount.toLocaleString('en-IN')} properties across India
      </div>
    </div>
  );
}
