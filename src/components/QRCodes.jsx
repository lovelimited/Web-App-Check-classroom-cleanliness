import { useState, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Download, X, ZoomIn } from 'lucide-react';

function QRCodes() {
  const rooms = ["ม.1", "ม.2", "ม.3", "ม.4", "ม.5", "ม.6"];
  const [selectedRoom, setSelectedRoom] = useState(null);
  const modalQrRef = useRef(null);
  
  // ใช้ origin + pathname เพื่อให้รองรับ Subfolder ใน GitHub Pages และเติม # สำหรับ HashRouter
  const basePath = (window.location.origin + window.location.pathname).replace(/\/$/, '');

  const handleDownload = useCallback((room) => {
    // Create an offscreen SVG QR, render to canvas, then download as PNG
    const svgContainer = document.createElement('div');
    svgContainer.style.position = 'absolute';
    svgContainer.style.left = '-9999px';
    document.body.appendChild(svgContainer);

    // Render a temporary QRCodeSVG via DOM
    const size = 512;
    const padding = 40;
    const totalSize = size + padding * 2;
    
    // Use the QR library to generate SVG string
    const tempRoot = document.createElement('div');
    document.body.appendChild(tempRoot);
    
    // Create a canvas approach using the visible SVG
    const svgEl = (selectedRoom === room && modalQrRef.current)
      ? modalQrRef.current.querySelector('svg')
      : document.querySelector(`[data-qr-room="${room}"] svg`);
    
    document.body.removeChild(tempRoot);
    document.body.removeChild(svgContainer);

    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    canvas.width = totalSize;
    canvas.height = totalSize;
    const ctx = canvas.getContext('2d');
    
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, totalSize, totalSize);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, padding, padding, size, size);
      
      // Add room label text
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`ห้อง ${room}`, totalSize / 2, totalSize - 8);

      const link = document.createElement('a');
      link.download = `QR-ห้อง${room}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }, [selectedRoom]);

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
              <div 
                data-qr-room={room}
                className="bg-white p-4 border-2 border-slate-100 rounded-xl mb-6 cursor-pointer relative group"
                onClick={() => setSelectedRoom(room)}
              >
                <QRCodeSVG 
                  value={checkUrl} 
                  size={160} 
                  level={"H"}
                  includeMargin={true}
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-all duration-200 flex items-center justify-center">
                  <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 drop-shadow-lg" size={32} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">ห้อง {room}</h3>
              <div className="flex gap-3 items-center print:hidden">
                <a 
                  href={checkUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-blue-600 font-medium hover:text-blue-800 hover:underline transition-colors"
                >
                  เปิดลิงก์
                </a>
                <span className="text-slate-300">|</span>
                <button
                  onClick={() => handleDownload(room)}
                  className="text-emerald-600 font-medium hover:text-emerald-800 transition-colors flex items-center gap-1"
                >
                  <Download size={14} />
                  ดาวน์โหลด
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Lightbox */}
      {selectedRoom && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center print:hidden"
          onClick={() => setSelectedRoom(null)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn" />
          
          {/* Modal Content */}
          <div 
            className="relative bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-6 animate-scaleIn max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedRoom(null)}
              className="absolute top-3 right-3 p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700"
            >
              <X size={24} />
            </button>

            <h3 className="text-2xl font-bold text-slate-800">ห้อง {selectedRoom}</h3>
            
            <div ref={modalQrRef} className="bg-white p-6 border-2 border-slate-100 rounded-2xl">
              <QRCodeSVG 
                value={`${basePath}/#/check/${selectedRoom}`}
                size={300}
                level={"H"}
                includeMargin={true}
              />
            </div>

            <p className="text-sm text-slate-400 text-center max-w-xs">
              {`${basePath}/#/check/${selectedRoom}`}
            </p>

            <button
              onClick={() => handleDownload(selectedRoom)}
              className="btn btn-primary px-8 py-3 text-base flex items-center gap-2"
            >
              <Download size={20} />
              ดาวน์โหลด QR Code
            </button>
          </div>
        </div>
      )}
      
      {/* Print-specific styles + modal animations */}
      <style>{`
        @media print {
          body { background: white; }
          .card { border: none; box-shadow: none; break-inside: avoid; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.25s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default QRCodes;

