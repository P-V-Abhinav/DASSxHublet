import { useState, useEffect } from 'react';
import axios from 'axios';
import PropertyForm from './PropertyForm';

const API_BASE_URL = 'http://localhost:3000/api';

interface SellerDashboardProps {
  sellerId: string;
  sellerName: string;
}

interface Property {
  id: string;
  title: string;
  locality: string;
  area: number;
  bhk: number;
  price: number;
  amenities: string[];
  isActive: boolean;
  createdAt: string;
}

interface Match {
  id: string;
  matchScore: number;
  buyer: {
    name: string;
    email: string;
    phone?: string;
  };
  property: {
    title: string;
  };
}

export const SellerDashboard = ({ sellerId, sellerName }: SellerDashboardProps) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, [sellerId]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/properties`);
      // Filter properties by seller
      const sellerProps = response.data.filter((p: any) => p.sellerId === sellerId);
      setProperties(sellerProps);
    } catch (err) {
      console.error('Failed to fetch properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchesForProperty = async (propertyId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/matches/property/${propertyId}`);
      setMatches(response.data);
      setSelectedProperty(propertyId);
    } catch (err) {
      console.error('Failed to fetch matches:', err);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🏢 Seller Dashboard - {sellerName}</h1>

      <button
        onClick={() => setShowAddForm(!showAddForm)}
        style={{
          padding: '12px 24px',
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px',
        }}
      >
        {showAddForm ? 'Cancel' : '+ Add New Property'}
      </button>

      {showAddForm && (
        <div style={{ marginBottom: '30px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
          <PropertyForm onSuccess={() => {
            setShowAddForm(false);
            fetchProperties();
          }} />
        </div>
      )}

      <h2>Your Properties ({properties.length})</h2>
      
      {loading && <p>Loading...</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {properties.map((property) => (
          <div
            key={property.id}
            style={{
              border: '1px solid #ddd',
              padding: '15px',
              borderRadius: '8px',
              background: 'white',
            }}
          >
            <h3>{property.title}</h3>
            <p>📍 {property.locality}</p>
            <p>🏠 {property.bhk} BHK | {property.area} sq ft</p>
            <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#4CAF50' }}>
              ₹{(property.price / 100000).toFixed(2)} Lakhs
            </p>
            <p style={{
              color: property.isActive ? 'green' : 'red',
              fontWeight: 'bold',
            }}>
              {property.isActive ? '✓ Active' : '✗ Inactive'}
            </p>
            <button
              onClick={() => fetchMatchesForProperty(property.id)}
              style={{
                width: '100%',
                padding: '10px',
                background: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              View Matches
            </button>
          </div>
        ))}
      </div>

      {selectedProperty && matches.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h2>Matches for Selected Property</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#4CAF50', color: 'white' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left' }}>Buyer Name</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Phone</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Match Score</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match, idx) => (
                <tr key={match.id} style={{ background: idx % 2 === 0 ? '#f9f9f9' : 'white' }}>
                  <td style={{ padding: '10px' }}>{match.buyer.name}</td>
                  <td style={{ padding: '10px' }}>{match.buyer.email}</td>
                  <td style={{ padding: '10px' }}>{match.buyer.phone || 'N/A'}</td>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: '#4CAF50' }}>
                    {match.matchScore.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
