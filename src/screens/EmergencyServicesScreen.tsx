import React, { useState } from 'react';
import {
  ShieldAlert,
  Flame,
  HeartPulse,
  UserCheck,
  Smile,
  Zap,
  Droplets,
  AlertTriangle,
  PhoneCall,
  MapPin,
  Navigation,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { EMERGENCY_SERVICES } from '../data/mockData';
import { EmergencyContact } from '../types';

export const EmergencyServicesScreen: React.FC = () => {
  const [selectedEmergency, setSelectedEmergency] = useState<EmergencyContact | null>(null);

  const getEmergencyIcon = (category: string) => {
    switch (category) {
      case 'Police':
        return ShieldAlert;
      case 'Fire':
        return Flame;
      case 'Ambulance':
        return HeartPulse;
      case 'Women Helpline':
        return UserCheck;
      case 'Child Helpline':
        return Smile;
      case 'Electricity':
        return Zap;
      case 'Water':
        return Droplets;
      case 'Disaster Management':
        return AlertTriangle;
      default:
        return PhoneCall;
    }
  };

  const getCardTheme = (category: string) => {
    switch (category) {
      case 'Police':
        return {
          bg: 'bg-blue-500/10 dark:bg-blue-950/30',
          border: 'border-blue-200 dark:border-blue-800',
          btn: 'bg-blue-600 hover:bg-blue-700',
          iconColor: 'text-blue-600 dark:text-blue-400',
        };
      case 'Fire':
      case 'Ambulance':
      case 'Women Helpline':
        return {
          bg: 'bg-rose-500/10 dark:bg-rose-950/30',
          border: 'border-rose-200 dark:border-rose-800',
          btn: 'bg-red-600 hover:bg-red-700',
          iconColor: 'text-red-600 dark:text-red-400',
        };
      case 'Child Helpline':
        return {
          bg: 'bg-amber-500/10 dark:bg-amber-950/30',
          border: 'border-amber-200 dark:border-amber-800',
          btn: 'bg-amber-600 hover:bg-amber-700',
          iconColor: 'text-amber-600 dark:text-amber-400',
        };
      case 'Electricity':
        return {
          bg: 'bg-yellow-500/10 dark:bg-yellow-950/30',
          border: 'border-yellow-200 dark:border-yellow-800',
          btn: 'bg-yellow-600 hover:bg-yellow-700',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
        };
      case 'Water':
        return {
          bg: 'bg-cyan-500/10 dark:bg-cyan-950/30',
          border: 'border-cyan-200 dark:border-cyan-800',
          btn: 'bg-cyan-600 hover:bg-cyan-700',
          iconColor: 'text-cyan-600 dark:text-cyan-400',
        };
      default:
        return {
          bg: 'bg-purple-500/10 dark:bg-purple-950/30',
          border: 'border-purple-200 dark:border-purple-800',
          btn: 'bg-purple-600 hover:bg-purple-700',
          iconColor: 'text-purple-600 dark:text-purple-400',
        };
    }
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4 fill-red-600 text-white" />
          <span>City Emergency Command Grid</span>
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
          Emergency Civic Services
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Direct lines to city first responders, utility disaster desks, and crisis cells.
        </p>
      </div>

      {/* Emergency Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {EMERGENCY_SERVICES.map((item) => {
          const Icon = getEmergencyIcon(item.category);
          const theme = getCardTheme(item.category);

          return (
            <div
              key={item.id}
              className={`p-4 rounded-3xl border transition-all ${theme.bg} ${theme.border} shadow-sm hover:shadow-md flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-xs">
                      <Icon className={`w-5 h-5 ${theme.iconColor}`} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <span className="text-sm font-black font-mono text-slate-900 dark:text-white bg-white/80 dark:bg-slate-800/80 px-2.5 py-1 rounded-xl shadow-2xs">
                    {item.number}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-xs">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{item.nearestStation}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 pl-4 truncate">
                    {item.address}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 pl-4 font-bold">
                    <Clock className="w-3 h-3" />
                    <span>Average Dispatch: {item.responseTime}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2">
                <a
                  href={`tel:${item.number}`}
                  className={`flex-1 py-2.5 rounded-xl ${theme.btn} text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-600/20 active:scale-98 transition`}
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call {item.number}</span>
                </a>

                <button
                  onClick={() => {
                    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      item.address
                    )}`;
                    window.open(url, '_blank');
                  }}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 shadow-2xs transition"
                  title="Navigate GPS"
                >
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
