import React, { useState } from 'react';
import { Zap, Clock, AlertTriangle, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DemoSpeedControls: React.FC = () => {
  const {
    isDemoMode,
    toggleDemoMode,
    complaints,
    triggerManualEscalation,
    resetAllDataToDefaults,
  } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);

  // Find the first non-resolved complaint to test escalation on
  const activeTicket = complaints.find(
    (c) => ['Submitted', 'Assigned', 'In Progress'].includes(c.status)
  );

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-amber-600/15 to-orange-500/10 dark:from-amber-950/40 dark:to-orange-950/30 border-y border-amber-300/40 dark:border-amber-700/40 px-3 py-1.5 transition-all text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isDemoMode ? 'bg-amber-500' : 'bg-blue-500'
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isDemoMode ? 'bg-amber-600' : 'bg-blue-600'
              }`}
            ></span>
          </span>
          <span className="font-bold text-[11px] text-amber-900 dark:text-amber-200">
            {isDemoMode ? '⚡ Demo Mode Active (30s Escalations)' : 'Standard SLA Engine (2h–7d)'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleDemoMode}
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition shadow-2xs ${
              isDemoMode
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
            }`}
          >
            {isDemoMode ? 'Demo ON' : 'Turn Demo ON'}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-amber-200/60 dark:border-amber-800/60 flex flex-wrap items-center justify-between gap-2 animate-in fade-in duration-150">
          <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight">
            In Demo Mode, complaints auto-escalate across all 7 hierarchy tiers every 30–60 seconds!
          </p>

          <div className="flex items-center gap-2">
            {activeTicket && (
              <button
                onClick={() =>
                  triggerManualEscalation(
                    activeTicket.id,
                    'Evaluator Demo Trigger: Instant Escalation Test'
                  )
                }
                className="flex items-center gap-1 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[10px] transition shadow-xs"
              >
                <AlertTriangle className="w-3 h-3" />
                Force Escalate [{activeTicket.id}]
              </button>
            )}

            <button
              onClick={() => {
                if (window.confirm('Reset all complaints and trust scores back to original seed data?')) {
                  resetAllDataToDefaults();
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-lg font-semibold text-[10px] transition"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
