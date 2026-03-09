import { BrowserRouter as Router, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import './App.css';
import { AdminDashboard } from './components/AdminDashboard';
import { BuyerDashboard } from './components/BuyerDashboard';
import { SellerDashboard } from './components/SellerDashboard';
import { AuthPage } from './components/AuthPage';
import { clearAuthSession, getAuthSession } from './api/client';

function HomePage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          maxWidth: '400px',
          width: '100%',
        }}
      >
        <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>🏠 Hublet</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
          Real Estate Lead Matching Platform
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button
            onClick={() => navigate('/auth/admin')}
            style={{
              padding: '16px 24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
          >
            🔐 Login as Admin
          </button>
          <button
            onClick={() => navigate('/auth/buyer')}
            style={{
              padding: '16px 24px',
              background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
          >
            🏠 Buyer Login / Signup
          </button>
          <button
            onClick={() => navigate('/auth/seller')}
            style={{
              padding: '16px 24px',
              background: 'linear-gradient(135deg, #FF6B6B 0%, #EE5A6F 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
          >
            🏢 Seller Login / Signup
          </button>
        </div>
      </div>
    </div>
  );
}

function AuthPageWrapper() {
  const navigate = useNavigate();
  const { userType } = useParams<{ userType: 'buyer' | 'seller' | 'admin' }>();

  if (!userType || !['buyer', 'seller', 'admin'].includes(userType)) {
    return <Navigate to="/" replace />;
  }

  const handleAuthSuccess = (userId: string, _userName: string) => {
    if (userType === 'admin') {
      navigate('/admin');
      return;
    }
    navigate(`/${userType}/${userId}`);
  };

  return (
    <AuthPage
      userType={userType}
      onAuthSuccess={handleAuthSuccess}
      onBack={() => navigate('/')}
    />
  );
}

function AdminDashboardWrapper() {
  const navigate = useNavigate();
  const { user } = getAuthSession();

  if (!user || user.role !== 'admin') {
    return <Navigate to="/auth/admin" replace />;
  }

  const handleLogout = () => {
    clearAuthSession();
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div
        style={{
          background: 'white',
          padding: '15px 30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>🏠 Hublet</h2>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
            Logged in as: <strong>{user.email}</strong>
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            background: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          Logout
        </button>
      </div>
      <AdminDashboard />
    </div>
  );
}

function BuyerDashboardWrapper() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { user } = getAuthSession();

  if (!userId) {
    return <Navigate to="/" replace />;
  }

  if (!user || user.role !== 'buyer' || user.id !== userId) {
    return <Navigate to="/auth/buyer" replace />;
  }

  const handleLogout = () => {
    clearAuthSession();
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div
        style={{
          background: 'white',
          padding: '15px 30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>🏠 Hublet</h2>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
            Logged in as: <strong>{user.name || user.email}</strong>
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            background: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          Logout
        </button>
      </div>
      <BuyerDashboard buyerId={userId} buyerName={user.name || 'Buyer'} />
    </div>
  );
}

function SellerDashboardWrapper() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { user } = getAuthSession();

  if (!userId) {
    return <Navigate to="/" replace />;
  }

  if (!user || user.role !== 'seller' || user.id !== userId) {
    return <Navigate to="/auth/seller" replace />;
  }

  const handleLogout = () => {
    clearAuthSession();
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div
        style={{
          background: 'white',
          padding: '15px 30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>🏠 Hublet</h2>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
            Logged in as: <strong>{user.name || user.email}</strong>
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            background: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          Logout
        </button>
      </div>
      <SellerDashboard sellerId={userId} sellerName={user.name || 'Seller'} />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth/:userType" element={<AuthPageWrapper />} />
        <Route path="/admin" element={<AdminDashboardWrapper />} />
        <Route path="/buyer/:userId" element={<BuyerDashboardWrapper />} />
        <Route path="/seller/:userId" element={<SellerDashboardWrapper />} />
      </Routes>
    </Router>
  );
}

export default App;
