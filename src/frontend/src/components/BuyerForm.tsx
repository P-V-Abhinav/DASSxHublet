import { useState } from 'react';
import axios from 'axios';
import LocationPicker, { PickedLocation } from './LocationPicker';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

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
        rawQuery: '',
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [showMap, setShowMap] = useState(false);
    const [pickedLocations, setPickedLocations] = useState<PickedLocation[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            // Prepare payload - only send fields that have values to avoiding overwriting with empty defaults
            const payload: any = {};

            if (formData.name) payload.name = formData.name;
            if (formData.email) payload.email = formData.email;
            if (formData.phone) payload.phone = formData.phone;
            if (formData.rawQuery) payload.rawPreferences = formData.rawQuery;

            const localitiesArray = formData.localities
                .split(',')
                .map((l) => l.trim())
                .filter((l) => l.length > 0);

            // Only send localities if the user explicitly typed them. 
            // Otherwise let backend parsed intent take over.
            if (localitiesArray.length > 0) {
                payload.localities = localitiesArray;
            }

            const amenitiesArray = formData.amenities
                .split(',')
                .map((a) => a.trim())
                .filter((a) => a.length > 0);

            if (amenitiesArray.length > 0) {
                payload.amenities = amenitiesArray;
            }

            if (formData.minBudget) payload.minBudget = parseInt(formData.minBudget);
            if (formData.maxBudget) payload.maxBudget = parseInt(formData.maxBudget);
            if (formData.bhk && formData.bhk !== 'Any') payload.bhk = parseInt(formData.bhk);

            // Include locality coordinates from map picker if available
            if (pickedLocations.length > 0) {
                payload.metadata = {
                    localityCoords: pickedLocations.map((l) => ({
                        name: l.name,
                        lat: l.lat,
                        lon: l.lon,
                    })),
                };
            }

            await axios.put(`${API_BASE_URL}/buyers/${buyerId}`, payload);

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

    const handleLocationsChange = (locations: PickedLocation[]) => {
        setPickedLocations(locations);
        // Also update the text field to stay in sync
        const names = locations.map((l) => l.name);
        setFormData((prev) => ({
            ...prev,
            localities: names.join(', '),
        }));
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
            <h2 style={{ marginBottom: '10px', color: '#333' }}> Update Your Preferences</h2>
            <p style={{ marginBottom: '25px', color: '#666', fontSize: '14px' }}>
                AI Agent will understand your needs and update your profile automatically.
            </p>

            <form onSubmit={handleSubmit}>
                {/* AI Intent Parsing Section */}
                <div style={{
                    marginBottom: '30px',
                    padding: '20px',
                    background: '#f0f7ff',
                    borderRadius: '8px',
                    border: '1px solid #cce5ff'
                }}>
                    <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#0056b3' }}>
                        AI / Natural Language Search
                    </h3>
                    <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                        Type your requirements naturally, e.g., "Looking for a 2 bhk in Indiranagar under 60 lakhs with parking"
                    </p>
                    <textarea
                        name="rawQuery"
                        value={formData.rawQuery}
                        onChange={handleChange}
                        placeholder="Describe your dream home here..."
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '2px solid #b8daff',
                            borderRadius: '6px',
                            minHeight: '80px',
                            fontSize: '14px',
                            fontFamily: 'inherit'
                        }}
                    />
                </div>

                {/* Map-based Locality Picker */}
                <div style={{
                    marginBottom: '20px',
                    padding: '15px',
                    background: '#f0fff4',
                    borderRadius: '8px',
                    border: '1px solid #c6f6d5'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div>
                            <h3 style={{ fontSize: '16px', margin: 0, color: '#276749' }}>
                                📍 Preferred Localities
                            </h3>
                            <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>
                                Type localities below or pick them on the map
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

                    <input
                        type="text"
                        name="localities"
                        value={formData.localities}
                        onChange={handleChange}
                        placeholder="e.g., Thane, Powai, Andheri (comma-separated)"
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #c6f6d5',
                            borderRadius: '6px',
                            fontSize: '14px',
                            marginBottom: showMap ? '12px' : 0,
                        }}
                    />

                    {showMap && (
                        <LocationPicker
                            mode="multiple"
                            initialLocations={pickedLocations}
                            onLocationsChange={handleLocationsChange}
                            height={350}
                        />
                    )}
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
                    {loading ? ' Updating...' : ' Update Preferences & Find Matches'}
                </button>
            </form>
        </div>
    );
};

export default BuyerForm;
