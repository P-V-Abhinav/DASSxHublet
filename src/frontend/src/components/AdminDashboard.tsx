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

type TabType = 'buyers' | 'sellers' | 'properties' | 'leads' | 'matches' | 'logs';

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

    // Fetch data based on active tab
    useEffect(() => {
        fetchData();
    }, [activeTab]);

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

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1 style={{ marginBottom: '20px', color: '#333' }}>🔐 Admin Dashboard</h1>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #ddd' }}>
                {(['buyers', 'sellers', 'properties', 'leads', 'matches', 'logs'] as TabType[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '10px 20px',
                            border: 'none',
                            background: activeTab === tab ? '#4CAF50' : '#f0f0f0',
                            color: activeTab === tab ? 'white' : '#333',
                            cursor: 'pointer',
                            borderRadius: '5px 5px 0 0',
                            fontWeight: activeTab === tab ? 'bold' : 'normal',
                            textTransform: 'capitalize',
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Loading/Error States */}
            {loading && <p>Loading...</p>}
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}

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
                                                <span style={{ color: '#ff9800' }}>{'⭐'.repeat(Math.min(Math.round(seller.rating), 5))}</span> {seller.rating.toFixed(1)}
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{seller.completedDeals}</td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                <span style={{
                                                    background: seller.trustScore >= 70 ? '#4CAF50' : seller.trustScore >= 40 ? '#ff9800' : '#f44336',
                                                    color: 'white', padding: '4px 8px', borderRadius: '4px',
                                                }}>{seller.trustScore}</span>
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd', fontSize: '12px' }}>{formatDate(seller.createdAt)}</td>
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
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Source</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Posted</th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {properties.map((property, idx) => (
                                        <tr key={property.id} style={{ background: idx % 2 === 0 ? '#f9f9f9' : 'white' }}>
                                            <td style={{ padding: '6px', border: '1px solid #ddd', width: '50px' }}>
                                                {property.metadata?.imageUrl ? (
                                                    <img src={property.metadata.imageUrl} alt="" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px' }} />
                                                ) : (
                                                    <div style={{ width: '48px', height: '48px', background: '#eee', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🏠</div>
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
                                                    <a href={property.metadata.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#2196F3' }}>View listing ↗</a>
                                                )}
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                {property.locality}
                                                {property.metadata?.landmark && <div style={{ fontSize: '11px', color: '#666' }}>📍 {property.metadata.landmark}</div>}
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
                                                {property.metadata?.companyName && <div style={{ fontSize: '11px', color: '#888' }}>🏢 {property.metadata.companyName}</div>}
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
                                                {lead.buyer.phone && <div style={{ fontSize: '11px', color: '#888' }}>📞 {lead.buyer.phone}</div>}
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
