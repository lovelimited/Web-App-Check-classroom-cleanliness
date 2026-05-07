import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, Clock } from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { submitScore, fetchScores } from '../api/googleSheets';

const MySwal = withReactContent(Swal);

function CheckOverview() {
  const rooms = ["ม.1", "ม.2", "ม.3", "ม.4", "ม.5", "ม.6"];
  
  const [scores, setScores] = useState(
    rooms.reduce((acc, room) => ({ ...acc, [room]: 5 }), {})
  );
  const [loadingStates, setLoadingStates] = useState(
    rooms.reduce((acc, room) => ({ ...acc, [room]: false }), {})
  );
  const [checkedStatus, setCheckedStatus] = useState({});
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const getTodayStr = () => {
    const now = new Date();
    return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, '0') + "-" + String(now.getDate()).padStart(2, '0');
  };

  const loadCurrentStatus = async () => {
    setIsInitialLoading(true);
    const allData = await fetchScores();
    const today = getTodayStr();
    
    const status = {};
    allData.forEach(entry => {
      if (entry.date === today) {
        status[entry.room] = true;
      }
    });
    
    setCheckedStatus(status);
    setIsInitialLoading(false);
  };

  useEffect(() => {
    loadCurrentStatus();
  }, []);

  const handleScoreChange = (room, value) => {
    setScores(prev => ({ ...prev, [room]: parseFloat(value) }));
  };

  const handleSubmit = async (room) => {
    setLoadingStates(prev => ({ ...prev, [room]: true }));
    
    try {
      const result = await submitScore(room, scores[room]);
      
      if (result.status === 'success') {
        MySwal.fire({
          title: 'สำเร็จ!',
          text: `บันทึกคะแนนห้อง ${room} เรียบร้อยแล้ว`,
          icon: 'success',
          confirmButtonText: 'ตกลง',
          confirmButtonColor: '#3b82f6',
          timer: 2000,
          timerProgressBar: true,
          customClass: { popup: 'rounded-2xl' }
        });
        // อัปเดตสถานะว่าเช็คแล้วทันที
        setCheckedStatus(prev => ({ ...prev, [room]: true }));
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
      MySwal.fire({
        title: 'การเชื่อมต่อขัดข้อง',
        text: 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง',
        icon: 'error',
        confirmButtonText: 'ปิด',
        confirmButtonColor: '#ef4444',
        customClass: { popup: 'rounded-2xl' }
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [room]: false }));
    }
  };

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-slate-500 font-medium">กำลังโหลดสถานะล่าสุด...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">ภาพรวมการให้คะแนน</h2>
        <p className="text-slate-500 text-lg">
          ตรวจสอบและให้คะแนนความสะอาดของทุกห้องเรียนประจำวัน
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto w-full">
        {rooms.map((room) => {
          const isLoading = loadingStates[room];
          const isChecked = checkedStatus[room];
          const currentScore = scores[room];

          return (
            <div 
              key={room} 
              className={`card bg-white p-6 md:p-8 flex flex-col gap-6 transition-all border-2 ${
                isChecked ? 'border-green-100 bg-green-50/10' : 'border-slate-100'
              }`}
            >
              <div className="flex justify-between items-start border-b border-slate-50 pb-4">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">ห้อง {room}</h3>
                  <div className="mt-2">
                    {isChecked ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider">
                        <CheckCircle size={14} />
                        บันทึกแล้ว
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wider">
                        <Clock size={14} />
                        ยังไม่ได้กรอก
                      </span>
                    )}
                  </div>
                </div>
                <span className={`text-3xl font-black ${isChecked ? 'text-green-600' : 'text-blue-600'}`}>
                  {currentScore}
                </span>
              </div>

              <div className="flex flex-col gap-4">
                <div className="px-1">
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    step="0.5" 
                    value={currentScore} 
                    onChange={(e) => handleScoreChange(room, e.target.value)} 
                    disabled={isLoading || isChecked}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                      isChecked ? 'bg-green-100 accent-green-600' : 'bg-slate-100 accent-blue-600'
                    }`}
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2 px-1 uppercase tracking-wider">
                    <span>1</span>
                    <span>5</span>
                    <span>10</span>
                  </div>
                </div>

                <button
                  onClick={() => handleSubmit(room)}
                  disabled={isLoading || isChecked}
                  className={`btn w-full py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all ${
                    isChecked 
                      ? 'bg-green-100 text-green-600 cursor-default shadow-none border-none' 
                      : 'btn-primary shadow-blue-500/20'
                  }`}
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : isChecked ? (
                    <>
                      <CheckCircle size={18} />
                      เรียบร้อยแล้ว
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      บันทึกคะแนน
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CheckOverview;
