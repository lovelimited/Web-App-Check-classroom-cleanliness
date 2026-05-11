import { useState } from 'react';
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
    <div className="flex flex-col items-center justify-center py-12 px-4 animate-slide-up">
      <div className="card w-full max-w-md p-8 md:p-10 bg-white/90 backdrop-blur-xl shadow-2xl border-white animate-fade-in card-hover">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-500 text-white rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 rotate-3 animate-float">
            <Lock size={36} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Admin Login</h2>
          <p className="text-slate-500 text-center mt-3 font-medium">
            กรุณาใส่รหัสผ่านเพื่อเข้าถึงระบบจัดการ
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
              รหัสผ่านผู้ดูแลระบบ
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all outline-none text-lg font-medium"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full py-4 text-xl font-black shadow-xl shadow-blue-500/30"
          >
            เข้าสู่ระบบ
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
