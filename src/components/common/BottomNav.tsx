import React from 'react';
import { Home, PlusCircle, Search, Bot, User, LayoutDashboard } from 'lucide-react';
import { useApp, AppTab } from '../../context/AppContext';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, currentRole, t } = useApp();

  const isAuthority = currentRole !== 'citizen';

  const navItems = [
    {
      id: 'home' as AppTab,
      label: t('navHome'),
      icon: Home,
    },
    {
      id: 'report' as AppTab,
      label: t('navReport'),
      icon: PlusCircle,
      isPrimary: true,
    },
    {
      id: 'track' as AppTab,
      label: t('navTrack'),
      icon: Search,
    },
    {
      id: 'ai' as AppTab,
      label: t('navAi'),
      icon: Bot,
    },
    isAuthority
      ? {
          id: (currentRole === 'super_admin' ? 'super_admin' : 'authority_dash') as AppTab,
          label: t('navDashboard'),
          icon: LayoutDashboard,
          isSpecial: true,
        }
      : {
          id: 'profile' as AppTab,
          label: t('navProfile'),
          icon: User,
        },
  ];

  return (
    <nav className="sticky bottom-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-[#CFD8DC]/70 dark:border-slate-800 px-3 py-2 transition-colors">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.isPrimary) {
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="relative -top-4 flex flex-col items-center group focus:outline-none"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1565C0] via-[#1976D2] to-[#26A69A] text-white flex items-center justify-center shadow-soft-lg group-hover:scale-105 group-active:scale-95 transition-all">
                  <Icon className="w-7 h-7 stroke-[2.2]" />
                </div>
                <span className="text-[10px] font-extrabold text-[#1565C0] dark:text-blue-400 mt-0.5">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center py-1 px-3 rounded-2xl transition focus:outline-none relative group"
            >
              {/* MD3 Active Indicator Pill */}
              <div
                className={`flex items-center justify-center w-12 h-7 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-100 dark:bg-blue-950 text-[#1565C0] dark:text-blue-300'
                    : 'text-slate-500 dark:text-slate-400 hover:text-[#263238] dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              </div>
              <span
                className={`text-[10px] mt-0.5 transition-colors ${
                  isActive
                    ? 'text-[#1565C0] dark:text-blue-300 font-bold'
                    : 'text-slate-500 dark:text-slate-400 font-medium'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
