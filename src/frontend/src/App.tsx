import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import './App.css';
import { AdminDashboard } from './components/AdminDashboard';
import { BuyerDashboard } from './components/BuyerDashboard';
import { SellerDashboard } from './components/SellerDashboard';
import { AuthPage } from './components/AuthPage';

// Home Page Component
function HomePage() {
  const navigate = useNavigate();

  const handleAdminLogin = () => {
    navigate('/admin');
  };

  const handleBuyerClick = () => {
    navigate('/auth/buyer');
  };

  const handleSellerClick = () => {
    navigate('/auth/seller');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        maxWidth: '400px',
        width: '100%',
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>🏠 Hublet</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
          Real Estate Lead Matching Platform
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button
            onClick={handleAdminLogin}
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
            onClick={handleBuyerClick}
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
            onClick={handleSellerClick}
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

        <div style={{
          marginTop: '30px',
          padding: '15px',
          background: '#f5f5f5',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#666',
          textAlign: 'center'
        }}>
          <strong>Demo Data Available:</strong><br/>
          Mumbai, Hyderabad, Delhi<br/>
          18 Properties • 18 Buyers
        </div>
      </div>
    </div>
  );
}

// Auth Page Wrapper
function AuthPageWrapper() {
  const navigate = useNavigate();
  const { userType } = useParams<{ userType: 'buyer' | 'seller' }>();

  const handleAuthSuccess = (userId: string, userName: string) => {
    if (userType === 'buyer') {
      navigate(`/buyer/${userId}`, { state: { userName } });
    } else if (userType === 'seller') {
      navigate(`/seller/${userId}`, { state: { userName } });
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  if (!userType || (userType !== 'buyer' && userType !== 'seller')) {
    navigate('/');
    return null;
  }

  return <AuthPage userType={userType} onAuthSuccess={handleAuthSuccess} onBack={handleBack} />;
}

// Admin Dashboard Wrapper
function AdminDashboardWrapper() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{
        background: 'white',
        padding: '15px 30px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h2 style={{ margin: 0 }}>🏠 Hublet</h2>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
            Logged in as: <strong>Admin User</strong>
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

// Buyer Dashboard Wrapper
function BuyerDashboardWrapper() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [userName] = useState<string>('Buyer User');

  const handleLogout = () => {
    navigate('/');
  };

  if (!userId) {
    navigate('/');
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{
        background: 'white',
        padding: '15px 30px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h2 style={{ margin: 0 }}>🏠 Hublet</h2>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
            Logged in as: <strong>{userName}</strong>
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

      <BuyerDashboard buyerId={userId} buyerName={userName} />
    </div>
  );
}

// Seller Dashboard Wrapper
function SellerDashboardWrapper() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [userName] = useState<string>('Seller User');

  const handleLogout = () => {
    navigate('/');
  };

  if (!userId) {
    navigate('/');
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{
        background: 'white',
        padding: '15px 30px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h2 style={{ margin: 0 }}>🏠 Hublet</h2>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
            Logged in as: <strong>{userName}</strong>
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

      <SellerDashboard sellerId={userId} sellerName={userName} />
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
