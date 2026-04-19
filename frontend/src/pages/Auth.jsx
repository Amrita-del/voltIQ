import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Zap, ShieldCheck, Mail, Lock, User, Activity } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorText, setErrorText] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorText('');
    const endpoint = isLogin ? '/auth/signin' : '/auth/signup';
    try {
        const payload = isLogin ? {email, password} : {name, email, password};
        const res = await fetch(`http://localhost:8000${endpoint}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) {
            setErrorText(data.detail || 'Authentication failed');
            return;
        }
        login(data.token, data.has_profile, { id: data.id, name: data.name || name, email: data.email || email }, data.profile, !isLogin);
        navigate((data.has_profile || isLogin) ? '/dashboard' : '/onboarding');
    } catch(err) {
        setErrorText('Server connection failed. Is FastAPI running?');
    }
  };

  return (
    <div className="min-h-screen flex bg-[#FDFBF7] relative overflow-hidden font-sans selection:bg-brand-primary/20">
      
      {/* ─── LEFT BRAND PANEL ─── */}
      <motion.div 
        initial={{ x: -20, opacity: 0 }} 
        animate={{ x: 0, opacity: 1 }} 
        transition={{ duration: 0.8, ease: "easeOut" }} 
        className="hidden lg:flex w-[46%] bg-[#0A2F29] p-16 flex-col justify-between text-white relative overflow-hidden"
      >
         {/* Decorative elements */}
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-primary opacity-10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
         <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent opacity-5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4"></div>
         <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px'}}></div>
         
         <div className="relative z-10">
            <div className="flex items-center gap-3.5 group cursor-default">
                <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl text-white shadow-2xl border border-white/10 group-hover:scale-110 transition-transform duration-500">
                    <Zap size={28} strokeWidth={2.5} className="fill-white" />
                </div>
                <h1 className="text-3xl font-black tracking-tighter text-white" style={{ fontFamily: 'Plus Jakarta Sans' }}>VoltIQ</h1>
            </div>
         </div>
         
         <div className="relative z-10 space-y-8">
            <div className="space-y-5">
                <h2 className="text-[56px] font-black leading-[1.05] tracking-tight text-white mb-2" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                    Intelligent energy <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-light to-white/60">analytics</span> for the modern home.
                </h2>
                <p className="text-xl font-medium text-white/70 max-w-md leading-relaxed">
                    Automate your savings with AI-driven insights and hyper-local tariff mapping for every major Indian city.
                </p>
            </div>

         </div>

         <div className="relative z-10 pt-10">
            <p className="text-xs font-bold text-white/30 uppercase tracking-[0.3em]">© 2026 VoltIQ Energy Systems</p>
         </div>
      </motion.div>

      {/* ─── RIGHT AUTH PANEL ─── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#FDFBF7] relative">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6zM36 4V0h-2v4h-4v2h4v4h2V6h4V4h-4z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
        
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className="w-full max-w-[420px] relative z-10"
        >
          {/* Mobile Only Header */}
          <div className="flex lg:hidden justify-center items-center gap-3.5 mb-14">
             <div className="bg-[#0A2F29] p-3 rounded-2xl text-white shadow-2xl"><Zap size={28} strokeWidth={2.5} className="fill-white" /></div>
             <h1 className="text-3xl font-black tracking-tighter text-[#0A2F29]" style={{ fontFamily: 'Plus Jakarta Sans' }}>VoltIQ</h1>
          </div>

          <div className="mb-12 text-center lg:text-left relative">
              <h2 className="text-[42px] font-black mb-1.5 text-[#0A2F29] tracking-tighter leading-none" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                {isLogin ? 'Welcome back' : 'Create Account'}
              </h2>
              <p className="text-[#5E5B56] font-semibold text-lg opacity-80">
                {isLogin ? 'Enter your credentials to access the grid.' : 'Join the mission for smarter sustainable energy.'}
              </p>
          </div>

          <div className="flex bg-[#E8DFD2] rounded-[22px] p-2 mb-10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] border border-[#D5CFC6]">
            <button 
                onClick={() => setIsLogin(true)} 
                className={`flex-1 py-4 text-sm font-black rounded-[16px] transition-all duration-500 ${isLogin ? 'bg-white text-[#0A2F29] shadow-[0_8px_16px_-4px_rgba(0,0,0,0.12)] ring-1 ring-[#D5CFC6]' : 'text-[#6B6863] hover:text-[#0A2F29]'}`}
            >
                Sign In
            </button>
            <button 
                onClick={() => setIsLogin(false)} 
                className={`flex-1 py-4 text-sm font-black rounded-[16px] transition-all duration-500 ${!isLogin ? 'bg-white text-[#0A2F29] shadow-[0_8px_16px_-4px_rgba(0,0,0,0.12)] ring-1 ring-[#D5CFC6]' : 'text-[#6B6863] hover:text-[#0A2F29]'}`}
            >
                Sign Up
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.form 
              key={isLogin ? 'login' : 'signup'}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              onSubmit={handleSubmit} 
              className="space-y-6"
            >
              {!isLogin && (
                <div className="group">
                  <label className="block text-[11px] font-black uppercase tracking-[0.25em] mb-2.5 text-[#0A2F29] ml-1 group-focus-within:text-brand-primary transition-colors">Full Name</label>
                  <div className="relative">
                    <User size={19} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#6B6863] group-focus-within:text-brand-primary transition-colors" />
                    <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        required 
                        style={{ color: '#1A1A1A' }}
                        className="w-full bg-white border-2 border-[#D5CFC6] rounded-[22px] p-5 pl-14 outline-none focus:border-brand-primary focus:ring-[6px] ring-brand-primary/5 transition-all font-bold text-base shadow-[0_2px_8px_rgba(0,0,0,0.06)] placeholder:text-[#7A7772]" 
                        placeholder="Abhinav Sharma" 
                    />
                  </div>
                </div>
              )}
              
              <div className="group">
                <label className="block text-[11px] font-black uppercase tracking-[0.25em] mb-2.5 text-[#0A2F29] ml-1 group-focus-within:text-brand-primary transition-colors">Email Address</label>
                <div className="relative">
                    <Mail size={19} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#6B6863] group-focus-within:text-brand-primary transition-colors" />
                    <input 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required 
                        style={{ color: '#1A1A1A' }}
                        className="w-full bg-white border-2 border-[#D5CFC6] rounded-[22px] p-5 pl-14 outline-none focus:border-brand-primary focus:ring-[6px] ring-brand-primary/5 transition-all font-bold text-base shadow-[0_2px_8px_rgba(0,0,0,0.06)] placeholder:text-[#7A7772]" 
                        placeholder="abhinav@example.com" 
                    />
                </div>
              </div>

              <div className="group">
                <label className="block text-[11px] font-black uppercase tracking-[0.25em] mb-2.5 text-[#0A2F29] ml-1 group-focus-within:text-brand-primary transition-colors">Password</label>
                <div className="relative">
                    <Lock size={19} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#6B6863] group-focus-within:text-brand-primary transition-colors" />
                    <input 
                        type="password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                        style={{ color: '#1A1A1A' }}
                        className="w-full bg-white border-2 border-[#D5CFC6] rounded-[22px] p-5 pl-14 outline-none focus:border-brand-primary focus:ring-[6px] ring-brand-primary/5 transition-all font-bold text-base shadow-[0_2px_8px_rgba(0,0,0,0.06)] placeholder:text-[#7A7772]" 
                        placeholder="••••••••" 
                    />
                </div>
              </div>
              
              {errorText && (
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    className="text-negative font-bold text-[13px] p-4 bg-negative-light/40 rounded-2xl border border-negative/10 text-center shadow-sm"
                >
                    {errorText}
                </motion.div>
              )}

              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-[#0A2F29] to-[#155F57] text-white rounded-[24px] p-5 font-black text-lg hover:to-[#1a7066] transition-all duration-300 flex items-center justify-center gap-4 mt-8 shadow-[0_20px_40px_-12px_rgba(10,47,41,0.3)] hover:shadow-[0_24px_48px_-12px_rgba(10,47,41,0.4)] hover:-translate-y-1 active:scale-[0.97]"
              >
                {isLogin ? 'Enter Dashboard' : 'Join VoltIQ'} <ArrowRight size={20} strokeWidth={3} />
              </button>
            </motion.form>
          </AnimatePresence>

          <footer className="mt-16 flex flex-col items-center justify-center gap-4">
             <div className="flex items-center gap-2.5 text-[#9A9894] text-[11px] font-black uppercase tracking-[0.25em] bg-white px-6 py-3 rounded-full border border-[#EAE7E2] shadow-sm">
                 <ShieldCheck size={16} className="text-positive" /> 256-bit AES Encryption
             </div>
          </footer>
        </motion.div>
      </div>
    </div>
  );
}
