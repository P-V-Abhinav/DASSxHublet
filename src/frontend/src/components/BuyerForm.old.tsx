import { useState } from 'react';
import { buyerApi } from '../api/client';

function BuyerForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    rawPreferences: '',
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
      const response = await buyerApi.create(formData);
      setMessage(`Buyer created successfully! ID: ${response.data.id}`);
      setFormData({ name: '', email: '', phone: '', rawPreferences: '' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create buyer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Create Buyer Profile</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter buyer name"
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
              placeholder="buyer@example.com"
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

        <div className="form-group">
          <label>Property Preferences (Free Text)</label>
          <textarea
            value={formData.rawPreferences}
            onChange={(e) => setFormData({ ...formData, rawPreferences: e.target.value })}
            placeholder="Example: Looking for 2 BHK in Indiranagar or Koramangala, budget 50 lakhs to 70 lakhs, minimum 1000 sqft with parking and gym"
          />
          <small style={{ color: '#666', fontSize: '0.875rem' }}>
            Tip: Mention locality, BHK, budget, area, and amenities for better matches
          </small>
        </div>

        {message && <div className="success">{message}</div>}
        {error && <div className="error">{error}</div>}

        <button type="submit" className="button" disabled={loading}>
          {loading ? 'Creating...' : 'Create Buyer'}
        </button>
      </form>
    </div>
  );
}

export default BuyerForm;
