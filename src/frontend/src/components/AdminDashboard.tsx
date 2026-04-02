import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
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

interface Buyer {
    id: string;
    name: string;
    email: string;
    phone?: string;
    localities: string[];
    bhk?: number;
    budgetMin?: number;
    budgetMax?: number;
    areaMin?: number;
    areaMax?: number;
    amenities: string[];
    metadata?: any;
    createdAt: string;
}

interface Seller {
    id: string;
    name: string;
    email: string;
    phone?: string;
    sellerType: string;
    rating: number;
    ratingCount: number;
    completedDeals: number;
    trustScore: number;
    metadata?: any;
    createdAt: string;
}

interface Property {
    id: string;
    title: string;
    description?: string;
    locality: string;
    address?: string;
    area: number;
    bhk: number;
    price: number;
    amenities: string[];
    propertyType: string;
    contact?: string;
    isActive: boolean;
    metadata?: {
        sourceUrl?: string;
        externalId?: string;
        source?: string;
        scraper?: string;
        ownerName?: string;
        companyName?: string;
        imageUrl?: string;
        landmark?: string;
        postedDate?: string;
        scrapedAt?: string;
        groupUrl?: string;
        coordinates?: { lat: number; lon: number };
        city?: string;
    };
    createdAt: string;
    seller: Seller;
}

interface Lead {
    id: string;
    state: string;
    matchScore?: number;
    createdAt: string;
    updatedAt: string;
    buyer: { name: string; email: string; phone?: string };
    property: { title: string; locality: string; price?: number; bhk?: number; area?: number; seller?: { name: string; email?: string; sellerType?: string } };
}

interface Match {
    id: string;
    matchScore: number;
    locationScore?: number;
    budgetScore?: number;
    sizeScore?: number;
    amenitiesScore?: number;
    createdAt: string;
    buyer: { name: string; email: string };
    property: { title: string; locality: string; seller?: { name: string; email?: string; sellerType?: string } };
}

interface WorkflowEvent {
    id: string;
    eventType: string;
    fromState?: string;
    toState?: string;
    description?: string;
    createdAt: string;
}

interface FbScrapedRow {
    TITLE: string;
    LOCALITY: string;
    TYPE: string;
    BHK: string;
    AREA: string;
    PRICE: string;
    AMENITIES: string;
    SELLER: string;
    STATUS: string;
    CREATED_AT: string;
    CONTACT: string;
    GROUP_URL: string;
}

type TabType = 'buyers' | 'sellers' | 'properties' | 'leads' | 'matches' | 'logs' | 'fb-scrape' | 'manual-scrape' | 'property-map' | 'buyer-map';

