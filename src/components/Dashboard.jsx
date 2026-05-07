import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { fetchScores } from '../api/googleSheets';
import { RefreshCw, TrendingUp, Award } from 'lucide-react';

function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const scores = await fetchScores();
      
      if (!scores || scores.length === 0) {
        const mockData = generateMockData();
        setData(mockData);
      } else {
        setData(scores);
      }
    } catch (error) {
      console.error("Failed to load", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const generateMockData = () => {
    const mock = [];
    const rooms = ["ม.1", "ม.2", "ม.3", "ม.4", "ม.5", "ม.6"];
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
  };

  const getDailyData = () => {
    const dailyMap = {};
    data.forEach(item => {
      if (!dailyMap[item.date]) {
        dailyMap[item.date] = { date: item.date, total: 0, count: 0 };
      }
      dailyMap[item.date].total += item.score;
      dailyMap[item.date].count += 1;
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
      if (!monthMap[item.month]) {
        monthMap[item.month] = { month: item.month, total: 0, count: 0 };
      }
      monthMap[item.month].total += item.score;
      monthMap[item.month].count += 1;
    });
    
    return Object.values(monthMap).map(m => ({
      month: m.month,
      average: parseFloat((m.total / m.count).toFixed(2))
    })).sort((a, b) => a.month.localeCompare(b.month));
  };

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-slate-800">ภาพรวมความสะอาด</h2>
        <button 
          onClick={loadData} 
          className="btn btn-primary text-sm px-4 py-2" 
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          รีเฟรชข้อมูล
        </button>
      </div>

      {loading ? (
        <div className="card text-center py-16">
          <RefreshCw size={32} className="animate-spin mx-auto text-blue-500 mb-4" />
          <p className="text-slate-500">กำลังโหลดข้อมูล...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card flex items-center gap-5">
              <div className="bg-blue-50 p-4 rounded-full">
                <TrendingUp size={28} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">คะแนนเฉลี่ยรวม</p>
                <h3 className="text-3xl font-bold text-slate-800">
                  {data.length > 0 ? (data.reduce((acc, curr) => acc + curr.score, 0) / data.length).toFixed(2) : '0.00'}
                </h3>
              </div>
            </div>
            <div className="card flex items-center gap-5">
              <div className="bg-emerald-50 p-4 rounded-full">
                <Award size={28} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">ห้องที่คะแนนดีสุด</p>
                <h3 className="text-3xl font-bold text-slate-800">
                  {getRoomData().length > 0 ? [...getRoomData()].sort((a, b) => b.average - a.average)[0].room : '-'}
                </h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-bold text-slate-700 mb-6">คะแนนเฉลี่ยรายห้อง</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getRoomData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="room" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                    <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: '#f1f5f9'}} />
                    <Bar dataKey="average" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-bold text-slate-700 mb-6">แนวโน้มรายวัน (14 วันล่าสุด)</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getDailyData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} tickFormatter={(tick) => tick.slice(5)} dy={10} />
                    <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="average" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card lg:col-span-2">
              <h3 className="text-lg font-bold text-slate-700 mb-6">แนวโน้มรายเดือน (ปีการศึกษา)</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getMonthlyData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                    <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: '#f1f5f9'}} />
                    <Bar dataKey="average" fill="#10b981" radius={[6, 6, 0, 0]} barSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
