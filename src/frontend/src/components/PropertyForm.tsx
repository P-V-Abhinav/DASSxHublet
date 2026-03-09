import { useState, useEffect } from 'react';
import { propertyApi, sellerApi } from '../api/client';

interface PropertyFormProps {
  onSuccess?: () => void;
  fixedSellerId?: string;
}

function PropertyForm({ onSuccess, fixedSellerId }: PropertyFormProps = {}) {
  const [sellers, setSellers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    sellerId: fixedSellerId || '',
    title: '',
    description: '',
    locality: '',
    address: '',
    area: 0,
    bhk: 2,
    price: 0,
    amenities: '',
    propertyType: 'apartment',
    contact: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (fixedSellerId) {
      setFormData((prev) => ({ ...prev, sellerId: fixedSellerId }));
      return;
    }

    // Load sellers for dropdown
    const fetchSellers = async () => {
      try {
        const response = await sellerApi.getAll();
        setSellers(response.data);
      } catch (err) {
        console.error('Failed to fetch sellers:', err);
      }
    };
    fetchSellers();
  }, [fixedSellerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const amenitiesArray = formData.amenities
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a.length > 0);

      const response = await propertyApi.create({
        ...formData,
        amenities: amenitiesArray,
        contact: formData.contact || undefined,
      });

      setMessage(`Property created successfully! ID: ${response.data.id}`);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      setFormData({
        sellerId: fixedSellerId || formData.sellerId,
        title: '',
        description: '',
        locality: '',
        address: '',
        area: 0,
        bhk: 2,
        price: 0,
        amenities: '',
        propertyType: 'apartment',
        contact: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Add Property Listing</h2>
      <form onSubmit={handleSubmit}>
        {fixedSellerId ? (
          <div className="form-group">
            <label>Seller *</label>
            <input type="text" value="Current logged-in seller" disabled />
          </div>
        ) : (
          <div className="form-group">
            <label>Seller *</label>
            <select
              required
              value={formData.sellerId}
              onChange={(e) => setFormData({ ...formData, sellerId: e.target.value })}
            >
              <option value="">Select a seller</option>
              {sellers.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.name} ({seller.email})
                </option>
              ))}
            </select>
            {sellers.length === 0 && (
              <small style={{ color: '#ef4444' }}>
                No sellers found. Please create a seller first.
              </small>
            )}
          </div>
        )}

        <div className="form-group">
          <label>Title *</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Spacious 2BHK in Indiranagar"
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Detailed property description..."
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Locality *</label>
            <input
              type="text"
              required
              value={formData.locality}
              onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
              placeholder="e.g., Indiranagar"
            />
          </div>

          <div className="form-group">
            <label>Property Type</label>
            <select
              value={formData.propertyType}
              onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
            >
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="villa">Villa</option>
              <option value="plot">Plot</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Address</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Full address"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Area (sq ft) *</label>
            <input
              type="number"
              required
              min="0"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: parseInt(e.target.value) })}
              placeholder="e.g., 1200"
            />
          </div>

          <div className="form-group">
            <label>BHK *</label>
            <input
              type="number"
              required
              min="1"
              max="10"
              value={formData.bhk}
              onChange={(e) => setFormData({ ...formData, bhk: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Price (₹) *</label>
          <input
            type="number"
            required
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
            placeholder="e.g., 5000000 (50 lakhs)"
          />
        </div>

        <div className="form-group">
          <label>Amenities (comma-separated)</label>
          <input
            type="text"
            value={formData.amenities}
            onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
            placeholder="e.g., parking, gym, swimming pool, garden"
          />
        </div>

        <div className="form-group">
          <label>Contact (phone/name)</label>
          <input
            type="text"
            value={formData.contact}
            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
            placeholder="e.g., 9876543210 or John Doe"
          />
        </div>

        {message && <div className="success">{message}</div>}
        {error && <div className="error">{error}</div>}

        <button type="submit" className="button" disabled={loading}>
          {loading ? 'Creating...' : 'Add Property'}
        </button>
      </form>
    </div>
  );
}

export default PropertyForm;
