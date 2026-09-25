import React from 'react';
import {
  X,
  User,
  Shield,
  CheckCircle,
  Building,
  Award,
  Crown,
  Settings,
  Briefcase,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Role } from '../../types';
import { ROLE_DEFINITIONS } from '../../data/mockData';

interface RoleSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ isOpen, onClose }) => {
  const { currentRole, switchRole, isDemoMode, toggleDemoMode } = useApp();

  if (!isOpen) return null;

  const roleKeys = Object.keys(ROLE_DEFINITIONS) as Role[];

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'citizen':
        return User;
      case 'ward_officer':
      case 'junior_engineer':
        return Briefcase;
      case 'department_officer':
        return Building;
      case 'municipal_commissioner':
        return Award;
      case 'district_collector':
        return Shield;
      case 'state_secretary':
        return Building;
      case 'minister':
        return Crown;
      case 'cm_grievance_cell':
        return Crown;
      case 'super_admin':
        return Settings;
      default:
        return User;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur">
              <Shield className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">Role-Based Access Control (RBAC)</h3>
              <p className="text-[11px] text-blue-100">
                Switch between 10 government governance levels
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Fast Mode Banner inside switcher */}
        <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200">
            <Zap className="w-4 h-4 text-amber-600 shrink-0 fill-amber-600" />
            <span className="font-medium text-[11px]">
              Demo Escalation Mode: {isDemoMode ? '30s-120s SLAs' : 'Standard 2h-7d SLAs'}
            </span>
          </div>
          <button
            onClick={toggleDemoMode}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition shadow-xs ${
              isDemoMode
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-white dark:bg-slate-800 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
            }`}
          >
            {isDemoMode ? 'Turn OFF Demo' : 'Enable Demo SLAs'}
          </button>
        </div>

        {/* Role List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {roleKeys.map((role) => {
            const info = ROLE_DEFINITIONS[role];
            const isSelected = currentRole === role;
            const IconComponent = getRoleIcon(role);

            return (
              <div
                key={role}
                onClick={() => {
                  switchRole(role);
                  onClose();
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  isSelected
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-blue-50/30 hover:border-blue-300'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      {info.title}
                      {role === 'cm_grievance_cell' && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-red-600 text-white font-extrabold uppercase">
                          APEX
                        </span>
                      )}
                    </h4>
                    {isSelected && (
                      <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {info.description}
                  </p>
                  {info.department && (
                    <span className="inline-block mt-1 text-[9px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700/60 px-2 py-0.5 rounded-full">
                      {info.department}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
