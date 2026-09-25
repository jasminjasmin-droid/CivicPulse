import React, { useState } from 'react';
import {
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Filter,
  BarChart3,
  Camera,
  Upload,
  ArrowRight,
  TrendingUp,
  Building,
  User,
  Zap,
  Phone,
  Layers,
  FileCheck,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ROLE_DEFINITIONS } from '../../data/mockData';
import { Complaint, Role, GpsTag } from '../../types';
import { CameraCaptureModal } from '../../components/common/CameraCaptureModal';
import { calculateDistanceMeters } from '../../services/aiService';

export const AuthorityDashboardScreen: React.FC = () => {
  const {
    currentRole,
    currentUser,
    complaints,
    departments,
    markComplaintResolved,
    triggerManualEscalation,
    setSelectedComplaintId,
    setActiveTab,
    isDemoMode,
  } = useApp();

  const roleInfo = ROLE_DEFINITIONS[currentRole];

  // Filtering complaints for this authority level
  const assignedComplaints = complaints.filter((c) => {
    // Super admin & CMPGC see all complaints
    if (currentRole === 'super_admin' || currentRole === 'cm_grievance_cell') return true;
    // Commissioner, Collector, State Secretary, Minister see escalations at or below their level
    if (roleInfo.level >= 3) return true;
    // Ward Officer & Junior Engineer see Ward 42 or directly assigned tickets
    return c.assignedToRole === currentRole || c.currentEscalationLevel === roleInfo.level;
  });

  const [filterTab, setFilterTab] = useState<'All' | 'Pending' | 'Escalated' | 'Resolved'>('All');
  const [resolvingTicket, setResolvingTicket] = useState<Complaint | null>(null);
  const [isAuthorityCameraOpen, setIsAuthorityCameraOpen] = useState(false);
  const [authorityCapturedPhoto, setAuthorityCapturedPhoto] = useState<string | null>(null);
  const [authorityGpsTag, setAuthorityGpsTag] = useState<GpsTag | null>(null);
  const [workNotes, setWorkNotes] = useState<string>(
    'Field repair completed with high-density cold mix asphalt and steam roller compaction.'
  );

  const pendingCount = assignedComplaints.filter((c) =>
    ['Submitted', 'Assigned', 'In Progress'].includes(c.status)
  ).length;
  const escalatedCount = assignedComplaints.filter((c) =>
    c.isEscalated || c.status === 'Escalated'
  ).length;
  const resolvedCount = assignedComplaints.filter((c) =>
    ['Resolved', 'Awaiting Verification', 'Closed'].includes(c.status)
  ).length;

  const displayedComplaints = assignedComplaints.filter((c) => {
    if (filterTab === 'Pending') return ['Submitted', 'Assigned', 'In Progress'].includes(c.status);
    if (filterTab === 'Escalated') return c.isEscalated || c.status === 'Escalated';
    if (filterTab === 'Resolved') return ['Resolved', 'Awaiting Verification', 'Closed'].includes(c.status);
    return true;
  });

  const handleOpenResolveModal = (comp: Complaint) => {
    setResolvingTicket(comp);
    setAuthorityCapturedPhoto(null);
    setAuthorityGpsTag(null);
    setWorkNotes('Field repairs executed per municipal specifications. Site cleared and sanitized.');
  };

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingTicket || !authorityCapturedPhoto) return;

    markComplaintResolved(
      resolvingTicket.id,
      authorityCapturedPhoto,
      workNotes,
      authorityGpsTag || undefined
    );
    setResolvingTicket(null);
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Official Authority Designation Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-5 text-white shadow-xl border border-slate-700/60">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
              Government Executive Desk • Level {roleInfo.level}
            </span>
            <button
              onClick={() => setActiveTab('analytics')}
              className="flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-400/20 hover:bg-amber-400/30 px-2.5 py-1 rounded-full border border-amber-300/30 transition"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>BI Analytics</span>
            </button>
          </div>

          <h2 className="text-xl font-black mt-2 tracking-tight flex items-center gap-2">
            <span>{currentUser.name}</span>
            {roleInfo.level >= 6 && <span className="text-amber-400">👑</span>}
          </h2>
          <p className="text-xs text-blue-200 mt-0.5">{roleInfo.title}</p>
          <div className="text-[11px] text-slate-400 mt-1">
            {roleInfo.department || 'State Governance Administration'}
          </div>

          {/* Authority Metrics */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/10 text-center">
            <div className="bg-white/5 rounded-2xl p-2 backdrop-blur-xs">
              <div className="text-base font-extrabold text-blue-400">{pendingCount}</div>
              <div className="text-[10px] text-slate-300">Pending Fieldwork</div>
            </div>
            <div className="bg-white/5 rounded-2xl p-2 backdrop-blur-xs">
              <div className="text-base font-extrabold text-red-400">{escalatedCount}</div>
              <div className="text-[10px] text-slate-300">Escalated Tier</div>
            </div>
            <div className="bg-white/5 rounded-2xl p-2 backdrop-blur-xs">
              <div className="text-base font-extrabold text-emerald-400">{resolvedCount}</div>
              <div className="text-[10px] text-slate-300">Resolved / Verif</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
        {(['All', 'Pending', 'Escalated', 'Resolved'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`flex-1 py-2 rounded-xl transition ${
              filterTab === tab
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Assigned Complaints Queue */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Assigned Action Queue ({displayedComplaints.length})
          </h3>
          <span className="text-[10px] text-blue-600 font-semibold">
            Auto-Escalation Monitored
          </span>
        </div>

        {displayedComplaints.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
            No complaints currently pending in this filter category.
          </div>
        ) : (
          displayedComplaints.map((comp) => {
            const isEsc = comp.isEscalated || comp.status === 'Escalated';
            const canResolve = ['Submitted', 'Assigned', 'In Progress', 'Escalated'].includes(
              comp.status
            );

            return (
              <div
                key={comp.id}
                className="p-4 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs hover:shadow-md transition-all space-y-3"
              >
                {/* Top Badge & ID */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {comp.category}
                    </span>
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white mt-1 leading-snug">
                      {comp.title}
                    </h4>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono font-bold text-slate-400 block">
                      {comp.id}
                    </span>
                    <span
                      className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full mt-0.5 ${
                        isEsc
                          ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 animate-pulse'
                          : comp.status === 'Awaiting Verification'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      {comp.status}
                    </span>
                  </div>
                </div>

                {/* Complaint Image Thumbnail & Location */}
                <div className="flex items-center gap-3">
                  <img
                    src={comp.beforeImageUrl}
                    alt="before"
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                  <div className="flex-1 min-w-0 text-xs">
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                      {comp.description}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                      <span>{comp.location.ward}</span>
                      <span>•</span>
                      <span className="font-bold text-red-500">{comp.priority} Priority</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons for Authorities */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedComplaintId(comp.id);
                      setActiveTab('track');
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  >
                    View Timeline
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Demo Escalate */}
                    {canResolve && (
                      <button
                        onClick={() => triggerManualEscalation(comp.id, 'Officer Initiated Escalation')}
                        className="px-2.5 py-1.5 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 hover:bg-red-200 text-[10px] font-bold transition flex items-center gap-1"
                        title="Escalate to Next Higher Authority Level"
                      >
                        <AlertTriangle className="w-3 h-3 text-red-600" />
                        <span>Escalate Up</span>
                      </button>
                    )}

                    {/* Resolve Button: Opens Live Camera capture dialog */}
                    {canResolve && (
                      <button
                        onClick={() => handleOpenResolveModal(comp)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Complete & Resolve</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Resolution Dialog Modal (Authority captures Live GPS-tagged After Photo) */}
      {resolvingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Submit Resolution Proof: {resolvingTicket.id}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Live camera capture required • Anti-fraud GPS check
                  </p>
                </div>
              </div>
              <button
                onClick={() => setResolvingTicket(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-3">
              {/* Camera Photo Capture Area */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Live "After Work" Completion Photo *</span>
                  <span className="text-[10px] font-extrabold text-rose-500 uppercase">Camera Only</span>
                </label>

                {!authorityCapturedPhoto ? (
                  <button
                    type="button"
                    onClick={() => setIsAuthorityCameraOpen(true)}
                    className="w-full py-7 border-2 border-dashed border-emerald-400 dark:border-emerald-600/60 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/40 transition flex flex-col items-center justify-center gap-2 group cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 block">
                        Open In-App Camera (GPS Tagged)
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Gallery disabled • Watermarked with live coordinates & time
                      </span>
                    </div>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="h-44 rounded-2xl overflow-hidden border-2 border-emerald-500 relative shadow-inner">
                      <img
                        src={authorityCapturedPhoto}
                        alt="After Work"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setIsAuthorityCameraOpen(true)}
                        className="absolute bottom-2 right-2 px-2.5 py-1 rounded-xl bg-slate-950/80 text-white text-[10px] font-bold cursor-pointer backdrop-blur flex items-center gap-1 shadow-md hover:bg-slate-900"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Retake Photo</span>
                      </button>
                    </div>

                    {/* GPS Distance Validation Check */}
                    {authorityGpsTag && (() => {
                      const distFromSite = calculateDistanceMeters(
                        resolvingTicket.location.lat,
                        resolvingTicket.location.lng,
                        authorityGpsTag.lat,
                        authorityGpsTag.lng
                      );
                      const isWithin100m = distFromSite <= 100;

                      return (
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-blue-500" />
                              <span>Officer GPS Tag:</span>
                            </span>
                            <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                              [{authorityGpsTag.lat.toFixed(4)}, {authorityGpsTag.lng.toFixed(4)}] (±{authorityGpsTag.accuracy}m)
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-600 dark:text-slate-300">
                              Distance from Grievance Site:
                            </span>
                            <span className={`font-black ${isWithin100m ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                              {distFromSite} meters
                            </span>
                          </div>

                          <div
                            className={`p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
                              isWithin100m
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                            }`}
                          >
                            {isWithin100m ? (
                              <>✓ Verified: Photo taken within permitted 100m perimeter.</>
                            ) : (
                              <>⚠️ Site Notice: Photo captured {distFromSite}m away (&gt;100m). Citizen on-site check will audit this coordinate.</>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Officer Completion Notes *
                </label>
                <textarea
                  required
                  rows={3}
                  value={workNotes}
                  onChange={(e) => setWorkNotes(e.target.value)}
                  placeholder="Describe materials used, compaction, clearing, and testing performed..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                ></textarea>
              </div>

              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-[10px] text-blue-800 dark:text-blue-300 leading-relaxed">
                <strong>Next Step:</strong> Once submitted, grievance moves to <em>"Awaiting Verification"</em>. Citizen will visit site, take a live verification photo, and confirm work before final closure.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResolvingTicket(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!authorityCapturedPhoto || workNotes.trim().length < 5}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit for Citizen Verification</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live Camera Modal for Authority */}
      {resolvingTicket && (
        <CameraCaptureModal
          isOpen={isAuthorityCameraOpen}
          onClose={() => setIsAuthorityCameraOpen(false)}
          title={`Resolution Photo: ${resolvingTicket.id}`}
          expectedCoords={{ lat: resolvingTicket.location.lat, lng: resolvingTicket.location.lng }}
          onCapture={(imageUrl, gpsTag) => {
            setAuthorityCapturedPhoto(imageUrl);
            setAuthorityGpsTag(gpsTag);
            setIsAuthorityCameraOpen(false);
          }}
        />
      )}
    </div>
  );
};
