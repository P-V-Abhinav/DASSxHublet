import { useState } from 'react';
import { sellerApi } from '../api/client';

function SellerForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    sellerType: 'owner',
    rating: 0,
    completedDeals: 0,
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await sellerApi.create(formData);
      setMessage(`Seller created successfully! ID: ${response.data.id} | Trust Score: ${response.data.trustScore}`);
      setFormData({
        name: '',
        email: '',
        phone: '',
        sellerType: 'owner',
        rating: 0,
        completedDeals: 0,
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create seller');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Create Seller Profile</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter seller name"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="seller@example.com"
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 9876543210"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Seller Type</label>
            <select
              value={formData.sellerType}
              onChange={(e) => setFormData({ ...formData, sellerType: e.target.value })}
            >
              <option value="owner">Owner</option>
              <option value="broker">Broker</option>
              <option value="agent">Agent</option>
            </select>
          </div>

          <div className="form-group">
            <label>Rating (0-5)</label>
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={formData.rating}
              onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Completed Deals</label>
          <input
            type="number"
            min="0"
            value={formData.completedDeals}
            onChange={(e) => setFormData({ ...formData, completedDeals: parseInt(e.target.value) })}
            placeholder="Number of successfully completed deals"
          />
        </div>

        {message && <div className="success">{message}</div>}
        {error && <div className="error">{error}</div>}

        <button type="submit" className="button" disabled={loading}>
          {loading ? 'Creating...' : 'Create Seller'}
        </button>
      </form>
    </div>
  );
}

export default SellerForm;
