import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UploadCloud, FileText, CheckCircle2, Zap, ArrowRight, Calendar, Zap as ZapIcon, IndianRupee, Hash, Loader2 } from 'lucide-react';
import { useReportStore } from '../../store/reportStore';
import { useAuthStore } from '../../store/authStore';

/* ─── Floating particle animation for the loading step ─── */
const LoadingOrbs = () => (
  <div className="relative w-24 h-24 flex items-center justify-center">
    {[0, 1, 2, 3, 4].map((i) => (
      <motion.div
        key={i}
        className="absolute w-3 h-3 rounded-full bg-brand-primary/60"
        animate={{
          x: [0, Math.cos((i / 5) * Math.PI * 2) * 36, 0],
          y: [0, Math.sin((i / 5) * Math.PI * 2) * 36, 0],
          scale: [1, 1.4, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{ duration: 2, delay: i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
      />
    ))}
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      className="w-10 h-10 rounded-full border-2 border-brand-light border-t-brand-primary"
    />
    <Zap size={16} className="absolute text-brand-primary" fill="currentColor" />
  </div>
);

/* ─── Loading message cycle ─── */
const LOADING_MSGS = [
  'Reading your bill data…',
  'Extracting units and tariffs…',
  'Running AI analysis…',
  'Calculating device footprint…',
  'Generating your report…',
];

function CyclingMessage() {
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % LOADING_MSGS.length), 1800);
    return () => clearInterval(t);
  }, []);
  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={idx}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.35 }}
        className="text-sm text-text-muted font-medium text-center"
      >
        {LOADING_MSGS[idx]}
      </motion.p>
    </AnimatePresence>
  );
}

/* ─── Step indicator dots ─── */
const StepDots = ({ step }) => (
  <div className="flex gap-1.5 items-center">
    {[1, 2, 3].map(s => (
      <div key={s} className={`rounded-full transition-all duration-300 ${s === 1 ? (step >= 1 ? 'w-4 h-1.5 bg-brand-primary' : 'w-1.5 h-1.5 bg-border') : (step >= s ? 'w-4 h-1.5 bg-brand-primary' : 'w-1.5 h-1.5 bg-border')}`} />
    ))}
  </div>
);

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const CURRENT_YEAR = new Date().getFullYear();

