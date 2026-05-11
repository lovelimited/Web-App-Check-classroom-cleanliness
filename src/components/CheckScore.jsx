import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, AlertTriangle, CheckCircle, Home } from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { submitScore, fetchScores } from '../api/googleSheets';

const MySwal = withReactContent(Swal);

function CheckScore() {
  const { room } = useParams();
  const navigate = useNavigate();
  const [score, setScore] = useState(5);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isChecked, setIsChecked] = useState(false);

  const validRooms = useMemo(() => ["ม.1", "ม.2", "ม.3", "ม.4", "ม.5", "ม.6"], []);

  const getTodayStr = () => {
    const now = new Date();
    return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, '0') + "-" + String(now.getDate()).padStart(2, '0');
  };

  const checkStatus = useCallback(async () => {
    setIsInitialLoading(true);
    try {
      const allData = await fetchScores();
      const today = getTodayStr();
      
      const alreadyChecked = [...allData].reverse().some(entry => {
        const entryDate = typeof entry.date === 'string' ? entry.date.split(' ')[0] : entry.date;
        return entryDate === today && entry.room === room;
      });
      
      setIsChecked(alreadyChecked);
    } catch (error) {
      console.error("Check status error:", error);
    } finally {
      setTimeout(() => setIsInitialLoading(false), 300);
    }
  }, [room]);

  useEffect(() => {
    if (validRooms.includes(room)) {
      checkStatus();
    }
  }, [room, checkStatus, validRooms]);

  if (!validRooms.includes(room)) {
    return (
      <div className="card max-w-md mx-auto text-center py-12 mt-8">
        <AlertTriangle size={64} className="text-red-500 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-slate-800 mb-3">ห้องไม่ถูกต้อง</h2>
        <p className="text-slate-500 mb-8">ไม่พบข้อมูลห้อง {room} ในระบบ</p>
        <button className="btn btn-primary w-full" onClick={() => navigate('/')}>
          กลับสู่หน้าหลัก
        </button>
      </div>
    );
  }

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-slate-500 font-medium">กำลังตรวจสอบข้อมูล...</p>
      </div>
    );
  }

  if (isChecked) {
    return (
      <div className="card max-w-md mx-auto text-center py-12 mt-8 border-2 border-green-100 bg-green-50/10">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={48} />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-3">บันทึกแล้ว</h2>
        <p className="text-slate-500 mb-8 px-6 text-lg">
          ห้อง {room} ได้ทำการเช็คความสะอาดประจำวันนี้เรียบร้อยแล้ว ขอบคุณครับ
        </p>
        <div className="flex flex-col gap-3 px-6">
          <button className="btn btn-primary w-full py-4 text-lg" onClick={() => navigate('/')}>
            <Home size={20} className="mr-2" />
            กลับหน้าแดชบอร์ด
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await submitScore(room, score);
      
      if (result.status === 'success') {
        MySwal.fire({
          title: 'สำเร็จ!',
          text: `บันทึกคะแนนห้อง ${room} เรียบร้อยแล้ว`,
          icon: 'success',
          confirmButtonText: 'ตกลง',
          confirmButtonColor: '#3b82f6',
          customClass: { popup: 'rounded-2xl' }
        }).then(() => {
          navigate('/');
        });
      } else {
        MySwal.fire({
          title: 'เกิดข้อผิดพลาด',
          text: result.message || 'ไม่สามารถบันทึกคะแนนได้',
          icon: 'error',
          confirmButtonText: 'ปิด',
          confirmButtonColor: '#ef4444',
          customClass: { popup: 'rounded-2xl' }
        });
      }
    } catch (err) {
      console.error("Submit error:", err);
      MySwal.fire({
        title: 'การเชื่อมต่อขัดข้อง',
        text: 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง',
        icon: 'error',
        confirmButtonText: 'ปิด',
        confirmButtonColor: '#ef4444',
        customClass: { popup: 'rounded-2xl' }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card max-w-md mx-auto mt-8 animate-in zoom-in-95 duration-300 shadow-xl border border-slate-100">
      <div className="text-center mb-8 border-b border-slate-100 pb-6">
        <p className="text-slate-500 font-bold mb-1 uppercase tracking-widest text-xs">แบบประเมินความสะอาด</p>
        <h2 className="text-4xl font-black text-slate-800">ห้อง {room}</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="text-lg font-bold text-slate-700">ระดับความสะอาด</label>
            <span className="text-5xl font-black text-blue-600 w-20 text-right italic">
              {score}
            </span>
          </div>
          
          <div className="pt-4 pb-8 px-1">
            <input 
              type="range" 
              min="1" 
              max="10" 
              step="0.5" 
              value={score} 
              onChange={(e) => setScore(parseFloat(e.target.value))} 
              disabled={loading}
              className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs font-black text-slate-400 mt-4 px-1 uppercase tracking-widest">
              <span className="text-red-400">ควรปรับปรุง</span>
              <span className="text-blue-400">ปานกลาง</span>
              <span className="text-green-500">สะอาดมาก</span>
            </div>
          </div>
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary w-full py-5 text-xl font-bold shadow-lg shadow-blue-500/30 active:scale-95 transition-transform" 
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-3">
              <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              กำลังบันทึก...
            </span>
          ) : (
            <>
              <Save size={24} className="mr-2" />
              บันทึกคะแนน
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default CheckScore;
