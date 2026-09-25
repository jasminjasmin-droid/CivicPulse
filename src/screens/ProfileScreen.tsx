import React from 'react';
import {
  User,
  Shield,
  Award,
  CheckCircle2,
  Clock,
  Sparkles,
  Settings,
  Moon,
  Sun,
  Globe,
  Zap,
  RotateCcw,
  LogOut,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  Download,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Language } from '../types';

export const ProfileScreen: React.FC = () => {
  const {
    currentUser,
    complaints,
    language,
    setLanguage,
    t,
    theme,
    toggleTheme,
    isDemoMode,
    toggleDemoMode,
    resetAllDataToDefaults,
    logoutUser,
  } = useApp();

  const userComplaints = complaints.filter(
    (c) => c.citizenId === currentUser.id || currentUser.role !== 'citizen'
  );
  const submittedCount = userComplaints.length;
  const resolvedCount = userComplaints.filter((c) =>
    ['Resolved', 'Closed'].includes(c.status)
  ).length;
  const pendingCount = userComplaints.filter((c) =>
    ['Submitted', 'Assigned', 'In Progress', 'Escalated'].includes(c.status)
  ).length;

  const LANGUAGES: { code: Language; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-28 max-w-2xl mx-auto">
      {/* Profile Bio Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-[#CFD8DC]/80 dark:border-slate-700 shadow-soft-sm">
        <div className="flex items-center gap-4">
          <img
            src={
              currentUser.avatarUrl ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
            }
            alt={currentUser.name}
            className="w-18 h-18 rounded-2xl object-cover ring-4 ring-blue-100 dark:ring-blue-900 shadow-md"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-black text-lg text-[#263238] dark:text-white truncate">
                {currentUser.name}
              </h2>
              <Shield className="w-4 h-4 text-[#1565C0] fill-[#1565C0]/20 shrink-0" />
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {currentUser.designation || 'Verified Citizen Account'}
            </p>

            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate">{currentUser.ward || 'T. Nagar, Chennai'}</span>
            </div>
          </div>
        </div>

        {/* Contact info pills */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentUser.email}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentUser.phone}</span>
          </div>
        </div>
      </div>

      {/* Citizen Impact Metrics */}
      <div className="grid grid-cols-4 gap-2.5 text-center">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-[#CFD8DC]/80 dark:border-slate-700 shadow-soft-sm">
          <div className="text-lg font-black text-[#263238] dark:text-white">{submittedCount}</div>
          <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Reported</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-[#CFD8DC]/80 dark:border-slate-700 shadow-soft-sm">
          <div className="text-lg font-black text-[#FB8C00]">{pendingCount}</div>
          <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Pending</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-[#CFD8DC]/80 dark:border-slate-700 shadow-soft-sm">
          <div className="text-lg font-black text-[#43A047]">{resolvedCount}</div>
          <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Resolved</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-[#CFD8DC]/80 dark:border-slate-700 shadow-soft-sm">
          <div className="text-lg font-black text-[#1565C0] dark:text-blue-400">98%</div>
          <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Trust Score</div>
        </div>
      </div>

      {/* Multi-Language Selector (Requirement 3: English, Tamil, Hindi) */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-[#CFD8DC]/80 dark:border-slate-700 shadow-soft-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#1565C0] dark:text-blue-400 uppercase tracking-wider">
          <Globe className="w-4 h-4" />
          <span>{t('languageSetting')}</span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 active:scale-95 ${
                language === l.code
                  ? 'bg-blue-50 dark:bg-blue-950/80 border-[#1565C0] shadow-soft-sm text-[#1565C0] dark:text-blue-300 font-bold ring-2 ring-[#1565C0]/20'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-300'
              }`}
            >
              <span className="text-sm font-extrabold">{l.native}</span>
              <span className="text-[10px] text-slate-400">{l.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Preferences & System Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-[#CFD8DC]/80 dark:border-slate-700 shadow-soft-sm space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Preferences & System Settings
        </h3>

        {/* Theme Toggle */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-[#263238] dark:text-slate-200">
            {theme === 'light' ? <Sun className="w-4 h-4 text-[#FB8C00]" /> : <Moon className="w-4 h-4 text-blue-400" />}
            <span>{t('themeSetting')}</span>
          </div>
          <button
            onClick={toggleTheme}
            className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-[#1565C0] dark:text-blue-400 shadow-2xs"
          >
            {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        {/* Demo Fast Mode Toggle */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-[#263238] dark:text-slate-200">
            <Zap className="w-4 h-4 text-[#FFB300]" />
            <span>{t('demoModeSetting')}</span>
          </div>
          <button
            onClick={toggleDemoMode}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs ${
              isDemoMode
                ? 'bg-[#FB8C00] text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
            }`}
          >
            {isDemoMode ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {/* Reset Database Button */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-[#263238] dark:text-slate-200">
            <RotateCcw className="w-4 h-4 text-[#E53935]" />
            <span>{t('resetDb')}</span>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Reset all demo complaints and state back to defaults?')) {
                resetAllDataToDefaults();
              }
            }}
            className="px-3.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950 text-[#E53935] border border-rose-200 dark:border-rose-900 text-xs font-bold hover:bg-rose-100"
          >
            Reset DB
          </button>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={logoutUser}
        className="w-full py-3.5 rounded-2xl bg-slate-200 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-200 hover:text-[#E53935] font-bold text-xs border border-slate-300 dark:border-slate-700 transition flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        <span>{t('logout')}</span>
      </button>
    </div>
  );
};
