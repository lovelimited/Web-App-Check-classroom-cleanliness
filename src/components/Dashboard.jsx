import { useState, useEffect, useCallback, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, LabelList } from 'recharts';
import { fetchScores, prefetchScores } from '../api/googleSheets';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-lg">
        <p className="font-bold text-slate-700 mb-1">{label}</p>
        <p className="text-blue-600 font-medium">
          คะแนนเฉลี่ย: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

const rooms = ["ม.1", "ม.2", "ม.3", "ม.4", "ม.5", "ม.6"];

function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedOnce = useRef(false);

  const generateMockData = useCallback(() => {
    const mock = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const monthStr = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0');
      const academicYear = d.getMonth() < 4 ? (d.getFullYear() - 1).toString() : d.getFullYear().toString();
      
      rooms.forEach(room => {
        mock.push({
          date: dateStr,
          room: room,
          score: Math.floor(Math.random() * 4) + 6 + (Math.random() > 0.5 ? 0.5 : 0),
          month: monthStr,
          academicYear: academicYear
        });
      });
    }
    return mock;
  }, []);

  // Initial load: cache first, then background refresh
  const loadData = useCallback(async (isInitial = false) => {
    if (!isInitial) {
      setRefreshing(true);
    }
    try {
      const forceRefresh = !isInitial;
      const scores = await fetchScores(forceRefresh);
      
      if (!scores || scores.length === 0) {
        const mockData = generateMockData();
        setData(mockData);
      } else {
        setData(scores);
      }
      hasLoadedOnce.current = true;
    } catch (error) {
      console.error("Failed to load", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [generateMockData]);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      // Step 1: Load (from cache if available — instant)
      await loadData(true);
      
      // Step 2: Background refresh after showing cache
      if (isMounted) {
        const freshData = await prefetchScores();
        if (isMounted && freshData && freshData.length > 0) {
          setData(freshData);
        }
      }
    };
    if (isMounted) init();
    return () => { isMounted = false; };
  }, [loadData]);

  const getTodayStr = () => {
    const now = new Date();
    return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, '0') + "-" + String(now.getDate()).padStart(2, '0');
  };

  const getTodayStatus = () => {
    const today = getTodayStr();
    const todayData = data.filter(item => {
      const itemDate = typeof item.date === 'string' ? item.date.split('T')[0] : item.date;
      return itemDate === today;
    });
    
    return rooms.map(room => {
      const roomEntries = todayData.filter(d => d.room === room);
      const latestEntry = roomEntries.length > 0 ? roomEntries[roomEntries.length - 1] : null;
      
      return {
        room: room,
        score: latestEntry ? latestEntry.score : '-',
        isChecked: !!latestEntry
      };
    });
  };

  const getDailyData = () => {
    const dailyMap = {};
    data.forEach(item => {
      const date = typeof item.date === 'string' ? item.date.split('T')[0] : item.date;
      if (!dailyMap[date]) {
        dailyMap[date] = { date, total: 0, count: 0 };
      }
      dailyMap[date].total += item.score;
      dailyMap[date].count += 1;
    });
    
    return Object.values(dailyMap).map(d => ({
      date: d.date,
      average: parseFloat((d.total / d.count).toFixed(2))
    })).slice(-14);
  };

  const getRoomData = () => {
    const roomMap = {};
    data.forEach(item => {
      if (!roomMap[item.room]) {
        roomMap[item.room] = { room: item.room, total: 0, count: 0 };
      }
      roomMap[item.room].total += item.score;
      roomMap[item.room].count += 1;
    });
    
    return Object.values(roomMap).map(r => ({
      room: r.room,
      average: parseFloat((r.total / r.count).toFixed(2))
    })).sort((a, b) => a.room.localeCompare(b.room));
  };

  const getMonthlyData = () => {
    const monthMap = {};
    data.forEach(item => {
      const month = typeof item.month === 'string' ? item.month.slice(0, 7) : item.month;
      if (!monthMap[month]) {
        monthMap[month] = { month, total: 0, count: 0 };
      }
      monthMap[month].total += item.score;
      monthMap[month].count += 1;
    });
    
    return Object.values(monthMap).map(m => ({
      month: m.month,
      average: parseFloat((m.total / m.count).toFixed(2))
    })).sort((a, b) => a.month.localeCompare(b.month));
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6 animate-slide-up">
      <div className="flex justify-between items-center">
        <div className="animate-fade-in">
          <h2 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span className="inline-block animate-float">🧹</span> 
            ภาพรวมความสะอาด
          </h2>
          {refreshing && (
            <p className="text-[10px] text-blue-500 font-bold animate-pulse mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              กำลังอัปเดตข้อมูลล่าสุด...
            </p>
          )}
        </div>
        <button 
          onClick={loadData} 
          className="btn btn-primary text-xs md:text-sm px-4 py-2.5" 
          disabled={loading || refreshing}
        >
          <RefreshCw size={16} className={(loading || refreshing) ? "animate-spin" : ""} />
          <span>รีเฟรช</span>
        </button>
      </div>

      {loading ? (
        <div className="card text-center py-20 flex flex-col items-center justify-center animate-fade-in">
          <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-6"></div>
          <p className="text-slate-500 font-medium text-lg">กำลังเตรียมข้อมูล...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section: Today Status */}
          <div className="card border-none bg-white p-0 overflow-hidden shadow-xl animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="bg-gradient-to-r from-slate-50 to-white px-4 md:px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm md:text-base flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                สถานะประจำวัน ({getTodayStr()})
              </h3>
            </div>
            <div className="p-3 md:p-6">
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-4">
                {getTodayStatus().map((item, idx) => (
                  <div 
                    key={item.room} 
                    className={`p-3 md:p-4 rounded-xl md:rounded-2xl border-2 transition-all duration-500 card-hover ${
                      item.isChecked ? 'border-green-100 bg-green-50/30' : 'border-red-100 bg-red-50/30'
                    }`}
                    style={{ animationDelay: `${200 + (idx * 50)}ms` }}
                  >
                    <p className="text-[10px] md:text-sm font-bold text-slate-500 mb-0.5 md:mb-1 uppercase tracking-wider">{item.room}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xl md:text-3xl font-black ${item.isChecked ? 'text-green-600' : 'text-red-500'}`}>
                        {item.score}
                      </span>
                      {item.isChecked ? (
                        <CheckCircle size={18} className="text-green-500 hidden md:block" />
                      ) : (
                        <XCircle size={18} className="text-red-500 hidden md:block" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="card card-hover animate-slide-up" style={{ animationDelay: '300ms' }}>
              <h3 className="text-sm md:text-lg font-bold text-slate-700 mb-4 md:mb-6 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                คะแนนเฉลี่ยรายห้อง
              </h3>
              <div className="h-[220px] md:h-[300px] w-full overflow-hidden">
                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                  <BarChart data={getRoomData()} margin={{ top: 20, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="room" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dy={10} />
                    <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc', radius: 8}} />
                    <Bar dataKey="average" fill="url(#blueGradient)" radius={[6, 6, 0, 0]} barSize={32}>
                      <LabelList dataKey="average" position="top" style={{ fill: '#3b82f6', fontWeight: '800', fontSize: '11px' }} offset={10} />
                    </Bar>
                    <defs>
                      <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#60a5fa" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card card-hover animate-slide-up" style={{ animationDelay: '400ms' }}>
              <h3 className="text-sm md:text-lg font-bold text-slate-700 mb-4 md:mb-6 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                แนวโน้มรายวัน (14 วันล่าสุด)
              </h3>
              <div className="h-[220px] md:h-[300px] w-full overflow-hidden">
                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                  <LineChart data={getDailyData()} margin={{ top: 20, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} tickFormatter={(tick) => tick.slice(5)} dy={10} />
                    <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="average" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }}>
                      <LabelList dataKey="average" position="top" style={{ fill: '#6366f1', fontWeight: '800', fontSize: '10px' }} offset={12} />
                    </Line>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card lg:col-span-2 card-hover animate-slide-up" style={{ animationDelay: '500ms' }}>
              <h3 className="text-sm md:text-lg font-bold text-slate-700 mb-4 md:mb-6 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                แนวโน้มรายเดือน
              </h3>
              <div className="h-[220px] md:h-[300px] w-full overflow-hidden">
                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                  <BarChart data={getMonthlyData()} margin={{ top: 20, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                    <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc', radius: 8}} />
                    <Bar dataKey="average" fill="url(#emeraldGradient)" radius={[6, 6, 0, 0]} barSize={40}>
                      <LabelList dataKey="average" position="top" style={{ fill: '#10b981', fontWeight: '800', fontSize: '11px' }} offset={10} />
                    </Bar>
                    <defs>
                      <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#34d399" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
