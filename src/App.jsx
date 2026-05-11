import { useState } from 'react';
import { HashRouter as Router, Routes, Route, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, QrCode, LogOut, Lock } from 'lucide-react';
import Dashboard from './components/Dashboard';
import CheckScore from './components/CheckScore';
import QRCodes from './components/QRCodes';
import Login from './components/Login';
import CheckOverview from './components/CheckOverview';

function ProtectedRoute({ isAdmin, children }) {
  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

const navLinkClass = ({ isActive }) => 
  `flex flex-col items-center gap-1 px-3 py-2 text-[11px] font-semibold transition-all rounded-xl min-w-[64px] ${
    isActive 
      ? 'text-blue-600 bg-blue-50' 
      : 'text-slate-400 active:bg-slate-100'
  }`;

const navLinkDesktopClass = ({ isActive }) => 
  `flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all ${
    isActive 
      ? 'bg-blue-600 text-white shadow-md' 
      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
  }`;

function AppContent() {
  const [isAdmin, setIsAdmin] = useState(() => {
    return sessionStorage.getItem('isAdmin') === 'true';
  });
  
  const navigate = useNavigate();
  const location = useLocation();

  // Hide the shell nav on QR check-in pages (public mobile use)
  const isCheckPage = location.pathname.startsWith('/check/');

  const handleLogin = (status) => {
    setIsAdmin(status);
    sessionStorage.setItem('isAdmin', status);
  };

  const handleLogout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('isAdmin');
    navigate('/login');
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-slate-50">
      {/* --- Top Header (compact on mobile) --- */}
      {!isCheckPage && (
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-100 safe-top">
          <div className="max-w-6xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
            <h1 className="text-base md:text-xl font-bold text-slate-800 truncate">
              🧹 ระบบเช็คความสะอาด
            </h1>
            
            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-3">
              <NavLink to="/" className={navLinkDesktopClass} end>
                <LayoutDashboard size={18} />
                แดชบอร์ด
              </NavLink>
              {isAdmin && (
                <>
                  <NavLink to="/qrcodes" className={navLinkDesktopClass}>
                    <QrCode size={18} />
                    QR Code
                  </NavLink>
                  <NavLink to="/select-room" className={navLinkDesktopClass}>
                    <CheckSquare size={18} />
                    เช็คคะแนน
                  </NavLink>
                </>
              )}
              {!isAdmin && (
                <NavLink to="/login" className={navLinkDesktopClass}>
                  <Lock size={18} />
                  Admin
                </NavLink>
              )}
              {isAdmin && (
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  ออกจากระบบ
                </button>
              )}
            </nav>

            {/* Mobile: logout button only */}
            {isAdmin && (
              <button 
                onClick={handleLogout}
                className="md:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-slate-400 active:bg-red-50 active:text-red-500 transition-colors"
              >
                <LogOut size={14} />
                ออก
              </button>
            )}
          </div>
        </header>
      )}

      {/* --- Main Content --- */}
      <main className={`flex-grow px-4 md:px-6 py-4 md:py-8 max-w-6xl mx-auto w-full ${
        !isCheckPage ? 'pb-24 md:pb-8' : ''
      }`}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/check/:room" element={<CheckScore />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          
          {/* Protected Routes */}
          <Route 
            path="/qrcodes" 
            element={
              <ProtectedRoute isAdmin={isAdmin}>
                <QRCodes />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/select-room" 
            element={
              <ProtectedRoute isAdmin={isAdmin}>
                <CheckOverview />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>

      {/* --- Bottom Tab Navigation (mobile only) --- */}
      {!isCheckPage && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/90 backdrop-blur-lg border-t border-slate-200 safe-bottom">
          <div className="flex justify-around items-center px-2 py-1">
            <NavLink to="/" className={navLinkClass} end>
              <LayoutDashboard size={22} />
              แดชบอร์ด
            </NavLink>
            {isAdmin ? (
              <>
                <NavLink to="/qrcodes" className={navLinkClass}>
                  <QrCode size={22} />
                  QR Code
                </NavLink>
                <NavLink to="/select-room" className={navLinkClass}>
                  <CheckSquare size={22} />
                  เช็คคะแนน
                </NavLink>
              </>
            ) : (
              <NavLink to="/login" className={navLinkClass}>
                <Lock size={22} />
                Admin
              </NavLink>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
