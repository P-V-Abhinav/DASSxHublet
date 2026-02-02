import { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

interface BuyerFormProps {
  buyerId: string;
  onPreferencesUpdated?: () => void;
}

const BuyerForm = ({ buyerId, onPreferencesUpdated }: BuyerFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    minBudget: '',
    maxBudget: '',
    bhk: '',
    localities: '',
    amenities: '',
    additionalNotes: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Update buyer preferences
      const localitiesArray = formData.localities
        .split(',')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      
      const amenitiesArray = formData.amenities
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a.length > 0);

      await axios.put(`${API_BASE_URL}/buyers/${buyerId}`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        minBudget: parseInt(formData.minBudget) || 0,
        maxBudget: parseInt(formData.maxBudget) || 0,
        bhk: parseInt(formData.bhk) || 2,
        localities: localitiesArray,
        amenities: amenitiesArray,
      });

      setMessage('Preferences updated successfully! Finding matches...');
      if (onPreferencesUpdated) {
        setTimeout(() => {
          onPreferencesUpdated();
        }, 1000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div style={{ 
      maxWidth: '700px', 
      margin: '0 auto', 
      padding: '30px',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ marginBottom: '10px', color: '#333' }}>📝 Update Your Preferences</h2>
      <p style={{ marginBottom: '25px', color: '#666', fontSize: '14px' }}>
        Fill in your details and preferences to find matching properties
      </p>
      
      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#555', borderBottom: '2px solid #4CAF50', paddingBottom: '8px' }}>
            Basic Information
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="John Doe"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  transition: 'border 0.3s'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="john@example.com"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        {/* Property Preferences */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#555', borderBottom: '2px solid #4CAF50', paddingBottom: '8px' }}>
            Property Preferences
          </h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
              Preferred Localities (comma-separated) *
            </label>
            <input
              type="text"
              name="localities"
              value={formData.localities}
              onChange={handleChange}
              placeholder="e.g., Bandra, Andheri, Powai"
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>
              💡 Available: Mumbai (Bandra, Andheri, Powai, Juhu, Worli, Malad), Hyderabad (Hitech City, Gachibowli, Banjara Hills, Jubilee Hills, Madhapur, Kondapur), Delhi (Connaught Place, Saket, Dwarka, Rohini, Vasant Kunj, Hauz Khas)
            </small>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                Min Budget (₹)
              </label>
              <input
                type="number"
                name="minBudget"
                value={formData.minBudget}
                onChange={handleChange}
                placeholder="5000000"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                Max Budget (₹)
              </label>
              <input
                type="number"
                name="maxBudget"
                value={formData.maxBudget}
                onChange={handleChange}
                placeholder="10000000"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                BHK
              </label>
              <select
                name="bhk"
                value={formData.bhk}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="">Any</option>
                <option value="1">1 BHK</option>
                <option value="2">2 BHK</option>
                <option value="3">3 BHK</option>
                <option value="4">4 BHK</option>
                <option value="5">5+ BHK</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
              Preferred Amenities (comma-separated)
            </label>
            <input
              type="text"
              name="amenities"
              value={formData.amenities}
              onChange={handleChange}
              placeholder="e.g., parking, gym, pool, security"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        {/* Additional Notes */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
            💬 Additional Requirements / Notes
          </label>
          <textarea
            name="additionalNotes"
            value={formData.additionalNotes}
            onChange={handleChange}
            placeholder="Tell us more about what you're looking for... (e.g., pet-friendly, near metro station, quiet neighborhood, good schools nearby, shopping malls, hospitals)"
            rows={4}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e0e0e0',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>

        {message && (
          <div style={{ 
            padding: '12px', 
            background: '#d4edda', 
            color: '#155724', 
            borderRadius: '6px', 
            marginBottom: '15px',
            border: '1px solid #c3e6cb'
          }}>
            ✓ {message}
          </div>
        )}

        {error && (
          <div style={{ 
            padding: '12px', 
            background: '#f8d7da', 
            color: '#721c24', 
            borderRadius: '6px', 
            marginBottom: '15px',
            border: '1px solid #f5c6cb'
          }}>
            ✗ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            background: loading ? '#ccc' : 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 4px 6px rgba(76, 175, 80, 0.3)',
            transition: 'all 0.3s'
          }}
        >
          {loading ? '⏳ Updating...' : '🔍 Update Preferences & Find Matches'}
        </button>
      </form>
    </div>
  );
};

export default BuyerForm;
