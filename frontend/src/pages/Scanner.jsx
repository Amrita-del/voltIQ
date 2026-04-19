import React, { useRef, useState, useEffect } from 'react';
import { ScanLine, UploadCloud, Star, IndianRupee, Zap, Leaf, Info, RotateCcw, Camera, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BEE_STARS = {
  1: { label: '1 Star', color: '#EF4444', desc: 'Poor efficiency. Very high annual running cost.' },
  2: { label: '2 Stars', color: '#F97316', desc: 'Below average. Consider upgrading soon.' },
  3: { label: '3 Stars', color: '#EAB308', desc: 'Average efficiency. Acceptable for light usage.' },
  4: { label: '4 Stars', color: '#84CC16', desc: 'Good efficiency. Recommended for most households.' },
  5: { label: '5 Stars', color: '#22C55E', desc: 'Excellent efficiency. Maximum energy savings.' },
};

export default function Scanner() {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  const startCamera = async () => {
    setCameraActive(true);
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
        processFile(file);
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  };

  const processFile = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setLoading(true);
    setResult(null);
    try {
      const res  = await fetch('http://localhost:8000/barcode/scan', { method: 'POST', body: formData });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: 'Analysis failed. Please try a clearer image of the BEE label.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) processFile(file);
  };

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const starInfo = result?.star_rating ? BEE_STARS[Math.round(result.star_rating)] : null;

  return (
    <div className="max-w-2xl mx-auto pb-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#2D2A26] tracking-tight">Quick Scan</h1>
        <p className="text-sm text-[#7A7670] mt-1 font-medium">Scan a BEE Star Rating label to instantly decode its annual running cost.</p>
      </div>

      {/* Scanner card */}
      <div className="bg-[#FDFBF7] border border-[#EAE7E2] rounded-[24px] overflow-hidden shadow-sm relative">
        <canvas ref={canvasRef} className="hidden" />

        {/* Drop zone / Camera View */}
        <div
          onClick={() => !loading && !result && !cameraActive && fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative transition-all duration-300 ${dragOver ? 'bg-[#36796A]/5' : 'bg-[#F8F2EA]/40'} ${cameraActive ? '' : 'cursor-pointer'}`}
          style={{ minHeight: 320 }}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={e => {
              if (e.target.files?.[0]) {
                processFile(e.target.files[0]);
                e.target.value = ''; // Reset for same-file re-uploads
              }
            }} 
            className="hidden" 
            accept="image/*" 
          />

          <AnimatePresence mode="wait">
            {cameraActive ? (
              <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black flex flex-col items-center justify-center overflow-hidden">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                
                {/* Overlay UI */}
                <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
                  <div className="w-full h-full border-2 border-brand-primary/50 relative">
                    {/* Corners */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-brand-primary" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-brand-primary" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-brand-primary" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-brand-primary" />
                  </div>
                </div>

                <div className="absolute top-4 right-4 z-20">
                  <button onClick={(e) => { e.stopPropagation(); stopCamera(); }} className="p-2 bg-black/60 text-white rounded-full backdrop-blur-md">
                    <X size={20} />
                  </button>
                </div>

                <div className="absolute bottom-6 z-20">
                  <button 
                    onClick={(e) => { e.stopPropagation(); captureImage(); }} 
                    className="w-16 h-16 rounded-full border-4 border-white bg-brand-primary flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
                  >
                    <Camera size={28} />
                  </button>
                </div>
              </motion.div>
            ) : loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="relative w-14 h-14">
                  <div className="absolute inset-0 border-4 border-brand-light rounded-full" />
                  <div className="absolute inset-0 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-sm font-bold text-text-secondary">Analyzing BEE label...</p>
              </motion.div>
            ) : result && !result.error ? (
              <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
                {/* Star rating */}
                <div className="flex gap-1.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={22}
                      fill={s <= Math.round(result.star_rating) ? (starInfo?.color || '#22C55E') : '#E2E2DC'}
                      stroke="none"
                    />
                  ))}
                </div>
                <div className="text-center">
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-text-muted mb-1">BEE Analysis Complete</p>
                  <h3 className="text-2xl font-extrabold text-text-primary">{result.device_type}</h3>
                  <p className="text-sm text-text-secondary mt-1">{starInfo?.desc}</p>
                </div>
              </motion.div>
            ) : result?.error ? (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8">
                <div className="w-12 h-12 rounded-full bg-negative-light flex items-center justify-center text-negative">
                  <Info size={22} />
                </div>
                <p className="text-sm font-semibold text-negative text-center">{result.error}</p>
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                {/* Animated scan frame */}
                <div className="relative w-28 h-28 flex items-center justify-center mb-2">
                  {/* Corner brackets */}
                  {[
                    'top-0 left-0 border-t-2 border-l-2',
                    'top-0 right-0 border-t-2 border-r-2',
                    'bottom-0 left-0 border-b-2 border-l-2',
                    'bottom-0 right-0 border-b-2 border-r-2',
                  ].map((cls, i) => (
                    <span key={i} className={`absolute w-5 h-5 ${cls} ${dragOver ? 'border-brand-primary' : 'border-brand-primary/50'} rounded-sm transition-colors duration-300`} />
                  ))}
                  <ScanLine size={40} className={`${dragOver ? 'text-brand-primary' : 'text-brand-primary/40'} transition-colors duration-300`} />
                </div>
                <p className="text-sm font-semibold text-text-primary">
                  {dragOver ? 'Drop image here' : 'Click or drag & drop a BEE label image'}
                </p>
                <p className="text-xs text-text-muted">JPEG, PNG — max 10MB</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results panel */}
        <AnimatePresence>
          {result && !result.error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border"
            >
              <div className="p-6 grid grid-cols-3 gap-4">
                {[
                  { icon: IndianRupee, label: 'Annual Cost', val: `₹${result.annual_cost_rs?.toLocaleString() || '—'}`, color: 'text-[#C77232]', bg: 'bg-[#FDF3E8]' },
                  { icon: Zap,         label: 'Annual Units', val: result.annual_kwh ? `${result.annual_kwh} kWh` : '—', color: 'text-[#36796A]', bg: 'bg-[#EAF3EF]' },
                  { icon: Leaf,        label: 'CO₂ / Year', val: result.carbon_kg ? `${result.carbon_kg} kg` : '—', color: 'text-[#4A8F5D]', bg: 'bg-[#EFF6EE]' },
                ].map(item => (
                  <div key={item.label} className={`${item.bg} rounded-[20px] p-4 text-center border border-black/5`}>
                    <div className={`flex justify-center mb-2 ${item.color}`}><item.icon size={18} /></div>
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#8A8680] mb-1.5">{item.label}</p>
                    <p className={`text-[17px] font-black tracking-tight ${item.color}`}>{item.val}</p>
                  </div>
                ))}
              </div>
              {result.ai_insight && (
                <div className="mx-6 mb-6 p-5 bg-[#F8F2EA] border border-[#EBE3D5] rounded-[20px]">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#36796A] mb-2.5 flex items-center gap-2">
                    <Zap size={10} fill="currentColor" /> AI Insight
                  </p>
                  <p className="text-[13px] text-[#2D2A26] font-semibold leading-relaxed">{result.ai_insight}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action bar */}
        <div className="p-5 border-t border-[#EAE7E2] flex gap-3 bg-[#FDFBF7]">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || cameraActive}
            className="flex-1 flex items-center justify-center gap-2.5 py-4 bg-[#2D8075] text-white font-bold text-[13px] rounded-[18px] shadow-sm hover:bg-[#24665C] transition-all disabled:opacity-50"
          >
            <UploadCloud size={18} /> Upload Label
          </button>
          <button
            onClick={() => startCamera()}
            disabled={loading || cameraActive}
            className="flex-1 flex items-center justify-center gap-2.5 py-4 bg-[#FDF3E8] text-[#C77232] border border-[#FDEED9] font-bold text-[13px] rounded-[18px] shadow-sm hover:bg-[#FBE8D0] transition-all disabled:opacity-50"
          >
            <Camera size={18} /> Use Camera
          </button>
          {(result || cameraActive) && (
            <button
              onClick={() => { setResult(null); stopCamera(); }}
              className="px-5 py-4 bg-white border border-[#EAE7E2] text-[#7A7670] rounded-[18px] hover:bg-[#F8F2EA] transition-all"
              title="Reset"
            >
              <RotateCcw size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Info section */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: Star,        title: 'BEE Star Ratings', desc: 'BEE 1–5 star labels are found on ACs, fridges, fans, and other appliances. Higher stars = less electricity.' },
          { icon: IndianRupee, title: 'Running Cost',     desc: 'We calculate the true annual cost based on your local tariff rate and the appliance\'s rated wattage.' },
          { icon: Zap,         title: 'Save On Bills',    desc: 'Replacing a 1-star AC with a 5-star model can save ₹8,000–₹12,000 per year in electricity costs alone.' },
        ].map(item => (
          <div key={item.title} className="bg-[#FDFBF7] border border-[#EAE7E2] rounded-[20px] p-5">
            <div className="bg-[#EAF3EF] w-9 h-9 rounded-xl flex items-center justify-center text-[#36796A] mb-3.5">
              <item.icon size={16} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#9A9894] mb-2">{item.title}</p>
            <p className="text-[12px] text-[#7A7670] leading-relaxed font-medium">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
