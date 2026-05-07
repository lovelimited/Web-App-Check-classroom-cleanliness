import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer } from 'lucide-react';

function QRCodes() {
  const rooms = ["ม.1", "ม.2", "ม.3", "ม.4", "ม.5", "ม.6"];
  
  // ใช้ origin + pathname เพื่อให้รองรับ Subfolder ใน GitHub Pages และเติม # สำหรับ HashRouter
  const basePath = (window.location.origin + window.location.pathname).replace(/\/$/, '');
  return (
    <div className="flex flex-col gap-8">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">QR Code สำหรับเช็คคะแนน</h2>
        <p className="text-slate-500 text-lg">
          สแกน QR Code ด้านล่างเพื่อเข้าสู่หน้าต่างประเมินคะแนนของแต่ละห้อง
          คุณสามารถนำไปพิมพ์เพื่อติดหน้าห้องได้
        </p>
        <button 
          onClick={() => window.print()} 
          className="btn btn-primary mt-6 px-6 py-2.5 text-sm print:hidden"
        >
          <Printer size={18} />
          พิมพ์หน้าจอ
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => {
          const checkUrl = `${basePath}/#/check/${room}`;
          return (
            <div key={room} className="card flex flex-col items-center justify-center p-8 hover:shadow-lg transition-shadow duration-300">
              <div className="bg-white p-4 border-2 border-slate-100 rounded-xl mb-6">
                <QRCodeSVG 
                  value={checkUrl} 
                  size={160} 
                  level={"H"}
                  includeMargin={true}
                />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">ห้อง {room}</h3>
              <a 
                href={checkUrl} 
                target="_blank" 
                rel="noreferrer"
                className="text-blue-600 font-medium hover:text-blue-800 hover:underline transition-colors print:hidden"
              >
                เปิดลิงก์สำหรับเช็คคะแนน
              </a>
            </div>
          );
        })}
      </div>
      
      {/* Print-specific styles using Tailwind's print modifier */}
      <style>{`
        @media print {
          body { background: white; }
          .card { border: none; box-shadow: none; break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}

export default QRCodes;
