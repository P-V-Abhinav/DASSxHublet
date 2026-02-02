import { useState, useEffect } from 'react';
import { buyerApi, matchingApi } from '../api/client';

function MatchViewer() {
  const [buyers, setBuyers] = useState<any[]>([]);
  const [selectedBuyerId, setSelectedBuyerId] = useState('');
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load buyers for dropdown
    const fetchBuyers = async () => {
      try {
        const response = await buyerApi.getAll();
        setBuyers(response.data);
      } catch (err) {
        console.error('Failed to fetch buyers:', err);
      }
    };
    fetchBuyers();
  }, []);

  const handleFindMatches = async () => {
    if (!selectedBuyerId) {
      setError('Please select a buyer');
      return;
    }

    setLoading(true);
    setError('');
    setMatches([]);

    try {
      const response = await matchingApi.findForBuyer(selectedBuyerId, {
        minScore: 50,
      });
      setMatches(response.data);
      
      if (response.data.length === 0) {
        setError('No matches found for this buyer. Try adjusting preferences or add more properties.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to find matches');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(price / 100000).toFixed(2)} L`;
  };

  return (
    <div className="card">
      <h2>Find Property Matches</h2>

      <div className="form-group">
        <label>Select Buyer</label>
        <select
          value={selectedBuyerId}
          onChange={(e) => setSelectedBuyerId(e.target.value)}
        >
          <option value="">Choose a buyer</option>
          {buyers.map((buyer) => (
            <option key={buyer.id} value={buyer.id}>
              {buyer.name} ({buyer.email})
            </option>
          ))}
        </select>
        {buyers.length === 0 && (
          <small style={{ color: '#ef4444' }}>
            No buyers found. Please create a buyer first.
          </small>
        )}
      </div>

      <button
        onClick={handleFindMatches}
        className="button"
        disabled={loading || !selectedBuyerId}
      >
        {loading ? 'Finding Matches...' : 'Find Matches'}
      </button>

      {error && <div className="error" style={{ marginTop: '1rem' }}>{error}</div>}

      {matches.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Matched Properties ({matches.length})</h3>
          {matches.map((match) => (
            <div key={match.id} className="match-card">
              <div className="match-score">
                Match Score: {match.matchScore.toFixed(1)}%
              </div>
              
              <h4>{match.property.title}</h4>
              <p style={{ color: '#666', marginBottom: '0.5rem' }}>
                {match.property.locality} • {match.property.bhk} BHK • {match.property.area} sq ft
              </p>
              <p style={{ fontWeight: '600', fontSize: '1.2rem', color: '#667eea' }}>
                {formatPrice(match.property.price)}
              </p>

              {match.property.description && (
                <p style={{ marginTop: '0.5rem', color: '#444' }}>
                  {match.property.description}
                </p>
              )}

              {match.property.amenities && match.property.amenities.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <strong>Amenities:</strong>{' '}
                  <span style={{ color: '#666' }}>
                    {match.property.amenities.join(', ')}
                  </span>
                </div>
              )}

              <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#888' }}>
                <div>
                  <strong>Score Breakdown:</strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <div>Location: {match.locationScore?.toFixed(0)}%</div>
                  <div>Budget: {match.budgetScore?.toFixed(0)}%</div>
                  <div>Size: {match.sizeScore?.toFixed(0)}%</div>
                  <div>Amenities: {match.amenitiesScore?.toFixed(0)}%</div>
                </div>
              </div>

              <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                Seller: {match.property.seller.name} (Trust Score: {match.property.seller.trustScore})
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MatchViewer;
