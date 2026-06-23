import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import GuestHome from './pages/GuestHome';
import AdminPanel from './pages/AdminPanel';
import MyReservations from './pages/MyReservations';

function Router() {
  const { user } = useAuth();
  const [page, setPage] = useState('home'); // home | reservations

  if (!user) return <AuthPage />;

  if (user.role === 'ADMIN') return <AdminPanel />;

  return (
    <div className="tg-page-wrapper" style={{ background: '#0f0f0f', minHeight: '100vh' }}>
      <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto' }}>
        
        {page === 'home' && <GuestHome onNavigate={setPage} />}
        {page === 'reservations' && <MyReservations onNavigate={setPage} />}
        
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}
