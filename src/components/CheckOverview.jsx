import { useState, useEffect, useCallback } from 'react';
import { Save, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { submitScore, fetchScores, invalidateCache } from '../api/googleSheets';
import confetti from 'canvas-confetti';

const MySwal = withReactContent(Swal);

const rooms = ["ม.1", "ม.2", "ม.3", "ม.4", "ม.5", "ม.6"];

function CheckOverview() {
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

  const loadCurrentStatus = useCallback(async (isInitial = false) => {
    if (!isInitial) setIsInitialLoading(true);
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
  }, []);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      await loadCurrentStatus(true);
    };
    if (isMounted) init();
    return () => { isMounted = false; };
  }, [loadCurrentStatus]);

  const handleScoreChange = (room, value) => {
    setScores(prev => ({ ...prev, [room]: parseFloat(value) }));
  };

  const handleSubmit = async (room) => {
    setLoadingStates(prev => ({ ...prev, [room]: true }));
    
    try {
      const result = await submitScore(room, scores[room]);
      
      if (result.status === 'success') {
        // 🎉 Confetti!
        confetti({
          particleCount: 100,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#3b82f6', '#10b981']
        });

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
        invalidateCache();
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
    } catch {
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

  return (
    <div className="flex flex-col gap-8 animate-slide-up">
      <div className="text-center max-w-2xl mx-auto animate-fade-in">
        <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-4 tracking-tight">รายการเช็ครายห้อง</h2>
        <p className="text-slate-500 font-medium text-lg">ประเมินความสะอาดของแต่ละห้องเรียนประจำวันนี้</p>
      </div>
      
      {isInitialLoading ? (
        <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-6"></div>
          <p className="text-slate-400 font-medium tracking-wide">กำลังเตรียมข้อมูลล่าสุด...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto w-full pb-10 px-2">
          {rooms.map((room, idx) => {
            const isLoading = loadingStates[room];
            const isChecked = checkedStatus[room];
            const currentScore = scores[room];

            return (
              <div 
                key={room} 
                className={`card bg-white p-6 md:p-8 flex flex-col gap-6 transition-all border-2 animate-slide-up card-hover ${
                  isChecked ? 'border-slate-200 bg-slate-50 opacity-60 grayscale cursor-not-allowed shadow-none' : 'border-slate-100 hover:border-blue-200 shadow-xl'
                }`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex justify-between items-start border-b border-slate-50 pb-4">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800">ห้อง {room}</h3>
                    <div className="mt-2">
                      {isChecked ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-wider">
                          <CheckCircle size={12} />
                          บันทึกแล้ว
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider animate-pulse">
                          <Clock size={12} />
                          รอการเช็ค
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-4xl font-black italic tracking-tighter ${isChecked ? 'text-slate-300' : 'text-blue-600'}`}>
                    {currentScore}
                  </span>
                </div>

                <div className={isChecked ? 'pointer-events-none' : ''}>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">ระดับความสะอาด</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    step="0.5" 
                    value={currentScore} 
                    onChange={(e) => handleScoreChange(room, e.target.value)}
                    disabled={isLoading || isChecked}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[9px] font-black text-slate-400 mt-4 uppercase tracking-tighter opacity-70">
                    <span>ควรปรับปรุง</span>
                    <span>ปานกลาง</span>
                    <span>สะอาดมาก</span>
                  </div>
                </div>

                <button
                  onClick={() => handleSubmit(room)}
                  disabled={isLoading || isChecked}
                  className={`btn w-full py-4 text-lg font-black shadow-lg transition-all ${
                    isChecked 
                      ? 'bg-slate-200 text-slate-400 shadow-none' 
                      : 'btn-primary'
                  }`}
                >
                  {isLoading ? (
                    <RefreshCw size={22} className="animate-spin text-white" />
                  ) : isChecked ? (
                    'เรียบร้อยแล้ว'
                  ) : (
                    <>
                      <Save size={20} />
                      บันทึกคะแนน
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CheckOverview;
