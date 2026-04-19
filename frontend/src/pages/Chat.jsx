import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Sparkles, Loader2, ArrowRight, TrendingDown, BarChart2, Leaf, ChevronDown, Calendar, CheckCircle2, IndianRupee, Zap, Monitor, MessageSquare, History, Activity, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReportStore } from '../store/reportStore';
import { useAuthStore } from '../store/authStore';

const QUICK_REPLIES = [
  'Which device costs the most?',
  'How do I reduce my bill?',
  'Am I in a high tariff slab?',
  'What is my carbon footprint?',
];

/* ─── Inline widget cards inside bot messages ─── */
function InlineWidget({ type, data }) {
  if (type === 'savings')
    return (
      <div className="my-2 flex items-center justify-between p-3 bg-positive-light border border-positive/20 rounded-xl">
        <div className="flex items-center gap-2 text-positive font-bold text-xs"><TrendingDown size={13} /> Savings Potential</div>
        <span className="text-base font-black data-text text-positive">₹{data?.budget_analysis?.suggested_savings || 0}</span>
      </div>
    );
  if (type === 'usage')
    return (
      <div className="my-2 flex items-center justify-between p-3 bg-brand-light/50 border border-brand-primary/20 rounded-xl">
        <div className="flex items-center gap-2 text-brand-primary font-bold text-xs"><BarChart2 size={13} /> Units This Cycle</div>
        <span className="text-base font-black data-text text-brand-primary">{data?.units_kwh || 0} kWh</span>
      </div>
    );
  if (type === 'carbon')
    return (
      <div className="my-2 flex items-center justify-between p-3 bg-positive-light border border-positive/20 rounded-xl">
        <div className="flex items-center gap-2 text-positive font-bold text-xs"><Leaf size={13} /> CO₂ Impact</div>
        <span className="text-base font-black data-text text-positive">{data?.carbon?.impact_kg || 0} kg</span>
      </div>
    );
  return null;
}

