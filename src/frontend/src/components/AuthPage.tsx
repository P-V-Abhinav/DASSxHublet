import { useState } from 'react';
import { authApi, setAuthSession } from '../api/client';

interface AuthPageProps {
  userType: 'buyer' | 'seller' | 'admin';
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
    rawQuery: '',
    localities: '',
    minBudget: '',
    maxBudget: '',
    bhk: '2',
    amenities: '',
    sellerType: 'individual',
    rating: '4',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const isAdmin = userType === 'admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isLogin || isAdmin) {
        let response;
        if (userType === 'buyer') {
          response = await authApi.buyerLogin({ email: formData.email, password: formData.password });
        } else if (userType === 'seller') {
          response = await authApi.sellerLogin({ email: formData.email, password: formData.password });
        } else {
          response = await authApi.adminLogin({ email: formData.email, password: formData.password });
        }

        const { token, user } = response.data;
        setAuthSession(token, user);
        onAuthSuccess(user.id || 'admin', user.name || 'Admin');
        return;
      }

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
          password: formData.password,
          rawPreferences: formData.rawQuery,
        };

        if (localitiesArray.length > 0) payload.localities = localitiesArray;
        if (formData.minBudget) payload.minBudget = parseInt(formData.minBudget, 10);
        if (formData.maxBudget) payload.maxBudget = parseInt(formData.maxBudget, 10);
        if (formData.bhk) payload.bhk = parseInt(formData.bhk, 10);
        if (amenitiesArray.length > 0) payload.amenities = amenitiesArray;

        await authApi.buyerSignup(payload);
      } else {
        await authApi.sellerSignup({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          sellerType: formData.sellerType,
          rating: parseFloat(formData.rating) || 4.0,
        });
      }

      setMessage('Signup successful. Please login with your email and password.');
      setIsLogin(true);
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
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative',
      }}
    >
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
          gap: '5px',
        }}
      >
        ← Back to Home
      </button>

      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          maxWidth: '500px',
          width: '100%',
          padding: '40px',
        }}
      >
        <h1 style={{ textAlign: 'center', marginBottom: '10px', color: '#333' }}>
          {isAdmin ? '🔐 Admin' : userType === 'buyer' ? '🏠 Buyer' : '🏢 Seller'} {isLogin || isAdmin ? 'Login' : 'Signup'}
        </h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
          {isLogin || isAdmin ? 'Welcome back!' : 'Create your account'}
        </p>

        <form onSubmit={handleSubmit}>
          {!isLogin && !isAdmin && (
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
                    fontSize: '14px',
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
                    fontSize: '14px',
                  }}
                />
              </div>

              {userType === 'buyer' && (
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
                      fontFamily: 'inherit',
                    }}
                  />
                  <small style={{ display: 'block', color: '#718096', fontSize: '12px' }}>
                    Describe in your own words - our AI will understand.
                  </small>
                </div>
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
                      fontSize: '14px',
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
                fontSize: '14px',
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>

          {message && (
            <div
              style={{
                padding: '10px',
                background: '#d4edda',
                color: '#155724',
                borderRadius: '6px',
                marginBottom: '15px',
                fontSize: '14px',
              }}
            >
              {message}
            </div>
          )}

          {error && (
            <div
              style={{
                padding: '10px',
                background: '#f8d7da',
                color: '#721c24',
                borderRadius: '6px',
                marginBottom: '15px',
                fontSize: '14px',
              }}
            >
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
              marginBottom: '15px',
            }}
          >
            {loading ? 'Processing...' : (isLogin || isAdmin ? 'Login' : 'Sign Up')}
          </button>

          {!isAdmin && (
            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setMessage('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#667eea',
                  cursor: 'pointer',
                  fontSize: '14px',
                  textDecoration: 'underline',
                }}
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
