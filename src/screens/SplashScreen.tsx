import React, { useEffect, useState } from 'react';
import { Shield, Sparkles, ArrowRight } from 'lucide-react';

export const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFading(true);
      setTimeout(onComplete, 400);
    }, 2800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleSkip = () => {
    setFading(true);
    setTimeout(onComplete, 200);
  };

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-50 flex flex-col justify-between bg-gradient-to-b from-blue-900 via-blue-800 to-indigo-950 text-white select-none transition-opacity duration-400 cursor-pointer ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Top Gov Header */}
      <div className="pt-8 px-6 text-center animate-in fade-in slide-in-from-top duration-700">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs font-semibold tracking-wide uppercase">
          <Shield className="w-3.5 h-3.5 text-amber-400" />
          <span>Government of India • Ministry of Urban Affairs</span>
        </div>
      </div>

      {/* Center Branding */}
      <div className="px-6 flex flex-col items-center text-center animate-in zoom-in-90 fade-in duration-800">
        {/* CivicPulse Emblem */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-600 via-blue-500 to-amber-400 flex items-center justify-center shadow-2xl shadow-blue-500/50 ring-4 ring-white/20">
            <Shield className="w-13 h-13 text-white fill-white/15" />
          </div>
          <div className="absolute -top-2 -right-2 p-1.5 rounded-full bg-amber-400 text-blue-950 shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-1">
          Civic<span className="text-amber-400">Pulse</span>
        </h1>

        <div className="mt-2 inline-block px-3 py-0.5 rounded-md bg-blue-500/30 text-[11px] font-bold tracking-widest text-blue-200 uppercase border border-blue-400/30">
          Smart Civic Governance Platform
        </div>

        {/* Tagline */}
        <p className="mt-5 text-sm sm:text-base font-medium text-blue-100 max-w-xs leading-relaxed italic">
          "Report. Track. Verify. Transform Governance."
        </p>

        {/* Loading Spinner Dots */}
        <div className="mt-8 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          <span className="w-2 h-2 rounded-full bg-white/80 animate-pulse delay-100"></span>
          <span className="w-2 h-2 rounded-full bg-blue-300 animate-pulse delay-200"></span>
        </div>
      </div>

      {/* Bottom City Skyline Illustration */}
      <div className="relative w-full">
        {/* City Vector Silhouette */}
        <svg
          className="w-full h-32 sm:h-40 text-blue-950/70 fill-current -mb-1"
          viewBox="0 0 1200 300"
          preserveAspectRatio="none"
        >
          {/* Bridge arches & buildings */}
          <path d="M0,300 L0,220 L40,220 L40,160 L70,160 L70,220 L120,220 L120,130 L160,130 L160,80 L180,80 L180,130 L220,130 L220,220 L270,220 L270,180 L310,180 L310,220 L350,220 L350,90 L390,90 L390,220 L450,220 L450,140 L490,140 L490,220 L530,220 L530,60 L560,60 L560,220 L610,220 L610,150 L650,150 L650,220 L720,220 L720,110 L760,110 L760,220 L810,220 L810,70 L850,70 L850,220 L920,220 L920,160 L960,160 L960,220 L1020,220 L1020,120 L1070,120 L1070,220 L1140,220 L1140,170 L1200,170 L1200,300 Z" />
          <path
            opacity="0.4"
            d="M0,300 L0,250 L60,250 L60,190 L100,190 L100,250 L180,250 L180,150 L220,150 L220,250 L300,250 L300,170 L340,170 L340,250 L420,250 L420,110 L460,110 L460,250 L580,250 L580,180 L620,180 L620,250 L750,250 L750,140 L790,140 L790,250 L900,250 L900,190 L950,190 L950,250 L1050,250 L1050,130 L1090,130 L1090,250 L1200,250 L1200,300 Z"
          />
        </svg>

        <div className="pb-6 text-center">
          <span className="text-[11px] text-blue-200/80 font-medium flex items-center justify-center gap-1">
            Tap anywhere to launch <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
};
