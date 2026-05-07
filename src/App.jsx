import React from 'react';
import { HashRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, QrCode } from 'lucide-react';
import Dashboard from './components/Dashboard';
import CheckScore from './components/CheckScore';
import QRCodes from './components/QRCodes';

function App() {
  return (
    <Router>
      <div className="min-h-screen max-w-6xl mx-auto px-4 py-8 flex flex-col">
        <header className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6 tracking-tight">
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
            <NavLink 
              to="/qrcodes" 
              className={({ isActive }) => `flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all ${isActive ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
            >
              <QrCode size={18} />
              QR Code
            </NavLink>
            <NavLink 
              to="/check/ม.1" 
              className={({ isActive }) => `flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all ${isActive ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
            >
              <CheckSquare size={18} />
              ทดสอบเช็คคะแนน
            </NavLink>
          </nav>
        </header>

        <main className="flex-grow animate-in fade-in duration-500">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/check/:room" element={<CheckScore />} />
            <Route path="/qrcodes" element={<QRCodes />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
