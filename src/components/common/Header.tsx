import React, { useState } from 'react';
import {
  Bell,
  Sun,
  Moon,
  Globe,
  Shield,
  CheckCircle2,
  Clock,
  ArrowRight,
  X,
  ChevronDown,
  CheckCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ROLE_DEFINITIONS } from '../../data/mockData';
import { Language } from '../../types';

export const Header: React.FC<{ onOpenRoleSwitcher: () => void }> = ({ onOpenRoleSwitcher }) => {
  const {
    currentRole,
    currentUser,
    backendNotifications,
    unreadNotificationsCount,
    markBackendNotificationAsRead,
    markAllBackendNotificationsAsRead,
    refreshNotifications,
    language,
    setLanguage,
    t,
    theme,
    toggleTheme,
    setSelectedComplaintId,
    setActiveTab,
    apiUser,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const roleInfo = ROLE_DEFINITIONS[currentRole] || ROLE_DEFINITIONS.citizen;

  const handleNotificationClick = async (complaintId?: number | null, notifId?: number) => {
    if (notifId) {
      await markBackendNotificationAsRead(notifId);
    }
    if (complaintId) {
      setSelectedComplaintId(String(complaintId));
      setActiveTab('track');
    }
    setShowNotifications(false);
  };

  const LANGUAGES: { code: Language; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-[#CFD8DC]/70 dark:border-slate-800 px-4 py-2.5 transition-colors">
      <div className="flex items-center justify-between">
        {/* Left: Emblem & App Branding */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#1565C0] via-[#1976D2] to-[#26A69A] text-white shadow-md shadow-[#1565C0]/25">
            <Shield className="w-5 h-5 fill-white/20 text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#FFB300] border-2 border-white dark:border-slate-900 rounded-full"></span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-[#263238] dark:text-white leading-none">
                CivicPulse
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#1565C0] dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
                GOV.IN
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Smart Governance & Grievances
            </p>
          </div>
        </div>

        {/* Right: Role Chip + Lang Switcher + Actions */}
        <div className="flex items-center gap-1.5">
          {/* Quick Active Role Pill */}
          <button
            onClick={onOpenRoleSwitcher}
            title="User Role Status"
            className="flex items-center gap-1 pl-2 pr-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition active:scale-95 shadow-2xs"
          >
            <span className="w-2 h-2 rounded-full bg-[#1565C0] dark:bg-blue-400 animate-pulse"></span>
            <span className="max-w-[70px] sm:max-w-[100px] truncate">
              {apiUser?.role ? apiUser.role.toUpperCase() : roleInfo.shortTitle}
            </span>
          </button>

          {/* Trilingual Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              title="Switch Language"
              className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-[#1565C0] dark:text-blue-300 border border-blue-100 dark:border-blue-900 transition"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="uppercase text-[11px]">{language}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-1.5 w-36 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code);
                      setShowLangMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-semibold flex items-center justify-between transition ${
                      language === l.code
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-[#1565C0] dark:text-blue-300 font-bold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <span>{l.native}</span>
                    <span className="text-[10px] text-slate-400 uppercase">{l.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            title="Toggle Light / Dark mode"
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-[#FFB300]" />}
          </button>

          {/* Notification Bell (GET /notifications/unread-count) */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                refreshNotifications();
              }}
              className="relative p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-[#E53935] text-white rounded-full text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-bounce">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Notification Popover Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-92 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="p-3.5 bg-gradient-to-r from-[#1565C0] to-[#0D47A1] text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    <span className="font-bold text-xs">Citizen Notifications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadNotificationsCount > 0 && (
                      <button
                        onClick={markAllBackendNotificationsAsRead}
                        className="text-[10px] bg-white/20 hover:bg-white/30 text-white font-semibold px-2 py-0.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
                        title="Mark all as read (PATCH /notifications/read-all)"
                      >
                        <CheckCheck className="w-3 h-3" />
                        <span>Read all</span>
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="p-1 rounded-full hover:bg-white/20 text-white transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {backendNotifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No notifications found for this account.
                    </div>
                  ) : (
                    backendNotifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 text-xs transition hover:bg-blue-50/50 dark:hover:bg-slate-800/60 ${
                          !n.is_read ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5 mb-1">
                          <p className="text-slate-800 dark:text-slate-200 text-xs font-medium leading-relaxed">
                            {n.message}
                          </p>
                          {!n.is_read && (
                            <span
                              className="w-2 h-2 rounded-full bg-[#1565C0] shrink-0 mt-1"
                              title="Unread"
                            ></span>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                          <span>
                            {new Date(n.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>

                          <div className="flex items-center gap-2">
                            {!n.is_read && (
                              <button
                                onClick={() => markBackendNotificationAsRead(n.id)}
                                className="text-[10px] font-semibold text-[#1565C0] dark:text-blue-400 hover:underline"
                              >
                                Mark read
                              </button>
                            )}

                            {n.complaint_id && (
                              <button
                                onClick={() => handleNotificationClick(n.complaint_id, n.id)}
                                className="text-[10px] font-semibold text-[#1565C0] dark:text-blue-400 hover:underline flex items-center gap-0.5"
                              >
                                View #{n.complaint_id} <ArrowRight className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
