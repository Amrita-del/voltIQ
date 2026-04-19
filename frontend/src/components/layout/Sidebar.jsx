import React, { useState } from 'react';
import { Home, Activity, Leaf, Target, MessageCircle, ScanLine, Settings, Zap, User, ChevronRight } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { name: 'Dashboard',        icon: Home,          path: '/dashboard' },
  { name: 'Device Health',    icon: Activity,      path: '/health'    },
  { name: 'Carbon Tracker',   icon: Leaf,          path: '/carbon'    },
  { name: 'Budget Optimizer', icon: Target,        path: '/budget'    },
  { name: 'Volt Chat',        icon: MessageCircle, path: '/chat'      },
  { name: 'Quick Scan',       icon: ScanLine,      path: '/scanner'   },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();

  return (
    <aside
      className="relative flex flex-col h-screen bg-surface border-r border-border transition-all duration-300 ease-in-out shrink-0"
      style={{ width: collapsed ? '72px' : '232px', zIndex: 50 }}
    >
      {/* ─── Brand row ─── */}
      <div className="flex items-center gap-3 px-[18px] pt-5 pb-4 border-b border-border/60 overflow-hidden">
        <div className="shrink-0 w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center shadow-sm shadow-brand-primary/30">
          <Zap size={15} className="text-white" fill="white" />
        </div>
        <span
          className="font-extrabold text-[17px] text-brand-primary tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300"
          style={{ fontFamily: 'Plus Jakarta Sans', opacity: collapsed ? 0 : 1, maxWidth: collapsed ? 0 : 160 }}
        >
          VoltIQ
        </span>
      </div>

      {/* ─── Navigation ─── */}
      <nav className="flex flex-col gap-0.5 px-2 mt-3 flex-1">
        {navItems.map((n) => {
          const Icon = n.icon;
          return (
            <NavLink
              key={n.name}
              to={n.path}
              title={collapsed ? n.name : undefined}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-2.5 py-2 rounded-xl transition-all duration-150 group overflow-hidden whitespace-nowrap text-[13.5px] font-medium
                 ${isActive
                   ? 'bg-brand-primary/10 text-brand-primary font-semibold'
                   : 'text-text-secondary hover:bg-raised hover:text-text-primary'}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-brand-primary rounded-r-full" />
                  )}
                  <Icon size={17} className="shrink-0 ml-0.5" />
                  <span
                    className="whitespace-nowrap overflow-hidden transition-all duration-300"
                    style={{ opacity: collapsed ? 0 : 1, maxWidth: collapsed ? 0 : 200 }}
                  >
                    {n.name}
                  </span>
                  {/* Tooltip in collapsed mode */}
                  {collapsed && (
                    <span className="pointer-events-none fixed left-[76px] bg-[#1C1C1E] text-white text-xs font-bold px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-[999]">
                      {n.name}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ─── Bottom section ─── */}
      <div className="px-2 pb-4 border-t border-border/60 pt-2.5 space-y-0.5">
        <NavLink
          to="/profile"
          title={collapsed ? 'Settings' : undefined}
          className={({ isActive }) =>
            `relative flex items-center gap-3 px-2.5 py-2 rounded-xl transition-all duration-150 group overflow-hidden whitespace-nowrap text-[13.5px] font-medium
             ${isActive ? 'bg-brand-primary/10 text-brand-primary font-semibold' : 'text-text-secondary hover:bg-raised hover:text-text-primary'}`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-brand-primary rounded-r-full" />}
              <Settings size={17} className="shrink-0 ml-0.5" />
              <span
                className="whitespace-nowrap overflow-hidden transition-all duration-300"
                style={{ opacity: collapsed ? 0 : 1, maxWidth: collapsed ? 0 : 200 }}
              >
                Settings
              </span>
              {collapsed && (
                <span className="pointer-events-none fixed left-[76px] bg-[#1C1C1E] text-white text-xs font-bold px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-[999]">
                  Settings
                </span>
              )}
            </>
          )}
        </NavLink>

        {/* User chip */}
        {!collapsed && (
          <button
            onClick={() => navigate('/profile')}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-raised transition text-left mt-1"
          >
            <div className="w-6 h-6 rounded-full bg-brand-primary/15 flex items-center justify-center shrink-0">
              <User size={13} className="text-brand-primary" />
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-[12px] font-bold text-text-primary truncate leading-tight">{user?.name || 'User'}</p>
              <p className="text-[10px] text-text-muted truncate">{user?.email || ''}</p>
            </div>
          </button>
        )}
      </div>

      {/* ─── Collapse toggle button ─── */}
      <button
        onClick={() => setCollapsed(c => !c)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="
          absolute -right-3 top-[68px]
          w-6 h-6
          bg-surface border border-border rounded-full
          flex items-center justify-center
          shadow-[0_2px_8px_rgba(0,0,0,0.10)]
          hover:bg-brand-primary hover:border-brand-primary hover:text-white
          text-text-muted
          transition-all duration-200
          z-50
        "
      >
        {/* Chevron flips direction with rotation */}
        <ChevronRight
          size={12}
          className="transition-transform duration-300"
          style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)' }}
        />
      </button>
    </aside>
  );
}
