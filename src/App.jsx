import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
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

function AppContent() {
  const [isAdmin, setIsAdmin] = useState(() => {
    return sessionStorage.getItem('isAdmin') === 'true';
  });
  
  const navigate = useNavigate();

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
    <div className="min-h-screen max-w-6xl mx-auto px-4 py-8 flex flex-col">
      <header className="mb-10 text-center relative">
        {isAdmin && (
          <button 
            onClick={handleLogout}
            className="absolute right-0 top-0 md:top-2 flex items-center gap-2 text-sm text-slate-500 hover:text-red-500 transition-colors"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">ออกจากระบบ</span>
          </button>
        )}
        
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6 tracking-tight mt-8 md:mt-0">
          ระบบเช็คความสะอาดในห้องเรียน
        </h1>
        
        <nav className="flex flex-wrap justify-center gap-3">
          <NavLink 
            to="/" 
            className={({ isActive }) => `flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all ${isActive ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`} 
            end
          >
            <LayoutDashboard size={18} />
            แดชบอร์ด
          </NavLink>
          
          {isAdmin && (
            <>
              <NavLink 
                to="/qrcodes" 
                className={({ isActive }) => `flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all ${isActive ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
              >
                <QrCode size={18} />
                QR Code
              </NavLink>
              <NavLink 
                to="/select-room" 
                className={({ isActive }) => `flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all ${isActive ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
              >
                <CheckSquare size={18} />
                ทดสอบเช็คคะแนน
              </NavLink>
            </>
          )}

          {!isAdmin && (
            <NavLink 
              to="/login" 
              className={({ isActive }) => `flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all ${isActive ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
            >
              <Lock size={18} />
              สำหรับ Admin
            </NavLink>
          )}
        </nav>
      </header>

      <main className="flex-grow animate-in fade-in duration-500">
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
