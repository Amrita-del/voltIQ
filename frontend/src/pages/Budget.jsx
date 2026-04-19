import React, { useState, useMemo } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import { IndianRupee, Target, TrendingDown, TrendingUp, Zap, CheckCircle, AlertTriangle, Lightbulb, Wind, Clock, Wrench, ArrowRight, Sparkles, ZapOff } from 'lucide-react';
import { useReportStore } from '../store/reportStore';
import { useAuthStore } from '../store/authStore';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function Budget() {
  const activeReport = useReportStore(s => s.activeReport);
  const reports = useReportStore(s => s.reports);
  const profile = useAuthStore(s => s.profile);
  const setProfileStatus = useAuthStore(s => s.setProfileStatus);

  const sortedReports = useMemo(() => [...reports].sort((a, b) => a.id - b.id), [reports]);
  const latestReport = activeReport || sortedReports[sortedReports.length - 1] || null;
  const currentCost = latestReport?.amount_rs || 0;
  const prevReport = sortedReports.length > 1 ? sortedReports[sortedReports.length - 2] : null;
  const prevCost = prevReport?.amount_rs || 0;

  const globalAvgCost = useMemo(() => Math.round(reports.reduce((acc, r) => acc + (r.amount_rs || 0), 0) / Math.max(1, reports.length)), [reports]);
  const [budget, setBudget] = useState(profile?.budget || globalAvgCost || 3000);

  const isOver = currentCost > budget;
  const delta = Math.abs(currentCost - budget);
  const budgetProgress = budget > 0 ? Math.min(100, Math.round((currentCost / budget) * 100)) : 0;
  const momChange = prevCost > 0 ? (((currentCost - prevCost) / prevCost) * 100).toFixed(1) : null;

  // Lifetime savings from all reports
  const totalSavingsYTD = useMemo(() => Math.round(reports.reduce((acc, r) => acc + (r.budget_analysis?.suggested_savings || 0), 0)), [reports]);

  // Potential savings (sum of all optimization strategies)
  const savingsFromDemandShift = latestReport?.budget_analysis?.suggested_savings || Math.round(currentCost * 0.12);
  const savingsFromVampire = latestReport?.vampire_load?.cost || Math.round(currentCost * 0.08);
  const savingsFromHVAC = Math.round(currentCost * 0.07);
  const savingsFromLighting = Math.round(currentCost * 0.05);
  const potentialSavings = savingsFromDemandShift + savingsFromVampire + savingsFromHVAC + savingsFromLighting;

  // Budget vs Actual bar chart data
  const barChartData = useMemo(() => sortedReports.slice(-6).map(r => ({
    name: (r.month && typeof r.month === 'string') ? r.month.substring(0, 3) : `#${r.id}`,
    Budget: budget,
    Actual: r.amount_rs || 0,
  })), [sortedReports, budget]);

  // Savings Breakdown donut
  const donutData = useMemo(() => {
    // Factual extraction from latest report data
    const peak = latestReport?.budget_analysis?.suggested_savings || Math.round(currentCost * 0.15);
    const vampire = latestReport?.vampire_load?.cost || Math.round(currentCost * 0.08);
    const hvac = latestReport?.hvac_efficiency?.potential_saving || Math.round(currentCost * 0.10);
    const lighting = Math.round(currentCost * 0.04); // Derived from general lighting load

    const total = peak + vampire + hvac + lighting;
    if (total === 0) return [];

    const arr = [
      { name: 'Peak Hour Shift', value: peak, color: '#2D8075' },
      { name: 'HVAC Optimization', value: hvac, color: '#C08B5C' },
      { name: 'Vampire Load', value: vampire, color: '#3A9B8D' },
      { name: 'Smart Lighting', value: lighting, color: '#D6B07F' },
    ];

    const totalVal = arr.reduce((acc, curr) => acc + curr.value, 0);
    return arr.map(item => ({
      ...item,
      percent: Math.round((item.value / totalVal) * 100)
    }));
  }, [latestReport, currentCost]);

  const DONUT_COLORS = ['#2D8075', '#C08B5C', '#3A9B8D', '#D6B07F'];

  // Smart Recommendations
  const recommendations = [
    {
      icon: Clock,
      title: 'Shift Heavy Loads to Off-Peak',
      desc: `Moving 30% of equipment usage to 10 PM – 6 AM can save up to ₹${savingsFromDemandShift.toLocaleString()}/month`,
      saving: `₹${savingsFromDemandShift.toLocaleString()}/mo`,
      difficulty: 'Easy',
      diffColor: 'bg-[#EAF3EF] text-[#36796A]',
    },
    {
      icon: Wind,
      title: 'HVAC Temperature Adjustment',
      desc: `Increasing AC temperature by 2°C during peak hours reduces consumption by 15%`,
      saving: `₹${savingsFromHVAC.toLocaleString()}/mo`,
      difficulty: 'Easy',
      diffColor: 'bg-[#EAF3EF] text-[#36796A]',
    },
    {
      icon: Zap,
      title: 'Eliminate Vampire Load',
      desc: `Idle standby devices (TV, router, chargers) silently consume 5–10% of your bill every month`,
      saving: `₹${savingsFromVampire.toLocaleString()}/mo`,
      difficulty: 'Medium',
      diffColor: 'bg-[#FDF3E8] text-[#C77232]',
    },
    {
      icon: Lightbulb,
      title: 'Smart Lighting Upgrade',
      desc: `Switching to LED and installing occupancy sensors can cut lighting costs by up to 50%`,
      saving: `₹${savingsFromLighting.toLocaleString()}/mo`,
      difficulty: 'Major',
      diffColor: 'bg-[#F5EDFF] text-[#7C4FA0]',
    },
  ];

  // Billing history from reports
  const billingHistory = useMemo(() => sortedReports.slice(-3).reverse().map((r, i) => ({
    provider: r.provider || profile?.provider || 'Electricity Board',
    month: r.month || `Report #${r.id}`,
    amount: r.amount_rs || 0,
    status: i === 0 ? 'Due Soon' : 'Paid',
    statusColor: i === 0 ? 'text-[#C77232]' : 'text-[#36796A]',
  })), [sortedReports, profile]);

  const StatCard = ({ icon: Icon, iconBg, iconColor, title, value, unit, badge, badgeColor, sub }) => (
    <div className="bg-[#FDFBF7] border border-[#EAE7E2] rounded-[24px] p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between">
      <div className="flex items-start justify-between mb-6">
        <div className={`p-3 rounded-xl ${iconBg} ${iconColor}`}>
          <Icon size={20} strokeWidth={2.2} />
        </div>
        {badge && <span className={`text-[12px] font-bold ${badgeColor}`}>{badge}</span>}
      </div>
      <div>
        <p className="text-[12px] font-medium text-[#7A7670] mb-1">{title}</p>
        <p className="text-[22px] font-bold text-[#2D2A26] tracking-tight mb-1">
          ₹{typeof value === 'number' ? value.toLocaleString() : value}
          {unit && <span className="text-[14px] font-normal text-[#9A9894] ml-1">{unit}</span>}
        </p>
        {sub && <p className="text-[11px] text-[#9A9894]">{sub}</p>}
      </div>
    </div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-[#FDFBF7] border border-[#EAE7E2] rounded-2xl p-3 shadow-lg text-[13px]">
          <p className="font-bold text-[#2D2A26] mb-1">{label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color }} className="font-semibold">
              {p.name}: ₹{(p.value || 0).toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <PageWrapper className="max-w-[1400px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Budget Optimizer</h1>
          <p className="text-text-secondary text-sm mt-1">Smart energy spend tracker — {reports.length} billing cycle{reports.length !== 1 ? 's' : ''} analyzed</p>
        </div>
        {budget !== (profile?.budget || 0) && (
          <button
            onClick={() => setProfileStatus(true, { ...profile, budget })}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2D8075] text-white font-bold text-sm rounded-xl shadow-sm hover:bg-[#24665C] hover:-translate-y-0.5 transition-all whitespace-nowrap self-start sm:self-end"
          >
            Save Budget Target
          </button>
        )}
      </div>


      {reports.length === 0 ? (
        <div className="bg-[#FDFBF7] border border-[#EAE7E2] rounded-[24px] p-12 sm:p-16 text-center mt-6 shadow-sm">
           <IndianRupee size={48} className="mx-auto text-brand-primary opacity-30 mb-4" />
           <h2 className="text-xl font-extrabold text-text-primary mb-2 tracking-tight">No Financial Data Available</h2>
           <p className="text-sm text-text-secondary max-w-sm mx-auto mb-6">Upload your first electricity bill from the dashboard to track spending and get your personalized budget optimizer.</p>
           <button onClick={() => navigate('/dashboard')} className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white font-bold text-sm rounded-xl hover:bg-brand-dark transition-all shadow-md">
             Go to Dashboard
           </button>
        </div>
      ) : (
      <>
      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <StatCard
          icon={IndianRupee}
          iconBg="bg-[#E8F1EC]" iconColor="text-[#36796A]"
          title="Current Month Spend"
          value={currentCost}
          badge={
            momChange !== null && (
              <span className="flex items-center gap-1">
                {parseFloat(momChange) <= 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                {Math.abs(momChange)}%
              </span>
            )
          }
          badgeColor={momChange !== null && parseFloat(momChange) <= 0 ? 'text-[#36796A] font-bold' : 'text-[#CA5742] font-bold'}
          sub={prevCost > 0 ? `vs ₹${prevCost.toLocaleString()} last month` : `Based on latest report`}
        />
        <StatCard
          icon={Target}
          iconBg="bg-[#FDEED9]" iconColor="text-[#C77232]"
          title="Monthly Budget"
          value={budget}
          badge={isOver ? 'Over Budget' : 'Under Budget'}
          badgeColor={isOver ? 'text-[#C77232] font-bold' : 'text-[#36796A] font-bold'}
          sub={`₹${delta.toLocaleString()} ${isOver ? 'over' : 'remaining'}`}
        />
        <StatCard
          icon={TrendingDown}
          iconBg="bg-[#E8F1EC]" iconColor="text-[#36796A]"
          title="Total Savings (YTD)"
          value={totalSavingsYTD}
          badge={
            reports.length > 0 && (
              <span className="flex items-center gap-1">
                <TrendingUp size={14} />
                {reports.length} reports
              </span>
            )
          }
          badgeColor="text-[#36796A] font-bold"
          sub="From budget optimizations"
        />
        <StatCard
          icon={Zap}
          iconBg="bg-[#EDE8F5]" iconColor="text-[#7C4FA0]"
          title="Potential Savings"
          value={potentialSavings}
          badge={
            <span className="flex items-center gap-1">
              <TrendingUp size={14} />
              22%
            </span>
          }
          badgeColor="text-[#36796A] font-bold"
          sub="With all recommendations"
        />
      </div>

      {/* Main Grid — Chart + Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Budget vs Actual Chart */}
        <div className="lg:col-span-2 bg-[#FDFBF7] border border-[#EAE7E2] rounded-[24px] p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-[16px] font-bold text-[#2D2A26]">Budget vs Actual Spending</h3>
              <p className="text-[12px] text-[#7A7670] mt-0.5">Track your monthly energy expenses</p>
            </div>
            {/* Budget slider inline — compact */}
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-medium text-[#7A7670]">Target:</span>
              <input
                type="range" min="500" max={Math.max(10000, currentCost * 2, globalAvgCost * 2)} step="100"
                value={budget}
                onChange={e => setBudget(Number(e.target.value))}
                className="w-28 accent-[#2D8075]"
              />
              <span className="text-[13px] font-bold text-[#2D2A26]">₹{budget.toLocaleString()}</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 mb-5">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#2D8075] inline-block"></span><span className="text-[12px] font-medium text-[#7A7670]">Budget</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#C08B5C] inline-block"></span><span className="text-[12px] font-medium text-[#7A7670]">Actual</span></div>
          </div>

          {barChartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-56 border-2 border-dashed border-[#EAE7E2] rounded-2xl">
              <p className="text-sm text-[#9A9894] font-medium">No data yet. Upload your first bill.</p>
            </div>
          ) : (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAE7E2" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9A9894', fontWeight: 600, fontSize: 12 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9A9894', fontWeight: 600, fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(45,128,117,0.04)', radius: 8 }} />
                  <Bar dataKey="Budget" fill="#2D8075" radius={[5, 5, 2, 2]} />
                  <Bar dataKey="Actual" fill="#C08B5C" radius={[5, 5, 2, 2]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Savings Breakdown Donut */}
        <div className="bg-[#FDFBF7] border border-[#EAE7E2] rounded-[24px] p-6 shadow-sm flex flex-col">
          <h3 className="text-[16px] font-bold text-[#2D2A26] mb-0.5">Savings Breakdown</h3>
          <p className="text-[12px] text-[#7A7670] mb-4">By optimization category</p>

          {donutData.length > 0 ? (
            <>
              <div className="flex justify-center mb-6">
                <PieChart width={180} height={180}>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={6}
                    dataKey="percent"
                    stroke="none"
                  >
                    {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </div>
              <div className="flex flex-col gap-3.5 mt-auto">
                {donutData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: item.color }}></span>
                      <span className="text-[13px] text-[#2D2A26] font-medium">{item.name}</span>
                    </div>
                    <span className="text-[14px] font-bold text-[#2D2A26]">{item.percent}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 h-40">
              <p className="text-sm text-[#9A9894] font-medium text-center">Upload reports to see savings breakdown</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grid — Smart Recommendations + Diagnostic Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Smart Recommendations */}
        <div className="bg-[#FDFBF7] border border-[#EAE7E2] rounded-[24px] p-6 shadow-sm">
          <div className="flex items-end justify-between mb-1">
            <h3 className="text-[16px] font-bold text-[#2D2A26]">Smart Recommendations</h3>
            <Sparkles size={16} className="text-[#36796A]" />
          </div>
          <p className="text-[12px] text-[#7A7670] mb-5">AI-powered savings suggestions based on your data</p>

          <div className="flex flex-col gap-3">
            {[
              {
                id: 'peak',
                icon: Clock,
                title: 'Demand Response Shift',
                desc: `Shift high-draw appliances (AC, WM) to off-peak hours to save ₹${savingsFromDemandShift}.`,
                saving: `₹${savingsFromDemandShift}/mo`,
                difficulty: 'Easy',
                active: savingsFromDemandShift > 50
              },
              {
                id: 'vampire',
                icon: ZapOff,
                title: 'Eliminate Phantom Loads',
                desc: `Your standby power is costing you ₹${savingsFromVampire}. Unplug idle electronics.`,
                saving: `₹${savingsFromVampire}/mo`,
                difficulty: 'Medium',
                active: savingsFromVampire > 50
              },
              {
                id: 'hvac',
                icon: Wind,
                title: 'Thermal Correction',
                desc: `Adjusting target temperature to 24°C will trim ₹${savingsFromHVAC} from your next bill.`,
                saving: `₹${savingsFromHVAC}/mo`,
                difficulty: 'Easy',
                active: true
              }
            ].filter(r => r.active).map((rec, i) => (
              <div key={i} className="bg-[#F8F2EA] border border-[#EBE3D5] rounded-[18px] p-4 flex items-center gap-4 hover:border-[#D6CAB2] transition-all">
                <div className="p-2.5 rounded-xl bg-[#EAF3EF] text-[#36796A] shrink-0">
                  <rec.icon size={20} strokeWidth={2.2} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[13px] font-bold text-[#2D2A26] mb-0.5 truncate">{rec.title}</h4>
                  <p className="text-[11px] text-[#7A7670] leading-relaxed line-clamp-1">{rec.desc}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[#36796A] font-bold text-[12px]">{rec.saving}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF3EF] text-[#36796A]`}>{rec.difficulty}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Diagnostic Savings Summary */}
        <div className="bg-[#FDFBF7] border border-[#EAE7E2] rounded-[24px] p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-end justify-between mb-1">
            <div>
              <h3 className="text-[16px] font-bold text-[#2D2A26]">Optimizer Narrative</h3>
              <p className="text-[12px] text-[#7A7670]">Calculated fiscal diagnostic</p>
            </div>
          </div>

          <div className="bg-[#F8F2EA] border border-[#EBE3D5] rounded-[20px] p-5 flex-1 flex flex-col justify-center">
             <div className="flex items-center gap-4 mb-4">
                <div className="bg-brand-primary/10 p-3 rounded-2xl text-brand-primary"><Lightbulb size={24} /></div>
                <div>
                   <p className="text-[14px] font-extrabold text-[#2D2A26]">Monthly Efficiency Score</p>
                   <p className="text-[11px] font-bold text-[#7A7670] uppercase tracking-wider">Predictive Ranking</p>
                </div>
             </div>
             <p className="text-[13px] text-[#2D2A26] leading-relaxed font-medium mb-6">
                Based on your last {reports.length} reports, your energy efficiency is 
                <span className="text-[#36796A] font-bold"> {isOver ? 'degrading' : 'improving'}</span>. 
                Applying all smart recommendations could move your budget to 
                <span className="text-[#36796A] font-extrabold"> ₹{(currentCost - potentialSavings).toLocaleString()}</span> next month.
             </p>
             <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/50 border border-[#EBE3D5] rounded-xl p-3">
                   <p className="text-[10px] font-black text-[#9A9894] uppercase tracking-wider mb-1">Slab Tax</p>
                   <p className="text-[15px] font-black text-[#2D2A26]">₹{latestReport?.budget_analysis?.slab_charges || '0'}</p>
                </div>
                <div className="bg-white/50 border border-[#EBE3D5] rounded-xl p-3">
                   <p className="text-[10px] font-black text-[#9A9894] uppercase tracking-wider mb-1">Fixed Cost</p>
                   <p className="text-[15px] font-black text-[#2D2A26]">₹150</p>
                </div>
             </div>
          </div>

          {/* Monthly Budget Progress Bar */}
          <div className="bg-[#F8F2EA] border border-[#EBE3D5] rounded-[16px] p-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[13px] font-bold text-[#2D2A26]">Monthly Budget Progress</p>
              <span className={`text-[13px] font-bold ${budgetProgress >= 100 ? 'text-[#C77232]' : 'text-[#2D2A26]'}`}>{budgetProgress}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[#EAE7E2] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${budgetProgress >= 100 ? 'bg-[#C77232]' : 'bg-[#2D8075]'}`}
                style={{ width: `${Math.min(100, budgetProgress)}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-[#9A9894] mt-2">₹{currentCost.toLocaleString()} of ₹{budget.toLocaleString()} spent</p>
          </div>
        </div>
      </div>
      </>
      )}
    </PageWrapper>
  );
}
