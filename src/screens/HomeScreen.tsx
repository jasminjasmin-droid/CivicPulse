import React, { useEffect, useState } from 'react';
import {
  PlusCircle,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const HomeScreen: React.FC = () => {
  const {
    currentUser,
    setActiveTab,
    setSelectedComplaintId,
    citizenStats,
    refreshCitizenStats,
    backendComplaints,
    refreshBackendComplaints,
    t,
  } = useApp();

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([refreshCitizenStats(), refreshBackendComplaints()]).finally(() => {
      setIsLoading(false);
    });
  }, [refreshCitizenStats, refreshBackendComplaints]);

  const total = citizenStats?.total ?? 0;
  const pending = citizenStats?.pending ?? 0;
  const inProgress = citizenStats?.in_progress ?? 0;
  const resolved = citizenStats?.resolved ?? 0;

  const recentComplaints = backendComplaints.slice(0, 4);

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-28 max-w-4xl mx-auto">
      {/* Welcome Banner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1565C0] via-[#1976D2] to-[#0D47A1] p-6 text-white shadow-soft-lg">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wide uppercase border border-white/20">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FFB300]" />
              <span>Official Citizen Dashboard</span>
            </div>
            <button
              onClick={() => {
                setIsLoading(true);
                Promise.all([refreshCitizenStats(), refreshBackendComplaints()]).finally(() =>
                  setIsLoading(false)
                );
              }}
              title="Refresh Statistics"
              className="flex items-center gap-1.5 text-xs font-medium text-white/90 bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-full border border-white/20 transition active:scale-95"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Welcome, {currentUser.name.split(' ')[0]} 👋
            </h1>
            <p className="text-sm text-blue-100 mt-1 max-w-xl font-normal leading-relaxed">
              CivicPulse Smart Governance Portal — Track grievances, upload evidence, and monitor SLA redressals in real time.
            </p>
          </div>

          {/* Quick Actions inside banner */}
          <div className="pt-2 flex flex-wrap gap-2.5">
            <button
              onClick={() => setActiveTab('report')}
              className="px-4 py-2 bg-white text-[#1565C0] hover:bg-blue-50 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-[#1565C0]" />
              File New Complaint
            </button>
            <button
              onClick={() => setActiveTab('track')}
              className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white font-semibold text-xs rounded-xl border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              View My Complaints
            </button>
          </div>
        </div>
      </div>

      {/* FEATURE 17 - CITIZEN DASHBOARD METRIC CARDS */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Grievance Statistics (GET /dashboard)
          </h2>
          <span className="text-[11px] text-slate-400">Authenticated Citizen Metrics</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {/* Card 1: Total */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-blue-100 dark:border-slate-700 shadow-soft-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#1565C0] dark:text-blue-400 flex items-center justify-center">
                <FolderOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {isLoading ? '...' : total}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Complaints filed</p>
            </div>
          </div>

          {/* Card 2: Pending */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-amber-100 dark:border-slate-700 shadow-soft-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {isLoading ? '...' : pending}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Awaiting assignment</p>
            </div>
          </div>

          {/* Card 3: In Progress */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-sky-100 dark:border-slate-700 shadow-soft-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">In Progress</span>
              <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-sky-600 dark:text-sky-400">
                {isLoading ? '...' : inProgress}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Under official redressal</p>
            </div>
          </div>

          {/* Card 4: Resolved */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-emerald-100 dark:border-slate-700 shadow-soft-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Resolved</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {isLoading ? '...' : resolved}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Successfully closed</p>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT COMPLAINTS PREVIEW */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-soft-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Complaints
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Live updates from CivicPulse grievance tracker
            </p>
          </div>
          <button
            onClick={() => setActiveTab('track')}
            className="text-xs font-bold text-[#1565C0] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentComplaints.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No complaints submitted yet. Click "File New Complaint" above to register a civic issue.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {recentComplaints.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  setSelectedComplaintId(String(c.id));
                  setActiveTab('track');
                }}
                className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-750 px-2 rounded-xl transition cursor-pointer"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#1565C0] dark:text-blue-400">
                      #{c.id}
                    </span>
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {c.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 font-medium">
                      {c.category}
                    </span>
                    <span>•</span>
                    <span>{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      c.status === 'Resolved'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : c.status === 'In Progress'
                        ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}
                  >
                    {c.status}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
