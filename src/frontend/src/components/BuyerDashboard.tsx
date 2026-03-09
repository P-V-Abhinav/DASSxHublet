import { useState, useEffect } from 'react';
import axios from 'axios';
import BuyerForm from './BuyerForm';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

interface BuyerDashboardProps {
  buyerId: string;
  buyerName: string;
}

interface Match {
  id: string;
  matchScore: number;
  locationScore?: number;
  budgetScore?: number;
  sizeScore?: number;
  amenitiesScore?: number;
  property: {
    id: string;
    title: string;
    locality: string;
    area: number;
    bhk: number;
    price: number;
    amenities: string[];
    propertyType: string;
    seller: {
      name: string;
      email: string;
      phone?: string;
      rating: number;
      trustScore: number;
    };
  };
}

export const BuyerDashboard = ({ buyerId, buyerName }: BuyerDashboardProps) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);

  // Fetch matches on component load
  useEffect(() => {
    fetchMatches();
  }, [buyerId]);

  const fetchMatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/matches/buyer/${buyerId}`);
      setMatches(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch matches');
    } finally {
      setLoading(false);
    }
  };

  const handleFindMatches = async () => {
    setLoading(true);
    setError(null);
    try {
      // Trigger matching algorithm
      const response = await axios.post(`${API_BASE_URL}/matches/buyer/${buyerId}/find`, {
        minScore: 50,
        limit: 50,
      });
      setMatches(response.data);
      setShowForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to find matches');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesUpdated = () => {
    handleFindMatches();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', background: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: '20px' }}>🏠 Welcome, {buyerName}!</h1>

      {/* Form Section */}
      {showForm && (
        <div style={{ marginBottom: '30px' }}>
          <BuyerForm buyerId={buyerId} onPreferencesUpdated={handlePreferencesUpdated} />
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: '12px 24px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '20px'
          }}
        >
          Update Preferences
        </button>
      )}

      {/* Matches Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Your Matches ({matches.length})</h2>
          <button
            onClick={fetchMatches}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: loading ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Loading...' : 'Refresh Matches'}
          </button>
        </div>

        {error && <p style={{ color: 'red' }}>Error: {error}</p>}

        {matches.length === 0 && !loading && (
          <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
            No matches found yet. Update your preferences and click "Find Matches" to see properties!
          </p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {matches.map((match) => (
            <div
              key={match.id}
              style={{
                background: 'white',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, color: '#333' }}>{match.property.title}</h3>
                <span style={{
                  background: '#4CAF50',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  {match.matchScore}% Match
                </span>
              </div>

              <p style={{ color: '#666', margin: '8px 0' }}>
                📍 {match.property.locality}
              </p>

              <div style={{ display: 'flex', gap: '15px', margin: '12px 0' }}>
                <span style={{ fontSize: '14px' }}>🏠 {match.property.bhk} BHK</span>
                <span style={{ fontSize: '14px' }}>📏 {match.property.area} sq.ft</span>
                <span style={{ fontSize: '14px' }}>🏢 {match.property.propertyType}</span>
              </div>

              <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#4CAF50', margin: '12px 0' }}>
                ₹{(match.property.price / 10000000).toFixed(2)} Cr
              </p>

              {match.property.amenities.length > 0 && (
                <div style={{ margin: '12px 0' }}>
                  <strong>Amenities:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
                    {match.property.amenities.map((amenity, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: '#e3f2fd',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#1976d2'
                        }}
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Match Score Breakdown */}
              <div style={{ marginTop: '15px', padding: '12px', background: '#f9f9f9', borderRadius: '4px' }}>
                <strong style={{ fontSize: '14px' }}>Match Breakdown:</strong>
                <div style={{ marginTop: '8px' }}>
                  {match.locationScore !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px' }}>Location:</span>
                      <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{match.locationScore}%</span>
                    </div>
                  )}
                  {match.budgetScore !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px' }}>Budget:</span>
                      <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{match.budgetScore}%</span>
                    </div>
                  )}
                  {match.sizeScore !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px' }}>Size:</span>
                      <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{match.sizeScore}%</span>
                    </div>
                  )}
                  {match.amenitiesScore !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px' }}>Amenities:</span>
                      <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{match.amenitiesScore}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Seller Info */}
              <div style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '12px' }}>
                <strong style={{ fontSize: '14px' }}>Seller:</strong>
                <p style={{ margin: '5px 0', fontSize: '13px' }}>
                  {match.property.seller.name} ⭐ {match.property.seller.rating.toFixed(1)}
                </p>
                <p style={{ margin: '5px 0', fontSize: '13px', color: '#666' }}>
                  📧 {match.property.seller.email}
                </p>
                {match.property.seller.phone && (
                  <p style={{ margin: '5px 0', fontSize: '13px', color: '#666' }}>
                    📞 {match.property.seller.phone}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
