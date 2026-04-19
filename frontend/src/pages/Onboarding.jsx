import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, MapPin, Tv, Fan, Monitor, Smartphone, Flame, Wind, Plus, Minus, Cpu, ArrowRight, Loader2, Home, Users, Zap, Info } from 'lucide-react';

const CITIES = [
  "Agra, UP", "Ahmedabad, Gujarat", "Amritsar, Punjab", "Bengaluru, Karnataka", "Bhopal, Madhya Pradesh", 
  "Bhubaneswar, Odisha", "Chandigarh, Punjab", "Chennai, Tamil Nadu", "Coimbatore, Tamil Nadu", "Delhi, NCR", 
  "Faridabad, Haryana", "Gandhinagar, Gujarat", "Gurugram, Haryana", "Guwahati, Assam", "Howrah, West Bengal", 
  "Hubballi, Karnataka", "Hyderabad, Telangana", "Indore, Madhya Pradesh", "Jaipur, Rajasthan", "Jalandhar, Punjab", 
  "Jodhpur, Rajasthan", "Kanpur, UP", "Kochi, Kerala", "Kolkata, West Bengal", "Lucknow, UP", 
  "Ludhiana, Punjab", "Madurai, Tamil Nadu", "Mangaluru, Karnataka", "Mumbai, Maharashtra", "Mysuru, Karnataka", 
  "Nagpur, Maharashtra", "Nashik, Maharashtra", "Noida, UP", "Patiala, Punjab", "Patna, Bihar", 
  "Pune, Maharashtra", "Raipur, Chhattisgarh", "Rajkot, Gujarat", "Ranchi, Jharkhand", "Surat, Gujarat", 
  "Thane, Maharashtra", "Thiruvananthapuram, Kerala", "Tiruchirappalli, Tamil Nadu", "Vadodara, Gujarat", 
  "Varanasi, UP", "Warangal, Telangana"
];

const APPLIANCES = [
  { id: 'ac', name: 'Air Conditioner', icon: Wind, color: 'text-brand-primary' },
  { id: 'geyser', name: 'Geyser', icon: Flame, color: 'text-accent' },
  { id: 'wm', name: 'Washing Machine', icon: Cpu, color: 'text-positive' },
  { id: 'fridge', name: 'Refrigerator', icon: Smartphone, color: 'text-brand-primary' },
  { id: 'tv', name: 'Television', icon: Tv, color: 'text-accent' },
  { id: 'fans', name: 'Ceiling Fans', icon: Fan, color: 'text-positive' },
  { id: 'pc', name: 'Desktop/PC', icon: Monitor, color: 'text-brand-primary' },
];

const HOME_TYPES = [
  { label: 'Studio', value: '1 BHK', icon: Home },
  { label: 'Medium', value: '2 BHK', icon: Home },
  { label: 'Large', value: '3 BHK+', icon: Home },
  { label: 'Villa', value: 'Independent House', icon: Home },
];

