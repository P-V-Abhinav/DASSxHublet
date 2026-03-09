import { useState, useEffect } from 'react';
import axios from 'axios';
import PropertyForm from './PropertyForm';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

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
  locationScore?: number | null;
  budgetScore?: number | null;
  sizeScore?: number | null;
  amenitiesScore?: number | null;
  buyer: {
    name: string;
    email: string;
    phone?: string;
    localities?: string[] | string;
    areaMin?: number | null;
    areaMax?: number | null;
    bhk?: number | null;
    budgetMin?: number | null;
    budgetMax?: number | null;
    amenities?: string[] | string;
  };
  property: {
    title: string;
  };
}

export const SellerDashboard = ({ sellerId, sellerName }: SellerDashboardProps) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [selectedMatchForBreakdown, setSelectedMatchForBreakdown] = useState<Match | null>(null);
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
      setSelectedMatchForBreakdown(null);
    } catch (err) {
      console.error('Failed to fetch matches:', err);
    }
  };

  const parseStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter((item) => item.length > 0);
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return [];

      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item).trim()).filter((item) => item.length > 0);
        }
      } catch {
        // Fall back to comma-separated or plain string handling
      }

      if (trimmed.includes(',')) {
        return trimmed.split(',').map((item) => item.trim()).filter((item) => item.length > 0);
      }

      return [trimmed];
    }

    return [];
  };

  const formatPrice = (price?: number | null) => {
    if (!price || Number.isNaN(price)) return 'Not specified';
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} Lakhs`;
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const formatBudgetRange = (min?: number | null, max?: number | null) => {
    if (!min && !max) return 'No budget preference';
    if (min && max) return `${formatPrice(min)} to ${formatPrice(max)}`;
    if (min) return `At least ${formatPrice(min)}`;
    return `Up to ${formatPrice(max)}`;
  };

  const formatAreaRange = (min?: number | null, max?: number | null) => {
    if (!min && !max) return 'No area preference';
    if (min && max) return `${min} to ${max} sq ft`;
    if (min) return `At least ${min} sq ft`;
    return `Up to ${max} sq ft`;
  };

  const getScoreText = (score?: number | null) =>
    score !== null && score !== undefined ? `${score.toFixed(1)}%` : 'N/A';

  const selectedPropertyData = selectedProperty
    ? properties.find((property) => property.id === selectedProperty) || null
    : null;

  const buyerLocalities = parseStringArray(selectedMatchForBreakdown?.buyer?.localities);
  const buyerAmenities = parseStringArray(selectedMatchForBreakdown?.buyer?.amenities);
  const propertyAmenities = parseStringArray(selectedPropertyData?.amenities);
  const matchedAmenities = buyerAmenities.filter((amenity) =>
    propertyAmenities.map((item) => item.toLowerCase()).includes(amenity.toLowerCase())
  );

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
          <PropertyForm fixedSellerId={sellerId} onSuccess={() => {
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
                    <div>{match.matchScore.toFixed(1)}%</div>
                    <button
                      onClick={() => setSelectedMatchForBreakdown(match)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#1565c0',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        padding: '0',
                        marginTop: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      View Breakdown
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedMatchForBreakdown && selectedPropertyData && (
        <div
          onClick={() => setSelectedMatchForBreakdown(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '900px',
              background: '#fff',
              borderRadius: '10px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
              maxHeight: '85vh',
              overflow: 'auto',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h2 style={{ margin: 0, marginBottom: '8px' }}>Match Score Breakdown</h2>
                <p style={{ margin: 0, color: '#555' }}>
                  Buyer: <strong>{selectedMatchForBreakdown.buyer.name}</strong> | Property:{' '}
                  <strong>{selectedPropertyData.title}</strong>
                </p>
                <p style={{ marginTop: '8px', marginBottom: 0, color: '#2e7d32', fontWeight: 'bold' }}>
                  Total Match Score: {selectedMatchForBreakdown.matchScore.toFixed(1)}%
                </p>
              </div>
              <button
                onClick={() => setSelectedMatchForBreakdown(null)}
                style={{
                  border: 'none',
                  background: '#efefef',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Close
              </button>
            </div>

            <div style={{ marginTop: '18px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                <thead style={{ background: '#f5f5f5' }}>
                  <tr>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Parameter</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Score</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Buyer Wanted</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Property Has</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 600 }}>Location</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{getScoreText(selectedMatchForBreakdown.locationScore)}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      {buyerLocalities.length > 0 ? buyerLocalities.join(', ') : 'No location preference'}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{selectedPropertyData.locality}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 600 }}>Budget</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{getScoreText(selectedMatchForBreakdown.budgetScore)}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      {formatBudgetRange(
                        selectedMatchForBreakdown.buyer.budgetMin,
                        selectedMatchForBreakdown.buyer.budgetMax
                      )}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{formatPrice(selectedPropertyData.price)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 600 }}>Size</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{getScoreText(selectedMatchForBreakdown.sizeScore)}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      BHK: {selectedMatchForBreakdown.buyer.bhk || 'Any'}
                      <br />
                      Area: {formatAreaRange(selectedMatchForBreakdown.buyer.areaMin, selectedMatchForBreakdown.buyer.areaMax)}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      BHK: {selectedPropertyData.bhk}
                      <br />
                      Area: {selectedPropertyData.area} sq ft
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 600 }}>Amenities</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{getScoreText(selectedMatchForBreakdown.amenitiesScore)}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      {buyerAmenities.length > 0 ? buyerAmenities.join(', ') : 'No amenities preference'}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      {propertyAmenities.length > 0 ? propertyAmenities.join(', ') : 'No amenities listed'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '14px', background: '#f8f9fa', padding: '12px', borderRadius: '8px' }}>
              <strong>Amenities overlap:</strong>{' '}
              {matchedAmenities.length > 0 ? matchedAmenities.join(', ') : 'No common amenities'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
