import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, TrendingUp, X } from 'lucide-react';
import AIValuationModal from './AIValuationModal';
import './GlobalSearch.css';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // AI Valuation Modal State
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  const searchRef = useRef<HTMLDivElement>(null);

  const trendingLocations = [
    { display_name: "Bandra West, Mumbai, Maharashtra", city: "Mumbai", area: "Bandra West" },
    { display_name: "Whitefield, Bengaluru, Karnataka", city: "Bengaluru", area: "Whitefield" },
    { display_name: "DLF Cyber City, Gurugram, Haryana", city: "Gurugram", area: "Cyber City" },
    { display_name: "Jubilee Hills, Hyderabad, Telangana", city: "Hyderabad", area: "Jubilee Hills" }
  ];

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search logic for OpenStreetMap Nominatim
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`);
        const data = await res.json();
        setResults(data);
      } catch (err) {
        console.error("Geocoding error", err);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (loc: any) => {
    setFocused(false);
    setQuery('');
    setResults([]);
    
    // Parse location for AI. The API returns full display names.
    // We will extract city/area roughly if they aren't pre-coded.
    let parsedCity = loc.city || loc.display_name.split(',')[0];
    let parsedArea = loc.area || loc.display_name;
    
    setSelectedLocation({
      name: loc.display_name,
      city: parsedCity,
      area: parsedArea
    });
  };

  return (
    <>
      <div className="global-search-container" ref={searchRef}>
        <div className={`search-bar ${focused ? 'focused' : ''}`}>
          <Search size={16} className="text-muted" aria-hidden="true" />
          <input 
            type="text" 
            placeholder="Search any location in India..." 
            className="search-input" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
          />
          {query && (
            <button className="clear-btn" onClick={() => setQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>

        {focused && (
          <div className="search-dropdown animate-fade-in">
            {!query ? (
              <div className="trending-section">
                <div className="dropdown-header">
                  <TrendingUp size={14} className="text-primary" /> Most Searched Now
                </div>
                {trendingLocations.map((loc, idx) => (
                  <div key={idx} className="search-result-item" onClick={() => handleSelect(loc)}>
                    <MapPin size={16} className="text-muted" />
                    <span>{loc.display_name}</span>
                    <span className="ai-badge">AI Predict</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="results-section">
                <div className="dropdown-header">
                  Results for "{query}" {loading && <span className="loading-dots">...</span>}
                </div>
                {results.length === 0 && !loading ? (
                  <div className="no-results">No locations found. Try a different query.</div>
                ) : (
                  results.map((loc, idx) => (
                    <div key={idx} className="search-result-item" onClick={() => handleSelect(loc)}>
                      <MapPin size={16} className="text-muted" />
                      <span>{loc.display_name}</span>
                      <span className="ai-badge">AI Predict</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedLocation && (
        <AIValuationModal 
          location={selectedLocation} 
          onClose={() => setSelectedLocation(null)} 
        />
      )}
    </>
  );
}
