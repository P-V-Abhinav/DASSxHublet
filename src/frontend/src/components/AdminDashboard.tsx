import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

interface Buyer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  localities: string[];
  bhk?: number;
  budgetMin?: number;
  budgetMax?: number;
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
  locality: string;
  area: number;
  bhk: number;
  price: number;
  amenities: string[];
  propertyType: string;
  isActive: boolean;
  createdAt: string;
  seller: Seller;
}

interface Lead {
  id: string;
  state: string;
  matchScore?: number;
  createdAt: string;
  updatedAt: string;
  buyer: { name: string; email: string };
  property: { title: string; locality: string };
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
  property: { title: string; locality: string };
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
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Amenities</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {buyers.map((buyer, idx) => (
                    <tr key={buyer.id} style={{ background: idx % 2 === 0 ? '#f9f9f9' : 'white' }}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{buyer.name}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{buyer.email}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{buyer.phone || 'N/A'}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{buyer.localities.join(', ')}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{buyer.bhk || 'N/A'}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        {buyer.budgetMin && buyer.budgetMax
                          ? `₹${buyer.budgetMin / 100000}L - ₹${buyer.budgetMax / 100000}L`
                          : 'N/A'}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{buyer.amenities.join(', ')}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{formatDate(buyer.createdAt)}</td>
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
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Rating</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Completed Deals</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Trust Score</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {sellers.map((seller, idx) => (
                    <tr key={seller.id} style={{ background: idx % 2 === 0 ? '#f9f9f9' : 'white' }}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{seller.name}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{seller.email}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{seller.phone || 'N/A'}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{seller.sellerType}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        <span style={{ color: '#ff9800' }}>{'⭐'.repeat(Math.round(seller.rating))}</span> {seller.rating.toFixed(1)}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{seller.completedDeals}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        <span style={{
                          background: seller.trustScore >= 70 ? '#4CAF50' : seller.trustScore >= 40 ? '#ff9800' : '#f44336',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                        }}>
                          {seller.trustScore}
                        </span>
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{formatDate(seller.createdAt)}</td>
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
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Title</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Locality</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Type</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>BHK</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Area (sqft)</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Price</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Amenities</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Seller</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((property, idx) => (
                    <tr key={property.id} style={{ background: idx % 2 === 0 ? '#f9f9f9' : 'white' }}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{property.title}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{property.locality}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{property.propertyType}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{property.bhk}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{property.area}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>₹{(property.price / 100000).toFixed(1)}L</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{property.amenities.join(', ')}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{property.seller.name}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        <span style={{
                          background: property.isActive ? '#4CAF50' : '#f44336',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                        }}>
                          {property.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{formatDate(property.createdAt)}</td>
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
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Property</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>State</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Match Score</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Created At</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Updated At</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, idx) => (
                    <tr key={lead.id} style={{ background: idx % 2 === 0 ? '#f9f9f9' : 'white' }}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        {lead.buyer.name}<br />
                        <small style={{ color: '#666' }}>{lead.buyer.email}</small>
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        {lead.property.title}<br />
                        <small style={{ color: '#666' }}>{lead.property.locality}</small>
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        <span style={{
                          background: lead.state === 'CLOSED' ? '#4CAF50' : lead.state === 'NEW' ? '#2196F3' : '#ff9800',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                        }}>
                          {lead.state}
                        </span>
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{lead.matchScore?.toFixed(1) || 'N/A'}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{formatDate(lead.createdAt)}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{formatDate(lead.updatedAt)}</td>
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
                        {match.buyer.name}<br />
                        <small style={{ color: '#666' }}>{match.buyer.email}</small>
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        {match.property.title}<br />
                        <small style={{ color: '#666' }}>{match.property.locality}</small>
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        <strong style={{ color: '#4CAF50' }}>{match.matchScore.toFixed(1)}%</strong>
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{match.locationScore?.toFixed(1) || 'N/A'}%</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{match.budgetScore?.toFixed(1) || 'N/A'}%</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{match.sizeScore?.toFixed(1) || 'N/A'}%</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{match.amenitiesScore?.toFixed(1) || 'N/A'}%</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{formatDate(match.createdAt)}</td>
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
    </div>
  );
};
