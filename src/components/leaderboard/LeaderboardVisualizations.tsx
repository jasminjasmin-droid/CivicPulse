import React, { useState } from 'react';
import {
  Award,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Star,
  MapPin,
  ChevronDown,
  ChevronUp,
  Shield,
  Zap,
  Layers,
  ArrowUpRight,
  Flame,
  Activity,
  BarChart3,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { LeaderboardEntity } from '../../types';

interface LeaderboardVisualizationsProps {
  entities: (LeaderboardEntity & { rank: number })[];
  activeView: 'cards' | 'barchart' | 'trend' | 'heatmap' | 'comparison';
  timeframe: string;
}

export const LeaderboardVisualizations: React.FC<LeaderboardVisualizationsProps> = ({
  entities,
  activeView,
  timeframe,
}) => {
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [selectedHeatDistrict, setSelectedHeatDistrict] = useState<LeaderboardEntity | null>(null);

  const top10 = entities.slice(0, 10);

  // Helper for badge colors
  const getBadgePill = (badge: string) => {
    switch (badge) {
      case 'Gold':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-2xs">
            🥇 Gold Tier
          </span>
        );
      case 'Silver':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-2xs">
            🥈 Silver Tier
          </span>
        );
      case 'Bronze':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-orange-100 text-orange-900 dark:bg-orange-950/80 dark:text-orange-300 border border-orange-300 dark:border-orange-700 shadow-2xs">
            🥉 Bronze Tier
          </span>
        );
      case 'Fastest Responder':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            ⚡ Fastest Responder
          </span>
        );
      case 'Most Trusted Department':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            🛡️ Most Trusted
          </span>
        );
      case 'Best Citizen Satisfaction':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            ⭐ Top Satisfaction
          </span>
        );
      case 'Highest Verification Rate':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
            🎯 95%+ Verified
          </span>
        );
      case 'Zero Pending Complaints':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            ✨ Zero Backlog
          </span>
        );
      default:
        return null;
    }
  };

  // ==================== VIEW 1: TOP 10 RANKING CARDS ====================
  if (activeView === 'cards') {
    return (
      <div className="space-y-3">
        {top10.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400 bg-white dark:bg-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-700">
            No entities match the selected filter combination.
          </div>
        ) : (
          top10.map((item) => {
            const isExpanded = expandedCardId === item.id;
            const isTop3 = item.rank <= 3;

            return (
              <div
                key={item.id}
                className={`rounded-3xl border transition-all duration-200 overflow-hidden ${
                  item.rank === 1
                    ? 'bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-white dark:to-slate-800 border-amber-300 dark:border-amber-600/60 shadow-md ring-1 ring-amber-400/30'
                    : item.rank === 2
                    ? 'bg-gradient-to-r from-slate-400/10 via-slate-300/5 to-white dark:to-slate-800 border-slate-300 dark:border-slate-600 shadow-sm'
                    : item.rank === 3
                    ? 'bg-gradient-to-r from-orange-400/10 via-orange-300/5 to-white dark:to-slate-800 border-orange-300 dark:border-orange-600/60 shadow-sm'
                    : 'bg-white dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700/80 shadow-2xs hover:shadow-sm'
                }`}
              >
                {/* Main Card Content */}
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    {/* Rank Badge + Name */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                          item.rank === 1
                            ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black text-base ring-2 ring-amber-300'
                            : item.rank === 2
                            ? 'bg-gradient-to-tr from-slate-400 to-slate-200 text-slate-900 font-extrabold'
                            : item.rank === 3
                            ? 'bg-gradient-to-tr from-orange-500 to-amber-600 text-white font-extrabold'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `#${item.rank}`}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                            {item.name}
                          </h3>
                          {item.trend > 0 && (
                            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center">
                              <ArrowUpRight className="w-3 h-3" />
                              +{item.trend}%
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          <span className="font-semibold text-blue-600 dark:text-blue-400">{item.tier}</span>
                          <span>•</span>
                          <span>{item.state}</span>
                          {item.district && item.district !== item.name && (
                            <>
                              <span>•</span>
                              <span>{item.district}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Trust Score Banner */}
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trust Score</div>
                      <div className="text-xl font-black text-[#1565C0] dark:text-blue-400 tracking-tight">
                        {item.trustScore}
                        <span className="text-xs font-normal text-slate-400">/100</span>
                      </div>
                    </div>
                  </div>

                  {/* Badges Bar */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {item.badges.map((b) => (
                      <React.Fragment key={b}>{getBadgePill(b)}</React.Fragment>
                    ))}
                  </div>

                  {/* Core 4 KPIs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/80 text-center">
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Resolution Rate</div>
                      <div className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">
                        {item.resolutionRate}%
                      </div>
                      <div className="text-[9px] text-emerald-600 font-semibold">{item.totalResolved} resolved</div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Avg Response</div>
                      <div className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">
                        {item.avgResolutionHours} hrs
                      </div>
                      <div className="text-[9px] text-blue-600 font-semibold">Speed Index</div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Citizen Rating</div>
                      <div className="text-xs font-black text-amber-500 mt-0.5 flex items-center justify-center gap-0.5">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                        <span>{item.citizenSatisfaction}</span>
                      </div>
                      <div className="text-[9px] text-slate-400">5.0 scale</div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Verification</div>
                      <div className="text-xs font-black text-teal-600 dark:text-teal-400 mt-0.5">
                        {item.citizenVerificationRate}%
                      </div>
                      <div className="text-[9px] text-slate-400">Audited Proof</div>
                    </div>
                  </div>

                  {/* Toggle Detailed Breakdown Button */}
                  <button
                    onClick={() => setExpandedCardId(isExpanded ? null : item.id)}
                    className="w-full py-1 text-[11px] font-bold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center justify-center gap-1"
                  >
                    <span>{isExpanded ? 'Hide Detailed Governance Audit' : 'View Full Evaluation Breakdown (10 Parameters)'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {/* Expandable Section: All 10 Parameters */}
                  {isExpanded && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-xs space-y-3 animate-in fade-in">
                      <div className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        Official Governance Performance Metrics
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px]">
                        <div>
                          <span className="text-slate-500 block">Total Received:</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">{item.totalReceived.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Total Resolved:</span>
                          <span className="font-extrabold text-emerald-600">{item.totalResolved.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">SLA Compliance:</span>
                          <span className="font-extrabold text-blue-600">{item.slaCompliance}%</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Escalated Tickets:</span>
                          <span className={`font-extrabold ${item.escalatedCount > 25 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
                            {item.escalatedCount} cases
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Reopened Complaints:</span>
                          <span className={`font-extrabold ${item.reopenedCount > 15 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
                            {item.reopenedCount} cases
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Trust Level:</span>
                          <span className="font-extrabold text-[#1565C0] dark:text-blue-400">
                            {item.trustScore >= 90 ? 'Grade A+ (Exemplary)' : item.trustScore >= 80 ? 'Grade A (Proficient)' : 'Grade B (Acceptable)'}
                          </span>
                        </div>
                      </div>

                      {/* Mini Sparkline Bar for History */}
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 block mb-1">
                          6-Month Trust Score Trajectory
                        </span>
                        <div className="flex items-end gap-1.5 h-10">
                          {item.historicalTrust.map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                              <div
                                style={{ height: `${Math.max(15, (h.score - 60) * 2.5)}%` }}
                                className="w-full rounded-t-md bg-blue-500/80 hover:bg-blue-600 transition"
                                title={`${h.month}: ${h.score}/100`}
                              ></div>
                              <span className="text-[8px] text-slate-400">{h.month}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }

  // ==================== VIEW 2: BAR CHARTS ====================
  if (activeView === 'barchart') {
    return (
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-md space-y-6">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span>Civic Trust Score & SLA Compliance Comparison</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Comparative performance of top 10 entities in this category ({timeframe})
          </p>
        </div>

        <div className="space-y-4">
          {top10.map((item) => (
            <div key={item.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="w-5 text-slate-400 text-[10px] font-mono">#{item.rank}</span>
                  <span>{item.name}</span>
                </span>
                <span className="text-blue-600 dark:text-blue-400 font-black">{item.trustScore}% Trust</span>
              </div>

              {/* Dual Bar: Trust Score + SLA Compliance */}
              <div className="space-y-1">
                {/* Bar 1: Trust Score */}
                <div className="h-3 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${item.trustScore}%` }}
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                  ></div>
                </div>

                {/* Bar 2: SLA Compliance */}
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>SLA Compliance: {item.slaCompliance}%</span>
                  <span>Resolution: {item.resolutionRate}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            <span className="text-slate-600 dark:text-slate-300 font-semibold">Civic Trust Score (0-100)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700"></div>
            <span className="text-slate-600 dark:text-slate-300 font-semibold">SLA Target Delta</span>
          </div>
        </div>
      </div>
    );
  }

  // ==================== VIEW 3: TREND GRAPHS ====================
  if (activeView === 'trend') {
    const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

    return (
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-md space-y-5">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>6-Month Trust Score Trajectory (Top 5 Performers)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Historical public accountability tracking across consecutive evaluation cycles
          </p>
        </div>

        {/* SVG Multi-Line Trend Graph */}
        <div className="w-full overflow-x-auto pb-2">
          <div className="min-w-[340px] h-56 relative border-b border-l border-slate-200 dark:border-slate-700 pt-4 px-2">
            {/* Horizontal Grid lines */}
            <div className="absolute left-0 right-0 top-6 border-b border-dashed border-slate-200 dark:border-slate-800 text-[9px] text-slate-400 pl-1">
              95 - Exemplary
            </div>
            <div className="absolute left-0 right-0 top-20 border-b border-dashed border-slate-200 dark:border-slate-800 text-[9px] text-slate-400 pl-1">
              90 - Gold Threshold
            </div>
            <div className="absolute left-0 right-0 top-36 border-b border-dashed border-slate-200 dark:border-slate-800 text-[9px] text-slate-400 pl-1">
              80 - Silver Threshold
            </div>

            {/* Render lines for top 5 */}
            <svg className="w-full h-full overflow-visible" viewBox="0 0 320 180" preserveAspectRatio="none">
              {top10.slice(0, 5).map((item, idx) => {
                const colors = ['#1565C0', '#26A69A', '#FB8C00', '#7E57C2', '#E53935'];
                const color = colors[idx % colors.length];

                const points = item.historicalTrust
                  .map((h, i) => {
                    const x = 30 + i * 55;
                    const y = 160 - ((h.score - 70) / 30) * 140;
                    return `${x},${y}`;
                  })
                  .join(' ');

                return (
                  <g key={item.id}>
                    <polyline fill="none" stroke={color} strokeWidth="2.5" points={points} strokeLinecap="round" />
                    {item.historicalTrust.map((h, i) => {
                      const cx = 30 + i * 55;
                      const cy = 160 - ((h.score - 70) / 30) * 140;
                      return (
                        <circle
                          key={i}
                          cx={cx}
                          cy={cy}
                          r="4"
                          fill={color}
                          className="hover:r-6 transition-all cursor-pointer"
                        />
                      );
                    })}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Month Labels */}
          <div className="flex justify-between pl-6 pr-2 mt-2 text-[10px] font-bold text-slate-400">
            {months.map((m) => (
              <span key={m}>{m} 2026</span>
            ))}
          </div>
        </div>

        {/* Legend for Top 5 Lines */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700 text-xs">
          {top10.slice(0, 5).map((item, idx) => {
            const colors = ['bg-[#1565C0]', 'bg-[#26A69A]', 'bg-[#FB8C00]', 'bg-[#7E57C2]', 'bg-[#E53935]'];
            return (
              <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${colors[idx % colors.length]}`}></div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] truncate max-w-[150px]">
                    {item.name}
                  </span>
                </div>
                <span className="font-black text-slate-700 dark:text-slate-300 text-xs">{item.trustScore}/100</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ==================== VIEW 4: DISTRICT HEAT MAP ====================
  if (activeView === 'heatmap') {
    return (
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-md space-y-4">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-rose-500" />
            <span>District Performance Heat Intensity Map</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Statewide geographic cluster analysis colored by Trust Score performance
          </p>
        </div>

        {/* Intensity Legend */}
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
            <div className="w-3.5 h-3.5 rounded-md bg-emerald-500"></div>
            <span>High Trust (&ge; 90)</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-600 font-bold">
            <div className="w-3.5 h-3.5 rounded-md bg-amber-400"></div>
            <span>Moderate (80-89)</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-600 font-bold">
            <div className="w-3.5 h-3.5 rounded-md bg-rose-500"></div>
            <span>Attention Needed (&lt; 80)</span>
          </div>
        </div>

        {/* Heat Map Grid of District Cells */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {entities.map((item) => {
            const isHigh = item.trustScore >= 90;
            const isMid = item.trustScore >= 80 && item.trustScore < 90;
            const isSelected = selectedHeatDistrict?.id === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setSelectedHeatDistrict(item)}
                className={`p-3 rounded-2xl text-left transition-all border ${
                  isSelected ? 'ring-2 ring-blue-500 scale-102 shadow-md' : 'hover:scale-101'
                } ${
                  isHigh
                    ? 'bg-emerald-500/10 border-emerald-300 dark:border-emerald-700/60'
                    : isMid
                    ? 'bg-amber-500/10 border-amber-300 dark:border-amber-700/60'
                    : 'bg-rose-500/10 border-rose-300 dark:border-rose-700/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isHigh ? 'bg-emerald-500 animate-pulse' : isMid ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                  ></span>
                  <span className="text-[10px] font-mono font-bold text-slate-400">#{item.rank}</span>
                </div>

                <div className="font-extrabold text-xs text-slate-900 dark:text-white mt-1.5 truncate">
                  {item.name}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">{item.state}</div>

                <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
                  <span className="font-black text-slate-800 dark:text-slate-200">{item.trustScore}%</span>
                  <span className="text-[10px] text-slate-400">{item.resolutionRate}% res.</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected District Heat Detail Drawer */}
        {selectedHeatDistrict && (
          <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-xl space-y-3 animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-300 border border-blue-400/30">
                  Heat Map Node Detail
                </span>
                <h4 className="text-sm font-black mt-1">{selectedHeatDistrict.name}</h4>
                <p className="text-xs text-slate-400">{selectedHeatDistrict.tier} • {selectedHeatDistrict.state}</p>
              </div>
              <button
                onClick={() => setSelectedHeatDistrict(null)}
                className="text-xs font-bold text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
              <div className="p-2 rounded-xl bg-white/10">
                <div className="text-amber-400 font-extrabold text-base">{selectedHeatDistrict.trustScore}</div>
                <div className="text-[10px] text-slate-300">Trust Score</div>
              </div>
              <div className="p-2 rounded-xl bg-white/10">
                <div className="text-emerald-400 font-extrabold text-base">{selectedHeatDistrict.resolutionRate}%</div>
                <div className="text-[10px] text-slate-300">Resolution Rate</div>
              </div>
              <div className="p-2 rounded-xl bg-white/10">
                <div className="text-blue-400 font-extrabold text-base">{selectedHeatDistrict.avgResolutionHours}h</div>
                <div className="text-[10px] text-slate-300">Avg Speed</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==================== VIEW 5: MONTHLY PERFORMANCE COMPARISON ====================
  if (activeView === 'comparison') {
    return (
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-md space-y-5">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span>Month-over-Month Governance Progress Comparison</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Evaluating performance leaps between August 2026 and September 2026
          </p>
        </div>

        {/* Progress Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">Most Improved Entity</span>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">Mudichur Panchayat</div>
            <div className="text-xs font-bold text-emerald-600 mt-0.5">+4.2% Trust Score Leap</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
            <span className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase">Speed Champion</span>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">Sanitation Dept</div>
            <div className="text-xs font-bold text-blue-600 mt-0.5">3.8h Average Turnaround</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase">Verification Leader</span>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">Greater Chennai Corp</div>
            <div className="text-xs font-bold text-amber-600 mt-0.5">97.4% Physical Verification</div>
          </div>
        </div>

        {/* Comparative Progress Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-[10px] uppercase text-slate-400">
                <th className="py-2 pr-2">Rank & Entity</th>
                <th className="py-2 px-2">Aug 2026</th>
                <th className="py-2 px-2">Sep 2026 (Live)</th>
                <th className="py-2 px-2">Delta Surge</th>
                <th className="py-2 pl-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {top10.map((item) => {
                const prev = item.historicalTrust[item.historicalTrust.length - 2]?.score || item.trustScore - 1;
                const curr = item.trustScore;
                const diff = curr - prev;

                return (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="py-2.5 pr-2 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="text-slate-400 font-mono text-[10px]">#{item.rank}</span>
                      <span>{item.name}</span>
                    </td>
                    <td className="py-2.5 px-2 font-semibold text-slate-500">{prev}/100</td>
                    <td className="py-2.5 px-2 font-extrabold text-blue-600 dark:text-blue-400">{curr}/100</td>
                    <td className="py-2.5 px-2 font-bold text-emerald-600">
                      {diff >= 0 ? `+${diff}%` : `${diff}%`}
                    </td>
                    <td className="py-2.5 pl-2">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {diff >= 0 ? 'Surging' : 'Stable'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
};