/* ─── Markdown renderer ─── */
function RenderMessage({ text, reportData }) {
  if (!text) return null;
  return (
    <div className="space-y-1">
      {text.split('\n').map((line, i) => {
        if (line.includes('[WIDGET:SAVINGS]')) return <InlineWidget key={i} type="savings" data={reportData} />;
        if (line.includes('[WIDGET:USAGE]'))   return <InlineWidget key={i} type="usage"   data={reportData} />;
        if (line.includes('[WIDGET:CARBON]'))  return <InlineWidget key={i} type="carbon"  data={reportData} />;

        const isBullet = /^[\*\-] /.test(line.trim());
        const content  = isBullet ? line.trim().slice(2) : line;
        const parts    = content.split(/(\*\*.*?\*\*)/g).map((p, j) =>
          p.startsWith('**') && p.endsWith('**')
            ? <strong key={j} className="text-brand-primary font-semibold">{p.slice(2, -2)}</strong>
            : p.replace(/#+\s?/g, '')
        );
        if (!content.trim()) return null;
        if (isBullet)
          return (
            <div key={i} className="flex items-start gap-2 text-sm text-text-secondary">
              <ArrowRight size={12} className="mt-[3px] shrink-0 text-brand-primary" />
              <span>{parts}</span>
            </div>
          );
        return <p key={i} className="text-sm text-text-secondary leading-relaxed">{parts}</p>;
      })}
    </div>
  );
}

/* ─── Report Selector Dropdown ─── */
function ReportSelector({ reports, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const sorted = [...reports].sort((a, b) => a.id - b.id);
  const getNum = (r) => sorted.findIndex(x => x.id === r.id) + 1;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2 text-xs font-bold text-text-secondary hover:border-brand-primary/30 hover:text-brand-primary transition-all"
      >
        <div className="w-1.5 h-1.5 bg-positive rounded-full" />
        {selected ? `Bill #${getNum(selected)} — ${selected.month} ${selected.year}` : 'Select a bill'}
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1.5 w-64 bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-50"
          >
            <div className="p-1.5 max-h-64 overflow-y-auto">
              {/* "All bills" option — uses latest */}
              <button
                onClick={() => { onSelect(null); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition text-xs ${!selected ? 'bg-brand-light/40 text-brand-primary font-bold' : 'hover:bg-raised text-text-secondary font-medium'}`}
              >
                <div className="w-5 h-5 rounded-lg bg-brand-light flex items-center justify-center text-brand-primary shrink-0">
                  <BarChart2 size={11} />
                </div>
                <span>Latest Bill (auto)</span>
                {!selected && <CheckCircle2 size={12} className="ml-auto text-brand-primary" />}
              </button>

              {reports.length > 0 && <div className="h-px bg-border mx-2 my-1" />}

              {[...sorted].reverse().map((r) => {
                const num = getNum(r);
                const isActive = selected?.id === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => { onSelect(r); setOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition ${isActive ? 'bg-brand-light/40 text-brand-primary font-bold' : 'hover:bg-raised text-text-secondary font-medium'}`}
                  >
                    <div className="w-5 h-5 rounded-lg bg-raised border border-border flex items-center justify-center text-text-muted shrink-0">
                      <Calendar size={10} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-[11px] font-bold text-text-primary truncate">Bill #{num} — {r.month} {r.year}</p>
                      <p className="text-[10px] text-text-muted">₹{r.amount_rs?.toLocaleString()} · {r.units_kwh} kWh</p>
                    </div>
                    {isActive && <CheckCircle2 size={12} className="ml-auto text-brand-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
export default function Chat() {
  const storeActiveReport = useReportStore(s => s.activeReport);
  const reports           = useReportStore(s => s.reports);
  const user              = useAuthStore(s => s.user);
  const profile           = useAuthStore(s => s.profile);

  // selectedReport = null means "use latest automatically"
  const [selectedReport, setSelectedReport] = useState(null);

  const latestReport  = reports?.length > 0 ? [...reports].sort((a,b) => a.id - b.id)[reports.length - 1] : null;
  const currentData   = selectedReport || storeActiveReport || latestReport;

  const sorted     = [...reports].sort((a, b) => a.id - b.id);
  const displayNum = currentData ? sorted.findIndex(r => r.id === currentData.id) + 1 : null;

  // Real data calculations for insights
  const avgUnitsPerDay = React.useMemo(() => {
    if (!latestReport) return 0;
    return Math.round(latestReport.units_kwh / 30);
  }, [latestReport]);

  const currentRate = React.useMemo(() => {
    if (!latestReport || !latestReport.units_kwh) return '7.50'; 
    return (latestReport.amount_rs / latestReport.units_kwh).toFixed(2);
  }, [latestReport]);

  const activeDeviceCount = React.useMemo(() => {
    if (!profile?.appliances) return 0;
    return Object.values(profile.appliances).reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0) + 4; // Constant base devices
  }, [profile]);

  // Chat history state (persistent via localStorage)
  const [chatHistory, setChatHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('volt_chat_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('volt_chat_sessions', JSON.stringify(chatHistory));
  }, [chatHistory]);

  const buildGreeting = (r, name) => {
    const parts = [`Hi${name ? ', ' + name : ''}! I'm **Volt**, your AI energy advisor.`];
    if (r) {
      parts.push(`I'm currently analysing **Bill #${sorted.findIndex(x => x.id === r.id) + 1}** (${r.month} ${r.year} · ₹${r.amount_rs?.toLocaleString()} · ${r.units_kwh} kWh).`);
      parts.push(`Ask me anything about this bill, your devices, or how to save money.`);
    } else {
      parts.push('I have access to your billing history — ask me anything about your usage, devices, or how to save money.');
    }
    return parts.join(' ');
  };

  const [messages, setMessages]   = useState([{ id: 1, text: buildGreeting(currentData, user?.name), sender: 'bot' }]);
  const [input, setInput]         = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef                 = useRef(null);

  // When the selected report changes, reset the chat with a new greeting
  const handleSelectReport = (r) => {
    setSelectedReport(r);
    const activeData = r || storeActiveReport || latestReport;
    setMessages([{ id: Date.now(), text: buildGreeting(activeData, user?.name), sender: 'bot' }]);
    setInput('');
  };

  const loadHistorySession = (session) => {
    if (isLoading) return;
    setMessages([{ 
      id: Date.now(), 
      text: `Resuming your **${session.topic}** (${session.date}) session summary. I've reloaded the analytical context for you. What would you like to dive into?`, 
      sender: 'bot' 
    }]);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const send = async (text) => {
    const msg = typeof text === 'string' ? text : input;
    if (!msg.trim() || isLoading) return;
    
    // Add to history if this is the start of a conversation (messages only has bot greeting)
    if (messages.length === 1) {
      const newSession = {
        id: Date.now(),
        topic: msg.length > 30 ? msg.substring(0, 30) + '...' : msg,
        date: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
      };
      setChatHistory(prev => [newSession, ...prev].slice(0, 10)); // Keep last 10
    }

    setMessages(prev => [...prev, { id: Date.now(), text: msg, sender: 'user' }]);
    setInput('');
    setIsLoading(true);
    try {
      const res  = await fetch('http://localhost:8000/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, report_data: currentData || {} }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { id: Date.now() + 1, text: data.reply || "Sorry, I couldn't process that.", sender: 'bot' }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, text: 'Connection error. Make sure the backend is running on port 8000.', sender: 'bot' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto h-[calc(100vh-4rem)]">
      {reports.length === 0 ? (
        <div className="h-full flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#FDFBF7] p-10 rounded-[2rem] shadow-sm border border-[#EAE7E2] text-center">
             <Sparkles size={48} className="mx-auto text-brand-primary opacity-30 mb-4" />
             <h2 className="text-xl font-extrabold text-[#2D2A26] mb-2 tracking-tight">Volt Chat AI</h2>
             <p className="text-sm text-[#7A7670] mb-6">Upload an electricity bill from the dashboard to start an AI-powered diagnostic session.</p>
             <button onClick={() => window.location.href = '/dashboard'} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2D8075] text-white font-bold text-sm rounded-xl hover:bg-[#24665C] transition-all shadow-md">
               Go to Dashboard
             </button>
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 h-full">
        {/* ─── Main Chat Section ─── */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Volt Chat</h1>
            <p className="text-sm text-text-muted mt-1 font-medium flex items-center gap-1.5">
              <Sparkles size={14} className="text-brand-primary" /> AI-powered Contextual Analysis
            </p>
          </div>
          {reports.length > 0 && (
            <ReportSelector
              reports={reports}
              selected={selectedReport}
              onSelect={handleSelectReport}
            />
          )}
        </div>

        {currentData && (
          <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-[#F8F2EA] border border-[#EBE3D5] rounded-[20px] shrink-0">
            <div className="w-2 h-2 bg-[#36796A] rounded-full animate-pulse shadow-[0_0_10px_rgba(54,121,106,0.5)]" />
            <span className="text-[13px] font-bold text-[#2D2A26]">
              Analysing Bill #{displayNum} — <span className="text-[#36796A]">{currentData.month} {currentData.year}</span>
            </span>
            <div className="ml-auto flex items-center gap-4">
              <span className="text-[11px] text-[#7A7670] font-bold">₹{currentData.amount_rs?.toLocaleString()}</span>
              <span className="text-[11px] text-[#7A7670] font-bold">{currentData.units_kwh} kWh</span>
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 bg-surface border border-border rounded-[28px] shadow-sm flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 pt-10">
            <AnimatePresence initial={false}>
              {messages.map(m => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-3.5 ${m.sender === 'user' ? 'flex-row-reverse ml-12' : 'mr-12'}`}
                >
                  <div className={`shrink-0 w-8 h-8 rounded-2xl flex items-center justify-center ${m.sender === 'user' ? 'bg-[#F2DFCE] text-[#C0602F]' : 'bg-[#EAF3EF] text-[#36796A]'}`}>
                    {m.sender === 'user' ? <User size={15} /> : <Sparkles size={15} fill="currentColor" />}
                  </div>
                  <div className={`px-4.5 py-3 rounded-[22px] shadow-sm leading-relaxed
                    ${m.sender === 'user'
                      ? 'bg-[#FDFBF7] border border-[#EAE7E2] text-[#2D2A26] rounded-tr-sm'
                      : 'bg-[#FDFBF7] border border-[#EAE7E2] text-[#2D2A26] rounded-tl-sm'}`}
                  >
                    {m.sender === 'user'
                      ? <p className="text-[14px] text-[#2D2A26] font-medium">{m.text}</p>
                      : <RenderMessage text={m.text} reportData={currentData} />}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3.5 mr-12">
                <div className="shrink-0 w-8 h-8 rounded-2xl bg-[#EAF3EF] text-[#36796A] flex items-center justify-center">
                  <Sparkles size={15} fill="currentColor" />
                </div>
                <div className="flex items-center gap-1.5 px-5 py-3.5 bg-[#FDFBF7] border border-[#EAE7E2] rounded-[22px] rounded-tl-sm shadow-sm">
                  {[0,1,2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 bg-[#36796A]/40 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-border p-4 bg-[#FDFBF7]/50 space-y-3 shrink-0">
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {QUICK_REPLIES.map(qr => (
                <button
                  key={qr}
                  disabled={isLoading}
                  onClick={() => send(qr)}
                  className="shrink-0 px-4 py-2 bg-[#F8F2EA] border border-[#EBE3D5] text-[#7A7670] text-[12px] font-bold rounded-xl hover:border-[#D6CAB2] hover:text-[#2D2A26] transition disabled:opacity-50"
                >
                  {qr}
                </button>
              ))}
            </div>

            <form onSubmit={e => { e.preventDefault(); send(); }} className="flex items-center gap-3">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={isLoading}
                placeholder={currentData ? `Ask about Bill #${displayNum}…` : 'Ask about your energy usage…'}
                className="flex-1 bg-surface border border-border rounded-[18px] px-4 py-3.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 ring-[#36796A]/10 focus:border-[#36796A] transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-12 h-12 bg-[#2D8075] text-white rounded-[18px] flex items-center justify-center shadow-lg shadow-[#2D8075]/20 hover:bg-[#24665C] transition-all disabled:opacity-40 shrink-0"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ─── Premium Side Panel ─── */}
      <div className="hidden lg:flex flex-col gap-6 overflow-y-auto pb-4 pr-1">
        <div className="mt-2">
          <h2 className="text-[17px] font-bold text-text-primary mb-5 px-1 flex items-center gap-2">
            <History size={18} className="text-[#36796A]" /> Chat History
          </h2>
          <div className="flex flex-col gap-2.5">
            {chatHistory.length > 0 ? (
              <>
                {chatHistory.map(chat => (
                  <button 
                    key={chat.id} 
                    className="group w-full flex items-center justify-between bg-[#FDFBF7] border border-[#EAE7E2] rounded-[20px] p-4 text-left hover:border-[#D6CAB2] hover:shadow-sm transition-all"
                    onClick={() => loadHistorySession(chat)}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="p-2.5 rounded-2xl bg-[#F9F3EA] text-[#7A7670] group-hover:text-[#36796A] transition-colors">
                        <MessageSquare size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-black text-[#2D2A26] truncate">{chat.topic}</p>
                        <p className="text-[10px] text-[#9A9894] font-bold uppercase tracking-wider">{chat.date} session</p>
                      </div>
                    </div>
                    <ArrowRight size={15} className="text-[#9A9894] opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </button>
                ))}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-5 bg-[#FDFBF7]/60 border border-dashed border-[#EAE7E2] rounded-[24px]">
                <div className="w-12 h-12 rounded-full bg-[#F9F3EA] flex items-center justify-center text-[#9C9994] mb-4">
                  <History size={22} />
                </div>
                <p className="text-[14px] font-black text-[#2D2A26] text-center">No past chats yet</p>
                <p className="text-[11px] text-[#9A9894] text-center mt-1.5 leading-relaxed font-medium">Your energy diagnostic sessions will appear here as you chat.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
      )}
    </div>
  );
}
