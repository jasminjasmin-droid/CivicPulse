import React from 'react';
import {
  PlusCircle,
  Search,
  Bot,
  MapPin,
  PhoneCall,
  Award,
  Bell,
  CheckCircle2,
  TrendingUp,
  Clock,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';
import { useApp, AppTab } from '../context/AppContext';

export const HomeScreen: React.FC = () => {
  const {
    currentUser,
    complaints,
    setActiveTab,
    setSelectedComplaintId,
    t,
  } = useApp();

  const citizenComplaints = complaints.filter(
    (c) => c.citizenId === currentUser.id || currentUser.role !== 'citizen'
  );
  const totalCount = citizenComplaints.length;
  const inProgressCount = citizenComplaints.filter((c) =>
    ['Submitted', 'Assigned', 'In Progress', 'Escalated'].includes(c.status)
  ).length;
  const awaitingVerification = citizenComplaints.filter(
    (c) => c.status === 'Awaiting Verification'
  );
  const resolvedCount = citizenComplaints.filter((c) =>
    ['Resolved', 'Closed'].includes(c.status)
  ).length;

  // The 8 clean, uncongested dashboard sections requested by user:
  const dashboardSections: {
    id: AppTab;
    title: string;
    description: string;
    icon: any;
    iconBg: string;
    iconColor: string;
    accentBorder: string;
    badge?: string;
  }[] = [
    {
      id: 'report',
      title: t('actionReportTitle'),
      description: t('actionReportDesc'),
      icon: PlusCircle,
      iconBg: 'bg-[#1565C0]/10 dark:bg-blue-950/60',
      iconColor: 'text-[#1565C0] dark:text-blue-400',
      accentBorder: 'hover:border-[#1565C0]',
      badge: 'AI Smart',
    },
    {
      id: 'track',
      title: t('actionTrackTitle'),
      description: t('actionTrackDesc'),
      icon: Search,
      iconBg: 'bg-[#26A69A]/10 dark:bg-teal-950/60',
      iconColor: 'text-[#26A69A] dark:text-teal-400',
      accentBorder: 'hover:border-[#26A69A]',
      badge: `${inProgressCount} Active`,
    },
    {
      id: 'nearby',
      title: t('actionNearbyTitle'),
      description: t('actionNearbyDesc'),
      icon: MapPin,
      iconBg: 'bg-emerald-500/10 dark:bg-emerald-950/60',
      iconColor: 'text-[#43A047] dark:text-emerald-400',
      accentBorder: 'hover:border-[#43A047]',
      badge: 'Live GPS',
    },
    {
      id: 'ai',
      title: t('actionAiTitle'),
      description: t('actionAiDesc'),
      icon: Bot,
      iconBg: 'bg-purple-500/10 dark:bg-purple-950/60',
      iconColor: 'text-purple-600 dark:text-purple-400',
      accentBorder: 'hover:border-purple-500',
      badge: '24/7 Bot',
    },
    {
      id: 'emergency',
      title: t('actionEmergencyTitle'),
      description: t('actionEmergencyDesc'),
      icon: PhoneCall,
      iconBg: 'bg-rose-500/10 dark:bg-rose-950/60',
      iconColor: 'text-[#E53935] dark:text-rose-400',
      accentBorder: 'hover:border-[#E53935]',
      badge: 'SOS 112',
    },
    {
      id: 'trust',
      title: t('actionLeaderboardTitle'),
      description: t('actionLeaderboardDesc'),
      icon: Award,
      iconBg: 'bg-amber-500/10 dark:bg-amber-950/60',
      iconColor: 'text-[#FB8C00] dark:text-amber-400',
      accentBorder: 'hover:border-[#FB8C00]',
      badge: 'Statewide',
    },
    {
      id: 'trust',
      title: t('actionTrustTitle'),
      description: t('actionTrustDesc'),
      icon: TrendingUp,
      iconBg: 'bg-[#1565C0]/10 dark:bg-blue-950/60',
      iconColor: 'text-[#1565C0] dark:text-blue-400',
      accentBorder: 'hover:border-[#1565C0]',
    },
    {
      id: 'track',
      title: t('actionNotificationsTitle'),
      description: t('actionNotificationsDesc'),
      icon: Bell,
      iconBg: 'bg-indigo-500/10 dark:bg-indigo-950/60',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      accentBorder: 'hover:border-indigo-500',
      badge: 'Alerts',
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-28 max-w-4xl mx-auto">
      {/* Welcome Banner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1565C0] via-[#1976D2] to-[#0D47A1] p-6 text-white shadow-soft-lg">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wide uppercase border border-white/20">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FFB300]" />
              <span>{currentUser.ward || 'Chennai • T. Nagar'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#FFB300] bg-black/20 px-3 py-1 rounded-full border border-[#FFB300]/40">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{currentUser.reputationScore || 420} {t('civicCredits')}</span>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              {t('welcomeCitizen')}, {currentUser.name.split(' ')[0]} 👋
            </h1>
            <p className="text-sm text-blue-100 mt-1 max-w-xl font-normal leading-relaxed">
              {t('tagline')}
            </p>
          </div>

          {/* Clean Metric Counters */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/20 text-center">
            <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-xs">
              <div className="text-xl font-black">{totalCount}</div>
              <div className="text-xs text-blue-100 font-medium">{t('totalReported')}</div>
            </div>
            <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-xs">
              <div className="text-xl font-black text-[#FFB300]">{inProgressCount}</div>
              <div className="text-xs text-blue-100 font-medium">{t('activeSla')}</div>
            </div>
            <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-xs">
              <div className="text-xl font-black text-emerald-300">{resolvedCount}</div>
              <div className="text-xs text-blue-100 font-medium">{t('resolvedComplaints')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Required: Citizen Verification Banner */}
      {awaitingVerification.length > 0 && (
        <div className="rounded-3xl p-5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border-2 border-[#43A047] shadow-soft-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#43A047] text-white flex items-center justify-center shrink-0 shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#43A047] bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-0.5 rounded-full">
                  {t('actionRequired')}
                </span>
                <h3 className="text-sm font-bold text-[#263238] dark:text-white mt-1">
                  {awaitingVerification[0].title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  {t('verifyWorkMsg')}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedComplaintId(awaitingVerification[0].id);
                setActiveTab('track');
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-[#43A047] hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 shrink-0 active:scale-95"
            >
              <span>{t('inspectVerify')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Official City Bulletin */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-[#CFD8DC]/80 dark:border-slate-700 flex items-center gap-3 shadow-soft-sm">
        <div className="p-2 rounded-xl bg-[#1565C0]/10 text-[#1565C0] shrink-0">
          <TrendingUp className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0 text-xs text-[#263238] dark:text-slate-200">
          <strong className="font-bold text-[#1565C0] dark:text-blue-400">{t('cityBulletin')}: </strong>
          <span>{t('bulletinMsg')}</span>
        </div>
      </div>

      {/* The 8 Spacious, Clean Governance Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Smart Governance Services
          </h2>
          <span className="text-xs text-[#1565C0] dark:text-blue-400 font-semibold">
            8 Sections Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {dashboardSections.map((sec, idx) => {
            const Icon = sec.icon;

            return (
              <div
                key={idx}
                onClick={() => setActiveTab(sec.id)}
                className={`group p-5 rounded-3xl bg-white dark:bg-slate-800 border border-[#CFD8DC]/80 dark:border-slate-700 shadow-soft-sm hover:shadow-soft-md transition-all duration-200 cursor-pointer flex items-start gap-4 ${sec.accentBorder} active:scale-[0.99]`}
              >
                {/* Large Icon Box */}
                <div
                  className={`w-14 h-14 rounded-2xl ${sec.iconBg} ${sec.iconColor} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-7 h-7 stroke-[2]" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="font-extrabold text-sm text-[#263238] dark:text-white group-hover:text-[#1565C0] dark:group-hover:text-blue-400 transition-colors">
                      {sec.title}
                    </h3>
                    {sec.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {sec.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {sec.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Complaints in Area */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t('recentComplaintsTitle')}
          </h2>
          <button
            onClick={() => setActiveTab('track')}
            className="text-xs text-[#1565C0] dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
          >
            <span>{t('viewAll')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {complaints.slice(0, 3).map((comp) => {
            const isEsc = comp.isEscalated || comp.status === 'Escalated';
            const isDone = comp.status === 'Resolved' || comp.status === 'Closed';

            return (
              <div
                key={comp.id}
                onClick={() => {
                  setSelectedComplaintId(comp.id);
                  setActiveTab('track');
                }}
                className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-[#CFD8DC]/80 dark:border-slate-700 shadow-soft-sm hover:shadow-soft-md transition cursor-pointer flex items-center gap-4"
              >
                <img
                  src={comp.beforeImageUrl}
                  alt={comp.title}
                  className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-mono font-bold text-[#1565C0] dark:text-blue-400">
                      {comp.id}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        isEsc
                          ? 'bg-red-100 text-[#E53935] dark:bg-red-950 dark:text-red-300'
                          : isDone
                          ? 'bg-emerald-100 text-[#43A047] dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-blue-100 text-[#1565C0] dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      {comp.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs text-[#263238] dark:text-slate-100 truncate mt-1">
                    {comp.title}
                  </h4>

                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="truncate max-w-[140px]">{comp.department}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300">
                      <Clock className="w-3 h-3 text-[#FB8C00]" />
                      {comp.priority}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
