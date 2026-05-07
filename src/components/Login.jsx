import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Lock } from 'lucide-react';

const MySwal = withReactContent(Swal);

function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Default password is 'admin123'
    if (password === 'admin123') {
      onLogin(true);
      navigate('/select-room');
    } else {
      MySwal.fire({
        title: 'รหัสผ่านไม่ถูกต้อง',
        text: 'กรุณาลองใหม่อีกครั้ง',
        icon: 'error',
        confirmButtonText: 'ปิด',
        confirmButtonColor: '#ef4444'
      });
      setPassword('');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="card w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">เข้าสู่ระบบ Admin</h2>
          <p className="text-slate-500 text-center mt-2">
            กรุณาใส่รหัสผ่านเพื่อจัดการ QR Code และภาพรวมการเช็คคะแนน
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              รหัสผ่าน
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full py-3 text-lg font-medium shadow-md shadow-blue-500/30"
          >
            เข้าสู่ระบบ
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
