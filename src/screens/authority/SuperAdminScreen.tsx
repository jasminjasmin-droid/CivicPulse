import React, { useState } from 'react';
import {
  Shield,
  Settings,
  Users,
  Building,
  FileText,
  AlertTriangle,
  RotateCcw,
  Plus,
  Trash2,
  Edit,
  Save,
  CheckCircle2,
  Layers,
  Database,
  Phone,
  BarChart,
  Lock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ROLE_DEFINITIONS, MOCK_USERS } from '../../data/mockData';
import { Role } from '../../types';

export const SuperAdminScreen: React.FC = () => {
  const {
    departments,
    complaints,
    isDemoMode,
    toggleDemoMode,
    resetAllDataToDefaults,
    switchRole,
    currentRole,
  } = useApp();

  const [adminTab, setAdminTab] = useState<'overview' | 'departments' | 'authorities' | 'sla_config'>('overview');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Super Admin Crest Header */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-5 text-white border border-slate-700/80 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Shield className="w-5 h-5 fill-white/20" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400">
                Super Administrator Master Console
              </span>
              <h2 className="text-lg font-black tracking-tight">System Operations & RBAC</h2>
            </div>
          </div>

          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Node Online
          </span>
        </div>

        {/* Quick System Stats */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800 text-center text-xs">
          <div>
            <div className="text-base font-black text-white">{Object.keys(ROLE_DEFINITIONS).length}</div>
            <div className="text-[9px] text-slate-400">RBAC Tiers</div>
          </div>
          <div>
            <div className="text-base font-black text-blue-400">{departments.length}</div>
            <div className="text-[9px] text-slate-400">Departments</div>
          </div>
          <div>
            <div className="text-base font-black text-amber-400">{complaints.length}</div>
            <div className="text-[9px] text-slate-400">Complaints</div>
          </div>
          <div>
            <div className="text-base font-black text-emerald-400">99.98%</div>
            <div className="text-[9px] text-slate-400">Uptime</div>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Navigation Pills */}
      <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold overflow-x-auto scrollbar-none">
        {[
          { id: 'overview', label: 'Overview', icon: Layers },
          { id: 'departments', label: 'Departments', icon: Building },
          { id: 'authorities', label: 'Authorities (10)', icon: Users },
          { id: 'sla_config', label: 'SLA Engine', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = adminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAdminTab(tab.id as any)}
              className={`flex-1 py-2 px-2.5 rounded-xl transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: Overview */}
      {adminTab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              System Diagnostics & Maintenance
            </h4>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Accelerated SLA Auto-Escalation
                </span>
                <p className="text-[11px] text-slate-400">
                  {isDemoMode ? '30s-120s rapid demo timer active' : 'Standard 2h-7d production timer'}
                </p>
              </div>
              <button
                onClick={toggleDemoMode}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs ${
                  isDemoMode ? 'bg-amber-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {isDemoMode ? 'Demo ON' : 'Turn ON'}
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Database Master Reset
                </span>
                <p className="text-[11px] text-slate-400">
                  Re-seed initial complaints, departments, and trust scorecards
                </p>
              </div>
              <button
                onClick={() => {
                  if (window.confirm('Reset all databases to defaults?')) {
                    resetAllDataToDefaults();
                    showNotification('Database successfully reset to initial seed state.');
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs"
              >
                Reset DB
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Departments */}
      {adminTab === 'departments' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Configured Municipal Departments ({departments.length})
            </h4>
            <button
              onClick={() => showNotification('Department configuration locked for demo.')}
              className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-xl border border-blue-200 dark:border-blue-800"
            >
              + Add Dept
            </button>
          </div>

          {departments.map((dept) => (
            <div
              key={dept.id}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs text-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="font-extrabold text-slate-900 dark:text-white">
                  {dept.name} ({dept.code})
                </div>
                <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full text-[10px]">
                  Trust: {dept.trustScore}/100
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                <strong>Chief:</strong> {dept.headOfficer} • <strong>Hotline:</strong> {dept.emergencyContact}
              </div>
              <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700">
                <span>Credits: +{dept.credits}</span>
                <span>•</span>
                <span>Penalties: -{dept.penaltyPoints}</span>
                <span>•</span>
                <span>Resolved: {dept.totalResolved}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Authorities (10 Roles) */}
      {adminTab === 'authorities' && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
            Configured Governance Authorities & Hierarchy (10 Levels)
          </h4>

          {Object.entries(ROLE_DEFINITIONS).map(([roleKey, info]) => {
            const mockUser = MOCK_USERS[roleKey as Role];
            const isCurrent = currentRole === roleKey;

            return (
              <div
                key={roleKey}
                className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 shrink-0">
                    {info.level === 99 ? '★' : `L${info.level}`}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {info.title}
                      {isCurrent && (
                        <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.2 rounded-full">
                          Logged In
                        </span>
                      )}
                    </h5>
                    <p className="text-[10px] text-slate-400">
                      Officer: {mockUser ? mockUser.name : 'System Assigned'} • {mockUser?.phone}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    switchRole(roleKey as Role);
                    showNotification(`Switched active view to ${info.shortTitle}`);
                  }}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-bold transition"
                >
                  Impersonate
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: SLA Engine Config */}
      {adminTab === 'sla_config' && (
        <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-3 text-xs">
          <h4 className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Configured SLA Tiers & Auto-Escalation Limits
          </h4>

          <div className="space-y-2">
            {[
              { priority: 'Critical', normal: '2 Hours', demo: '30 Seconds', color: 'text-red-600' },
              { priority: 'High', normal: '24 Hours', demo: '60 Seconds', color: 'text-orange-600' },
              { priority: 'Medium', normal: '3 Days', demo: '90 Seconds', color: 'text-amber-600' },
              { priority: 'Low', normal: '7 Days', demo: '120 Seconds', color: 'text-blue-600' },
            ].map((tier) => (
              <div
                key={tier.priority}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-between"
              >
                <div>
                  <span className={`font-black ${tier.color}`}>{tier.priority} Severity</span>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Standard: <strong>{tier.normal}</strong> • Demo: <strong>{tier.demo}</strong>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                  Auto-Escalates to Next Tier
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
