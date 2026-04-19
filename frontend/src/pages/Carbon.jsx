import React from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import { useNavigate } from 'react-router-dom';
import { Leaf, TreePine, Car, Factory, Globe2, Activity, TrendingDown, TrendingUp, ArrowRight, Zap, ThermometerSnowflake, ZapOff, Server, Award, Target } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useReportStore } from '../store/reportStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

export default function Carbon() {
  const profile = useAuthStore(s => s.profile);
  const reports = useReportStore(s => s.reports);
  const navigate = useNavigate();
  const provider = profile?.provider || 'Your Provider';

  const sortedReports = [...reports].sort((a, b) => new Date(a.generated_at) - new Date(b.generated_at));
  const chartData = sortedReports.map(r => ({
    name: r.month && typeof r.month === 'string' ? r.month.substring(0, 3) : `R${r.id || '?'}`,
    co2: r.carbon?.total_kg || 0,
    units: r.units_kwh || 0,
  }));

  const activeReport = reports && reports.length > 0 ? reports[0] : null;

  const totalImpact = Math.round(reports.reduce((acc, r) => acc + (r.carbon?.total_kg || 0), 0));
  const avgImpact = reports.length > 0 ? Math.round(totalImpact / reports.length) : 0;
  const totalUnits = reports.reduce((acc, r) => acc + (r.units_kwh || 0), 0);
  
  // Naturalized trees needed to offset CURRENT month
  const treeCount = activeReport?.carbon?.offset_trees || 1;
  
  const kmCount = Math.round(totalImpact / 0.17);
  const emissionsPerKwh = totalUnits > 0 ? (totalImpact / totalUnits).toFixed(2) : '0.82';
  const renewMix = provider.includes('BESCOM') ? '54%' : provider.includes('TNEB') ? '46%' : '38%';
  
  const latestCo2 = activeReport?.carbon?.total_kg || 0;
  const prevCo2 = sortedReports.length > 1 ? (sortedReports[sortedReports.length - 2].carbon?.total_kg || 0) : 0;
  const trend = prevCo2 > 0 ? (((latestCo2 - prevCo2) / prevCo2) * 100).toFixed(1) : null;

  const emissionSources = React.useMemo(() => {
     if (!activeReport?.device_breakdown) return [];
     
     // Derive emissions directly from device costs (proportionally)
     const items = activeReport.device_breakdown.map(d => ({
         name: d.name,
         val: Math.round((d.value / activeReport.amount_rs) * 100)
     })).sort((a,b) => b.val - a.val);

     const colors = ["bg-[#2D8075]", "bg-[#C08B5C]", "bg-[#3A9B8D]", "bg-[#D6B07F]", "bg-[#99C2A2]", "bg-[#7A7670]"];
     return items.map((item, i) => ({ ...item, color: colors[i % colors.length] }));
  }, [activeReport]);

  return (
    <PageWrapper className="max-w-[1400px] mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Carbon Footprint</h1>
          <p className="text-text-secondary text-sm mt-1">Household electricity emissions — {reports.length} billing cycle{reports.length !== 1 ? 's' : ''} tracked</p>
        </div>
        <button
          onClick={() => navigate('/budget')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-positive text-white font-bold text-sm rounded-xl shadow-sm hover:bg-positive-dark hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap self-start sm:self-end"
        >
          Optimize Usage <ArrowRight size={14} />
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="bg-[#FDFBF7] border border-[#EAE7E2] rounded-[24px] p-12 sm:p-16 text-center mt-6 shadow-sm">
           <Leaf size={48} className="mx-auto text-brand-primary opacity-30 mb-4" />
           <h2 className="text-xl font-extrabold text-text-primary mb-2 tracking-tight">No Emissions Tracked Yet</h2>
           <p className="text-sm text-text-secondary max-w-sm mx-auto mb-6">Upload your first electricity bill from the dashboard to unlock AI-powered insights on your carbon footprint.</p>
           <button onClick={() => navigate('/dashboard')} className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white font-bold text-sm rounded-xl hover:bg-brand-dark transition-all shadow-md">
             Go to Dashboard
           </button>
        </div>
      ) : (
      <>
      {/* Themed Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Card 1: Total Emissions */}
          <div className="bg-[#FDFBF7] border border-[#EAE7E2] rounded-[24px] p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between">
              <div className="flex items-start justify-between mb-8">
                  <div className="p-3 rounded-xl bg-[#E8F1EC] text-[#36796A]">
                      <Leaf size={22} strokeWidth={2.2} />
                  </div>
                  {trend !== null && (
                      <span className={`flex items-center gap-1 text-[13px] font-bold ${parseFloat(trend) <= 0 ? 'text-[#36796A]' : 'text-[#C77232]'}`}>
                          {parseFloat(trend) <= 0 ? <TrendingDown size={14} strokeWidth={2.5} /> : <TrendingUp size={14} strokeWidth={2.5} />} 
                          {Math.abs(parseFloat(trend))}%
                      </span>
                  )}
              </div>
              <div>
                  <p className="text-[12px] font-medium text-[#7A7670] mb-1">Total Emissions</p>
                  <p className="text-[22px] font-bold text-[#2D2A26] mb-1 tracking-tight">{latestCo2} <span className="text-[16px] font-normal text-[#2D2A26]">kg</span></p>
                  <p className="text-[11px] text-[#9A9894]">CO₂ equivalent this month</p>
              </div>
          </div>

          {/* Card 2: Monthly Average */}
          <div className="bg-[#FDFBF7] border border-[#EAE7E2] rounded-[24px] p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between">
              <div className="flex items-start justify-between mb-8">
                  <div className="p-3 rounded-xl bg-[#FDEED9] text-[#C77232]">
                      <Target size={22} strokeWidth={2.2} />
                  </div>
                  <span className={`text-[13px] font-bold ${latestCo2 <= avgImpact ? 'text-[#36796A]' : 'text-[#C77232]'}`}>
                      {latestCo2 <= avgImpact ? 'On Track' : 'Needs Action'}
                  </span>
              </div>
              <div>
                  <p className="text-[12px] font-medium text-[#7A7670] mb-1">Monthly Average</p>
                  <p className="text-[22px] font-bold text-[#2D2A26] mb-1 tracking-tight">{avgImpact} <span className="text-[16px] font-normal text-[#2D2A26]">kg</span></p>
                  <p className="text-[11px] text-[#9A9894]">{Math.abs(latestCo2 - avgImpact)} kg {latestCo2 <= avgImpact ? 'under' : 'over'} budget</p>
              </div>
          </div>

          {/* Card 3: Required Offset (Tree Icon) */}
          <div className="bg-[#FDFBF7] border border-[#EAE7E2] rounded-[24px] p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between">
              <div className="flex items-start justify-between mb-8">
                  <div className="p-3 rounded-xl bg-[#E8F1EC] text-[#36796A]">
                      <TreePine size={22} strokeWidth={2.2} />
                  </div>
              </div>
              <div>
                  <p className="text-[12px] font-medium text-[#7A7670] mb-1">Carbon Offset</p>
                  <p className="text-[22px] font-bold text-[#2D2A26] mb-1 tracking-tight">{treeCount} <span className="text-[16px] font-normal text-[#2D2A26]">trees</span></p>
                  <p className="text-[11px] text-[#9A9894]">Needed to neutralize usage</p>
              </div>
          </div>

          {/* Card 4: Lifetime Output (Factory Icon) */}
          <div className="bg-[#FDFBF7] border border-[#EAE7E2] rounded-[24px] p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between">
              <div className="flex items-start justify-between mb-8">
                  <div className="p-3 rounded-xl bg-[#E8F1EC] text-[#36796A]">
                      <Factory size={22} strokeWidth={2.2} />
                  </div>
              </div>
              <div>
                  <p className="text-[12px] font-medium text-[#7A7670] mb-1">Net Lifetime</p>
                  <p className="text-[22px] font-bold text-[#36796A] mb-1 tracking-tight">{totalImpact} <span className="text-[16px] font-normal text-[#36796A]">kg</span></p>
                  <p className="text-[11px] text-[#9A9894]">Across {reports.length} analyzed cycle{reports.length !== 1 ? 's' : ''}</p>
              </div>
          </div>
      </div>

      {/* Main Row — Chart + Equivalents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Chart */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="font-extrabold text-base text-text-primary">Monthly CO₂ Emissions History</h3>
              <p className="text-text-secondary text-xs mt-0.5">kg CO₂ emitted per billing cycle</p>
            </div>
            {trend !== null && (
              <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3.5 py-1.5 rounded-full border ${parseFloat(trend) <= 0 ? 'bg-positive-light text-positive border-positive/20' : 'bg-negative-light text-negative border-negative/20'}`}>
                {parseFloat(trend) <= 0 ? <TrendingDown size={14} /> : <Activity size={14} />} {Math.abs(parseFloat(trend))}% vs last month
              </span>
            )}
          </div>

          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-56 border-2 border-dashed border-border rounded-xl">
              <Activity size={32} className="text-text-muted mb-3" />
              <p className="text-sm text-text-muted font-medium">No data yet. Upload your first bill.</p>
            </div>
          ) : (
            <div className="h-52 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E2DC" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9C9994', fontWeight: 700, fontSize: 12 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9C9994', fontWeight: 600, fontSize: 11 }} unit=" kg" />
                  {avgImpact > 0 && <ReferenceLine y={avgImpact} stroke="var(--positive)" strokeDasharray="4 3" label={{ value: 'Avg', fill: 'var(--positive)', fontSize: 10, fontWeight: 700 }} />}
                  <Tooltip
                    cursor={{ fill: 'rgba(74,153,114,0.06)', radius: 8 }}
                    contentStyle={{ borderRadius: '14px', background: '#FAFAFA', border: '1px solid #E2E2DC', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', fontWeight: '600', fontSize: '13px' }}
                    formatter={(val) => [`${val} kg CO₂`, 'Emission']}
                  />
                  <Bar dataKey="co2" radius={[6, 6, 2, 2]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={i === chartData.length - 1 ? 'var(--positive)' : 'var(--positive-light)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Emission Sources Breakdown */}
        <div className="bg-[#FDFBF7] border border-[#EAE7E2] rounded-[24px] p-7 flex flex-col shadow-sm">
            <h3 className="text-[17px] font-bold text-text-primary mb-1">Emission Sources</h3>
            <p className="text-[13px] text-text-secondary mb-7">Breakdown by actual household category</p>

            <div className="flex flex-col gap-6 flex-1 justify-center">
                {emissionSources.map((source, idx) => (
                    <div key={idx}>
                       <div className="flex justify-between items-center mb-2.5">
                           <span className="text-[14px] text-[#2D2A26] font-medium">{source.name}</span>
                           <span className="text-[14px] text-[#2D2A26] font-bold">{source.val}%</span>
                       </div>
                       <div className="w-full h-2 rounded-full bg-[#F3EBE1] overflow-hidden">
                           <div className={`h-full rounded-full ${source.color}`} style={{ width: `${source.val}%` }}></div>
                       </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Grid Provider */}
      <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 hover:shadow-md transition duration-300">
        <div className="bg-positive/10 p-3 rounded-xl text-positive shrink-0 self-start"><Factory size={24} /></div>
        <div className="flex-1">
          <h4 className="font-extrabold text-base text-text-primary mb-1">
            Grid Provider: <span className="text-brand-primary">{provider}</span>
          </h4>
          <p className="text-sm text-text-secondary leading-relaxed">
            Your grid emits approximately <strong>{emissionsPerKwh} kg CO₂ per kWh</strong>. Every unit saved directly reduces your carbon footprint.
          </p>
        </div>
        <div className="text-left sm:text-right sm:border-l border-border sm:pl-8 shrink-0">
          <p className="text-4xl font-black data-text text-positive tracking-tighter">{renewMix}</p>
          <p className="text-xs font-black text-text-muted uppercase tracking-[0.2em] mt-1.5">Renewable Mix</p>
        </div>
      </div>

      {/* Themed Split Data Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 mt-8">
         {/* Left Column: Strategies */}
         <div>
            <div className="flex items-end justify-between mb-4 px-1">
               <div>
                  <h3 className="text-[17px] font-bold text-text-primary mb-1">Actionable Strategies</h3>
                  <p className="text-[13px] text-text-secondary">Your active carbon reduction initiatives</p>
               </div>
            </div>
            
            <div className="flex flex-col gap-3">
               {[
                 { 
                    title: 'AC Thermal Precision', 
                    tip: 'Your cooling accounts for ' + (emissionSources.find(s => s.name === 'Air Conditioner')?.val || '0') + '% of emissions. Setting to 24°C is critical.', 
                    save: '~12% footprint', 
                    icon: ThermometerSnowflake, 
                    active: (emissionSources.find(s => s.name === 'Air Conditioner')?.val || 0) > 30 
                 },
                 { 
                    title: 'Vampire Load Kill-Switch', 
                    tip: 'Standby power is costing you ₹' + (activeReport?.vampire_load?.cost || '0') + ' this month. Unplug idle electronics.', 
                    save: '~5-8% energy', 
                    icon: ZapOff, 
                    active: (activeReport?.vampire_load?.cost || 0) > 100 
                 },
                 { 
                    title: 'Washing Machine Optimization', 
                    tip: 'Only run full loads. Heating water uses 90% of a washer\'s energy.', 
                    save: '~₹150/mo', 
                    icon: Zap, 
                    active: (emissionSources.find(s => s.name === 'Washing Machine')?.val || 0) > 5 
                 },
               ].filter(s => s.active).slice(0, 3).map((item, i) => (
                  <div key={i} className="bg-[#F8F1E5] border border-[#EBE3D6] rounded-[20px] p-5 flex items-center justify-between transition-all hover:border-[#D6CAB2]">
                     <div className="flex items-center gap-4">
                        <div className="bg-[#EAF3EF] p-2.5 rounded-xl text-[#36796A]">
                           <item.icon size={22} strokeWidth={2.2}/>
                        </div>
                        <div>
                           <h4 className="text-[14px] font-bold text-text-primary mb-0.5">{item.title}</h4>
                           <p className="text-[12px] font-medium text-[#7A7670]">{item.tip}</p>
                        </div>
                     </div>
                     <div className="text-right shrink-0 flex flex-col items-end">
                        <p className="text-[#36796A] font-bold text-[13px] mb-1.5 whitespace-nowrap">{item.save}</p>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EAF3EF] text-[#36796A]">Recommended</span>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* Right Column: Milestones */}
         <div>
            <div className="flex items-end justify-between mb-4 px-1">
               <div>
                  <h3 className="text-[17px] font-bold text-text-primary mb-1">Efficiency Milestones</h3>
                  <p className="text-[13px] text-text-secondary">Predicted based on structural data</p>
               </div>
            </div>
            
            <div className="flex flex-col gap-3">
               {[
                 { title: 'Grid Guard', tip: 'Monthly consumption stabilized below 300 units.', icon: TrendingDown, achieved: (activeReport?.units_kwh < 300) },
                 { title: 'Carbon Neutrality Path', tip: 'Renewable grid mix in your region (' + renewMix + ') utilized optimally.', icon: Award, achieved: true },
                 { title: 'Thermal Efficiency', tip: 'Appliance health scores across your fleet average > 85%.', icon: Target, achieved: (Object.values(activeReport?.device_health?.scores || {}).reduce((a,b)=>a+b,0) / Object.keys(activeReport?.device_health?.scores || {}).length > 85) },
               ].map((item, i) => (
                  <div key={i} className={`rounded-[20px] p-5 flex items-center justify-between transition-all ${item.achieved ? 'bg-[#EAF3EF] border border-[#DCEAE3]' : 'bg-[#FDFBF7] border border-[#EAE7E2]'}`}>
                     <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl ${item.achieved ? 'text-[#36796A]' : 'text-[#9A9894]'}`}>
                           <item.icon size={22} strokeWidth={2.2}/>
                        </div>
                        <div>
                           <h4 className={`text-[14px] font-bold mb-0.5 ${item.achieved ? 'text-text-primary' : 'text-[#7A7670]'}`}>{item.title}</h4>
                           <p className="text-[12px] font-medium text-[#7A7670]">{item.tip}</p>
                        </div>
                     </div>
                     <div className="shrink-0 pl-3">
                        {item.achieved && (
                           <div className="p-1.5 rounded-full bg-[#D7E9DF] text-[#36796A]">
                              <Award size={18} strokeWidth={2.5}/>
                           </div>
                        )}
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
      </>
      )}
    </PageWrapper>
  );
}
