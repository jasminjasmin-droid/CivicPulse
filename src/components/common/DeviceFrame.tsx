import React from 'react';
import { Smartphone, Monitor, Shield, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DeviceFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { deviceMode, toggleDeviceMode, theme } = useApp();

  if (deviceMode === 'desktop') {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
        {/* Top Control Bar */}
        <div className="bg-slate-950 border-b border-slate-800 px-4 py-2 flex items-center justify-between z-50 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-semibold tracking-wide text-slate-300">
              CivicPulse OS v2.4 (Enterprise Smart City Deployment)
            </span>
          </div>
          <button
            onClick={toggleDeviceMode}
            className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-medium transition shadow-sm"
          >
            <Smartphone className="w-3.5 h-3.5" />
            Switch to Mobile App View
          </button>
        </div>
        <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 min-h-[85vh]">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Mobile Device Frame Mode
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-0 sm:p-4 md:p-6 font-sans">
      {/* Floating View Switcher pill for reviewers */}
      <div className="hidden sm:flex items-center justify-between max-w-[430px] w-full mb-3 px-3 py-1.5 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-full text-xs text-slate-300 shadow-lg z-40">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-medium text-[11px] text-slate-200">Mobile Simulator (412×915 MD3)</span>
        </div>
        <button
          onClick={toggleDeviceMode}
          className="flex items-center gap-1 px-2.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 rounded-full font-medium transition text-[11px]"
        >
          <Monitor className="w-3 h-3" />
          Full Screen View
        </button>
      </div>

      {/* Realistic Mobile Device Mockup */}
      <div className="w-full sm:max-w-[420px] h-[100dvh] sm:h-[880px] sm:max-h-[92vh] bg-white dark:bg-slate-900 sm:rounded-[44px] sm:border-[9px] sm:border-slate-800 sm:ring-1 sm:ring-slate-700 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] flex flex-col relative overflow-hidden">
        {/* Device Hardware Top: Speaker & Camera Notch */}
        <div className="hidden sm:flex absolute top-0 left-0 right-0 h-6 items-center justify-center pointer-events-none z-50">
          <div className="w-28 h-4 bg-slate-900 rounded-b-xl flex items-center justify-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-800 ring-1 ring-slate-700"></div>
            <div className="w-8 h-1 bg-slate-800 rounded-full"></div>
          </div>
        </div>

        {/* Mobile Status Bar */}
        <div className="pt-2 px-5 pb-1 flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 backdrop-blur z-40 select-none">
          <span>9:41</span>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span>5G</span>
            <div className="flex gap-0.5 items-end h-2.5">
              <span className="w-0.5 h-1 bg-current rounded-full"></span>
              <span className="w-0.5 h-1.5 bg-current rounded-full"></span>
              <span className="w-0.5 h-2 bg-current rounded-full"></span>
              <span className="w-0.5 h-2.5 bg-current rounded-full"></span>
            </div>
            <div className="w-4 h-2 border border-current rounded-sm flex items-center p-0.5">
              <div className="w-full h-full bg-current rounded-2xs"></div>
            </div>
          </div>
        </div>

        {/* App Main Viewport */}
        <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative">
          {children}
        </div>

        {/* Device Bottom Home Bar Indicator */}
        <div className="hidden sm:flex py-1.5 items-center justify-center bg-white dark:bg-slate-900 z-40 select-none">
          <div className="w-32 h-1 bg-slate-400 dark:bg-slate-600 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