export default function UploadModal({ isOpen, onClose }) {
  const fileInputRef = useRef(null);
  const [file, setFile]           = useState(null);
  const [method, setMethod]       = useState('');
  const [step, setStep]           = useState(1);
  const [dragOver, setDragOver]   = useState(false);
  const [parsedData, setParsedData] = useState({
    month: MONTHS[new Date().getMonth()],
    year: CURRENT_YEAR,
    units: '',
    amount: '',
  });
  const [completeData, setCompleteData] = useState(null);
  const [filePath, setFilePath]         = useState('');
  const [errors, setErrors]             = useState({});

  const setActiveReport = useReportStore(s => s.setActiveReport);
  const addReport       = useReportStore(s => s.addReport);
  const user = useAuthStore(s => s.user);

  const resetAll = () => {
    setFile(null); setMethod(''); setStep(1); setDragOver(false);
    setParsedData({ month: MONTHS[new Date().getMonth()], year: CURRENT_YEAR, units: '', amount: '' });
    setCompleteData(null); setFilePath(''); setErrors({});
  };

  const handleClose = () => { onClose(); setTimeout(resetAll, 400); };

  // ─── File processing ───
  const processFile = async (f) => {
    setFile(f);
    setMethod('file');
    setStep(1.5);
    const formData = new FormData();
    formData.append('file', f);
    try {
      const res  = await fetch('http://localhost:8000/bill/parse', { method: 'POST', body: formData });
      const json = await res.json();
      setCompleteData(json.data);
      setFilePath(json.file_path);
      setParsedData({
        month:  json.data?.month  || MONTHS[new Date().getMonth()],
        year:   json.data?.year   || CURRENT_YEAR,
        units:  json.data?.units_kwh || '',
        amount: json.data?.amount_rs  || '',
      });
      setStep(2);
    } catch {
      setStep(1);
    }
  };

  // ─── Validate & Save ───
  const validate = () => {
    const e = {};
    if (!parsedData.month) e.month = 'Required';
    if (!parsedData.units || Number(parsedData.units) <= 0) e.units = 'Enter a valid number';
    if (!parsedData.amount || Number(parsedData.amount) <= 0) e.amount = 'Enter a valid number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setStep(1.5);
    try {
      const finalData = {
        ...(completeData || {}),
        month:     parsedData.month,
        year:      Number(parsedData.year) || CURRENT_YEAR,
        units_kwh: Number(parsedData.units),
        amount_rs: Number(parsedData.amount),
      };
      const res = await fetch('http://localhost:8000/bill/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id, file_path: filePath || '', data: finalData }),
      });
      const data = await res.json();
      const reportRes = await fetch(`http://localhost:8000/report/${data.report_id}`);
      if (reportRes.ok) {
        const report = await reportRes.json();
        setActiveReport(report);
        if (addReport) addReport(report);
      }
      setStep(3);
      setTimeout(handleClose, 1800);
    } catch {
      setStep(2);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="relative w-full max-w-lg bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden"
          >
            {/* ─── Header ─── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-raised/60">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-brand-primary rounded-lg flex items-center justify-center">
                  <Zap size={14} className="text-white" fill="white" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-text-primary">Add Electricity Bill</h2>
                  <p className="text-[11px] text-text-muted font-medium">
                    {step === 1 ? 'Upload or enter manually' : step === 1.5 ? 'Processing…' : step === 2 ? 'Verify details' : 'Done!'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StepDots step={step === 1.5 ? 1.5 : step === 3 ? 3 : step} />
                <button onClick={handleClose} className="p-1.5 hover:bg-surface border border-transparent hover:border-border rounded-lg transition text-text-muted hover:text-text-primary">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* ─── Body ─── */}
            <div className="p-6">
              <AnimatePresence mode="wait">

                {/* Step 1 — Choose method */}
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                    {/* Drop zone */}
                    <label
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); }}
                      className={`block border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300 ${dragOver ? 'border-brand-primary bg-brand-light/20' : 'border-border hover:border-brand-primary/50 hover:bg-brand-light/10'}`}
                    >
                      <motion.div
                        animate={{ y: dragOver ? -6 : 0 }}
                        transition={{ duration: 0.3 }}
                        className={`p-3.5 rounded-xl transition-colors duration-300 ${dragOver ? 'bg-brand-primary text-white' : 'bg-raised text-brand-primary border border-border'}`}
                      >
                        <UploadCloud size={28} />
                      </motion.div>
                      <div className="text-center">
                        <p className="font-bold text-base text-text-primary">{dragOver ? 'Drop it here!' : 'Click or drag & drop your bill'}</p>
                        <p className="text-xs text-text-muted mt-0.5">PDF, JPG, PNG — max 10 MB</p>
                      </div>
                      <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" ref={fileInputRef} onChange={e => { if (e.target.files[0]) processFile(e.target.files[0]); }} />
                    </label>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest">or</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    {/* Manual entry button */}
                    <button
                      onClick={() => { setMethod('manual'); setStep(2); }}
                      className="w-full flex items-center gap-3 p-4 bg-raised/60 border border-border rounded-xl hover:border-brand-primary/30 hover:bg-brand-light/10 transition-all duration-200 group"
                    >
                      <div className="w-9 h-9 bg-surface border border-border rounded-xl flex items-center justify-center text-text-muted group-hover:border-brand-primary/30 group-hover:text-brand-primary transition shrink-0">
                        <FileText size={18} />
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-sm font-bold text-text-primary">Enter Manually</p>
                        <p className="text-xs text-text-muted">Type in your bill details directly</p>
                      </div>
                      <ArrowRight size={16} className="text-text-muted group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                    </button>
                  </motion.div>
                )}

                {/* Step 1.5 — Loading */}
                {step === 1.5 && (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center gap-6 py-10">
                    <LoadingOrbs />
                    <div className="text-center space-y-2">
                      <h3 className="text-base font-bold text-text-primary">AI is analyzing your bill</h3>
                      <CyclingMessage />
                    </div>
                    {/* Soft progress bar */}
                    <div className="w-48 h-1 bg-border rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-brand-primary rounded-full"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ width: '60%' }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Step 2 — Verify / Manual entry */}
                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                    {/* Success banner for file parsing */}
                    {method !== 'manual' && (
                      <div className="flex items-center gap-3 p-3 bg-positive-light/60 border border-positive/20 rounded-xl">
                        <CheckCircle2 size={18} className="text-positive shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-positive">Bill parsed successfully</p>
                          <p className="text-xs text-positive/70">Please verify the details below before submitting.</p>
                        </div>
                      </div>
                    )}

                    {/* Month + Year row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-text-muted mb-1.5 flex items-center gap-1.5">
                          <Calendar size={11} /> Billing Month
                        </label>
                        <select
                          value={parsedData.month}
                          onChange={e => setParsedData({...parsedData, month: e.target.value})}
                          className={`w-full px-3 py-2.5 bg-raised border rounded-xl text-sm font-bold text-text-primary outline-none focus:ring-2 ring-brand-primary/20 transition ${errors.month ? 'border-negative' : 'border-border focus:border-brand-primary'}`}
                        >
                          {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-text-muted mb-1.5 flex items-center gap-1.5">
                          <Hash size={11} /> Year
                        </label>
                        <select
                          value={parsedData.year}
                          onChange={e => setParsedData({...parsedData, year: Number(e.target.value)})}
                          className="w-full px-3 py-2.5 bg-raised border border-border rounded-xl text-sm font-bold text-text-primary outline-none focus:ring-2 ring-brand-primary/20 focus:border-brand-primary transition"
                        >
                          {[CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Units + Amount row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-text-muted mb-1.5 flex items-center gap-1.5">
                          <ZapIcon size={11} /> Units (kWh)
                        </label>
                        <input
                          type="number" min="0" placeholder="e.g. 285"
                          value={parsedData.units}
                          onChange={e => { setParsedData({...parsedData, units: e.target.value}); setErrors({...errors, units: ''}); }}
                          className={`w-full px-3 py-2.5 bg-surface border rounded-xl text-base font-black data-text text-text-primary outline-none focus:ring-2 ring-brand-primary/20 transition ${errors.units ? 'border-negative ring-negative/20' : 'border-border focus:border-brand-primary'}`}
                        />
                        {errors.units && <p className="text-[10px] text-negative mt-1">{errors.units}</p>}
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-text-muted mb-1.5 flex items-center gap-1.5">
                          <IndianRupee size={11} /> Amount (₹)
                        </label>
                        <input
                          type="number" min="0" placeholder="e.g. 2400"
                          value={parsedData.amount}
                          onChange={e => { setParsedData({...parsedData, amount: e.target.value}); setErrors({...errors, amount: ''}); }}
                          className={`w-full px-3 py-2.5 bg-surface border rounded-xl text-base font-black data-text text-text-primary outline-none focus:ring-2 ring-brand-primary/20 transition ${errors.amount ? 'border-negative ring-negative/20' : 'border-border focus:border-brand-primary'}`}
                        />
                        {errors.amount && <p className="text-[10px] text-negative mt-1">{errors.amount}</p>}
                      </div>
                    </div>

                    {/* Preview pill */}
                    {parsedData.units && parsedData.amount && (
                      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-3 bg-brand-light/30 border border-brand-primary/15 rounded-xl">
                        <span className="text-xs font-bold text-brand-primary">{parsedData.month} {parsedData.year}</span>
                        <span className="flex items-center gap-3">
                          <span className="text-xs font-black data-text text-text-primary">{parsedData.units} kWh</span>
                          <span className="w-px h-3 bg-border" />
                          <span className="text-xs font-black data-text text-text-primary">₹{Number(parsedData.amount).toLocaleString()}</span>
                        </span>
                      </motion.div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                      <button
                        onClick={() => { setStep(1); setMethod(''); setErrors({}); }}
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold text-text-secondary hover:bg-raised border border-transparent hover:border-border transition"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={handleSave}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand-primary text-white rounded-xl font-bold text-sm hover:bg-brand-dark hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 shadow-sm shadow-brand-primary/20"
                      >
                        Confirm & Analyze <ArrowRight size={15} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3 — Success */}
                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center gap-4 py-10">
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
                      className="w-16 h-16 bg-positive/10 border-2 border-positive/20 rounded-full flex items-center justify-center text-positive"
                    >
                      <CheckCircle2 size={32} />
                    </motion.div>
                    <div className="text-center">
                      <h3 className="text-lg font-extrabold text-text-primary">Report Generated!</h3>
                      <p className="text-sm text-text-muted mt-1">Your bill has been analyzed. Opening report…</p>
                    </div>
                    {/* Shrinking progress bar */}
                    <div className="w-32 h-1 bg-border rounded-full overflow-hidden">
                      <motion.div className="h-full bg-positive rounded-full" initial={{ width: '100%' }} animate={{ width: '0%' }} transition={{ duration: 1.6, ease: 'linear' }} />
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
