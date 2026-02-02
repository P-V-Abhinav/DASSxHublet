import { useState, useEffect } from 'react';
import axios from 'axios';
import { BuyerForm } from './BuyerForm';

const API_BASE_URL = 'http://localhost:3000/api';

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

  const handlePreferencesUpdated = async () => {
    if (!preferences.trim()) {
      alert('Please enter your preferences');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      // Parse preferences using intent parser
      const response = await axios.post(`${API_BASE_URL}/buyers/${buyerId}/parse-intent`, {
        rawPreferences: preferences,
      });
      alert('Preferences updated successfully!');
      setPreferences('');
      // Fetch new matches
      await handleFindMatches();
    } catch (err: any) {
      setError(err.message || 'Failed to update preferences');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🏠 Welcome, {buyerName}!</h1>

      {/* Preferences Input Section */}
      <div style={{
        background: '#f5f5f5',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '30px',
      }}>
        <h2>Update Your Preferences</h2>
        <textarea
          value={preferences}
          onChange={(e) => setPreferences(e.target.value)}
          placeholder="Tell us what you're looking for... e.g., 'I want a 3 BHK apartment in Koramangala with gym and swimming pool, budget 50-70 lakhs'"
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '12px',
            fontSize: '14px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            fontFamily: 'Arial, sans-serif',
          }}
        />
        <button
          onClick={handleUpdatePreferences}
          disabled={submitting}
          style={{
            marginTop: '10px',
            padding: '12px 24px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          {submitting ? 'Updating...' : 'Update Preferences & Find Matches'}
        </button>
        <button
          onClick={handleFindMatches}
          disabled={submitting}
          style={{
            marginTop: '10px',
            marginLeft: '10px',
            padding: '12px 24px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontSize: '16px',
          }}
        >
          {submitting ? 'Searching...' : 'Refresh Matches'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ padding: '12px', background: '#ffebee', color: '#c62828', borderRadius: '4px', marginBottom: '20px' }}>
          Error: {error}
        </div>
      )}

      {/* Matches Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Your Matches ({matches.length})</h2>
          {loading && <span>Loading...</span>}
        </div>

        {matches.length === 0 && !loading && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            background: '#f5f5f5',
            borderRadius: '8px',
          }}>
            <p style={{ fontSize: '18px', color: '#666' }}>No matches yet. Update your preferences to find matching properties!</p>
          </div>
        )}

        {/* Matches List - Scrollable */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '20px',
        }}>
          {matches.map((match) => (
            <div
              key={match.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '20px',
                background: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }}
            >
              {/* Match Score Badge */}
              <div style={{
                background: match.matchScore >= 80 ? '#4CAF50' : match.matchScore >= 60 ? '#ff9800' : '#2196F3',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '20px',
                display: 'inline-block',
                fontWeight: 'bold',
                marginBottom: '15px',
              }}>
                {match.matchScore.toFixed(0)}% Match
              </div>

              {/* Property Details */}
              <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{match.property.title}</h3>
              <p style={{ color: '#666', margin: '5px 0' }}>
                📍 {match.property.locality} | {match.property.propertyType}
              </p>
              <p style={{ color: '#666', margin: '5px 0' }}>
                🏠 {match.property.bhk} BHK | {match.property.area} sq ft
              </p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#4CAF50', margin: '10px 0' }}>
                ₹{(match.property.price / 100000).toFixed(2)} Lakhs
              </p>

              {/* Amenities */}
              {match.property.amenities.length > 0 && (
                <div style={{ margin: '10px 0' }}>
                  <strong>Amenities:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
                    {match.property.amenities.slice(0, 4).map((amenity, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: '#e3f2fd',
                          color: '#1976d2',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                        }}
                      >
                        {amenity}
                      </span>
                    ))}
                    {match.property.amenities.length > 4 && (
                      <span style={{ fontSize: '12px', color: '#666' }}>
                        +{match.property.amenities.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Score Breakdown */}
              <div style={{
                marginTop: '15px',
                padding: '10px',
                background: '#f5f5f5',
                borderRadius: '4px',
                fontSize: '12px',
              }}>
                <strong>Match Breakdown:</strong>
                <div style={{ marginTop: '5px' }}>
                  {match.locationScore !== undefined && (
                    <div>📍 Location: {match.locationScore.toFixed(0)}%</div>
                  )}
                  {match.budgetScore !== undefined && (
                    <div>💰 Budget: {match.budgetScore.toFixed(0)}%</div>
                  )}
                  {match.sizeScore !== undefined && (
                    <div>📏 Size: {match.sizeScore.toFixed(0)}%</div>
                  )}
                  {match.amenitiesScore !== undefined && (
                    <div>✨ Amenities: {match.amenitiesScore.toFixed(0)}%</div>
                  )}
                </div>
              </div>

              {/* Seller Info */}
              <div style={{
                marginTop: '15px',
                paddingTop: '15px',
                borderTop: '1px solid #ddd',
              }}>
                <strong>Seller:</strong> {match.property.seller.name}
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  ⭐ Rating: {match.property.seller.rating.toFixed(1)}/5 | Trust Score: {match.property.seller.trustScore}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  📧 {match.property.seller.email}
                  {match.property.seller.phone && ` | 📞 ${match.property.seller.phone}`}
                </div>
              </div>

              {/* Contact Button */}
              <button
                style={{
                  marginTop: '15px',
                  width: '100%',
                  padding: '10px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
                onClick={() => alert(`Contact seller: ${match.property.seller.email}`)}
              >
                Contact Seller
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
