import { useState, useEffect } from 'react';
import axios from 'axios';

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

type TabType = 'buyers' | 'sellers' | 'properties' | 'leads' | 'matches' | 'logs' | 'fb-scrape' | 'manual-scrape';

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
    const [seedBuyerMessage, setSeedBuyerMessage] = useState<string | null>(null);
    const [resettingSellers, setResettingSellers] = useState(false);
    const [resetSellerMessage, setResetSellerMessage] = useState<string | null>(null);

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
            <h1 style={{ marginBottom: '20px', color: '#333' }}> Admin Dashboard</h1>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #ddd', flexWrap: 'wrap' }}>
                {(['buyers', 'sellers', 'properties', 'leads', 'matches', 'logs', 'manual-scrape', 'fb-scrape'] as TabType[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '10px 20px',
                            border: 'none',
                            background: activeTab === tab ? (tab === 'fb-scrape' || tab === 'manual-scrape' ? '#1877F2' : '#4CAF50') : '#f0f0f0',
                            color: activeTab === tab ? 'white' : '#333',
                            cursor: 'pointer',
                            borderRadius: '5px 5px 0 0',
                            fontWeight: activeTab === tab ? 'bold' : 'normal',
                            textTransform: 'capitalize',
                        }}
                    >
                        {tab === 'fb-scrape' ? ' FB Scrape' : tab === 'manual-scrape' ? '️ Manual Scrape' : tab}
                    </button>
                ))}
            </div>

            {/* Loading/Error States */}
            {loading && <p>Loading...</p>}
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}

            {/* Demo Seeder Tools */}
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
                <span style={{ fontWeight: 'bold', color: '#4527A0', fontSize: '14px', marginRight: '8px' }}> Demo Tools:</span>

                <button
                    onClick={async () => {
                        if (!window.confirm('Seed 6-7 demo buyers for Mumbai, Chennai, Hyderabad, Bangalore, Pune & Kochi?\n\nExisting demo buyers will be skipped.')) return;
                        setSeedingBuyers(true);
                        setSeedBuyerMessage(null);
                        try {
                            const res = await axios.post(`${API_BASE_URL}/admin/seed/demo-buyers`);
                            if (res.data.success) {
                                setSeedBuyerMessage(` ${res.data.message}`);
                                if (activeTab === 'buyers') fetchData();
                            } else {
                                setSeedBuyerMessage(` ${res.data.error || 'Failed'}`);
                            }
                        } catch (err: any) {
                            setSeedBuyerMessage(` ${err.response?.data?.error || err.message}`);
                        } finally {
                            setSeedingBuyers(false);
                        }
                    }}
                    disabled={seedingBuyers}
                    style={{
                        padding: '10px 20px',
                        background: seedingBuyers ? '#B39DDB' : '#7C4DFF',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: seedingBuyers ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                    }}
                >
                    {seedingBuyers ? ' Seeding...' : ' Seed Demo Buyers'}
                </button>

                <button
                    onClick={async () => {
                        if (!window.confirm('Reset ALL seller trust scores, ratings, and deals to 0?\n\nThis cannot be undone.')) return;
                        setResettingSellers(true);
                        setResetSellerMessage(null);
                        try {
                            const res = await axios.post(`${API_BASE_URL}/admin/seed/reset-seller-trust`);
                            if (res.data.success) {
                                setResetSellerMessage(` ${res.data.message}`);
                                if (activeTab === 'sellers') fetchData();
                            } else {
                                setResetSellerMessage(` ${res.data.error || 'Failed'}`);
                            }
                        } catch (err: any) {
                            setResetSellerMessage(` ${err.response?.data?.error || err.message}`);
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
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                    }}
                >
                    {resettingSellers ? ' Resetting...' : ' Reset Seller Trust to 0'}
                </button>
            </div>

            {/* Seeder feedback messages */}
            {seedBuyerMessage && (
                <div style={{
                    padding: '12px 16px',
                    background: seedBuyerMessage.includes('') ? '#e8f5e9' : '#ffebee',
                    color: seedBuyerMessage.includes('') ? '#2e7d32' : '#c62828',
                    borderRadius: '6px',
                    marginBottom: '12px',
                    fontSize: '14px',
                }}>
                    {seedBuyerMessage}
                </div>
            )}
            {resetSellerMessage && (
                <div style={{
                    padding: '12px 16px',
                    background: resetSellerMessage.includes('') ? '#e8f5e9' : '#ffebee',
                    color: resetSellerMessage.includes('') ? '#2e7d32' : '#c62828',
                    borderRadius: '6px',
                    marginBottom: '12px',
                    fontSize: '14px',
                }}>
                    {resetSellerMessage}
                </div>
            )}

            {/* Content based on active tab */}
            <div style={{ marginTop: '20px' }}>
                {activeTab === 'buyers' && (
                    <div>
                        <h2>All Buyers ({buyers.length})</h2>
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
                                            <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold' }}>{buyer.name}</td>
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
                                                        if (window.confirm(`Delete buyer "${buyer.name}" (${buyer.email})?`)) {
                                                            try {
                                                                await axios.delete(`${API_BASE_URL}/buyers/${buyer.id}`);
                                                                fetchData();
                                                            } catch (err) {
                                                                alert('Failed to delete buyer');
                                                            }
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
                        <h2>All Sellers ({sellers.length})</h2>
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
                                            <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold' }}>{seller.name}</td>
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
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}></th>
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
        </div >
    );
};
