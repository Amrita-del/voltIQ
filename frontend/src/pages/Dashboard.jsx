import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, AlertCircle, Plus, ZapOff, Leaf, TrendingUp, TrendingDown, ChevronRight, ArrowLeft, Trash2, UploadCloud, Calendar, BarChart2, Activity, Server } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import UploadModal from '../components/modal/UploadModal';
import { useReportStore } from '../store/reportStore';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Area, AreaChart, ReferenceLine,
} from 'recharts';

/* ─── Animated Counter ─── */
const CountUp = ({ end, duration = 1.5 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!end) return;
    let startTime = null;
    let id;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / (duration * 1000), 1);
      setCount(Math.floor(p * end));
      if (p < 1) id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [end, duration]);
  return <>{count.toLocaleString()}</>;
};

/* ─── Stat Card ─── */
const StatCard = ({ label, value, suffix, prefix = '₹', icon: Icon, iconBg = 'bg-[#E8DCC8]', iconColor = 'text-[#2D2A26]', trend, cardBg = 'bg-[#FDFBF7]', cardBorder = 'border-[#EAE7E2]' }) => (
  <div className={`group ${cardBg} rounded-[20px] border ${cardBorder} p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden flex flex-col justify-between`}>
    <div className="flex items-start justify-between mb-8">
      <p className="text-[13.5px] font-medium text-[#6B6863] leading-none">{label}</p>
      <div className={`${iconBg} p-2 rounded-[12px] opacity-90 ${iconColor}`}><Icon size={18} strokeWidth={2.5} /></div>
    </div>
    <div>
      <p className="text-[32px] font-semibold text-text-primary tracking-tight flex items-baseline mt-auto">
        {prefix && <span className="mr-0.5">{prefix}</span>}
        <CountUp end={value} />
        {suffix && <span className="text-[15px] font-medium text-[#6B6863] ml-1.5">{suffix}</span>}
      </p>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-2">
          <div className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-white shadow-sm ${trend <= 0 ? 'text-[#347A6A]' : 'text-[#CA5742]'}`}>
            {trend <= 0 ? <TrendingDown size={11} strokeWidth={3} /> : <TrendingUp size={11} strokeWidth={3} />}
            {Math.abs(trend)}%
          </div>
          <span className="text-[11px] text-[#9C9994] font-medium tracking-tight">vs last month</span>
        </div>
      )}
    </div>
  </div>
);

/* ─── Archive Card — shows sequential number ─── */
const ArchiveCard = ({ r, displayNum, onOpen }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: displayNum * 0.04 }}
    onClick={() => onOpen(r)}
    className="bg-surface border border-border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-brand-primary/25 hover:-translate-y-0.5 cursor-pointer transition-all duration-300 group flex flex-col gap-3.5 relative overflow-hidden"
  >
    <div className="absolute -right-5 -bottom-5 opacity-[0.035] group-hover:opacity-[0.06] transition text-brand-primary">
      <Zap size={100} />
    </div>
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-xs font-bold text-text-muted mb-1 flex items-center gap-1.5">
          <Calendar size={12} /> {r.month} {r.year}
        </p>
        <p className="font-extrabold text-base text-text-primary">Bill #{displayNum}</p>
      </div>
      <div className="bg-brand-light/50 p-1.5 text-brand-primary rounded-xl group-hover:bg-brand-primary group-hover:text-white transition-all duration-300">
        <ChevronRight size={14} />
      </div>
    </div>
    <div className="relative z-10">
      <p className="text-3xl font-black data-text text-text-primary tracking-tighter">₹{r.amount_rs?.toLocaleString()}</p>
      <p className="text-xs font-bold text-text-muted mt-1 tracking-wider uppercase">{r.units_kwh} kWh</p>
    </div>
    <div className="flex gap-2 flex-wrap relative z-10 mt-1">
      {r.carbon?.total_kg > 0 && (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-positive bg-positive-light px-3 py-1 rounded-full">
          <Leaf size={10} />{r.carbon.total_kg} kg
        </span>
      )}
      {r.slab_alert?.active && (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-negative bg-negative-light px-3 py-1 rounded-full">
          <AlertCircle size={10} />Slab Alert
        </span>
      )}
    </div>
  </motion.div>
);

/* ─── Custom tooltip for charts ─── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-black text-text-muted uppercase tracking-wider mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-bold" style={{ color: p.color }}>
          {p.name}: {p.name === 'Bill' ? `₹${p.value?.toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'high' | 'alerts'
  const navigate = useNavigate();
  const activeReport = useReportStore(s => s.activeReport);
  const setReports   = useReportStore(s => s.setReports);
  const reports      = useReportStore(s => s.reports);
  const user         = useAuthStore(s => s.user);

  useEffect(() => {
    if (user?.id) {
      fetch(`http://localhost:8000/report/history/${user.id}`)
        .then(r => r.json())
        .then(setReports)
        .catch(console.error);
    }
  }, [user?.id, activeReport]);

  const deleteReport = async (id) => {
    if (!window.confirm('Delete this report?')) return;
    try {
      await fetch(`http://localhost:8000/report/${id}`, { method: 'DELETE' });
      useReportStore.getState().setActiveReport(null);
      setReports(reports.filter(r => r.id !== id));
    } catch (e) { console.error(e); }
  };

  // Sequential numbering — sorted oldest first, numbered 1..N
  const sortedReports = [...reports].sort((a, b) => a.id - b.id);
  const getDisplayNum = (r) => sortedReports.findIndex(x => x.id === r.id) + 1;

  // Analytics for archive view
  const totalSpend   = reports.reduce((a, r) => a + (r.amount_rs || 0), 0);
  const totalUnits   = reports.reduce((a, r) => a + (r.units_kwh || 0), 0);
  const totalCarbon  = Math.round(reports.reduce((a, r) => a + (r.carbon?.total_kg || 0), 0));
  const avgBill      = reports.length > 1 ? Math.round(totalSpend / reports.length) : 0;
  const lastTwo      = sortedReports.slice(-2);
  const momDelta     = lastTwo.length === 2 ? lastTwo[1].amount_rs - lastTwo[0].amount_rs : null;
  const momPct       = lastTwo.length === 2 && lastTwo[0].amount_rs > 0
    ? Number(((momDelta / lastTwo[0].amount_rs) * 100).toFixed(1)) : undefined;

  const trendData = sortedReports.map((r, i) => ({
    name: (r.month && typeof r.month === 'string') ? r.month.substring(0, 3) : `#${i + 1}`,
    Bill: r.amount_rs || 0,
    Units: r.units_kwh || 0,
  }));

  const filteredReports = sortedReports.filter(r => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = (r.month && typeof r.month === 'string' && r.month.toLowerCase().includes(q)) || 
                         r.year?.toString().includes(q) || 
                         `bill #${getDisplayNum(r)}`.includes(q);
    
    if (!matchesSearch) return false;
    
    if (filterType === 'high') return r.units_kwh > 250;
    if (filterType === 'alerts') return r.slab_alert?.active;
    return true;
  });

  const pieData = activeReport?.device_breakdown || [];

  /* ─────────────────────── ARCHIVE VIEW ─────────────────────── */
  if (!activeReport) {
    return (
      <>
        <UploadModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
        <div className="max-w-[1440px] mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Energy Dashboard</h1>
              <p className="text-base text-text-muted mt-1">{reports.length} bill{reports.length !== 1 ? 's' : ''} analyzed</p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-primary text-white font-bold text-sm rounded-xl shadow-sm shadow-brand-primary/20 hover:bg-brand-dark hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 whitespace-nowrap"
            >
              <UploadCloud size={15} /> Upload Bill
            </button>
          </div>

          {reports.length === 0 ? (
            <div className="space-y-6">
              <div className="bg-surface border border-border rounded-2xl p-12 sm:p-16 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-light/20 via-transparent to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-light rounded-2xl text-brand-primary mb-5">
                    <Zap size={28} strokeWidth={1.5} />
                  </div>
                  <h2 className="text-xl font-extrabold text-text-primary mb-2">Welcome, {user?.name || 'there'}!</h2>
                  <p className="text-sm text-text-secondary mb-6 max-w-sm mx-auto">Upload your first electricity bill to start generating AI-powered insights on your usage, devices, and spending.</p>
                  <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white font-bold text-sm rounded-xl shadow-md hover:bg-brand-dark transition-all duration-200">
                    <UploadCloud size={16} /> Upload Your First Bill
                  </button>
                </div>
              </div>

              {/* Added device visibility for empty state */}
              {user?.profile?.appliances && Object.keys(user.profile.appliances).length > 0 && (
                <div className="bg-surface border border-border rounded-2xl p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-extrabold text-text-primary">Your Device Fleet</h3>
                    <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Awaiting Bill Analysis</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                    {Object.entries(user.profile.appliances).map(([key, count]) => {
                      const icons = { ac: TrendingUp, geyser: Zap, wm: Activity, fridge: Server, tv: Zap, fans: Activity, pc: Zap };
                      const Icon = icons[key] || Zap;
                      const labels = { ac: 'AC', geyser: 'Geyser', wm: 'WM', fridge: 'Fridge', tv: 'TV', fans: 'Fan', pc: 'PC' };
                      return (
                        <div key={key} className="bg-raised p-4 rounded-xl border border-border flex flex-col items-center gap-2">
                          <div className="p-2 bg-brand-light/30 rounded-lg text-brand-primary"><Icon size={20} /></div>
                          <p className="text-[11px] font-black uppercase text-text-primary">{labels[key] || key}</p>
                          <p className="text-xs font-bold text-text-muted">x{count}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* ─── Summary stat row ─── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Spent"    value={totalSpend}  icon={TrendingUp}  trend={momPct} cardBg="bg-[#EADCC8]" cardBorder="border-[#EADCC8]/50" iconBg="bg-[#DFD0BD]" iconColor="text-[#B08C69]" />
                <StatCard label="Total Units"    value={totalUnits}  prefix=""  suffix="kWh" icon={Zap} cardBg="bg-[#E1E7DE]" cardBorder="border-[#E1E7DE]/50" iconBg="bg-[#CEDAD0]" iconColor="text-[#347A6A]" />
                <StatCard label="Monthly Avg"    value={avgBill}               icon={BarChart2} />
                <StatCard label="Total CO₂"      value={totalCarbon} prefix=""  suffix="kg"  icon={Leaf} />
              </div>

              {/* ─── Charts row ─── */}
              {trendData.length > 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                  {/* Area chart */}
                  <div className="lg:col-span-3 bg-surface border border-border rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-extrabold text-sm text-text-primary">Spending Trend</h3>
                        <p className="text-xs text-text-muted">Monthly bill history</p>
                      </div>
                      {momDelta !== null && (
                        <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full border ${momDelta <= 0 ? 'bg-positive-light text-positive border-positive/20' : 'bg-negative-light text-negative border-negative/20'}`}>
                          {momDelta <= 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />} ₹{Math.abs(momDelta).toLocaleString()} last mo
                        </span>
                      )}
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData} margin={{ top: 5, right: 4, left: -24, bottom: 0 }}>
                          <defs>
                            <linearGradient id="billGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor="var(--brand-primary)" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E2DC" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9C9994', fontSize: 11, fontWeight: 600 }} dy={6} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9C9994', fontSize: 10, fontWeight: 600 }} />
                          <Tooltip content={<ChartTip />} />
                          <Area type="monotone" dataKey="Bill" stroke="var(--brand-primary)" strokeWidth={2} fill="url(#billGrad)" dot={{ fill: 'var(--brand-primary)', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Aggregate Donut Chart */}
                  <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-5 shadow-sm flex flex-col">
                    <div className="mb-4">
                      <h3 className="font-extrabold text-sm text-text-primary">Energy Distribution</h3>
                      <p className="text-xs text-text-muted">Breakdown by consumption category</p>
                    </div>
                    {(() => {
                      const agg = reports.reduce((acc, r) => {
                        (r.device_breakdown || []).forEach(d => {
                          const exist = acc.find(x => x.name === d.name);
                          if (exist) exist.value += d.value;
                          else acc.push({ ...d });
                        });
                        return acc;
                      }, []);
                      
                      const total = agg.reduce((a, b) => a + b.value, 0);

                      return agg.length > 0 ? (
                        <div className="flex flex-col h-full">
                          <div className="h-44 relative mb-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={agg} innerRadius={55} outerRadius={74} paddingAngle={3} dataKey="value" stroke="none">
                                  {agg.map((e, i) => <Cell key={i} fill={e.color} />)}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', background: '#FAFAFA', border: '1px solid #E2E2DC', fontSize: '11px', fontWeight: 600 }} formatter={val => [`₹${val?.toLocaleString()}`, '']} />
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                              <p className="text-xl font-black text-text-primary leading-none">100%</p>
                              <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider mt-1">Total Usage</p>
                            </div>
                          </div>
                          <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1 flex-1 custom-scrollbar">
                            {agg.sort((a,b) => b.value - a.value).map((d, i) => {
                              const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                              return (
                                <div key={i} className="flex items-center justify-between gap-4 px-3 py-1.5 rounded-xl hover:bg-raised transition-all">
                                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                                    <span className="text-[11px] font-bold text-text-secondary truncate">{d.name}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-[11px] font-black text-text-primary w-8 text-right">{pct}%</span>
                                    <div className="w-16 h-1.5 bg-raised rounded-full overflow-hidden border border-border/40">
                                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: d.color }} />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-text-muted text-center opacity-50">
                           <Activity size={32} strokeWidth={1.5} className="mb-2" />
                           <p className="text-xs font-bold uppercase tracking-widest">No spectral data</p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* ─── Summary stat row 2 — shifted cards ─── */}
              {reports.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   {(() => {
                      const highest = [...reports].sort((a,b) => b.amount_rs - a.amount_rs)[0];
                      const lowest  = [...reports].sort((a,b) => a.amount_rs - b.amount_rs)[0];
                      return (
                        <>
                          <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="bg-negative-light p-3 rounded-xl text-negative"><TrendingUp size={20} /></div>
                              <div>
                                <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Highest Point</p>
                                <p className="text-xl font-bold text-text-primary tracking-tight">₹{highest?.amount_rs?.toLocaleString()} <span className="text-xs text-text-muted font-medium ml-1">({highest?.month} {highest?.year})</span></p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="bg-positive-light p-3 rounded-xl text-positive"><TrendingDown size={20} /></div>
                              <div>
                                <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Lowest Point</p>
                                <p className="text-xl font-bold text-text-primary tracking-tight">₹{lowest?.amount_rs?.toLocaleString()} <span className="text-xs text-text-muted font-medium ml-1">({lowest?.month} {lowest?.year})</span></p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-brand-primary text-white rounded-2xl p-5 flex items-center gap-4 shadow-md shadow-brand-primary/20">
                            <div className="bg-white/10 p-3 rounded-xl text-white"><Zap size={20} /></div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Efficiency Index</p>
                              <p className="text-xl font-bold tracking-tight text-white">₹{totalUnits > 0 ? (totalSpend / totalUnits).toFixed(2) : '—'} <span className="text-xs opacity-60 font-medium tracking-normal ml-1">per kWh</span></p>
                            </div>
                          </div>
                        </>
                      );
                   })()}
                </div>
              )}

              {/* ─── Archive cards grid ─── */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-extrabold text-2xl text-text-primary tracking-tight">Report Archive</h3>
                      <div className="h-5 w-px bg-border hidden sm:block" />
                      <p className="text-xs font-bold text-text-muted">Ascending by date</p>
                    </div>
                    {/* Filter Chips */}
                    <div className="flex gap-2">
                       {[
                         { id: 'all', label: 'All Bills' },
                         { id: 'high', label: 'High Usage (>250kWh)' },
                         { id: 'alerts', label: 'Slab Alerts' }
                       ].map(f => (
                         <button 
                           key={f.id}
                           onClick={() => setFilterType(f.id)}
                           className={`px-4 py-1.5 rounded-full text-xs font-black transition-all border shadow-sm ${filterType === f.id ? 'bg-brand-primary text-white border-brand-primary' : 'bg-surface text-text-muted border-border hover:border-brand-primary/30'}`}
                         >
                           {f.label}
                         </button>
                       ))}
                    </div>
                  </div>
                  
                  {/* Search / Filter bar refinement */}
                  <div className="relative group w-full lg:w-80">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-primary transition-colors flex items-center pointer-events-none">
                      <BarChart2 size={18} />
                    </div>
                    <input 
                      type="text"
                      placeholder="Search by month, year, or bill number..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-12 pr-4 py-3 bg-surface border-2 border-border rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all w-full shadow-sm"
                    />
                  </div>
                </div>

                {filteredReports.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredReports.map((r) => (
                      <ArchiveCard
                        key={r.id}
                        r={r}
                        displayNum={getDisplayNum(r)}
                        onOpen={r => useReportStore.getState().setActiveReport(r)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-raised border-2 border-border border-dashed rounded-[2.5rem] p-16 text-center shadow-inner">
                    <div className="bg-surface p-4 rounded-2xl w-fit mx-auto mb-4 border border-border shadow-sm"><BarChart2 size={32} className="text-text-muted opacity-30" /></div>
                    <p className="text-lg font-extrabold text-text-primary mb-1">No matching reports</p>
                    <p className="text-sm font-medium text-text-muted mb-6">Try adjusting your search or filters.</p>
                    <button onClick={() => {setSearchTerm(''); setFilterType('all');}} className="px-6 py-2.5 bg-brand-primary text-white font-black rounded-xl text-xs hover:brightness-95 shadow-md shadow-brand-primary/20 transition-all uppercase tracking-widest">Reset Discovery</button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      );
    }
  /* ═════════════════════ REPORT DETAIL VIEW ═════════════════════ */
  const breakdown = activeReport?.device_breakdown || [];
  const displayNum = getDisplayNum(activeReport);
  const reportTrend = sortedReports.map((r, i) => ({
    name: (r.month && typeof r.month === 'string') ? r.month.substring(0, 3) : `B${i+1}`,
    Bill: r.amount_rs || 0,
    Units: r.units_kwh || 0,
    isCurrent: r.id === activeReport.id,
  }));

  const sorted2   = [...reports].sort((a, b) => a.id - b.id);
  const currIdx   = sorted2.findIndex(r => r.id === activeReport.id);
  const prevReport = currIdx > 0 ? sorted2[currIdx - 1] : null;
  const delta      = prevReport ? activeReport.amount_rs - prevReport.amount_rs : null;
  const deltaPct   = prevReport?.amount_rs > 0 ? Number(((delta / prevReport.amount_rs) * 100).toFixed(1)) : null;

  return (
    <>
      <UploadModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      <div className="max-w-[1440px] mx-auto space-y-5 pb-10">

        {/* ─── Top bar ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <button
              onClick={() => useReportStore.getState().setActiveReport(null)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-surface border border-border rounded-xl text-sm font-semibold text-text-secondary hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all duration-200"
            >
              <ArrowLeft size={14} /> <span className="hidden sm:inline">All Bills</span>
            </button>
            <div className="flex items-center gap-1.5 px-3 py-2 bg-surface border border-border rounded-xl text-sm font-bold text-text-secondary">
              <Calendar size={12} /> {activeReport.month} {activeReport.year} — Bill #{displayNum}
            </div>
            {delta !== null && (
              <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3.5 py-1.5 rounded-xl border ${delta <= 0 ? 'bg-positive-light text-positive border-positive/20' : 'bg-negative-light text-negative border-negative/20'}`}>
                {delta <= 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />} ₹{Math.abs(delta)} ({Math.abs(deltaPct)}%) vs last
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-primary text-white rounded-xl text-sm font-bold hover:bg-brand-dark transition">
              <Plus size={14} /> New
            </button>
            <button onClick={() => deleteReport(activeReport.id)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-surface border border-negative/20 text-negative rounded-xl text-sm font-bold hover:bg-negative hover:text-white hover:border-negative transition-all duration-200">
              <Trash2 size={14} /><span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>

        {/* ─── Slab Alert ─── */}
        {activeReport?.slab_alert?.active && (
          <div className="bg-negative-light/60 border border-negative/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 bg-negative/10 rounded-xl text-negative shrink-0"><AlertCircle size={22} /></div>
              <div>
                <h3 className="font-extrabold text-base text-negative mb-0.5 uppercase tracking-[0.05em]">Tariff Slab Alert</h3>
                <p className="text-sm text-negative/90 leading-relaxed font-medium">
                  You're already <strong>{activeReport.slab_alert.units_into_slab} units</strong> into a higher pricing slab. This adds approximately <strong>₹{activeReport.slab_alert.extra_cost}</strong> to your current bill.
                  <span className="block mt-1 opacity-70 italic text-xs">Strategy: {activeReport.slab_alert.strategy}</span>
                </p>
              </div>
            </div>
            <button onClick={() => navigate('/budget')} className="shrink-0 px-5 py-2.5 bg-negative text-white font-bold rounded-xl text-sm hover:brightness-95 shadow-md shadow-negative/20 transition whitespace-nowrap self-start sm:self-center">
              View Reduction Strategy →
            </button>
          </div>
        )}

        {/* ─── Stat Cards ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Bill"     value={activeReport?.amount_rs || 0}              icon={TrendingUp} trend={deltaPct} cardBg="bg-[#EADCC8]" cardBorder="border-[#EADCC8]/50" iconBg="bg-[#DFD0BD]" iconColor="text-[#B08C69]" />
          <StatCard label="Units Consumed" value={activeReport?.units_kwh || 0} prefix="" suffix="kWh" icon={Zap} cardBg="bg-[#E1E7DE]" cardBorder="border-[#E1E7DE]/50" iconBg="bg-[#CEDAD0]" iconColor="text-[#347A6A]" />
          <StatCard label="Vampire Load"   value={activeReport?.vampire_load?.cost || 0}     icon={ZapOff} />
          <StatCard label="CO₂ Footprint"  value={activeReport?.carbon?.total_kg || 0} prefix="" suffix="kg" icon={Leaf} />
        </div>

        {/* ─── Main row: Pie + AI Insights ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Pie breakdown */}
          <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-5 shadow-sm flex flex-col">
            <h3 className="font-extrabold text-sm text-text-primary mb-4">Device Cost Breakdown</h3>
            {breakdown.length > 0 ? (
              <>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={breakdown} innerRadius={55} outerRadius={74} paddingAngle={3} dataKey="value" stroke="none">
                        {breakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', background: '#FAFAFA', border: '1px solid #E2E2DC', fontSize: '12px', fontWeight: 600 }} formatter={val => [`₹${val?.toLocaleString()}`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 mt-3 flex-1">
                  {breakdown.map((d, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-raised transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-xs font-semibold text-text-secondary">{d.name}</span>
                      </div>
                      <span className="text-xs font-black data-text text-text-primary">₹{d.value?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-text-muted text-center py-8">
                <div>
                  <Activity size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No breakdown data</p>
                </div>
              </div>
            )}
          </div>

          {/* AI Insights */}
          <div className="lg:col-span-3 bg-surface border border-border rounded-2xl p-5 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-text-primary">Volt Intelligence</h3>
              <span className="text-xs font-black uppercase tracking-widest text-brand-primary bg-brand-light/50 border border-brand-primary/15 px-2.5 py-1 rounded-full">AI · Gemini</span>
            </div>

            <div className="bg-raised/60 rounded-xl border border-border p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-primary mb-2">Priority Narrative</p>
              <p className="text-sm text-text-secondary leading-relaxed font-medium">{activeReport?.ai_narrative || 'No insights available yet.'}</p>
            </div>

            {activeReport?.vampire_load?.suggestion && (
              <div className="bg-accent-light/50 rounded-xl border border-accent/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ZapOff size={14} className="text-accent" />
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-accent">Idle Energy Waste</p>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed font-medium">{activeReport.vampire_load.suggestion}</p>
              </div>
            )}

            {activeReport?.budget_analysis?.suggested_savings > 0 && (
              <div className="bg-positive-light/40 rounded-xl border border-positive/20 p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown size={14} className="text-positive" />
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-positive">Potential Savings</p>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed font-medium">
                    Could save <span className="font-extrabold text-positive">₹{activeReport.budget_analysis.suggested_savings}</span> next cycle.
                  </p>
                </div>
                <button onClick={() => navigate('/budget')} className="shrink-0 px-4 py-2 bg-positive text-white font-bold rounded-xl text-xs hover:bg-positive-dark shadow-sm transition">
                  Optimize →
                </button>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 mt-auto">
              {[
                { label: 'Per Unit', val: `₹${(activeReport.amount_rs / Math.max(1, activeReport.units_kwh)).toFixed(2)}` },
                { label: 'Slab Tax', val: activeReport.budget_analysis?.slab_charges ? `₹${activeReport.budget_analysis.slab_charges}` : '—' },
                { label: 'Fixed', val: activeReport.budget_analysis?.fixed_charges ? `₹${activeReport.budget_analysis.fixed_charges}` : '—' },
              ].map(item => (
                <div key={item.label} className="bg-raised rounded-xl p-3 text-center border border-border shadow-sm">
                  <p className="text-xs font-black text-text-muted uppercase tracking-wider mb-1.5">{item.label}</p>
                  <p className="text-sm font-black data-text text-text-primary">{item.val}</p>
                </div>
              ))}
            </div>

            <a href="/chat" className="flex items-center justify-between p-3 bg-raised border border-border rounded-xl hover:border-brand-primary/25 hover:bg-brand-light/10 transition-all group">
              <div className="flex items-center gap-2.5">
                <div className="bg-brand-light/60 p-2 rounded-lg text-brand-primary"><Zap size={14} /></div>
                <p className="text-xs font-bold text-text-primary">Ask Volt about Bill #{displayNum}</p>
              </div>
              <ChevronRight size={15} className="text-text-muted group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all" />
            </a>
          </div>
        </div>

        {/* ─── History bar chart ─── */}
        {reportTrend.length > 1 && (
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-sm text-text-primary">Billing History</h3>
                <p className="text-xs text-text-muted">Current bill highlighted</p>
              </div>
              <button onClick={() => navigate('/carbon')} className="text-xs font-bold text-brand-primary hover:underline">Carbon Report →</button>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportTrend} margin={{ top: 5, right: 4, left: -24, bottom: 0 }} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E2DC" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9C9994', fontWeight: 600, fontSize: 11 }} dy={6} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9C9994', fontWeight: 600, fontSize: 10 }} />
                  <Tooltip content={<ChartTip />} />
                  <Bar dataKey="Bill" radius={[5, 5, 1, 1]}>
                    {reportTrend.map((e, i) => <Cell key={i} fill={e.isCurrent ? 'var(--brand-primary)' : '#D4F0EC'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ─── Bottom widget row ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Month-on-Month */}
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-text-muted mb-3">Month-on-Month</p>
            {delta !== null ? (
              <>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-black mb-3 ${delta <= 0 ? 'bg-positive-light text-positive' : 'bg-negative-light text-negative'}`}>
                  {delta <= 0 ? <TrendingDown size={16} /> : <TrendingUp size={16} />} ₹{Math.abs(delta).toLocaleString()} ({Math.abs(deltaPct)}%)
                </div>
                <p className="text-xs text-text-secondary mb-3">{delta <= 0 ? 'Bill dropped vs last month — great trend!' : 'Bill rose vs last month. Review device usage.'}</p>
                <div className="flex gap-2">
                  <div className="flex-1 bg-raised rounded-xl p-2.5 text-center border border-border">
                    <p className="text-xs text-text-muted font-black uppercase tracking-wider mb-1">This</p>
                    <p className="text-sm font-black data-text text-text-primary">₹{activeReport.amount_rs?.toLocaleString()}</p>
                  </div>
                  <div className="flex-1 bg-raised rounded-xl p-2.5 text-center border border-border">
                    <p className="text-xs text-text-muted font-black uppercase tracking-wider mb-1">Prev</p>
                    <p className="text-sm font-black data-text text-text-secondary">₹{prevReport.amount_rs?.toLocaleString()}</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs text-text-muted">Upload a second bill to compare months.</p>
            )}
          </div>

          {/* Action Items */}
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-text-muted mb-3">Action Items</p>
            <div className="space-y-3">
              {[
                activeReport?.slab_alert?.active && { text: `Reduce ${activeReport.slab_alert.units_into_slab} units to exit high slab`, icon: AlertCircle, color: 'text-negative', bg: 'bg-negative-light/50', cb: () => navigate('/budget') },
                (activeReport?.vampire_load?.cost || 0) > 0 && { text: `₹${activeReport.vampire_load.cost} lost to idle standby devices`, icon: ZapOff, color: 'text-accent', bg: 'bg-accent-light/40', cb: () => navigate('/budget') },
                (activeReport?.budget_analysis?.suggested_savings || 0) > 0 && { text: `Save ₹${activeReport.budget_analysis.suggested_savings} with optimizer`, icon: TrendingDown, color: 'text-positive', bg: 'bg-positive-light/40', cb: () => navigate('/budget') },
                { text: 'Review device health for degrading appliances', icon: Activity, color: 'text-brand-primary', bg: 'bg-brand-light/40', cb: () => navigate('/health') },
              ].filter(Boolean).slice(0, 3).map((item, i) => (
                <button key={i} onClick={item.cb} className={`w-full text-left flex items-start gap-2.5 p-3 rounded-xl ${item.bg} hover:brightness-95 transition-all`}>
                  <item.icon size={14} className={`shrink-0 mt-0.5 ${item.color}`} />
                  <span className={`text-xs font-bold ${item.color} leading-snug`}>{item.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Grid Efficiency */}
          {(() => {
            const perUnit   = activeReport.units_kwh > 0 ? (activeReport.amount_rs / activeReport.units_kwh).toFixed(2) : '—';
            const avgUnits  = reports.reduce((a, r) => a + r.units_kwh, 0) / Math.max(1, reports.length);
            const projected = Math.round((activeReport.amount_rs / Math.max(1, activeReport.units_kwh)) * avgUnits);
            return (
              <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.15em] text-text-muted mb-3">Grid Efficiency</p>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">Cost per unit</span>
                    <span className="text-xs font-black data-text text-text-primary">₹{perUnit} / kWh</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">Your avg usage</span>
                    <span className="text-xs font-black data-text text-text-primary">{Math.round(avgUnits)} kWh</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="bg-raised rounded-xl p-3 border border-border">
                    <p className="text-xs font-black text-text-muted uppercase tracking-wider mb-1">Projected Next Bill</p>
                    <p className="text-xl font-black data-text text-text-primary tracking-tighter">₹{projected.toLocaleString()}</p>
                  </div>
                  <button onClick={() => navigate('/budget')} className="w-full py-2 text-[11px] font-bold text-brand-primary bg-brand-light/40 border border-brand-primary/15 rounded-xl hover:bg-brand-light transition">
                    Adjust Budget →
                  </button>
                </div>
              </div>
            );
          })()}
        </div>

      </div>
    </>
  );
}
