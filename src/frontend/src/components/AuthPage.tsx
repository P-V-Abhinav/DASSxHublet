import { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

interface AuthPageProps {
  userType: 'buyer' | 'seller';
  onAuthSuccess: (userId: string, userName: string) => void;
  onBack: () => void;
}

export const AuthPage = ({ userType, onAuthSuccess, onBack }: AuthPageProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    // Buyer specific
    rawQuery: '', // New field
    localities: '',
    minBudget: '',
    maxBudget: '',
    bhk: '2',
    amenities: '',
    // Seller specific
    sellerType: 'individual',
    rating: '4',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Login - find user by email
        const endpoint = userType === 'buyer' ? '/buyers' : '/sellers';
        const response = await axios.get(`${API_BASE_URL}${endpoint}`);
        const user = response.data.find((u: any) => u.email === formData.email);
        
        if (user) {
          onAuthSuccess(user.id, user.name);
        } else {
          setError('User not found. Please sign up first.');
        }
      } else {
        // Signup - create new user
        if (userType === 'buyer') {
          const localitiesArray = formData.localities
            .split(',')
            .map((l) => l.trim())
            .filter((l) => l.length > 0);
          
          const amenitiesArray = formData.amenities
            .split(',')
            .map((a) => a.trim())
            .filter((a) => a.length > 0);

          const payload: any = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            rawPreferences: formData.rawQuery,
          };
          
          if (localitiesArray.length > 0) payload.localities = localitiesArray;
          if (formData.minBudget) payload.minBudget = parseInt(formData.minBudget);
          if (formData.maxBudget) payload.maxBudget = parseInt(formData.maxBudget);
          if (formData.bhk) payload.bhk = parseInt(formData.bhk);
          if (amenitiesArray.length > 0) payload.amenities = amenitiesArray;

          const response = await axios.post(`${API_BASE_URL}/buyers`, payload);
          onAuthSuccess(response.data.id, response.data.name);
        } else {
          const response = await axios.post(`${API_BASE_URL}/sellers`, {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            sellerType: formData.sellerType,
            rating: parseFloat(formData.rating) || 4.0,
          });
          onAuthSuccess(response.data.id, response.data.name);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
    }}>
      {/* Back Button */}
      <button
        onClick={onBack}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          padding: '10px 20px',
          background: 'white',
          border: '2px solid #667eea',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#667eea',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}
      >
        ← Back to Home
      </button>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        maxWidth: '500px',
        width: '100%',
        padding: '40px',
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '10px', color: '#333' }}>
          {userType === 'buyer' ? '🏠 Buyer' : '🏢 Seller'} {isLogin ? 'Login' : 'Signup'}
        </h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
          {isLogin ? 'Welcome back!' : 'Create your account'}
        </p>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 XXXXXXXXXX"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              {userType === 'buyer' && (
                <>
                  {/* Natural Language Input */}
                  <div style={{ marginBottom: '20px', background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#4a5568' }}>
                      ✨ What are you looking for? (AI Powered)
                    </label>
                    <textarea
                      name="rawQuery"
                      value={formData.rawQuery}
                      onChange={handleChange}
                      placeholder="e.g. 2bhk in Indiranagar under 60 lakhs with parking"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #cbd5e0',
                        borderRadius: '6px',
                        minHeight: '80px',
                        fontSize: '14px',
                        marginBottom: '4px',
                        fontFamily: 'inherit'
                      }}
                    />
                    <small style={{display:'block', color:'#718096', fontSize:'12px'}}>
                      Describe in your own words - our AI will understand!
                    </small>
                  </div>


                </>
              )}

              {userType === 'seller' && (
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Seller Type
                  </label>
                  <select
                    name="sellerType"
                    value={formData.sellerType}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="individual">Individual</option>
                    <option value="agent">Agent</option>
                    <option value="builder">Builder</option>
                  </select>
                </div>
              )}
            </>
          )}

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px',
              background: '#f8d7da',
              color: '#721c24',
              borderRadius: '6px',
              marginBottom: '15px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '15px'
            }}
          >
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>

          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#667eea',
                cursor: 'pointer',
                fontSize: '14px',
                textDecoration: 'underline'
              }}
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
