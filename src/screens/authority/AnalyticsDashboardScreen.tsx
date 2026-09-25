import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Download,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useApp } from '../../context/AppContext';

export const AnalyticsDashboardScreen: React.FC = () => {
  const { complaints, departments, currentRole, language } = useApp();

  const [dateRange, setDateRange] = useState<'30d' | '90d' | 'year'>('30d');

  // Metrics Calculations
  const total = complaints.length;
  const resolved = complaints.filter((c) => ['Resolved', 'Closed'].includes(c.status)).length;
  const inProgress = complaints.filter((c) =>
    ['Submitted', 'Assigned', 'In Progress'].includes(c.status)
  ).length;
  const escalated = complaints.filter((c) => c.isEscalated || c.status === 'Escalated').length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  // Category counts
  const categoryCounts: Record<string, number> = {};
  complaints.forEach((c) => {
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
  });

  const exportPdfReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('CivicPulse – Smart Civic Governance Platform', 14, 20);
    doc.setFontSize(12);
    doc.text(`Official Analytical Report • Generated: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.line(14, 32, 196, 32);

    doc.setFontSize(14);
    doc.text('1. Executive Grievance Summary', 14, 42);
    doc.setFontSize(10);
    doc.text(`• Total Complaints Logged: ${total}`, 20, 50);
    doc.text(`• In Progress / Pending: ${inProgress}`, 20, 56);
    doc.text(`• Escalated Across Hierarchy: ${escalated}`, 20, 62);
    doc.text(`• Successfully Resolved: ${resolved} (${resolutionRate}% Resolution Rate)`, 20, 68);

    doc.setFontSize(14);
    doc.text('2. Complaints by Category Breakdown', 14, 80);
    let y = 88;
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      doc.setFontSize(10);
      doc.text(`• ${cat}: ${count} grievances`, 20, y);
      y += 6;
    });

    doc.setFontSize(14);
    doc.text('3. Department Civic Trust Index', 14, y + 8);
    y += 16;
    departments.forEach((dept) => {
      doc.setFontSize(10);
      doc.text(
        `• ${dept.name} (${dept.code}): Trust Score ${dept.trustScore}/100, Verification Rate ${dept.verificationRate}%`,
        20,
        y
      );
      y += 6;
    });

    doc.setFontSize(9);
    doc.text(
      'Report signed by CivicPulse National Informatics Engine. All rights reserved.',
      14,
      280
    );

    doc.save(`CivicPulse_Official_Report_${Date.now()}.pdf`);
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>City Analytics & Intelligence</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time municipal KPIs, SLA compliance rates, and grievance trends
          </p>
        </div>

        <button
          onClick={exportPdfReport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export PDF</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Logged</span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{total}</div>
          <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-0.5 mt-0.5">
            <TrendingUp className="w-3 h-3" /> +14% this month
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Resolution Rate</span>
          <div className="text-xl font-black text-emerald-600 mt-0.5">{resolutionRate}%</div>
          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
            <CheckCircle2 className="w-3 h-3" /> Above benchmark
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Active In Progress</span>
          <div className="text-xl font-black text-amber-500 mt-0.5">{inProgress}</div>
          <span className="text-[10px] text-slate-400 font-medium">Under field action</span>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Escalated Count</span>
          <div className="text-xl font-black text-red-600 mt-0.5">{escalated}</div>
          <span className="text-[10px] text-red-500 font-medium flex items-center gap-0.5">
            <AlertTriangle className="w-3 h-3" /> Breached initial SLA
          </span>
        </div>
      </div>

      {/* Category Breakdown Bar Chart */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-md">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Complaints Distribution by Category
        </h4>

        <div className="space-y-2.5">
          {Object.entries(categoryCounts).map(([cat, count]) => {
            const pct = Math.round((count / total) * 100) || 0;
            return (
              <div key={cat} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-800 dark:text-slate-200">{cat}</span>
                  <span className="text-slate-500">
                    {count} tickets ({pct}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(pct, 8)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Trends (Visual SVG Chart) */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            6-Month Resolution Volume Trend
          </h4>
          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
            +32% Velocity
          </span>
        </div>

        <div className="h-32 flex items-end justify-between gap-2 pt-6 px-2">
          {[
            { month: 'Apr', value: 45, max: 100 },
            { month: 'May', value: 62, max: 100 },
            { month: 'Jun', value: 78, max: 100 },
            { month: 'Jul', value: 95, max: 100 },
            { month: 'Aug', value: 110, max: 100 },
            { month: 'Sep', value: 135, max: 100 },
          ].map((bar, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <span className="text-[9px] font-bold text-slate-400">{bar.value}</span>
              <div
                className="w-full max-w-[28px] bg-gradient-to-t from-blue-700 to-indigo-500 rounded-t-lg transition-all duration-500"
                style={{ height: `${(bar.value / 135) * 80}%` }}
              ></div>
              <span className="text-[10px] font-semibold text-slate-500">{bar.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Citizen Satisfaction vs SLA Compliance */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-md">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          Department Governance Efficiency
        </h4>

        <div className="divide-y divide-slate-100 dark:divide-slate-700 text-xs">
          {departments.map((d) => (
            <div key={d.id} className="py-2.5 flex items-center justify-between">
              <div>
                <div className="font-extrabold text-slate-900 dark:text-white">{d.name}</div>
                <div className="text-[10px] text-slate-400">
                  Avg SLA: {d.avgResolutionHours}h • Total: {d.totalComplaints} tickets
                </div>
              </div>
              <div className="text-right">
                <span className="font-black text-emerald-600 text-sm">{d.trustScore}/100</span>
                <div className="text-[10px] text-amber-500 font-bold">★ {d.citizenSatisfaction} / 5.0</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