export const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState<TabType>('buyers');
    const [buyers, setBuyers] = useState<Buyer[]>([]);
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [logs, setLogs] = useState<WorkflowEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Manual scrape state
    const [manualCity, setManualCity] = useState('');
    const [manualScraper, setManualScraper] = useState('');
    const [manualScraping, setManualScraping] = useState(false);
    const [manualScrapeMessage, setManualScrapeMessage] = useState<string | null>(null);
    const [availableScrapers, setAvailableScrapers] = useState<string[]>([]);

    // Facebook scraping state
    const [fbGroupUrl, setFbGroupUrl] = useState('');
    const [fbPostLimit, setFbPostLimit] = useState(10);
    const [fbResults, setFbResults] = useState<FbScrapedRow[]>([]);
    const [fbScraping, setFbScraping] = useState(false);
    const [fbSaving, setFbSaving] = useState(false);
    const [fbMessage, setFbMessage] = useState<string | null>(null);
    const [fbError, setFbError] = useState<string | null>(null);

    // Demo seeder state
    const [seedingBuyers, setSeedingBuyers] = useState(false);
    const [seedingSellers, setSeedingSellers] = useState(false);
    const [deletingBuyers, setDeletingBuyers] = useState(false);
    const [deletingSellers, setDeletingSellers] = useState(false);
    const [resettingSellers, setResettingSellers] = useState(false);
    const [credentials, setCredentials] = useState<any[] | null>(null);
    const [actionMessage, setActionMessage] = useState<string | null>(null);

    // Map state
    const propertyMapRef = useRef<HTMLDivElement>(null);
    const propertyMapInstance = useRef<L.Map | null>(null);
    const buyerMapRef = useRef<HTMLDivElement>(null);
    const buyerMapInstance = useRef<L.Map | null>(null);

    // Fetch data based on active tab
    useEffect(() => {
        fetchData();
        if (activeTab === 'manual-scrape') {
            fetchScrapers();
        }
    }, [activeTab]);

    const fetchScrapers = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/scrapers`);
            if (res.data.success && Array.isArray(res.data.scrapers)) {
                setAvailableScrapers(res.data.scrapers.map((s: any) => s.name || s));
            }
        } catch (e: any) {
            setError(e.message);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            switch (activeTab) {
                case 'buyers':
                    const buyersRes = await axios.get(`${API_BASE_URL}/buyers`);
                    setBuyers(buyersRes.data);
                    break;
                case 'sellers':
                    const sellersRes = await axios.get(`${API_BASE_URL}/sellers`);
                    setSellers(sellersRes.data);
                    break;
                case 'properties':
                    const propertiesRes = await axios.get(`${API_BASE_URL}/properties`);
                    setProperties(propertiesRes.data);
                    break;
                case 'leads':
                    const leadsRes = await axios.get(`${API_BASE_URL}/leads`);
                    setLeads(leadsRes.data);
                    break;
                case 'matches':
                    const matchesRes = await axios.get(`${API_BASE_URL}/matches`);
                    setMatches(matchesRes.data);
                    break;
                case 'logs':
                    const logsRes = await axios.get(`${API_BASE_URL}/workflow-events`);
                    setLogs(logsRes.data);
                    break;
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const formatPrice = (price: number) => {
        if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
        if (price >= 100000) return `₹${(price / 100000).toFixed(1)} Lac`;
        return `₹${price.toLocaleString('en-IN')}`;
    };

    const handleOverrideRating = async (sellerId: string, newRating: number) => {
        try {
            // Use the dedicated rating endpoint so the new rating is folded into the
            // existing average (admin ratings count as one additional rating).
            await axios.post(`${API_BASE_URL}/sellers/${sellerId}/rate`, { rating: newRating });
            alert('Rating submitted successfully! (admin rating recorded)');
            fetchData();
        } catch (error: any) {
            alert('Failed to submit rating. Make sure you are logged in as admin. ' + (error?.response?.data?.error || ''));
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1 style={{ marginBottom: '20px', color: '#333' }}>Admin Dashboard</h1>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #ddd', flexWrap: 'wrap' }}>
                {(['buyers', 'sellers', 'properties', 'leads', 'matches', 'logs', 'property-map', 'buyer-map', 'manual-scrape', 'fb-scrape'] as TabType[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '10px 20px',
                            border: 'none',
                            background: activeTab === tab
                                ? (tab === 'fb-scrape' || tab === 'manual-scrape' ? '#1877F2'
                                    : tab === 'property-map' || tab === 'buyer-map' ? '#667eea'
                                        : '#4CAF50')
                                : '#f0f0f0',
                            color: activeTab === tab ? 'white' : '#333',
                            cursor: 'pointer',
                            borderRadius: '5px 5px 0 0',
                            fontWeight: activeTab === tab ? 'bold' : 'normal',
                            textTransform: 'capitalize',
                        }}
                    >
                        {tab === 'fb-scrape' ? 'FB Scrape'
                            : tab === 'manual-scrape' ? 'Manual Scrape'
                                : tab === 'property-map' ? 'Property Map'
                                    : tab === 'buyer-map' ? 'Buyer Map'
                                        : tab}
                    </button>
                ))}
            </div>

            {/* Loading/Error States */}
            {loading && <p>Loading...</p>}
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}

            {/* Global Admin Tools */}
            <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '20px',
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #e8eaf6 0%, #f3e5f5 100%)',
                borderRadius: '8px',
                border: '1px solid #d1c4e9',
                alignItems: 'center',
                flexWrap: 'wrap',
            }}>
                <span style={{ fontWeight: 'bold', color: '#4527A0', fontSize: '14px', marginRight: '8px' }}>Admin Tools:</span>

                <button
                    onClick={async () => {
                        if (!window.confirm('Reset ALL seller trust scores, ratings, and deals to 0?\n\nThis cannot be undone.')) return;
                        setResettingSellers(true);
                        setActionMessage(null);
                        try {
                            const res = await axios.post(`${API_BASE_URL}/admin/seed/reset-seller-trust`);
                            if (res.data.success) {
                                setActionMessage(`[OK] ${res.data.message}`);
                                fetchData();
                            } else {
                                setActionMessage(`[ERR] ${res.data.error || 'Failed'}`);
                            }
                        } catch (err: any) {
                            setActionMessage(`[ERR] ${err.response?.data?.error || err.message}`);
                        } finally {
                            setResettingSellers(false);
                        }
                    }}
                    disabled={resettingSellers}
                    style={{
                        padding: '10px 20px',
                        background: resettingSellers ? '#ef9a9a' : '#d32f2f',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: resettingSellers ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        fontSize: '13px',
                    }}
                >
                    {resettingSellers ? 'Resetting...' : 'Reset Seller Trust to 0'}
                </button>

                <button
                    onClick={async () => {
                        if (credentials) { setCredentials(null); return; }
                        try {
                            const res = await axios.get(`${API_BASE_URL}/admin/seed/credentials`);
                            setCredentials(res.data.credentials || []);
                        } catch (err: any) {
                            alert('Failed to fetch credentials: ' + (err.response?.data?.error || err.message));
                        }
                    }}
                    style={{
                        padding: '10px 20px',
                        background: credentials ? '#455A64' : '#607D8B',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '13px',
                    }}
                >
                    {credentials ? 'Hide Credentials' : 'View Credentials'}
                </button>
            </div>

            {/* Feedback messages */}
            {actionMessage && (
                <div style={{
                    padding: '12px 16px',
                    background: actionMessage.includes('[OK]') ? '#e8f5e9' : '#ffebee',
                    color: actionMessage.includes('[OK]') ? '#2e7d32' : '#c62828',
                    borderRadius: '6px',
                    marginBottom: '12px',
                    fontSize: '14px',
                }}>
                    {actionMessage}
                </div>
            )}

            {/* Credentials Table */}
            {credentials && (
                <div style={{
                    marginBottom: '20px',
                    padding: '16px',
                    background: '#263238',
                    borderRadius: '8px',
                    color: '#B0BEC5',
                }}>
                    <h3 style={{ margin: '0 0 12px 0', color: '#4DD0E1' }}>Stored Credentials ({credentials.length})</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #455A64' }}>
                                    <th style={{ padding: '8px', textAlign: 'left', color: '#80CBC4' }}>Role</th>
                                    <th style={{ padding: '8px', textAlign: 'left', color: '#80CBC4' }}>Name</th>
                                    <th style={{ padding: '8px', textAlign: 'left', color: '#80CBC4' }}>Email</th>
                                    <th style={{ padding: '8px', textAlign: 'left', color: '#80CBC4' }}>Password</th>
                                    <th style={{ padding: '8px', textAlign: 'left', color: '#80CBC4' }}>Source</th>
                                    <th style={{ padding: '8px', textAlign: 'left', color: '#80CBC4' }}>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {credentials.map((c: any, i: number) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #37474F' }}>
                                        <td style={{ padding: '6px 8px' }}>
                                            <span style={{
                                                background: c.role === 'admin' ? '#E53935' : c.role === 'buyer' ? '#43A047' : '#FB8C00',
                                                color: 'white',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '11px',
                                                textTransform: 'uppercase',
                                            }}>{c.role}</span>
                                        </td>
                                        <td style={{ padding: '6px 8px' }}>{c.name}</td>
                                        <td style={{ padding: '6px 8px', fontFamily: 'monospace', color: '#81D4FA' }}>{c.email}</td>
                                        <td style={{ padding: '6px 8px', fontFamily: 'monospace', color: '#FFAB91' }}>{c.password}</td>
                                        <td style={{ padding: '6px 8px', fontSize: '11px' }}>{c.source}</td>
                                        <td style={{ padding: '6px 8px', fontSize: '11px' }}>{c.timestamp ? new Date(c.timestamp).toLocaleString() : '--'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Content based on active tab */}
            <div style={{ marginTop: '20px' }}>
                {activeTab === 'buyers' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                            <h2 style={{ margin: 0 }}>All Buyers ({buyers.length})</h2>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={async () => {
                                        if (!window.confirm('Seed demo buyers for Mumbai, Chennai, Hyderabad, Bangalore, Pune & Kochi?\n\nExisting demo buyers will be skipped.')) return;
                                        setSeedingBuyers(true);
                                        setActionMessage(null);
                                        try {
                                            const res = await axios.post(`${API_BASE_URL}/admin/seed/demo-buyers`);
                                            if (res.data.success) {
                                                setActionMessage(`[OK] ${res.data.message}`);
                                                fetchData();
                                            } else {
                                                setActionMessage(`[ERR] ${res.data.error || 'Failed'}`);
                                            }
                                        } catch (err: any) {
                                            setActionMessage(`[ERR] ${err.response?.data?.error || err.message}`);
                                        } finally {
                                            setSeedingBuyers(false);
                                        }
                                    }}
                                    disabled={seedingBuyers}
                                    style={{
                                        padding: '8px 16px',
                                        background: seedingBuyers ? '#B39DDB' : '#7C4DFF',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: seedingBuyers ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold',
                                        fontSize: '13px',
                                    }}
                                >
                                    {seedingBuyers ? 'Seeding...' : 'Seed Demo Buyers'}
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!window.confirm('Delete ALL buyers and their leads/matches?\n\nThis cannot be undone.')) return;
                                        setDeletingBuyers(true);
                                        setActionMessage(null);
                                        try {
                                            const res = await axios.post(`${API_BASE_URL}/admin/seed/delete-all-buyers`);
                                            if (res.data.success) {
                                                setActionMessage(`[OK] ${res.data.message}`);
                                                fetchData();
                                            } else {
                                                setActionMessage(`[ERR] ${res.data.error || 'Failed'}`);
                                            }
                                        } catch (err: any) {
                                            setActionMessage(`[ERR] ${err.response?.data?.error || err.message}`);
                                        } finally {
                                            setDeletingBuyers(false);
                                        }
                                    }}
                                    disabled={deletingBuyers}
                                    style={{
                                        padding: '8px 16px',
                                        background: deletingBuyers ? '#ef9a9a' : '#d32f2f',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: deletingBuyers ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold',
                                        fontSize: '13px',
                                    }}
                                >
                                    {deletingBuyers ? 'Deleting...' : 'Delete All Buyers'}
                                </button>
                            </div>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                                <thead style={{ background: '#4CAF50', color: 'white' }}>
                                    <tr>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Name</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Email</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Phone</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Localities</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>BHK</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Budget</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Area</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Amenities</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Joined</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {buyers.map((buyer, idx) => (
                                        <tr key={buyer.id} style={{ background: idx % 2 === 0 ? '#f9f9f9' : 'white' }}>
                                            <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold' }}>
                                                {buyer.name}
                                                {buyer.metadata?.coordinates?.lat && buyer.metadata?.coordinates?.lon && (
                                                    <div style={{ marginTop: '4px' }}>
                                                        <a href={`https://www.openstreetmap.org/?mlat=${buyer.metadata.coordinates.lat}&mlon=${buyer.metadata.coordinates.lon}#map=16/${buyer.metadata.coordinates.lat}/${buyer.metadata.coordinates.lon}`} target="_blank" rel="noopener noreferrer" style={{ color: '#2196F3', textDecoration: 'none', fontSize: '12px' }}>
                                                            Map
                                                        </a>
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd', fontSize: '13px' }}>{buyer.email}</td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{buyer.phone || 'N/A'}</td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd', maxWidth: '200px' }}>
                                                {Array.isArray(buyer.localities) ? buyer.localities.join(', ') : (buyer.localities || 'N/A')}
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{buyer.bhk ? `${buyer.bhk} BHK` : 'N/A'}</td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd', color: '#2E7D32', fontWeight: 'bold' }}>
                                                {buyer.budgetMin || buyer.budgetMax
                                                    ? `${formatPrice(buyer.budgetMin || 0)} – ${formatPrice(buyer.budgetMax || 0)}`
                                                    : 'N/A'}
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                {buyer.areaMin || buyer.areaMax
                                                    ? `${buyer.areaMin || '?'} – ${buyer.areaMax || '?'} sqft`
                                                    : 'N/A'}
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd', fontSize: '12px' }}>
                                                {Array.isArray(buyer.amenities) && buyer.amenities.length > 0 ? buyer.amenities.join(', ') : 'None'}
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd', fontSize: '12px' }}>{formatDate(buyer.createdAt)}</td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await axios.delete(`${API_BASE_URL}/buyers/${buyer.id}`);
                                                            fetchData();
                                                        } catch (err) {
                                                            alert('Failed to delete buyer');
                                                        }
                                                    }}
                                                    style={{
                                                        padding: '5px 10px', background: '#f44336', color: 'white',
                                                        border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px',
                                                    }}
                                                > Remove</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'sellers' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                            <h2 style={{ margin: 0 }}>All Sellers ({sellers.length})</h2>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={async () => {
                                        if (!window.confirm('Seed demo sellers with properties for Mumbai, Chennai, Hyderabad, Bangalore, Pune & Kochi?\n\nExisting demo sellers will be skipped.')) return;
                                        setSeedingSellers(true);
                                        setActionMessage(null);
                                        try {
                                            const res = await axios.post(`${API_BASE_URL}/admin/seed/demo-sellers`);
                                            if (res.data.success) {
                                                setActionMessage(`[OK] ${res.data.message}`);
                                                fetchData();
                                            } else {
                                                setActionMessage(`[ERR] ${res.data.error || 'Failed'}`);
                                            }
                                        } catch (err: any) {
                                            setActionMessage(`[ERR] ${err.response?.data?.error || err.message}`);
                                        } finally {
                                            setSeedingSellers(false);
                                        }
                                    }}
                                    disabled={seedingSellers}
                                    style={{
                                        padding: '8px 16px',
                                        background: seedingSellers ? '#B39DDB' : '#7C4DFF',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: seedingSellers ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold',
                                        fontSize: '13px',
                                    }}
                                >
                                    {seedingSellers ? 'Seeding...' : 'Seed Demo Sellers'}
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!window.confirm('Delete ALL sellers, their properties, and related leads/matches?\n\nThis cannot be undone.')) return;
                                        setDeletingSellers(true);
                                        setActionMessage(null);
                                        try {
                                            const res = await axios.post(`${API_BASE_URL}/admin/seed/delete-all-sellers`);
                                            if (res.data.success) {
                                                setActionMessage(`[OK] ${res.data.message}`);
                                                fetchData();
                                            } else {
                                                setActionMessage(`[ERR] ${res.data.error || 'Failed'}`);
                                            }
                                        } catch (err: any) {
                                            setActionMessage(`[ERR] ${err.response?.data?.error || err.message}`);
                                        } finally {
                                            setDeletingSellers(false);
                                        }
                                    }}
                                    disabled={deletingSellers}
                                    style={{
                                        padding: '8px 16px',
                                        background: deletingSellers ? '#ef9a9a' : '#d32f2f',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: deletingSellers ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold',
                                        fontSize: '13px',
                                    }}
                                >
                                    {deletingSellers ? 'Deleting...' : 'Delete All Sellers'}
                                </button>
                            </div>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                                <thead style={{ background: '#4CAF50', color: 'white' }}>
                                    <tr>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Name</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Email</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Phone</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Type</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Properties</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Rating</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Deals</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Trust</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Joined</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sellers.map((seller: any, idx: number) => (
                                        <tr key={seller.id} style={{ background: idx % 2 === 0 ? '#f9f9f9' : 'white' }}>
                                            <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold' }}>
                                                {seller.name}
                                                {(() => {
                                                    // Try property coords first, fall back to OSM city search
                                                    const firstPropCoords = seller.properties?.[0]?.metadata?.coordinates;
                                                    const city = seller.metadata?.city;
                                                    const href = firstPropCoords
                                                        ? `https://www.openstreetmap.org/?mlat=${firstPropCoords.lat}&mlon=${firstPropCoords.lon}#map=14/${firstPropCoords.lat}/${firstPropCoords.lon}`
                                                        : city
                                                            ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(city + ', India')}`
                                                            : null;
                                                    return href ? (
                                                        <div style={{ marginTop: '4px' }}>
                                                            <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#2196F3', textDecoration: 'none', fontSize: '12px' }}>Map</a>
                                                        </div>
                                                    ) : null;
                                                })()
                                                }
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd', fontSize: '13px' }}>{seller.email}</td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{seller.phone || 'N/A'}</td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                <span style={{
                                                    background: seller.sellerType === 'owner' ? '#2196F3' : seller.sellerType === 'builder' ? '#9C27B0' : '#ff9800',
                                                    color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', textTransform: 'capitalize',
                                                }}>{seller.sellerType}</span>
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                <strong>{seller.propertyCount || seller._count?.properties || 0}</strong>
                                                {seller.properties && seller.properties.length > 0 && (
                                                    <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                                                        {seller.properties.slice(0, 2).map((p: any) => (
                                                            <div key={p.id}>{p.title?.substring(0, 30)}{p.title?.length > 30 ? '...' : ''}</div>
                                                        ))}
                                                        {seller.properties.length > 2 && <div>+{seller.properties.length - 2} more</div>}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                {seller.ratingCount === 0 ? "Not rated" : (
                                                    <>
                                                        <span style={{ color: '#ff9800' }}>{''.repeat(Math.min(Math.round(seller.rating), 5))}</span>
                                                        <span style={{ marginLeft: '6px', fontWeight: 'bold' }}>{seller.rating.toFixed(1)}</span>
                                                        <span style={{ marginLeft: '8px', fontSize: '12px', color: '#666' }}>({seller.ratingCount} ratings)</span>
                                                    </>
                                                )}
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{seller.completedDeals}</td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                <span style={{
                                                    background: seller.trustScore >= 70 ? '#4CAF50' : seller.trustScore >= 40 ? '#ff9800' : '#f44336',
                                                    color: 'white', padding: '4px 8px', borderRadius: '4px',
                                                }}>{seller.trustScore}</span>
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd', fontSize: '12px' }}>{formatDate(seller.createdAt)}</td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                <select
                                                    onChange={(e) => {
                                                        if (e.target.value) {
                                                            handleOverrideRating(seller.id, Number(e.target.value));
                                                            e.target.value = "";
                                                        }
                                                    }}
                                                    defaultValue=""
                                                    style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '12px' }}
                                                >
                                                    <option value="" disabled>Ov. Rating</option>
                                                    <option value="1">1 Star</option>
                                                    <option value="2">2 Stars</option>
                                                    <option value="3">3 Stars</option>
                                                    <option value="4">4 Stars</option>
                                                    <option value="5">5 Stars</option>
                                                </select>
                                                <button
                                                    onClick={async () => {
                                                        if (window.confirm(`Delete seller "${seller.name}" (${seller.email}) and all their properties?`)) {
                                                            try {
                                                                await axios.delete(`${API_BASE_URL}/sellers/${seller.id}`);
                                                                fetchData();
                                                            } catch (err) {
                                                                alert('Failed to delete seller');
                                                            }
                                                        }
                                                    }}
                                                    style={{
                                                        padding: '5px 10px', background: '#f44336', color: 'white',
                                                        border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px',
                                                        marginLeft: '6px',
                                                    }}
                                                > Remove</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'properties' && (
                    <div>
                        <h2>All Properties ({properties.length})</h2>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                                <thead style={{ background: '#4CAF50', color: 'white' }}>
                                    <tr>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Img</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Map</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Title</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Locality</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Type</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>BHK</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Area</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Price</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Seller</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Contact</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Source</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Posted</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Status</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {properties.map((property, idx) => (
                                        <tr key={property.id} style={{ background: idx % 2 === 0 ? '#f9f9f9' : 'white' }}>
                                            <td style={{ padding: '6px', border: '1px solid #ddd', width: '50px' }}>
                                                {property.metadata?.imageUrl ? (
                                                    <img src={property.metadata.imageUrl} alt="" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px' }} />
                                                ) : (
                                                    <div style={{ width: '48px', height: '48px', background: '#eee', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}></div>
                                                )}
                                            </td>
                                            <td style={{ padding: '6px', border: '1px solid #ddd', width: '36px' }}>
                                                {property.metadata?.coordinates?.lat && property.metadata?.coordinates?.lon ? (
                                                    <a
                                                        href={`https://www.openstreetmap.org/?mlat=${property.metadata.coordinates.lat}&mlon=${property.metadata.coordinates.lon}#map=16/${property.metadata.coordinates.lat}/${property.metadata.coordinates.lon}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ color: '#1976D2', fontSize: '13px', textDecoration: 'none', fontWeight: 'bold' }}
                                                        title="View on OpenStreetMap"
                                                    >Map</a>
                                                ) : <span style={{ color: '#ccc', fontSize: '12px' }}>—</span>}
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd', maxWidth: '250px' }}>
                                                <strong>{property.title}</strong>
                                                {property.description && (
                                                    <div style={{ fontSize: '11px', color: '#666', marginTop: '4px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {property.description}
                                                    </div>
                                                )}
                                                {property.metadata?.sourceUrl && (
                                                    <a href={property.metadata.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#2196F3' }}>View listing </a>
                                                )}
                                                {property.metadata?.groupUrl && (
                                                    <a href={property.metadata.groupUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#9C27B0', marginLeft: property.metadata?.sourceUrl ? '8px' : '0', display: 'inline-block' }}>View Group </a>
                                                )}
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                {property.locality}
                                                {property.metadata?.landmark && <div style={{ fontSize: '11px', color: '#666' }}> {property.metadata.landmark}</div>}
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                <span style={{ background: '#E3F2FD', color: '#1565C0', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', textTransform: 'capitalize' }}>{property.propertyType}</span>
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{property.bhk || '—'}</td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{property.area ? `${property.area} sqft` : '—'}</td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold', color: '#2E7D32' }}>{formatPrice(property.price)}</td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                <strong>{property.seller?.name || 'Unknown'}</strong>
                                                <div style={{ fontSize: '11px', color: '#666' }}>{property.seller?.sellerType || ''}</div>
                                                {property.metadata?.companyName && <div style={{ fontSize: '11px', color: '#888' }}> {property.metadata.companyName}</div>}
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                {property.contact || 'N/A'}
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                {property.metadata?.source ? (
                                                    <span style={{ background: '#FFF3E0', color: '#E65100', padding: '3px 8px', borderRadius: '4px', fontSize: '11px' }}>
                                                        {property.metadata.source}
                                                    </span>
                                                ) : '—'}
                                                {property.metadata?.scraper && (
                                                    <div style={{ fontSize: '10px', color: '#999', marginTop: '3px' }}>{property.metadata.scraper}</div>
                                                )}
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd', fontSize: '12px' }}>
                                                {property.metadata?.postedDate || '—'}
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                <span style={{
                                                    background: property.isActive ? '#4CAF50' : '#f44336',
                                                    color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px',
                                                }}>
                                                    {property.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                {property.isActive && (
                                                    <button
                                                        onClick={async () => {
                                                            if (window.confirm('Mark this property as sold and remove it?')) {
                                                                try {
                                                                    await axios.put(`${API_BASE_URL}/properties/${property.id}/mark-sold`, {});
                                                                    fetchData();
                                                                } catch (err) {
                                                                    alert('Failed to mark as sold');
                                                                }
                                                            }
                                                        }}
                                                        style={{
                                                            padding: '6px 12px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
                                                        }}
                                                    >
                                                        Mark as Sold
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'leads' && (
                    <div>
                        <h2>All Leads ({leads.length})</h2>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                                <thead style={{ background: '#4CAF50', color: 'white' }}>
                                    <tr>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Buyer</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Seller</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Property</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Price</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>State</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Match Score</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Created</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Updated</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leads.map((lead: any, idx: number) => (
                                        <tr key={lead.id} style={{ background: idx % 2 === 0 ? '#f9f9f9' : 'white' }}>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                <strong>{lead.buyer.name}</strong><br />
                                                <small style={{ color: '#666' }}>{lead.buyer.email}</small>
                                                {lead.buyer.phone && <div style={{ fontSize: '11px', color: '#888' }}> {lead.buyer.phone}</div>}
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                <strong>{lead.property?.seller?.name || 'Unknown'}</strong><br />
                                                <small style={{ color: '#666' }}>{lead.property?.seller?.email || ''}</small>
                                                {lead.property?.seller?.sellerType && (
                                                    <div><small style={{ color: '#999', textTransform: 'capitalize' }}>{lead.property.seller.sellerType}</small></div>
                                                )}
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                {lead.property.title}<br />
                                                <small style={{ color: '#666' }}>{lead.property.locality}</small>
                                                {lead.property.bhk && <span style={{ fontSize: '11px', color: '#888' }}> · {lead.property.bhk} BHK</span>}
                                                {lead.property.area && <span style={{ fontSize: '11px', color: '#888' }}> · {lead.property.area} sqft</span>}
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold', color: '#2E7D32' }}>
                                                {lead.property.price ? formatPrice(lead.property.price) : '—'}
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                <span style={{
                                                    background: lead.state === 'CLOSED' ? '#4CAF50' : lead.state === 'NEW' ? '#2196F3' : lead.state === 'CONTACTED' ? '#ff9800' : '#9C27B0',
                                                    color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px',
                                                }}>
                                                    {lead.state}
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                {lead.matchScore ? (
                                                    <strong style={{ color: lead.matchScore >= 70 ? '#4CAF50' : lead.matchScore >= 40 ? '#ff9800' : '#f44336' }}>
                                                        {lead.matchScore.toFixed(1)}%
                                                    </strong>
                                                ) : 'N/A'}
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd', fontSize: '12px' }}>{formatDate(lead.createdAt)}</td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd', fontSize: '12px' }}>{formatDate(lead.updatedAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'matches' && (
                    <div>
                        <h2>All Matches ({matches.length})</h2>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                                <thead style={{ background: '#4CAF50', color: 'white' }}>
                                    <tr>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Buyer</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Seller</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Property</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Match Score</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Location</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Budget</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Size</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Amenities</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Created At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {matches.map((match, idx) => (
                                        <tr key={match.id} style={{ background: idx % 2 === 0 ? '#f9f9f9' : 'white' }}>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                <strong>{match.buyer.name}</strong><br />
                                                <small style={{ color: '#666' }}>{match.buyer.email}</small>
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                <strong>{match.property.seller?.name || 'Unknown'}</strong><br />
                                                <small style={{ color: '#666' }}>{match.property.seller?.email || ''}</small>
                                                {match.property.seller?.sellerType && (
                                                    <div><small style={{ color: '#999', textTransform: 'capitalize' }}>{match.property.seller.sellerType}</small></div>
                                                )}
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                {match.property.title}<br />
                                                <small style={{ color: '#666' }}>{match.property.locality}</small>
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                <strong style={{ color: match.matchScore >= 70 ? '#4CAF50' : match.matchScore >= 40 ? '#ff9800' : '#f44336' }}>{match.matchScore.toFixed(1)}%</strong>
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{match.locationScore?.toFixed(1) || 'N/A'}%</td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{match.budgetScore?.toFixed(1) || 'N/A'}%</td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{match.sizeScore?.toFixed(1) || 'N/A'}%</td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{match.amenitiesScore?.toFixed(1) || 'N/A'}%</td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd', fontSize: '12px' }}>{formatDate(match.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div>
                        <h2>Workflow Event Logs ({logs.length})</h2>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                                <thead style={{ background: '#4CAF50', color: 'white' }}>
                                    <tr>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Timestamp</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Event Type</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>From State</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>To State</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log, idx) => (
                                        <tr key={log.id} style={{ background: idx % 2 === 0 ? '#f9f9f9' : 'white' }}>
                                            <td style={{ padding: '10px', border: '1px solid #ddd', fontSize: '12px' }}>{formatDate(log.createdAt)}</td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                <span style={{
                                                    background: log.eventType === 'ERROR' || log.eventType === 'INVALID_TRANSITION' ? '#f44336' :
                                                        log.eventType === 'STATE_TRANSITION' ? '#2196F3' :
                                                            log.eventType === 'MATCH_GENERATED' ? '#4CAF50' : '#ff9800',
                                                    color: 'white',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '11px',
                                                }}>
                                                    {log.eventType}
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{log.fromState || '-'}</td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{log.toState || '-'}</td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd', fontSize: '13px' }}>{log.description || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'manual-scrape' && (
                    <div>
                        <h2>️ Manual Scrape</h2>
                        <p style={{ color: '#666', marginBottom: '20px' }}>Trigger a manual scrape for properties in a specific city using a selected scraper.</p>

                        <div style={{
                            background: '#f0f4ff',
                            border: '1px solid #c5d5f7',
                            borderRadius: '8px',
                            padding: '20px',
                            marginBottom: '20px',
                            display: 'flex',
                            gap: '15px',
                            alignItems: 'flex-end',
                            flexWrap: 'wrap',
                        }}>
                            <div style={{ flex: '1', minWidth: '200px' }}>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#333' }}>City Name</label>
                                <input
                                    type="text"
                                    value={manualCity}
                                    onChange={(e) => setManualCity(e.target.value)}
                                    placeholder="e.g. Pune, Mumbai, Delhi"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '4px',
                                        border: '1px solid #ddd',
                                    }}
                                />
                            </div>
                            <div style={{ flex: '1', minWidth: '200px' }}>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#333' }}>Scraper</label>
                                <select
                                    value={manualScraper}
                                    onChange={(e) => setManualScraper(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '4px',
                                        border: '1px solid #ddd',
                                    }}
                                >
                                    <option value="" disabled>Select a scraper</option>
                                    {availableScrapers.map(scraper => (
                                        <option key={scraper} value={scraper}>{scraper}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={async () => {
                                    if (!manualCity || !manualScraper) {
                                        alert("Please provide both city and scraper");
                                        return;
                                    }
                                    setManualScraping(true);
                                    setManualScrapeMessage(null);
                                    try {
                                        const res = await axios.post(`${API_BASE_URL}/admin/trigger-scrape`, {
                                            city: manualCity,
                                            scraper: manualScraper,
                                        });
                                        if (res.data.success) {
                                            setManualScrapeMessage(` Scrape triggered successfully. Results: ${JSON.stringify(res.data.results)}`);
                                        } else {
                                            setManualScrapeMessage(` Failed to trigger scrape: ${res.data.error || 'Unknown error'}`);
                                        }
                                    } catch (err: any) {
                                        setManualScrapeMessage(` Failed to trigger scrape: ${err.response?.data?.error || err.message}`);
                                    } finally {
                                        setManualScraping(false);
                                    }
                                }}
                                disabled={manualScraping}
                                style={{
                                    padding: '10px 28px',
                                    background: manualScraping ? '#90CAF9' : '#1877F2',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: manualScraping ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold',
                                    height: '42px',
                                }}
                            >
                                {manualScraping ? 'Scraping...' : 'Trigger Scrape'}
                            </button>
                        </div>
                        {manualScrapeMessage && (
                            <div style={{
                                padding: '15px',
                                background: manualScrapeMessage.includes('') ? '#e8f5e9' : '#ffebee',
                                color: manualScrapeMessage.includes('') ? '#2e7d32' : '#c62828',
                                borderRadius: '4px',
                                marginBottom: '20px',
                            }}>
                                {manualScrapeMessage}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'fb-scrape' && (
                    <div>
                        <h2> Facebook Group Scraper</h2>
                        <p style={{ color: '#666', marginBottom: '20px' }}>Scrape real estate listings from Facebook groups using Apify + Groq LLM extraction.</p>

                        {/* Scrape Form */}
                        <div style={{
                            background: '#f0f4ff',
                            border: '1px solid #c5d5f7',
                            borderRadius: '8px',
                            padding: '20px',
                            marginBottom: '20px',
                            display: 'flex',
                            gap: '15px',
                            alignItems: 'flex-end',
                            flexWrap: 'wrap',
                        }}>
                            <div style={{ flex: '1', minWidth: '300px' }}>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#333' }}>Facebook Group URL</label>
                                <input
                                    type="text"
                                    value={fbGroupUrl}
                                    onChange={(e) => setFbGroupUrl(e.target.value)}
                                    placeholder="https://www.facebook.com/groups/..."
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1px solid #bbb',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        boxSizing: 'border-box',
                                    }}
                                />
                            </div>
                            <div style={{ width: '140px' }}>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#333' }}>No. of Posts</label>
                                <input
                                    type="number"
                                    value={fbPostLimit}
                                    onChange={(e) => setFbPostLimit(Number(e.target.value))}
                                    min={1}
                                    max={100}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1px solid #bbb',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        boxSizing: 'border-box',
                                    }}
                                />
                            </div>
                            <button
                                onClick={async () => {
                                    if (!fbGroupUrl.trim()) {
                                        setFbError('Please enter a Facebook group URL');
                                        return;
                                    }
                                    setFbScraping(true);
                                    setFbError(null);
                                    setFbMessage(null);
                                    setFbResults([]);
                                    try {
                                        const res = await axios.post(`${API_BASE_URL}/admin/fb-scrape`, {
                                            groupUrl: fbGroupUrl.trim(),
                                            limit: fbPostLimit,
                                        });
                                        if (res.data.success && Array.isArray(res.data.data)) {
                                            setFbResults(res.data.data);
                                            setFbMessage(` Scraped ${res.data.data.length} listing(s)`);
                                        } else {
                                            setFbError('Unexpected response format');
                                        }
                                    } catch (err: any) {
                                        setFbError(err.response?.data?.error || err.message || 'Scraping failed');
                                    } finally {
                                        setFbScraping(false);
                                    }
                                }}
                                disabled={fbScraping}
                                style={{
                                    padding: '10px 28px',
                                    background: fbScraping ? '#90CAF9' : '#1877F2',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: fbScraping ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}
                            >
                                {fbScraping ? ' Scraping...' : ' Scrape Group'}
                            </button>

                            <button
                                onClick={async () => {
                                    setFbScraping(true);
                                    setFbError(null);
                                    setFbMessage(null);
                                    setFbResults([]);
                                    try {
                                        const res = await axios.get(`${API_BASE_URL}/admin/fb-load-csv`);
                                        if (res.data.success && Array.isArray(res.data.data)) {
                                            setFbResults(res.data.data);
                                            setFbMessage(` Loaded ${res.data.data.length} listing(s) from CSV`);
                                        } else {
                                            setFbError('Unexpected response format');
                                        }
                                    } catch (err: any) {
                                        setFbError(err.response?.data?.error || err.message || 'Failed to load CSV');
                                    } finally {
                                        setFbScraping(false);
                                    }
                                }}
                                disabled={fbScraping}
                                style={{
                                    padding: '10px 28px',
                                    background: fbScraping ? '#B39DDB' : '#673AB7',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: fbScraping ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}
                            >
                                Load CSV
                            </button>
                        </div>

                        {fbError && <p style={{ color: '#d32f2f', background: '#ffebee', padding: '10px 16px', borderRadius: '6px', marginBottom: '16px' }}> {fbError}</p>}
                        {fbMessage && <p style={{ color: '#2E7D32', background: '#e8f5e9', padding: '10px 16px', borderRadius: '6px', marginBottom: '16px' }}>{fbMessage}</p>}

                        {fbScraping && (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#1877F2' }}>
                                <div style={{ fontSize: '40px', marginBottom: '12px', animation: 'spin 1s linear infinite' }}></div>
                                <p style={{ fontSize: '16px', fontWeight: 'bold' }}>Scraping in progress...</p>
                                <p style={{ color: '#888', fontSize: '13px' }}>This may take a few minutes depending on the number of posts.</p>
                                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                            </div>
                        )}

                        {/* Results Table */}
                        {fbResults.length > 0 && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <h3 style={{ margin: 0 }}>Scraped Results ({fbResults.length})</h3>
                                    <button
                                        onClick={async () => {
                                            setFbSaving(true);
                                            setFbError(null);
                                            try {
                                                const res = await axios.post(`${API_BASE_URL}/admin/fb-save`, { rows: fbResults });
                                                if (res.data.success) {
                                                    setFbMessage(` Saved ${res.data.saved} properties to database!` +
                                                        (res.data.errors?.length > 0 ? ` (${res.data.errors.length} errors)` : ''));
                                                    setFbResults([]);
                                                } else {
                                                    setFbError('Save failed');
                                                }
                                            } catch (err: any) {
                                                setFbError(err.response?.data?.error || err.message || 'Save failed');
                                            } finally {
                                                setFbSaving(false);
                                            }
                                        }}
                                        disabled={fbSaving}
                                        style={{
                                            padding: '10px 24px',
                                            background: fbSaving ? '#A5D6A7' : '#4CAF50',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: fbSaving ? 'not-allowed' : 'pointer',
                                            fontWeight: 'bold',
                                            fontSize: '14px',
                                        }}
                                    >
                                        {fbSaving ? ' Saving...' : ' Save to Database'}
                                    </button>
                                </div>

                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd', fontSize: '13px' }}>
                                        <thead style={{ background: '#1877F2', color: 'white' }}>
                                            <tr>
                                                <th style={{ padding: '10px 8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.2)', width: '40px' }}>✕</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left', border: '1px solid rgba(255,255,255,0.2)' }}>Title</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left', border: '1px solid rgba(255,255,255,0.2)' }}>Locality</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left', border: '1px solid rgba(255,255,255,0.2)' }}>Type</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left', border: '1px solid rgba(255,255,255,0.2)' }}>BHK</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left', border: '1px solid rgba(255,255,255,0.2)' }}>Area</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left', border: '1px solid rgba(255,255,255,0.2)' }}>Price</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left', border: '1px solid rgba(255,255,255,0.2)' }}>Amenities</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left', border: '1px solid rgba(255,255,255,0.2)' }}>Seller</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left', border: '1px solid rgba(255,255,255,0.2)' }}>Contact</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left', border: '1px solid rgba(255,255,255,0.2)' }}>Status</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left', border: '1px solid rgba(255,255,255,0.2)' }}>Date</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left', border: '1px solid rgba(255,255,255,0.2)' }}>Group</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {fbResults.map((row, idx) => (
                                                <tr key={idx} style={{ background: idx % 2 === 0 ? '#f9f9f9' : 'white' }}>
                                                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                                                        <button
                                                            onClick={() => setFbResults(prev => prev.filter((_, i) => i !== idx))}
                                                            title="Remove this row"
                                                            style={{
                                                                background: '#f44336',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                padding: '4px 8px',
                                                                fontSize: '12px',
                                                                fontWeight: 'bold',
                                                            }}
                                                        >✕</button>
                                                    </td>
                                                    <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.TITLE}</td>
                                                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{row.LOCALITY}</td>
                                                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                                        <span style={{ background: '#E3F2FD', color: '#1565C0', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>{row.TYPE}</span>
                                                    </td>
                                                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{row.BHK}</td>
                                                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{row.AREA}</td>
                                                    <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', color: '#2E7D32' }}>{row.PRICE}</td>
                                                    <td style={{ padding: '8px', border: '1px solid #ddd', fontSize: '11px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.AMENITIES}</td>
                                                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{row.SELLER}</td>
                                                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{row.CONTACT}</td>
                                                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                                        <span style={{
                                                            background: row.STATUS === 'ready_to_move' ? '#4CAF50' : row.STATUS === 'under_construction' ? '#ff9800' : '#9e9e9e',
                                                            color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px',
                                                        }}>{row.STATUS}</span>
                                                    </td>
                                                    <td style={{ padding: '8px', border: '1px solid #ddd', fontSize: '11px' }}>{row.CREATED_AT}</td>
                                                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                                        {row.GROUP_URL && row.GROUP_URL !== '-' ? (
                                                            <a href={row.GROUP_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#1877F2', fontSize: '11px' }}>View Group </a>
                                                        ) : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {!fbScraping && fbResults.length === 0 && !fbMessage && (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                <div style={{ fontSize: '48px', marginBottom: '12px' }}></div>
                                <p>Enter a Facebook group URL and click <strong>Scrape Group</strong> to get started.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Summary Stats */}
            <div style={{
                marginTop: '30px',
                padding: '20px',
                background: '#f5f5f5',
                borderRadius: '8px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '15px',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#666' }}>Total Buyers</h3>
                    <p style={{ fontSize: '32px', margin: 0, color: '#4CAF50' }}>{buyers.length}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#666' }}>Total Sellers</h3>
                    <p style={{ fontSize: '32px', margin: 0, color: '#2196F3' }}>{sellers.length}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#666' }}>Total Properties</h3>
                    <p style={{ fontSize: '32px', margin: 0, color: '#ff9800' }}>{properties.length}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#666' }}>Total Leads</h3>
                    <p style={{ fontSize: '32px', margin: 0, color: '#9C27B0' }}>{leads.length}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#666' }}>Total Matches</h3>
                    <p style={{ fontSize: '32px', margin: 0, color: '#F44336' }}>{matches.length}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#666' }}>Event Logs</h3>
                    <p style={{ fontSize: '32px', margin: 0, color: '#607D8B' }}>{logs.length}</p>
                </div>
            </div>

            {/* Property Map Tab */}
            {activeTab === 'property-map' && (
                <div>
                    <h2>All Properties Map</h2>
                    <div style={{ marginBottom: '10px' }}>
                        <MapSearchBar map={propertyMapInstance.current} placeholder="Search for a location..." />
                    </div>
                    <div
                        ref={propertyMapRef}
                        style={{ height: '600px', borderRadius: '8px', border: '1px solid #ddd' }}
                    />
                    <PropertyMapLoader
                        mapRef={propertyMapRef}
                        mapInstance={propertyMapInstance}
                        activeTab={activeTab}
                    />
                </div>
            )}

            {/* Buyer Map Tab */}
            {activeTab === 'buyer-map' && (
                <div>
                    <h2>Buyer Preferred Localities</h2>
                    <div style={{ marginBottom: '10px' }}>
                        <MapSearchBar map={buyerMapInstance.current} placeholder="Search for a location..." />
                    </div>
                    <div
                        ref={buyerMapRef}
                        style={{ height: '600px', borderRadius: '8px', border: '1px solid #ddd' }}
                    />
                    <BuyerMapLoader
                        mapRef={buyerMapRef}
                        mapInstance={buyerMapInstance}
                        activeTab={activeTab}
                    />
                </div>
            )}

        </div>
    );
};

/* ── Embedded map loaders (rendered inside AdminDashboard) ────────────────── */

function PropertyMapLoader({ mapRef, mapInstance, activeTab }: {
    mapRef: React.RefObject<HTMLDivElement | null>;
    mapInstance: React.MutableRefObject<L.Map | null>;
    activeTab: string;
}) {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

    useEffect(() => {
        if (activeTab !== 'property-map') return;
        if (!mapRef.current) return;

        // If map already exists, just invalidate its size
        if (mapInstance.current) {
            mapInstance.current.invalidateSize();
            return;
        }

        const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(map);
        mapInstance.current = map;

        // Fetch and render properties
        const token = localStorage.getItem('hublet_auth_token');
        fetch(`${API_BASE}/properties/map`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((data: Array<{ id: string; title: string; locality: string; bhk: number; price: number; area: number; propertyType: string; lat: number; lon: number }>) => {
                const bounds: [number, number][] = [];
                data.forEach((p) => {
                    const color = p.propertyType === 'apartment' ? '#4CAF50'
                        : p.propertyType === 'house' ? '#2196F3'
                            : p.propertyType === 'villa' ? '#FF9800' : '#9C27B0';
                    const icon = L.divIcon({
                        className: 'custom-marker',
                        html: `<div style="background:${color};width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);color:white;font-size:11px;font-weight:bold;">${p.bhk}</span></div>`,
                        iconSize: [28, 28],
                        iconAnchor: [14, 28],
                        popupAnchor: [0, -28],
                    });
                    const formatP = (price: number) => price >= 10000000 ? `Rs ${(price / 10000000).toFixed(2)} Cr` : price >= 100000 ? `Rs ${(price / 100000).toFixed(1)} L` : `Rs ${price.toLocaleString('en-IN')}`;
                    L.marker([p.lat, p.lon], { icon })
                        .bindPopup(`<div style="min-width:200px;"><h4 style="margin:0 0 6px 0;color:#333;">${p.title}</h4><p style="margin:2px 0;font-size:13px;">${p.locality}</p><p style="margin:2px 0;font-size:13px;">${p.bhk} BHK | ${p.area} sqft | ${p.propertyType}</p><p style="margin:4px 0 0 0;font-size:15px;font-weight:bold;color:#2e7d32;">${formatP(p.price)}</p></div>`)
                        .addTo(map);
                    bounds.push([p.lat, p.lon]);
                });
                if (bounds.length > 0) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
            })
            .catch(console.error);

        return () => { map.remove(); mapInstance.current = null; };
    }, [activeTab]);

    return null;
}

function BuyerMapLoader({ mapRef, mapInstance, activeTab }: {
    mapRef: React.RefObject<HTMLDivElement | null>;
    mapInstance: React.MutableRefObject<L.Map | null>;
    activeTab: string;
}) {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

    useEffect(() => {
        if (activeTab !== 'buyer-map') return;
        if (!mapRef.current) return;

        if (mapInstance.current) {
            mapInstance.current.invalidateSize();
            return;
        }

        const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(map);
        mapInstance.current = map;

        const token = localStorage.getItem('hublet_auth_token');
        fetch(`${API_BASE}/buyers/localities-map`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((data: Array<{ buyerName: string; locality: string; lat: number; lon: number }>) => {
                const bounds: [number, number][] = [];
                const icon = L.divIcon({
                    className: 'buyer-marker',
                    html: `<div style="background:#1565C0;width:24px;height:24px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><span style="color:white;font-size:11px;font-weight:bold;">B</span></div>`,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12],
                    popupAnchor: [0, -12],
                });
                data.forEach((p) => {
                    L.marker([p.lat, p.lon], { icon })
                        .bindPopup(`<div><strong>${p.locality}</strong><br/><span style="font-size:12px;color:#666;">Interested: ${p.buyerName}</span></div>`)
                        .addTo(map);
                    bounds.push([p.lat, p.lon]);
                });
                if (bounds.length > 0) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
            })
            .catch(console.error);

        return () => { map.remove(); mapInstance.current = null; };
    }, [activeTab]);

    return null;
}
