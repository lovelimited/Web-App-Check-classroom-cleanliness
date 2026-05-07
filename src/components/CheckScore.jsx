import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, AlertTriangle } from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { submitScore } from '../api/googleSheets';

const MySwal = withReactContent(Swal);

function CheckScore() {
  const { room } = useParams();
  const navigate = useNavigate();
  const [score, setScore] = useState(5);
  const [loading, setLoading] = useState(false);

  const validRooms = ["ม.1", "ม.2", "ม.3", "ม.4", "ม.5", "ม.6"];

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await submitScore(room, score);
      
      if (result.status === 'success') {
        MySwal.fire({
          title: 'สำเร็จ!',
          text: 'บันทึกคะแนนเรียบร้อยแล้ว',
          icon: 'success',
          confirmButtonText: 'ตกลง',
          confirmButtonColor: '#3b82f6',
          customClass: {
            popup: 'rounded-2xl',
          }
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
          customClass: {
            popup: 'rounded-2xl',
          }
        });
      }
    } catch (err) {
      MySwal.fire({
        title: 'การเชื่อมต่อขัดข้อง',
        text: 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง',
        icon: 'error',
        confirmButtonText: 'ปิด',
        confirmButtonColor: '#ef4444',
        customClass: {
          popup: 'rounded-2xl',
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card max-w-md mx-auto mt-8">
      <div className="text-center mb-8 border-b border-slate-100 pb-6">
        <p className="text-slate-500 font-medium mb-1">แบบประเมินความสะอาด</p>
        <h2 className="text-3xl font-bold text-slate-800">ห้อง {room}</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="text-lg font-medium text-slate-700">ให้คะแนน</label>
            <span className="text-4xl font-black text-blue-600 w-16 text-right">
              {score}
            </span>
          </div>
          
          <div className="pt-2 pb-6 px-1">
            <input 
              type="range" 
              min="1" 
              max="10" 
              step="0.5" 
              value={score} 
              onChange={(e) => setScore(parseFloat(e.target.value))} 
              disabled={loading}
              className="w-full"
            />
            <div className="flex justify-between text-xs font-medium text-slate-400 mt-3 px-1">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary w-full py-4 text-lg" 
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              กำลังบันทึก...
            </span>
          ) : (
            <>
              <Save size={22} />
              บันทึกคะแนน
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default CheckScore;
