import React, { useEffect, useState } from 'react';
import {
  User as UserIcon,
  Shield,
  Mail,
  LogOut,
  Moon,
  Sun,
  Globe,
  CheckCircle2,
  Clock,
  FolderOpen,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api, ApiUser } from '../services/api';
import { Language } from '../types';

export const ProfileScreen: React.FC = () => {
  const {
    apiUser,
    citizenStats,
    language,
    setLanguage,
    t,
    theme,
    toggleTheme,
    logoutUser,
  } = useApp();

  const [profile, setProfile] = useState<ApiUser | null>(apiUser);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchMe = async () => {
      setIsLoading(true);
      try {
        const me = await api.auth.getMe();
        setProfile(me);
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMe();
  }, []);

  const LANGUAGES: { code: Language; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-28 max-w-2xl mx-auto">
      {/* Profile Bio Card (GET /me) */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 shadow-soft-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#1565C0] via-[#1976D2] to-[#26A69A] text-white flex items-center justify-center font-black text-2xl shadow-md ring-4 ring-blue-100 dark:ring-blue-900 shrink-0">
            {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-black text-lg text-slate-900 dark:text-white truncate">
                {profile?.name || 'Citizen'}
              </h1>
              <Shield className="w-4 h-4 text-[#1565C0] fill-[#1565C0]/20 shrink-0" />
            </div>

            <div className="flex items-center gap-2 mt-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] uppercase tracking-wider border border-emerald-200 dark:border-emerald-800">
                {profile?.role || 'Citizen'}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                ID #{profile?.id || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Contact info pills */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">{profile?.email || 'citizen@civicpulse.gov.in'}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
            <Shield className="w-3.5 h-3.5 text-[#1565C0]" />
            <span>Official JWT Authenticated Session</span>
          </div>
        </div>
      </div>

      {/* Citizen Grievance Overview Metrics */}
      <div className="grid grid-cols-4 gap-2.5 text-center">
        <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-soft-sm">
          <div className="text-lg font-black text-slate-900 dark:text-white">
            {citizenStats?.total ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Total</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-soft-sm">
          <div className="text-lg font-black text-amber-600 dark:text-amber-400">
            {citizenStats?.pending ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Pending</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-soft-sm">
          <div className="text-lg font-black text-sky-600 dark:text-sky-400">
            {citizenStats?.in_progress ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Active</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-soft-sm">
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
            {citizenStats?.resolved ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Resolved</div>
        </div>
      </div>

      {/* Language Selector */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-soft-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#1565C0] dark:text-blue-400 uppercase tracking-wider">
          <Globe className="w-4 h-4" />
          <span>Language Preferences</span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 active:scale-95 cursor-pointer ${
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

      {/* Theme Setting */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-soft-sm">
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
            {theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Moon className="w-4 h-4 text-blue-400" />
            )}
            <span>Appearance Theme</span>
          </div>
          <button
            onClick={toggleTheme}
            className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-[#1565C0] dark:text-blue-400 shadow-2xs cursor-pointer"
          >
            {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </div>

      {/* LOGOUT (Requirement 11) */}
      <button
        onClick={logoutUser}
        className="w-full py-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs border border-rose-200 dark:border-rose-800 transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
      >
        <LogOut className="w-4 h-4" />
        <span>Log Out of CivicPulse</span>
      </button>
    </div>
  );
};
