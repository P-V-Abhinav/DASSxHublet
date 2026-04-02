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
      id: string;
      name: string;
      email: string;
      phone?: string;
      rating: number;
      ratingCount: number;
      trustScore: number;
    };
  };
}

interface BuyerPrefs {
  minBudget?: number;
  maxBudget?: number;
  areaMin?: number;
  areaMax?: number;
  bhk?: number;
  localities: string[];
  amenities: string[];
}

const formatPrice = (price: number): string => {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`;
  return `₹${price.toLocaleString()}`;
};

export const BuyerDashboard = ({ buyerId, buyerName }: BuyerDashboardProps) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);
  const [buyerPrefs, setBuyerPrefs] = useState<BuyerPrefs | null>(null);

  const fetchBuyerPrefs = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/buyers/${buyerId}`);
      const b = res.data;
      const parseArr = (val: any): string[] => {
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') { try { return JSON.parse(val); } catch { return []; } }
        return [];
      };
      setBuyerPrefs({
        minBudget: b.budgetMin ?? undefined,
        maxBudget: b.budgetMax ?? undefined,
        areaMin: b.areaMin ?? undefined,
        areaMax: b.areaMax ?? undefined,
        bhk: b.bhk ?? undefined,
        localities: parseArr(b.localities),
        amenities: parseArr(b.amenities),
      });
    } catch {}
  };

  // Fetch matches on component load
  useEffect(() => {
    fetchMatches();
    fetchBuyerPrefs();
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
    fetchBuyerPrefs();
    handleFindMatches();
  };

  const handleRateSeller = async (sellerId: string, rating: number) => {
    try {
      // Use the same token key used by the app auth utilities
      const token = localStorage.getItem('hublet_auth_token') || localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/sellers/${sellerId}/rate`, { rating }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      alert('Rating submitted successfully!');
      fetchMatches();
    } catch (err) {
      alert('Failed to rate seller');
    }
  };

  const handleContactAgent = async (sellerId: string) => {
    try {
      // Basic mock since real emailing happens in backend
      const token = localStorage.getItem('hublet_auth_token') || localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/sellers/${sellerId}/contact`, 
        { message: 'I am interested in your property', buyerName, buyerEmail: '' },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      alert('Email sent to seller successfully!');
    } catch (err) {
      alert('Failed to send email to seller');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', background: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: '20px' }}> Welcome, {buyerName}!</h1>

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

        {/* Your Preferences Summary */}
        {buyerPrefs && (buyerPrefs.localities.length > 0 || buyerPrefs.minBudget || buyerPrefs.maxBudget || buyerPrefs.bhk || buyerPrefs.amenities.length > 0) && (
          <div style={{
            background: 'white',
            borderRadius: '10px',
            padding: '14px 18px',
            marginBottom: '20px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
            border: '1px solid #e8edf5',
          }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#888', marginBottom: '10px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
               Your Search Preferences
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              {buyerPrefs.localities.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px' }}></span>
                  {buyerPrefs.localities.map((loc, i) => (
                    <span key={i} style={{ background: '#f0f4ff', color: '#3b4eb8', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' }}>{loc}</span>
                  ))}
                </div>
              )}
              {(buyerPrefs.minBudget || buyerPrefs.maxBudget) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '13px' }}></span>
                  <span style={{ background: '#f0fff4', color: '#166534', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' }}>
                    {buyerPrefs.minBudget ? formatPrice(buyerPrefs.minBudget) : '–'}
                    {' → '}
                    {buyerPrefs.maxBudget ? formatPrice(buyerPrefs.maxBudget) : '–'}
                  </span>
                </div>
              )}
              {buyerPrefs.bhk && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '13px' }}></span>
                  <span style={{ background: '#fff7eb', color: '#92400e', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' }}>{buyerPrefs.bhk} BHK</span>
                </div>
              )}
              {buyerPrefs.amenities.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px' }}></span>
                  {buyerPrefs.amenities.map((a, i) => (
                    <span key={i} style={{ background: '#fdf4ff', color: '#7e22ce', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' }}>{a}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

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
                 {match.property.locality}
              </p>

              <div style={{ display: 'flex', gap: '15px', margin: '12px 0' }}>
                <span style={{ fontSize: '14px' }}> {match.property.bhk} BHK</span>
                <span style={{ fontSize: '14px' }}> {match.property.area} sq.ft</span>
                <span style={{ fontSize: '14px' }}> {match.property.propertyType}</span>
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
              <div style={{ marginTop: '15px', padding: '14px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
                <strong style={{ fontSize: '13px', color: '#444' }}>Match Breakdown:</strong>
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

                  {/* Location */}
                  {match.locationScore !== undefined && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '12px', color: '#555', fontWeight: '600' }}> Location</span>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: match.locationScore >= 75 ? '#16a34a' : match.locationScore >= 40 ? '#d97706' : '#dc2626' }}>
                          {match.locationScore}%
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                        {buyerPrefs && buyerPrefs.localities.length > 0
                          ? buyerPrefs.localities.map((loc, i) => {
                              const matched =
                                match.property.locality.toLowerCase().includes(loc.toLowerCase()) ||
                                loc.toLowerCase().includes(match.property.locality.toLowerCase());
                              return (
                                <span key={i} style={{
                                  padding: '2px 8px', borderRadius: '10px', fontSize: '11px',
                                  background: matched ? '#dcfce7' : '#f3f4f6',
                                  color: matched ? '#15803d' : '#6b7280',
                                  border: `1px solid ${matched ? '#86efac' : '#d1d5db'}`,
                                }}>
                                  {matched ? '✓' : '○'} {loc}
                                </span>
                              );
                            })
                          : null
                        }
                        <span style={{ fontSize: '11px', color: '#888', marginLeft: '2px' }}>→ {match.property.locality}</span>
                      </div>
                    </div>
                  )}

                  {/* Budget */}
                  {match.budgetScore !== undefined && (() => {
                    const price = match.property.price;
                    const pMin = buyerPrefs?.minBudget || 0;
                    const pMax = buyerPrefs?.maxBudget || price * 2;
                    const domainMax = Math.max(pMax, price) * 1.3;
                    const toP = (v: number) => Math.min(98, Math.max(2, (v / domainMax) * 100));
                    const inRange = price >= pMin && price <= (buyerPrefs?.maxBudget ?? Infinity);
                    const hasBudgetPrefs = (buyerPrefs?.minBudget !== undefined && buyerPrefs?.minBudget !== null) || 
                                         (buyerPrefs?.maxBudget !== undefined && buyerPrefs?.maxBudget !== null);
                    return (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '12px', color: '#555', fontWeight: '600' }}> Budget</span>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: match.budgetScore >= 75 ? '#16a34a' : match.budgetScore >= 40 ? '#d97706' : '#dc2626' }}>
                            {match.budgetScore}%
                          </span>
                        </div>
                        {hasBudgetPrefs ? (
                          <>
                            <div style={{ position: 'relative', height: '16px', background: '#e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                              <div style={{
                                position: 'absolute', left: `${toP(pMin)}%`, width: `${toP(pMax) - toP(pMin)}%`,
                                height: '100%', background: '#bbf7d0',
                              }} />
                              <div style={{
                                position: 'absolute', left: `${toP(price)}%`, top: 0,
                                transform: 'translateX(-50%)',
                                width: '8px', height: '16px',
                                background: inRange ? '#16a34a' : '#f59e0b',
                                borderRadius: '4px', border: '1.5px solid white',
                              }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px' }}>
                              <span style={{ color: '#888' }}>
                                Your range: {formatPrice(pMin)} – {formatPrice(pMax)}
                              </span>
                              <span style={{ fontWeight: '600', color: inRange ? '#16a34a' : '#f59e0b' }}>
                                {formatPrice(price)} {inRange ? '✓' : ' over'}
                              </span>
                            </div>
                          </>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#888' }}>No specific budget in your preferences</span>
                        )}
                      </div>
                    );
                  })()}

                  {/* Size / BHK */}
                  {match.sizeScore !== undefined && (() => {
                    const area = match.property.area;
                    const aMin = buyerPrefs?.areaMin || 0;
                    const aMax = buyerPrefs?.areaMax || area * 2;
                    const domainMax = Math.max(aMax, area) * 1.3;
                    const toP = (v: number) => Math.min(98, Math.max(2, (v / domainMax) * 100));
                    const inRange = area >= aMin && area <= (buyerPrefs?.areaMax ?? Infinity);
                    const hasSizePrefs = (buyerPrefs?.areaMin !== undefined && buyerPrefs?.areaMin !== null) || 
                                       (buyerPrefs?.areaMax !== undefined && buyerPrefs?.areaMax !== null) || 
                                       (buyerPrefs?.bhk !== undefined && buyerPrefs?.bhk !== null);
                    
                    return (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <span style={{ fontSize: '12px', color: '#555', fontWeight: '600' }}> Size</span>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: match.sizeScore >= 75 ? '#16a34a' : match.sizeScore >= 40 ? '#d97706' : '#dc2626' }}>
                            {match.sizeScore}%
                          </span>
                        </div>
                        {hasSizePrefs ? (
                          <>
                            {/* Visual Bar for Area if min/max exists */}
                            {(buyerPrefs?.areaMin || buyerPrefs?.areaMax) && (
                              <div style={{ position: 'relative', height: '12px', background: '#e5e7eb', borderRadius: '6px', overflow: 'hidden', margin: '8px 0' }}>
                                <div style={{
                                  position: 'absolute', left: `${toP(aMin)}%`, width: `${toP(aMax) - toP(aMin)}%`,
                                  height: '100%', background: '#dbeafe',
                                }} />
                                <div style={{
                                  position: 'absolute', left: `${toP(area)}%`, top: 0,
                                  transform: 'translateX(-50%)',
                                  width: '6px', height: '12px',
                                  background: inRange ? '#3b82f6' : '#f59e0b',
                                  borderRadius: '3px', border: '1px solid white',
                                }} />
                              </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', flexWrap: 'wrap' }}>
                              {buyerPrefs?.bhk && (
                                <span style={{ background: '#f0f4ff', padding: '2px 8px', borderRadius: '8px', color: '#3b4eb8' }}>
                                  Wanted: {buyerPrefs.bhk} BHK
                                </span>
                              )}
                              {buyerPrefs?.areaMin || buyerPrefs?.areaMax ? (
                                <span style={{ color: '#666' }}>({buyerPrefs.areaMin || 0}-{buyerPrefs.areaMax || '∞'} sq.ft)</span>
                              ) : null}
                              
                              <span style={{ color: '#ccc' }}>→</span>
                              
                              <span style={{
                                background: buyerPrefs?.bhk === match.property.bhk ? '#dcfce7' : '#fef9c3',
                                padding: '2px 8px', borderRadius: '8px',
                                color: buyerPrefs?.bhk === match.property.bhk ? '#15803d' : '#713f12',
                              }}>
                                {buyerPrefs?.bhk != null && buyerPrefs.bhk === match.property.bhk ? '✓ ' : buyerPrefs?.bhk != null ? '~ ' : ''}
                                {match.property.bhk} BHK · {match.property.area} sq.ft
                              </span>
                            </div>
                          </>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#888' }}>No specific size in your preferences</span>
                        )}
                      </div>
                    );
                  })()}

                  {/* Amenities */}
                  {match.amenitiesScore !== undefined && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '12px', color: '#555', fontWeight: '600' }}> Amenities</span>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: match.amenitiesScore >= 75 ? '#16a34a' : match.amenitiesScore >= 40 ? '#d97706' : '#dc2626' }}>
                          {match.amenitiesScore}%
                        </span>
                      </div>
                      {buyerPrefs && buyerPrefs.amenities.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {buyerPrefs.amenities.map((am, i) => {
                            const has = match.property.amenities.some(
                              (pa: string) =>
                                pa.toLowerCase().includes(am.toLowerCase()) ||
                                am.toLowerCase().includes(pa.toLowerCase())
                            );
                            return (
                              <span key={i} style={{
                                padding: '2px 8px', borderRadius: '10px', fontSize: '11px',
                                background: has ? '#dcfce7' : '#fee2e2',
                                color: has ? '#15803d' : '#991b1b',
                                border: `1px solid ${has ? '#86efac' : '#fca5a5'}`,
                              }}>
                                {has ? '✓' : '✗'} {am}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#888' }}>No specific amenities in your preferences</span>
                      )}
                    </div>
                  )}

                </div>
              </div>

              {/* Seller Info */}
              <div style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '12px' }}>
                <strong style={{ fontSize: '14px' }}>Seller:</strong>
                <p style={{ margin: '5px 0', fontSize: '13px' }}>
                  {match.property.seller.name}  {match.property.seller.ratingCount === 0 ? "Not rated" : match.property.seller.rating.toFixed(1)}
                </p>
                <p style={{ margin: '5px 0', fontSize: '13px', color: '#666' }}>
                   {match.property.seller.email}
                </p>
                {match.property.seller.phone && (
                  <p style={{ margin: '5px 0', fontSize: '13px', color: '#666' }}>
                     {match.property.seller.phone}
                  </p>
                )}

                <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexDirection: 'column' }}>
                  <button 
                    onClick={() => handleContactAgent(match.property.seller.id)} 
                    style={{ padding: '8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                  >
                    Contact Agent / Email Seller
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <select 
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val) handleRateSeller(match.property.seller.id, val);
                        e.target.value = "";
                      }} 
                      defaultValue=""
                      style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '13px', flex: 1 }}
                    >
                      <option value="" disabled>Rate this seller</option>
                      <option value="1">1 Star</option>
                      <option value="2">2 Stars</option>
                      <option value="3">3 Stars</option>
                      <option value="4">4 Stars</option>
                      <option value="5">5 Stars</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
