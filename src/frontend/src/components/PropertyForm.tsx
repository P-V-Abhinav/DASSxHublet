import { useState, useEffect } from 'react';
import { propertyApi, sellerApi } from '../api/client';
import LocationPicker, { PickedLocation } from './LocationPicker';

interface PropertyFormProps {
    onSuccess?: () => void;
    fixedSellerId?: string;
    initialData?: any;
    isEditing?: boolean;
}

function PropertyForm({ onSuccess, fixedSellerId, initialData, isEditing }: PropertyFormProps = {}) {
    const [sellers, setSellers] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        sellerId: fixedSellerId || initialData?.sellerId || '',
        title: initialData?.title || '',
        description: initialData?.description || '',
        locality: initialData?.locality || '',
        address: initialData?.metadata?.address || '',
        area: initialData?.area || 0,
        bhk: initialData?.bhk || 2,
        price: initialData?.price || 0,
        amenities: initialData?.amenities ? initialData.amenities.join(', ') : '',
        propertyType: initialData?.propertyType || 'apartment',
        contact: initialData?.metadata?.contact || '',
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [pickedLocation, setPickedLocation] = useState<PickedLocation | null>(null);

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

            // Build metadata with coordinates if map was used
            const metadata: any = {};
            if (pickedLocation) {
                metadata.coordinates = { lat: pickedLocation.lat, lon: pickedLocation.lon };
            }

            const payload = {
                ...formData,
                amenities: amenitiesArray,
                contact: formData.contact || undefined,
                metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
            };

            let response;
            if (isEditing && initialData?.id) {
                // Ensure existing metadata is preserved and merged
                const mergedMetadata = { ...(initialData.metadata || {}), ...payload.metadata };
                payload.metadata = mergedMetadata;
                response = await propertyApi.update(initialData.id, payload);
                setMessage('Property updated successfully!');
            } else {
                response = await propertyApi.create(payload);
                setMessage(`Property created successfully! ID: ${response.data.id}`);
            }

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
            setPickedLocation(null);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create property');
        } finally {
            setLoading(false);
        }
    };

    const handleLocationChange = (locations: PickedLocation[]) => {
        if (locations.length > 0) {
            const loc = locations[0]; // single mode, take first
            setPickedLocation(loc);
            setFormData((prev) => ({
                ...prev,
                locality: loc.name,
                address: loc.address || prev.address,
            }));
        } else {
            setPickedLocation(null);
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

                {/* Map-based Location Picker */}
                <div style={{
                    marginBottom: '15px',
                    padding: '12px',
                    background: '#f0fff4',
                    borderRadius: '8px',
                    border: '1px solid #c6f6d5'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div>
                            <label style={{ fontWeight: 'bold', margin: 0 }}>📍 Property Location</label>
                            <p style={{ fontSize: '12px', color: '#666', margin: '2px 0 0 0' }}>
                                Pick on the map for auto-fill, or type manually below
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowMap(!showMap)}
                            style={{
                                padding: '8px 16px',
                                background: showMap ? '#e53e3e' : '#38a169',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 'bold',
                            }}
                        >
                            {showMap ? '✕ Hide Map' : '🗺️ Pick on Map'}
                        </button>
                    </div>

                    {showMap && (
                        <div style={{ marginBottom: '12px' }}>
                            <LocationPicker
                                mode="single"
                                initialLocations={pickedLocation ? [pickedLocation] : []}
                                onLocationsChange={handleLocationChange}
                                height={350}
                            />
                        </div>
                    )}

                    <div className="form-row">
                        <div className="form-group" style={{ margin: 0 }}>
                            <label>Locality *</label>
                            <input
                                type="text"
                                required
                                value={formData.locality}
                                onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                                placeholder="e.g., Indiranagar"
                            />
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
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

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="button" style={{ flex: 1 }} disabled={loading}>
                        {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Property' : 'Add Property')}
                    </button>
                    {isEditing && (
                        <button type="button" onClick={() => { if (onSuccess) onSuccess(); }} style={{ flex: 1, padding: '10px', background: '#ccc', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                            Cancel
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}

export default PropertyForm;