export default function Onboarding() {
  const [searchParams] = useSearchParams();
  const isEdit = searchParams.get('edit') === 'true';

  const setProfileStatus = useAuthStore((s) => s.setProfileStatus);
  const existingProfile = useAuthStore((s) => s.profile);
  const token = useAuthStore((s) => s.token);
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [citySearch, setCitySearch] = useState(existingProfile?.city || "Bengaluru, Karnataka");
  const [locating, setLocating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [homeType, setHomeType] = useState(existingProfile?.homeType || "2 BHK");
  const [familySize, setFamilySize] = useState(existingProfile?.familySize || 3);
  const [budget, setBudget] = useState(existingProfile?.budget || 2500);
  const [appliances, setAppliances] = useState(existingProfile?.appliances || {ac:0, geyser:0, wm:0, fridge:0, tv:0, fans:0, pc:0});
  const [provider, setProvider] = useState(existingProfile?.provider || "");
  const [manualProvider, setManualProvider] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let p = "Other";
    const c = citySearch.toLowerCase();
    if (c.includes("mumbai") || c.includes("pune") || c.includes("maharashtra")) p = "MSEDCL";
    else if (c.includes("gujarat") || c.includes("ahmedabad") || c.includes("surat") || c.includes("vadodara") || c.includes("gandhinagar")) p = "TORRENT";
    else if (c.includes("delhi") || c.includes("ncr")) p = "BSES";
    else if (c.includes("bengaluru") || c.includes("karnataka")) p = "BESCOM";
    else if (c.includes("tamil nadu") || c.includes("chennai")) p = "TNEB";
    else if (c.includes("telangana") || c.includes("hyderabad")) p = "TSSPDCL";
    else if (c.includes("up") || c.includes("agra") || c.includes("lucknow") || c.includes("kanpur") || c.includes("varanasi") || c.includes("noida")) p = "UPPCL";
    else if (c.includes("kolkata") || c.includes("howrah") || c.includes("west bengal")) p = "CESC";
    setProvider(p);
  }, [citySearch]);

  const handleAutoLocate = async () => {
      setLocating(true);
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(async (pos) => {
              try {
                  const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`);
                  const data = await res.json();
                  const loc = `${data.city || data.locality}, ${data.principalSubdivision || data.adminName1}`;
                  setCitySearch(loc);
                  setShowDropdown(false);
              } catch (e) {
                  console.error(e);
              } finally {
                  setLocating(false);
              }
          }, () => setLocating(false));
      } else {
          setLocating(false);
      }
  };

  const handleApplianceChange = (id, delta) => {
      setAppliances(prev => ({...prev, [id]: Math.max(0, prev[id] + delta)}));
  };

  const handleComplete = async () => {
    setSaving(true);
    const updatedProfile = {
        utility: provider === "Other" ? manualProvider : provider,
        city: citySearch,
        home_type: homeType,
        household_size: familySize,
        budget_rs: budget,
        appliances
    };

    try {
        const res = await fetch('http://localhost:8000/onboarding/complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedProfile)
        });

        if (res.ok) {
            // Update local store with UI-friendly keys
            setProfileStatus(true, {
                provider: updatedProfile.utility,
                city: updatedProfile.city,
                homeType: updatedProfile.home_type,
                familySize: updatedProfile.household_size,
                budget: updatedProfile.budget_rs,
                appliances: updatedProfile.appliances
            });
            navigate('/dashboard');
        }
    } catch (e) {
        console.error("Failed to save profile:", e);
    } finally {
        setSaving(false);
    }
  };

  const filteredCities = CITIES.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden">
      
      {/* ─── BACKGROUND DECOR ─── */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-primary opacity-[0.03] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent opacity-[0.02] rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4"></div>
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)', backgroundSize: '40px 40px'}}></div>

      <div className="w-full max-w-2xl bg-white p-8 md:p-14 rounded-[40px] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.08)] border border-[#EAE7E2] relative overflow-hidden z-10">
        
        {/* Progress Bar */}
        <div className="flex gap-3 mb-14 relative z-10 px-2">
          {[1,2,3,4].map(s => (
            <div key={s} className="h-1.5 flex-1 rounded-full bg-[#F3EBE1] overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }} 
                 animate={{ width: step >= s ? '100%' : '0%' }} 
                 transition={{ duration: 0.8, ease: "circOut" }} 
                 className={`h-full ${step >= s ? 'bg-brand-primary shadow-[0_0_10px_rgba(29,135,124,0.3)]' : 'bg-transparent'}`} 
               />
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="min-h-[440px] relative z-20 flex flex-col"
          >
            <div className="mb-10">
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-brand-primary mb-3">Step {step} of 4</p>
                <h2 className="text-[40px] font-black leading-[1.1] tracking-tighter text-[#0A2F29]" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                {step === 1 && "Where is your residence?"}
                {step === 2 && "The details matter."}
                {step === 3 && "Device Inventory"}
                {step === 4 && "Tariff Config"}
                </h2>
                <p className="text-[#6B6863] font-medium text-lg mt-3">
                    {step === 1 && "Help us calibrate the local power grid data."}
                    {step === 2 && "We'll build a custom consumption baseline for you."}
                    {step === 3 && "Select the major energy consumers in your home."}
                    {step === 4 && "We've pre-detected your provider based on location."}
                </p>
            </div>
            
            <div className="flex-1">
                {step === 1 && (
                <div className="space-y-8">
                    <button 
                        onClick={handleAutoLocate} 
                        disabled={locating} 
                        className="w-full flex items-center justify-center gap-4 p-6 bg-[#EAF3EF] text-[#2D8075] rounded-[24px] border border-[#D5E6DC] hover:shadow-xl hover:shadow-[#2D8075]/10 hover:-translate-y-1 transition duration-400 font-black text-lg disabled:opacity-70 group"
                    >
                        {locating ? <Loader2 size={24} className="animate-spin" /> : <MapPin size={24} className="group-hover:scale-110 transition-transform" />} 
                        {locating ? "Geolocating..." : "Auto-detect Location"}
                    </button>

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-[#EAE7E2]"></div>
                        <span className="flex-shrink-0 mx-6 text-[#9C9994] text-[10px] font-black tracking-[0.2em] uppercase">Manual Selection</span>
                        <div className="flex-grow border-t border-[#EAE7E2]"></div>
                    </div>
                    
                    <div className="relative group">
                        <input 
                            type="text" 
                            value={citySearch} 
                            onFocus={() => setShowDropdown(true)} 
                            onChange={e => {setCitySearch(e.target.value); setShowDropdown(true);}} 
                            className="w-full bg-[#FDFBF7] p-6 rounded-[24px] outline-none border-2 border-[#EAE7E2] focus:border-brand-primary focus:ring-4 ring-brand-primary/5 shadow-sm font-bold text-[#0A2F29] text-xl transition-all" 
                            placeholder="Start typing your city..." 
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[#9A9894]">
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 10, ease: "linear" }}>
                                <Zap size={24} className="opacity-20" />
                            </motion.div>
                        </div>
                        
                        <AnimatePresence>
                        {showDropdown && filteredCities.length > 0 && (
                            <motion.ul 
                                initial={{ opacity: 0, y: -10 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                exit={{ opacity: 0, y: -10 }} 
                                className="absolute top-[105%] left-0 w-full bg-white border border-[#EAE7E2] rounded-[24px] shadow-2xl max-h-[220px] overflow-y-auto z-50 p-3 custom-scrollbar"
                            >
                                {filteredCities.map(c => (
                                    <li key={c} onClick={() => {setCitySearch(c); setShowDropdown(false);}} className="p-4 hover:bg-[#FDFBF7] rounded-[16px] cursor-pointer font-bold text-[#6B6863] hover:text-[#0A2F29] transition-all flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-brand-primary/40 group-hover:bg-brand-primary transition-colors" />
                                        {c}
                                    </li>
                                ))}
                            </motion.ul>
                        )}
                        </AnimatePresence>
                    </div>
                </div>
                )}

                {step === 2 && (
                <div className="space-y-12">
                    <div>
                    <label className="mb-5 block font-black text-[#0A2F29] text-[14px] uppercase tracking-wider ml-1">Configuration</label>
                    <div className="grid grid-cols-2 gap-4">
                        {HOME_TYPES.map(t => (
                            <button 
                                key={t.value} 
                                onClick={() => setHomeType(t.value)} 
                                className={`group p-6 rounded-[24px] border-2 font-black transition-all duration-400 text-left flex flex-col gap-3 ${homeType === t.value ? 'bg-brand-primary border-brand-primary text-white shadow-xl shadow-brand-primary/20' : 'bg-white border-[#EAE7E2] text-[#6B6863] hover:border-brand-primary/40 hover:bg-[#FDFBF7]'}`}
                            >
                                <div className={`p-2.5 rounded-xl w-fit ${homeType === t.value ? 'bg-white/20' : 'bg-[#F3EBE1] text-[#9C9994]'}`}>
                                    <t.icon size={20} />
                                </div>
                                <div>
                                    <p className={`text-[10px] uppercase tracking-wide mb-0.5 ${homeType === t.value ? 'text-white/60' : 'text-[#8A8680]'}`}>{t.label}</p>
                                    <p className="text-lg">{t.value}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                    </div>
                    
                    <style>{`
                        .custom-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 28px; height: 28px; border-radius: 50%; background: #0A2F29; border: 6px solid #FFF; cursor: pointer; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);}
                        .custom-slider::-webkit-slider-thumb:hover { transform: scale(1.1); }
                        .custom-slider-accent::-webkit-slider-thumb { background: #CA5742; }
                    `}</style>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-[#FDFBF7] p-8 rounded-[32px] border border-[#EAE7E2] flex flex-col justify-between min-h-[160px]">
                            <label className="flex items-center justify-between font-black text-[#8A8680] text-[11px] uppercase tracking-wider mb-6">
                                Family Size <span className="bg-brand-primary text-white px-3 py-1 rounded-full text-xs font-bold">{familySize}</span>
                            </label>
                            <div className="flex items-end gap-1 mb-8">
                                <span className="text-4xl font-black text-[#0A2F29] tracking-tighter">{familySize}</span>
                                <span className="text-sm font-bold text-[#9A9894] mb-1.5 ml-1">Members</span>
                            </div>
                            <input type="range" min="1" max="10" value={familySize} onChange={e => setFamilySize(parseInt(e.target.value))} className="custom-slider w-full h-2 bg-[#D5E6DC] rounded-full appearance-none cursor-pointer outline-none ring-offset-4 focus:ring-4 ring-brand-primary/5" />
                        </div>
                        
                        <div className="bg-[#FDFBF7] p-8 rounded-[32px] border border-[#EAE7E2] flex flex-col justify-between min-h-[160px]">
                            <label className="flex items-center justify-between font-black text-[#8A8680] text-[11px] uppercase tracking-wider mb-6">
                                Budget Goal <span className="bg-[#CA5742] text-white px-3 py-1 rounded-full text-xs font-bold">₹{budget.toLocaleString()}</span>
                            </label>
                            <div className="flex items-end gap-1 mb-8">
                                <span className="text-4xl font-black text-[#0A2F29] tracking-tighter">₹{budget.toLocaleString()}</span>
                                <span className="text-sm font-bold text-[#9A9894] mb-1.5 ml-1">/ month</span>
                            </div>
                            <input type="range" min="500" max="15000" step="500" value={budget} onChange={e => setBudget(parseInt(e.target.value))} className="custom-slider custom-slider-accent w-full h-2 bg-[#F2DFCE] rounded-full appearance-none cursor-pointer outline-none ring-offset-4 focus:ring-4 ring-accent/5" />
                        </div>
                    </div>
                </div>
                )}

                {step === 3 && (
                <div className="space-y-6">
                    <div className="bg-[#EAF3EF] p-5 rounded-[24px] border border-[#D5E6DC] flex items-center gap-4 mb-2">
                         <div className="bg-brand-primary text-white p-2.5 rounded-xl shadow-lg shadow-brand-primary/20"><Zap size={20} /></div>
                         <p className="text-[13px] font-bold text-[#2D8075] leading-snug">Tracking your heavy consumers allows our AI to pinpoint leakage points in your billing cycle.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-3 custom-scrollbar pb-4">
                    {APPLIANCES.map(app => {
                        const cnt = appliances[app.id];
                        return (
                            <div key={app.id} className={`group flex flex-col gap-5 p-6 border-2 rounded-[28px] transition-all duration-400 ${cnt > 0 ? 'border-brand-primary bg-[#FDFBF7] shadow-lg shadow-brand-primary/5' : 'border-[#EAE7E2] hover:border-brand-primary/30'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`p-4 rounded-[20px] transition-all duration-500 ${cnt > 0 ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/30 rotate-6' : 'bg-[#F3EBE1] text-[#9A9894]'}`}><app.icon size={24} /></div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${cnt > 0 ? 'text-brand-primary' : 'text-[#8A8680]'}`}>Consumer</p>
                                        <p className={`font-black text-lg truncate ${cnt > 0 ? 'text-[#0A2F29]' : 'text-[#6B6863]'}`}>{app.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between bg-white rounded-[18px] p-2 border border-[#EAE7E2] shadow-sm">
                                    <button onClick={() => handleApplianceChange(app.id, -1)} className="w-11 h-11 bg-[#FDFBF7] rounded-[14px] text-[#8A8680] hover:text-[#CA5742] hover:bg-[#F2DFCE]/20 transition-all flex items-center justify-center border border-transparent hover:border-[#F2DFCE]"><Minus size={18} strokeWidth={3}/></button>
                                    <span className="font-black text-2xl w-10 text-center text-[#0A2F29] tabular-nums">{cnt || '0'}</span>
                                    <button onClick={() => handleApplianceChange(app.id, 1)} className="w-11 h-11 bg-[#FDFBF7] rounded-[14px] text-[#8A8680] hover:text-brand-primary hover:bg-brand-primary/5 transition-all flex items-center justify-center border border-transparent hover:border-brand-primary/40"><Plus size={18} strokeWidth={3}/></button>
                                </div>
                            </div>
                        );
                    })}
                    </div>
                </div>
                )}

                {step === 4 && (
                <div className="space-y-8 flex flex-col">
                    <div className="bg-[#FDFBF7] p-8 rounded-[36px] border border-[#EAE7E2] relative overflow-hidden group">
                        <div className="absolute right-[-40px] top-[-40px] opacity-[0.03] text-[#0A2F29] group-hover:rotate-12 transition-transform duration-1000">
                             <Zap size={200} />
                        </div>
                        
                        <p className="text-[11px] font-black text-[#8A8680] mb-5 uppercase tracking-[0.2em] relative z-10">Detected Node</p>
                        <div className="relative z-10">
                            <select 
                                value={provider} 
                                onChange={e => setProvider(e.target.value)} 
                                className="w-full bg-white px-7 py-6 rounded-[24px] outline-none border-2 border-[#EAE7E2] focus:border-brand-primary focus:ring-4 ring-brand-primary/5 shadow-md font-black text-[#0A2F29] text-xl appearance-none cursor-pointer pr-14"
                            >
                                <option value="BESCOM">BESCOM (Karnataka)</option>
                                <option value="MSEDCL">MSEDCL (Maharashtra)</option>
                                <option value="BSES">BSES (Delhi)</option>
                                <option value="TNEB">TNEB (Tamil Nadu)</option>
                                <option value="TSSPDCL">TSSPDCL (Telangana)</option>
                                <option value="TORRENT">Torrent Power (Gujarat)</option>
                                <option value="UPPCL">UPPCL (Uttar Pradesh)</option>
                                <option value="CESC">CESC (West Bengal)</option>
                                <option value="Other">Other Provider...</option>
                            </select>
                            <div className="absolute right-7 top-1/2 -translate-y-1/2 pointer-events-none text-brand-primary">
                                <Info size={24} />
                            </div>
                        </div>
                    </div>

                    <AnimatePresence>
                        {provider === "Other" && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                <label className="block text-[11px] font-black mb-3 mt-4 text-[#8A8680] uppercase tracking-widest ml-2">Manual Provider Entry</label>
                                <input 
                                    type="text" 
                                    value={manualProvider} 
                                    onChange={e => setManualProvider(e.target.value)} 
                                    className="w-full bg-white p-6 rounded-[24px] outline-none border-2 border-[#EAE7E2] focus:border-brand-primary ring-brand-primary/5 shadow-md font-black text-xl text-[#0A2F29]" 
                                    placeholder="e.g. Adani Electricity" 
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-8 bg-gradient-to-br from-[#EAF3EF] to-[#FDFBF7] border-2 border-brand-primary/20 rounded-[36px] mt-4 flex items-start gap-6"
                    >
                         <div className="w-14 h-14 bg-brand-primary rounded-[20px] flex items-center justify-center text-white shadow-xl shadow-brand-primary/20 shrink-0">
                             <Check size={28} strokeWidth={3} />
                         </div>
                         <div>
                            <p className="text-[#0A2F29] font-black text-xl mb-2 tracking-tight">Smart Grid Ready</p>
                            <p className="text-[#6B6863] font-medium leading-[1.6]">
                                VoltIQ is successfully connected to <span className="text-brand-primary font-black">{provider === 'Other' ? manualProvider || 'the grid' : provider}</span>'s 2026 progressive slab tariffs. 
                            </p>
                         </div>
                    </motion.div>
                </div>
                )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Action Bar */}
        <div className="flex items-center justify-between mt-12 pt-10 border-t border-[#F3EBE1] relative z-10">
          <button 
            onClick={() => setStep(s => Math.max(1, s - 1))} 
            className={`px-10 py-5 rounded-[20px] font-black text-[#8A8680] hover:text-[#0A2F29] border border-[#EAE7E2] hover:border-[#0A2F29]/20 hover:bg-[#FDFBF7] transition-all duration-300 ${step === 1 ? 'opacity-0 pointer-events-none' : 'shadow-sm active:scale-95'}`}
          >
            Previous
          </button>
          
          <button 
            onClick={() => step < 4 ? setStep(s => s + 1) : handleComplete()} 
            className="group px-12 py-5 rounded-[22px] bg-[#0A2F29] text-white hover:bg-brand-dark shadow-2xl shadow-brand-dark/20 hover:shadow-brand-primary/30 hover:-translate-y-1 active:scale-95 transition-all duration-300 font-extrabold text-xl flex items-center gap-4"
          >
            {step < 4 ? 'Continue' : 'Launch Dashboard'} 
            {step < 4 ? <ArrowRight size={22} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" /> : <Zap size={22} className="fill-white" />}
          </button>
        </div>
      </div>

      <p className="mt-10 text-[#9C9994] font-bold text-xs uppercase tracking-[0.3em]">Precision Engineering for Sustainablity</p>
    </div>
  );
}
