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
  Lock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Role } from '../../types';
import { ROLE_DEFINITIONS } from '../../data/mockData';

interface RoleSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ isOpen, onClose }) => {
  const { currentRole, switchRole, isDemoMode, toggleDemoMode, apiUser } = useApp();

  if (!isOpen) return null;

  const isCitizenAccount = apiUser?.role === 'citizen';
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
        <div className="p-4 bg-gradient-to-r from-[#1565C0] via-[#1976D2] to-[#0D47A1] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur">
              <Shield className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">Role-Based Access Control (RBAC)</h3>
              <p className="text-[11px] text-blue-100">
                CivicPulse Authentication & Security Status
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

        {/* Security Notice for Citizen Account */}
        {isCitizenAccount && (
          <div className="px-4 py-3 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <span className="font-bold">Backend RBAC Enforced:</span> You are authenticated with a verified Citizen account (<strong>{apiUser?.email}</strong>). Public citizens cannot access authority or administrator privileges.
            </div>
          </div>
        )}

        {/* Role List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {roleKeys.map((role) => {
            const info = ROLE_DEFINITIONS[role];
            const isSelected = (apiUser?.role === 'citizen' ? role === 'citizen' : currentRole === role);
            const isRestricted = isCitizenAccount && role !== 'citizen';
            const IconComponent = getRoleIcon(role);

            return (
              <div
                key={role}
                onClick={() => {
                  if (isRestricted) return;
                  switchRole(role);
                  onClose();
                }}
                className={`p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                  isRestricted
                    ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
                    : isSelected
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 shadow-sm ring-2 ring-blue-500/20 cursor-pointer'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-blue-50/30 hover:border-blue-300 cursor-pointer'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'bg-[#1565C0] text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      {info.title}
                      {isRestricted && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                          Staff Only
                        </span>
                      )}
                    </h4>
                    {isSelected && (
                      <CheckCircle className="w-4 h-4 text-[#1565C0] dark:text-blue-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {info.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
