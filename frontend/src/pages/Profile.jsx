import React, { useState } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import { User, LogOut, Home, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const logout = useAuthStore(s => s.logout);
  const profile = useAuthStore(s => s.profile);
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState('household'); // 'household', 'tariffs'

  const getTariffRows = () => {
      const p = profile?.provider || 'default';
      const tariffs = {
          'BESCOM': [{range: '0 - 50', rate: '4.75'}, {range: '51 - 100', rate: '6.00'}, {range: '100+', rate: '7.00', extreme: true}],
          'MSEDCL': [{range: '0 - 100', rate: '5.58'}, {range: '101 - 300', rate: '11.46'}, {range: '300+', rate: '15.72', extreme: true}],
          'BSES': [{range: '0 - 200', rate: '3.00'}, {range: '201 - 400', rate: '4.50'}, {range: '400+', rate: '6.50', extreme: true}],
          'TNEB': [{range: '0 - 100', rate: '0.00 (Free)'}, {range: '101 - 200', rate: '2.25'}, {range: '200+', rate: '4.50', extreme: true}],
          'TSSPDCL': [{range: '0 - 100', rate: '3.30'}, {range: '101 - 200', rate: '4.30'}, {range: '200+', rate: '7.20', extreme: true}],
          'TORRENT': [{range: '0 - 50', rate: '3.20'}, {range: '51 - 200', rate: '3.90'}, {range: '200+', rate: '4.90', extreme: true}],
          'UPPCL': [{range: '0 - 150', rate: '5.50'}, {range: '151 - 300', rate: '6.00'}, {range: '300+', rate: '6.50', extreme: true}],
          'CESC': [{range: '0 - 100', rate: '6.69'}, {range: '101 - 150', rate: '7.82'}, {range: '150+', rate: '9.07', extreme: true}],
          'default': [{range: '0 - 100', rate: '3.50'}, {range: '101 - 200', rate: '4.80'}, {range: '200+', rate: '6.50', extreme: true}],
      };
      return tariffs[p] || tariffs['default'];
  };

  return (
    <PageWrapper className="max-w-3xl pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#2D2A26] tracking-tight">Settings & DNA</h1>
        <p className="text-sm font-medium text-[#7A7670] mt-1">Configure your physical household DNA for accuracy.</p>
      </div>

      {/* User Card */}
      <div className="bg-[#FDFBF7] border border-[#EAE7E2] rounded-[24px] p-6 shadow-sm flex items-center gap-5 mb-6">
         <div className="w-14 h-14 bg-[#EAF3EF] text-[#36796A] rounded-full flex items-center justify-center shrink-0">
           <User size={28} strokeWidth={2.2} />
         </div>
         <div>
            <h2 className="text-[18px] font-extrabold text-[#2D2A26] mb-0.5">{user?.name || 'User Name'}</h2>
            <p className="text-[13px] font-bold text-[#7A7670] bg-[#F8F2EA] border border-[#EBE3D5] inline-block px-3 py-1.5 rounded-lg">{user?.email || 'user@example.com'}</p>
         </div>
      </div>

      <div className="space-y-4">
         {/* Household Panel */}
         <div className={`bg-[#FDFBF7] border rounded-[24px] overflow-hidden transition duration-300 ${expanded === 'household' ? 'border-[#36796A] shadow-sm' : 'border-[#EAE7E2] hover:border-[#D6CAB2]'}`}>
             <div onClick={() => setExpanded(expanded === 'household' ? '' : 'household')} className="px-6 py-5 flex items-center justify-between cursor-pointer group">
                 <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-colors ${expanded === 'household' ? 'bg-[#36796A] text-white shadow-sm' : 'bg-[#EAF3EF] text-[#36796A]'}`}><Home size={20} /></div>
                    <span className="font-extrabold text-[16px] text-[#2D2A26]">Household Profile</span>
                 </div>
                 <div className="flex items-center gap-4">
                     {expanded !== 'household' && <span className="text-[11px] font-extrabold bg-[#F8F2EA] px-3 py-1.5 rounded-lg border border-[#EBE3D5] text-[#7A7670] uppercase tracking-wider">{profile?.homeType}, {profile?.city?.split(',')[0]}</span>}
                     {expanded === 'household' ? <ChevronUp size={20} className="text-[#9A9894]"/> : <ChevronDown size={20} className="text-[#9A9894]"/>}
                 </div>
             </div>
             <AnimatePresence>
                 {expanded === 'household' && (
                     <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="border-t border-[#EAE7E2] px-6 pb-6 pt-4">
                        <div className="grid grid-cols-2 gap-4 bg-[#F8F2EA]/60 p-5 rounded-[18px] border border-[#EBE3D5]">
                            <div><p className="text-[#7A7670] font-bold uppercase text-[10px] tracking-widest mb-1">City</p><p className="font-extrabold text-[15px] text-[#2D2A26]">{profile?.city}</p></div>
                            <div><p className="text-[#7A7670] font-bold uppercase text-[10px] tracking-widest mb-1">Home Type</p><p className="font-extrabold text-[15px] text-[#2D2A26]">{profile?.homeType}</p></div>
                            <div><p className="text-[#7A7670] font-bold uppercase text-[10px] tracking-widest mb-1">Family Size</p><p className="font-extrabold text-[15px] text-[#2D2A26]">{profile?.familySize} Members</p></div>
                            <div><p className="text-[#7A7670] font-bold uppercase text-[10px] tracking-widest mb-1">Initial Target</p><p className="font-extrabold text-[15px] text-[#C77232]">₹{profile?.budget}</p></div>
                        </div>
                        <button onClick={() => navigate('/onboarding?edit=true')} className="mt-5 px-5 py-2.5 bg-[#2D8075] text-white font-bold text-[13px] rounded-xl hover:bg-[#24665C] transition shadow-sm">Edit Configuration</button>
                     </motion.div>
                 )}
             </AnimatePresence>
         </div>

         {/* Tariffs Panel */}
         <div className={`bg-[#FDFBF7] border rounded-[24px] overflow-hidden transition duration-300 ${expanded === 'tariffs' ? 'border-[#36796A] shadow-sm' : 'border-[#EAE7E2] hover:border-[#D6CAB2]'}`}>
             <div onClick={() => setExpanded(expanded === 'tariffs' ? '' : 'tariffs')} className="px-6 py-5 flex items-center justify-between cursor-pointer group">
                 <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-colors ${expanded === 'tariffs' ? 'bg-[#FDEED9] text-[#C77232] shadow-sm' : 'bg-[#FDF3E8] text-[#D89052]'}`}><Zap size={20} fill="currentColor" /></div>
                    <span className="font-extrabold text-[16px] text-[#2D2A26]">Tariff Slabs ({profile?.provider})</span>
                 </div>
                 {expanded === 'tariffs' ? <ChevronUp size={20} className="text-[#9A9894]"/> : <ChevronDown size={20} className="text-[#9A9894]"/>}
             </div>
             <AnimatePresence>
                 {expanded === 'tariffs' && (
                     <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="border-t border-[#EAE7E2] px-6 pb-6 pt-4">
                        <table className="w-full text-left bg-[#F8F2EA]/60 rounded-[18px] overflow-hidden border border-[#EBE3D5]">
                            <thead className="bg-[#F8F2EA] border-b border-[#EBE3D5] text-[#7A7670] font-extrabold uppercase text-[11px] tracking-wider">
                                <tr><th className="p-3.5 pl-4">Units (kWh)</th><th className="p-3.5 pr-4 text-right">Rate (₹)</th></tr>
                            </thead>
                            <tbody className="font-bold text-[14px] text-[#2D2A26]">
                                {getTariffRows().map((row, idx, arr) => (
                                    <tr key={idx} className={idx !== arr.length - 1 ? "border-b border-[#EBE3D5]/60" : ""}>
                                        <td className={`p-3.5 pl-4 ${row.extreme ? 'text-[#C77232]' : ''}`}>{row.range} {row.extreme && '(Extreme)'}</td>
                                        <td className={`p-3.5 pr-4 text-right ${row.extreme ? 'text-[#C77232] font-extrabold' : ''}`}>
                                            {row.rate.includes('Free') ? row.rate : `₹ ${row.rate}`}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </motion.div>
                 )}
             </AnimatePresence>
         </div>

         <div className="pt-4">
             <button onClick={logout} className="w-full py-4 bg-[#FCF8F8] border border-[#F2EAEA] text-[#D35A5A] hover:bg-[#F9F0F0] rounded-[24px] font-bold text-[15px] flex items-center justify-center gap-2.5 transition">
                <LogOut size={18} /> Sign Out securely
             </button>
         </div>
      </div>
    </PageWrapper>
  );
}
