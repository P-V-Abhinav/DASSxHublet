import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MapSearchBar from './MapSearchBar';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

interface MapProperty {
    id: string;
    title: string;
    locality: string;
    bhk: number;
    price: number;
    area: number;
    propertyType: string;
    lat: number;
    lon: number;
}

function formatPrice(price: number): string {
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
    return `₹${price.toLocaleString('en-IN')}`;
}

export default function PropertyExplorer() {
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const markersRef = useRef<L.LayerGroup | null>(null);
    const [properties, setProperties] = useState<MapProperty[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        bhk: '',
        minPrice: '',
        maxPrice: '',
        propertyType: '',
    });

    // Initialize map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const map = L.map(mapContainerRef.current).setView([20.5937, 78.9629], 5);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
        }).addTo(map);

        markersRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // Fetch properties
    useEffect(() => {
        fetchProperties();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchProperties = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('hublet_auth_token');
            const params = new URLSearchParams();
            if (filters.bhk) params.set('bhk', filters.bhk);
            if (filters.minPrice) params.set('minPrice', filters.minPrice);
            if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
            if (filters.propertyType) params.set('propertyType', filters.propertyType);

            const res = await fetch(`${API_BASE_URL}/properties/map?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error('Failed to fetch properties');

            const data: MapProperty[] = await res.json();
            setProperties(data);
            renderMarkers(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load properties');
        } finally {
            setLoading(false);
        }
    };

    const renderMarkers = (props: MapProperty[]) => {
        if (!markersRef.current || !mapRef.current) return;
        markersRef.current.clearLayers();

        const bounds: [number, number][] = [];

        props.forEach((p) => {
            const color =
                p.propertyType === 'apartment'
                    ? '#4CAF50'
                    : p.propertyType === 'house'
                        ? '#2196F3'
                        : p.propertyType === 'villa'
                            ? '#FF9800'
                            : '#9C27B0';

            const icon = L.divIcon({
                className: 'custom-marker',
                html: `<div style="
          background: ${color};
          width: 28px;
          height: 28px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        "><span style="
          transform: rotate(45deg);
          color: white;
          font-size: 11px;
          font-weight: bold;
        ">${p.bhk}</span></div>`,
                iconSize: [28, 28],
                iconAnchor: [14, 28],
                popupAnchor: [0, -28],
            });

            const marker = L.marker([p.lat, p.lon], { icon }).bindPopup(`
        <div style="min-width: 200px;">
          <h4 style="margin: 0 0 6px 0; color: #333;">${p.title}</h4>
          <p style="margin: 2px 0; font-size: 13px;">${p.locality}</p>
          <p style="margin: 2px 0; font-size: 13px;">${p.bhk} BHK • ${p.area} sqft • ${p.propertyType}</p>
          <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: bold; color: #2e7d32;">${formatPrice(p.price)}</p>
        </div>
      `);

            markersRef.current!.addLayer(marker);
            bounds.push([p.lat, p.lon]);
        });

        if (bounds.length > 0 && mapRef.current) {
            mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
        }
    };

    const handleFilter = () => {
        fetchProperties();
    };

    const handleReset = () => {
        setFilters({ bhk: '', minPrice: '', maxPrice: '', propertyType: '' });
        // Fetch with no filters — need a slight delay for state update
        setTimeout(() => fetchProperties(), 100);
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '80vh',
                minHeight: '600px',
                background: '#f5f5f5',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
        >
            {/* Header */}
            <div
                style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '15px 25px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                }}
            >
                <div>
                    <h2 style={{ margin: 0, fontSize: '20px' }}>Property Explorer</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.9 }}>
                        {properties.length} properties on map
                        {loading && ' • Loading...'}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div
                style={{
                    display: 'flex',
                    gap: '10px',
                    padding: '12px 25px',
                    background: 'white',
                    borderBottom: '1px solid #e0e0e0',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                }}
            >
                <MapSearchBar map={mapRef.current} placeholder="Search map..." />
                <select
                    value={filters.bhk}
                    onChange={(e) => setFilters({ ...filters, bhk: e.target.value })}
                    style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '13px',
                    }}
                >
                    <option value="">Any BHK</option>
                    <option value="1">1 BHK</option>
                    <option value="2">2 BHK</option>
                    <option value="3">3 BHK</option>
                    <option value="4">4+ BHK</option>
                </select>

                <input
                    type="number"
                    placeholder="Min Price (₹)"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                    style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '13px',
                        width: '130px',
                    }}
                />

                <input
                    type="number"
                    placeholder="Max Price (₹)"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '13px',
                        width: '130px',
                    }}
                />

                <select
                    value={filters.propertyType}
                    onChange={(e) => setFilters({ ...filters, propertyType: e.target.value })}
                    style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '13px',
                    }}
                >
                    <option value="">Any Type</option>
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="villa">Villa</option>
                    <option value="plot">Plot</option>
                </select>

                <button
                    onClick={handleFilter}
                    style={{
                        padding: '8px 20px',
                        background: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 'bold',
                    }}
                >
                    Apply Filters
                </button>

                <button
                    onClick={handleReset}
                    style={{
                        padding: '8px 20px',
                        background: '#f5f5f5',
                        color: '#666',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                    }}
                >
                    Reset
                </button>

                {error && (
                    <span style={{ color: '#e53935', fontSize: '13px' }}>⚠️ {error}</span>
                )}
            </div>

            {/* Map Legend */}
            <div
                style={{
                    display: 'flex',
                    gap: '15px',
                    padding: '6px 25px',
                    background: '#fafafa',
                    borderBottom: '1px solid #eee',
                    fontSize: '12px',
                    color: '#666',
                }}
            >
                <span>
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#4CAF50', marginRight: 4 }} />
                    Apartment
                </span>
                <span>
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#2196F3', marginRight: 4 }} />
                    House
                </span>
                <span>
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#FF9800', marginRight: 4 }} />
                    Villa
                </span>
                <span>
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#9C27B0', marginRight: 4 }} />
                    Plot
                </span>
            </div>

            {/* Map container */}
            <div ref={mapContainerRef} style={{ flex: 1 }} />
        </div>
    );
}
