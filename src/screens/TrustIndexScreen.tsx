import React, { useState, useMemo } from 'react';
import {
  Award,
  TrendingUp,
  Filter,
  BarChart3,
  Activity,
  Flame,
  Calendar,
  Building,
  MapPin,
  Shield,
  Layers,
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LeaderboardCategory, TimeframeFilter } from '../types';
import { leaderboardService } from '../services/leaderboardService';
import { LeaderboardVisualizations } from '../components/leaderboard/LeaderboardVisualizations';

export const TrustIndexScreen: React.FC = () => {
  const { complaints, departments, t } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<LeaderboardCategory>('districts');
  const [selectedState, setSelectedState] = useState<string>('Tamil Nadu');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedLocalBody, setSelectedLocalBody] = useState<string>('All');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('Monthly');
  const [activeView, setActiveView] = useState<'cards' | 'barchart' | 'trend' | 'heatmap' | 'comparison'>('cards');

  // Compute real-time dynamic leaderboard with live updates from complaints and departments
  const dynamicEntities = useMemo(() => {
    return leaderboardService.getDynamicLeaderboard(complaints, departments);
  }, [complaints, departments]);

  // Apply filters and rank
  const rankedEntities = useMemo(() => {
    return leaderboardService.filterAndRank(dynamicEntities, {
      category: selectedCategory,
      state: selectedState,
      district: selectedDistrict,
      localBody: selectedLocalBody,
      department: selectedDept,
      timeframe,
    });
  }, [dynamicEntities, selectedCategory, selectedState, selectedDistrict, selectedLocalBody, selectedDept, timeframe]);

  // Available districts for current state
  const availableDistricts = useMemo(() => {
    return Array.from(
      new Set(
        dynamicEntities
          .filter((e) => selectedState === 'All' || e.state === selectedState)
          .map((e) => e.district)
          .filter(Boolean)
      )
    );
  }, [dynamicEntities, selectedState]);

  // Category Tabs Configuration
  const CATEGORIES: { id: LeaderboardCategory; label: string; icon: string }[] = [
    { id: 'districts', label: 'Top Districts', icon: '🏛️' },
    { id: 'municipal_corporations', label: 'Municipal Corporations', icon: '🏢' },
    { id: 'municipalities', label: 'Municipalities', icon: '🏙️' },
    { id: 'town_panchayats', label: 'Town Panchayats', icon: '🏘️' },
    { id: 'village_panchayats', label: 'Village Panchayats', icon: '🌾' },
    { id: 'departments', label: 'Departments (8 Wings)', icon: '⚙️' },
  ];

  // Visualizations tabs
  const VISUALIZATIONS = [
    { id: 'cards' as const, label: 'Top 10 Cards', icon: Award },
    { id: 'barchart' as const, label: 'Bar Charts', icon: BarChart3 },
    { id: 'trend' as const, label: 'Trend Graphs', icon: Activity },
    { id: 'heatmap' as const, label: 'Heat Map', icon: Flame },
    { id: 'comparison' as const, label: 'Monthly Comparison', icon: Calendar },
  ];

  // Top entity in category
  const topEntity = rankedEntities[0];
  const avgTrust = rankedEntities.length
    ? Math.round(rankedEntities.reduce((acc, curr) => acc + curr.trustScore, 0) / rankedEntities.length)
    : 0;
  const totalCategoryResolved = rankedEntities.reduce((acc, curr) => acc + curr.totalResolved, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-28 max-w-4xl mx-auto">
      {/* Official Government Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-6 text-white shadow-xl border border-slate-700/60">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Public Governance Transparency Portal</span>
            </span>

            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-400/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Live Synced with Grievance Lifecycle</span>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight">
              State & Local Body Leaderboard
            </h1>
            <p className="text-xs text-blue-200 mt-1 max-w-2xl leading-relaxed">
              Transparent public accountability ranking districts, corporations, municipalities, and departments on Civic Trust Scores, resolution speed, and verified citizen satisfaction.
            </p>
          </div>

          {/* Quick Metrics Ticker */}
          <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-white/10 text-center">
            <div className="bg-white/5 rounded-2xl p-2.5 backdrop-blur-xs">
              <div className="text-xs font-bold text-slate-300">Leading Performer</div>
              <div className="text-sm font-extrabold text-amber-400 truncate mt-0.5">
                {topEntity ? topEntity.name : 'Chennai'}
              </div>
              <div className="text-[10px] text-slate-400">{topEntity?.trustScore || 94}% Trust</div>
            </div>

            <div className="bg-white/5 rounded-2xl p-2.5 backdrop-blur-xs">
              <div className="text-xs font-bold text-slate-300">Category Avg Trust</div>
              <div className="text-sm font-extrabold text-blue-400 mt-0.5">{avgTrust}/100</div>
              <div className="text-[10px] text-slate-400">Benchmark Index</div>
            </div>

            <div className="bg-white/5 rounded-2xl p-2.5 backdrop-blur-xs">
              <div className="text-xs font-bold text-slate-300">Complaints Resolved</div>
              <div className="text-sm font-extrabold text-emerald-400 mt-0.5">
                {totalCategoryResolved.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400">{timeframe} Period</div>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Category Switcher (6 Tabs) */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
          Select Leaderboard Category
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`shrink-0 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#1565C0] text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-400/40'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-blue-400'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Interactive 5-Way Filter Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-soft-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-[#1565C0] dark:text-blue-400">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4" />
            <span>Governance Filters & Scope</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {rankedEntities.length} Entities Ranked
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          {/* State */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">State</label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedDistrict('All');
              }}
              className="w-full text-xs font-semibold px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All States</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Maharashtra">Maharashtra</option>
            </select>
          </div>

          {/* District */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">District</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full text-xs font-semibold px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Districts</option>
              {availableDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Local Body */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Local Body Tier</label>
            <select
              value={selectedLocalBody}
              onChange={(e) => setSelectedLocalBody(e.target.value)}
              className="w-full text-xs font-semibold px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Tiers</option>
              <option value="Municipal Corporation">Corporation</option>
              <option value="Municipality">Municipality</option>
              <option value="Town Panchayat">Town Panchayat</option>
              <option value="Village Panchayat">Village Panchayat</option>
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full text-xs font-semibold px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Departments</option>
              <option value="Road Damage">Roads & Highways</option>
              <option value="Garbage">Sanitation</option>
              <option value="Water Leakage">Water Supply</option>
              <option value="Power Failure">Electricity</option>
              <option value="Drainage">Public Works / Drainage</option>
              <option value="Fallen Tree">Parks & Horticulture</option>
              <option value="Traffic Signal">Traffic & Signals</option>
            </select>
          </div>

          {/* Timeframe */}
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Timeframe</label>
            <div className="flex p-0.5 rounded-xl bg-slate-100 dark:bg-slate-900">
              {(['Weekly', 'Monthly', 'Quarterly', 'Yearly'] as const).map((tPeriod) => (
                <button
                  key={tPeriod}
                  onClick={() => setTimeframe(tPeriod)}
                  className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold transition cursor-pointer ${
                    timeframe === tPeriod
                      ? 'bg-[#1565C0] text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tPeriod[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Visualization Switcher Tabs */}
      <div className="flex gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold overflow-x-auto scrollbar-none">
        {VISUALIZATIONS.map((vis) => {
          const Icon = vis.icon;
          const isActive = activeView === vis.id;
          return (
            <button
              key={vis.id}
              onClick={() => setActiveView(vis.id)}
              className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{vis.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Active Visualization Display */}
      <LeaderboardVisualizations
        entities={rankedEntities}
        activeView={activeView}
        timeframe={timeframe}
      />
    </div>
  );
};
