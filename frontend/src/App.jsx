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
    // Убрали жесткое ограничение ширины, чтобы на ПК всё раскрывалось на 100%
    <div className="tg-page-wrapper" style={{ background: '#0f0f0f', minHeight: '100vh', width: '100%' }}>
      
      {page === 'home' && <GuestHome onNavigate={setPage} />}
      {page === 'reservations' && <MyReservations onNavigate={setPage} />}
        
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
