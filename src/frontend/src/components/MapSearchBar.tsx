import { useState, useRef, useEffect } from 'react';
import L from 'leaflet';

interface MapSearchBarProps {
    map: L.Map | null;
    placeholder?: string;
}

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

interface SearchResult {
    display_name: string;
    lat: string;
    lon: string;
}

export default function MapSearchBar({ map, placeholder = 'Search location...' }: MapSearchBarProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const search = async (q: string) => {
        if (q.length < 2) { setResults([]); return; }
        setSearching(true);
        try {
            const res = await fetch(
                `${NOMINATIM_BASE}/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=in`,
                { headers: { 'User-Agent': 'Hublet-RealEstate/1.0' } }
            );
            const data: SearchResult[] = await res.json();
            setResults(data);
            setShowDropdown(data.length > 0);
        } catch {
            setResults([]);
        } finally {
            setSearching(false);
        }
    };

    const handleInputChange = (value: string) => {
        setQuery(value);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => search(value), 400);
    };

    const handleSelect = (r: SearchResult) => {
        const lat = parseFloat(r.lat);
        const lon = parseFloat(r.lon);
        if (map) {
            map.setView([lat, lon], 13);
        }
        setQuery(r.display_name.split(',').slice(0, 2).join(','));
        setShowDropdown(false);
    };

    return (
        <div ref={containerRef} style={{ position: 'relative', zIndex: 1000 }}>
            <input
                type="text"
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => results.length > 0 && setShowDropdown(true)}
                placeholder={placeholder}
                style={{
                    padding: '8px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    fontSize: '13px',
                    width: '260px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
            />
            {searching && (
                <span style={{ position: 'absolute', right: '10px', top: '9px', fontSize: '12px', color: '#999' }}>...</span>
            )}
            {showDropdown && results.length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '0 0 6px 6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    maxHeight: '200px',
                    overflowY: 'auto',
                }}>
                    {results.map((r, i) => (
                        <div
                            key={i}
                            onClick={() => handleSelect(r)}
                            style={{
                                padding: '8px 12px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                borderBottom: i < results.length - 1 ? '1px solid #f0f0f0' : 'none',
                                color: '#333',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                        >
                            {r.display_name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
