import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Shield,
  Building,
  User,
  ArrowRight,
  Zap,
  MapPin,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  Phone,
  Camera,
  RefreshCw,
  FileCheck,
  Check,
  CheckCheck,
  Navigation,
  Compass,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Complaint, ComplaintStatus, Role, GpsTag } from '../types';
import { ROLE_DEFINITIONS } from '../data/mockData';
import { CameraCaptureModal } from '../components/common/CameraCaptureModal';
import { calculateDistanceMeters } from '../services/aiService';

export const TrackScreen: React.FC = () => {
  const {
    complaints,
    selectedComplaintId,
    setSelectedComplaintId,
    triggerManualEscalation,
    verifyComplaintByCitizen,
    currentRole,
    isDemoMode,
    language,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [rejectFeedback, setRejectFeedback] = useState<string>('');
  const [showRejectBox, setShowRejectBox] = useState<boolean>(false);
  const [isCitizenCameraOpen, setIsCitizenCameraOpen] = useState<boolean>(false);
  const [citizenCapturedPhoto, setCitizenCapturedPhoto] = useState<string | null>(null);
  const [citizenGpsTag, setCitizenGpsTag] = useState<GpsTag | null>(null);
  const [citizenNotes, setCitizenNotes] = useState<string>('Citizen physically inspected repair site. Work completed satisfactorily.');

  // Reset verification draft when switching complaints
  useEffect(() => {
    setCitizenCapturedPhoto(null);
    setCitizenGpsTag(null);
    setCitizenNotes('Citizen physically inspected repair site. Work completed satisfactorily.');
    setRejectFeedback('');
    setShowRejectBox(false);
  }, [selectedComplaintId]);

  // Filter complaints
  const filtered = complaints.filter((c) => {
    const matchesSearch =
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'All'
        ? true
        : statusFilter === 'Active'
        ? ['Submitted', 'Assigned', 'In Progress', 'Escalated'].includes(c.status)
        : statusFilter === 'Verification'
        ? c.status === 'Awaiting Verification'
        : ['Resolved', 'Closed'].includes(c.status);

    return matchesSearch && matchesStatus;
  });

  const selectedComplaint = complaints.find((c) => c.id === selectedComplaintId) || complaints[0];

  // SLA Time Remaining calculation
  const getSlaStatus = (c: Complaint) => {
    const expiry = new Date(c.slaExpiresAt).getTime();
    const now = Date.now();
    const diffMs = expiry - now;

    if (['Resolved', 'Awaiting Verification', 'Closed'].includes(c.status)) {
      return { text: 'SLA Complied & Resolved', color: 'text-emerald-600', isBreached: false };
    }

    if (diffMs <= 0) {
      return { text: 'SLA BREACHED (Auto-Escalating)', color: 'text-red-600', isBreached: true };
    }

    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    if (isDemoMode) {
      return { text: `${minutes}m ${seconds}s SLA deadline`, color: 'text-amber-600', isBreached: false };
    }

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return { text: `${days}d ${hours % 24}h SLA deadline`, color: 'text-blue-600', isBreached: false };
    }
    return { text: `${hours}h ${minutes % 60}m SLA deadline`, color: 'text-amber-600', isBreached: false };
  };

  // Timeline Step definition
  const TIMELINE_STEPS = [
    { key: 'Submitted', label: 'Submitted' },
    { key: 'Assigned', label: 'Assigned' },
    { key: 'In Progress', label: 'In Progress' },
    { key: 'Resolved', label: 'Resolved' },
    { key: 'Awaiting Verification', label: 'Citizen Verification' },
    { key: 'Closed', label: 'Closed' },
  ];

  const getStepProgressIndex = (status: ComplaintStatus) => {
    switch (status) {
      case 'Submitted':
        return 0;
      case 'Assigned':
        return 1;
      case 'In Progress':
      case 'Escalated':
        return 2;
      case 'Resolved':
        return 3;
      case 'Awaiting Verification':
        return 4;
      case 'Closed':
        return 5;
      default:
        return 0;
    }
  };

  const slaInfo = selectedComplaint ? getSlaStatus(selectedComplaint) : null;
  const currentStepIdx = selectedComplaint ? getStepProgressIndex(selectedComplaint.status) : 0;

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Search & Filter Header */}
      <div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
          {language === 'en' ? 'Grievance Tracking & SLA' : 'शिकायत ट्रैकिंग और एसएलए'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Transparent real-time escalation tracking through the government hierarchy
        </p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID (e.g. CP-2026-8941)..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs font-semibold px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="All">All Status</option>
          <option value="Active">Active SLA</option>
          <option value="Verification">Needs Verification</option>
          <option value="Resolved">Resolved</option>
        </select>
      </div>

      {/* Horizontal Complaint Selector Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filtered.map((c) => {
          const isSelected = selectedComplaint?.id === c.id;
          const isEsc = c.isEscalated || c.status === 'Escalated';
          return (
            <button
              key={c.id}
              onClick={() => setSelectedComplaintId(c.id)}
              className={`shrink-0 px-3 py-2 rounded-2xl border text-left transition ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400/30'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-blue-400'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[11px] font-bold ${isSelected ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`}>
                  {c.id}
                </span>
                {isEsc && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-red-500 text-white">
                    L-{c.currentEscalationLevel}
                  </span>
                )}
              </div>
              <div className={`text-[10px] mt-0.5 truncate max-w-[140px] ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                {c.category}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Selected Complaint Detail View */}
      {selectedComplaint ? (
        <div className="space-y-4">
          {/* Main Status & SLA Banner */}
          <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-md">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                  {selectedComplaint.category}
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mt-1.5 leading-snug">
                  {selectedComplaint.title}
                </h3>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-mono text-slate-400 block">{selectedComplaint.id}</span>
                <span
                  className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full mt-1 ${
                    selectedComplaint.status === 'Escalated'
                      ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 animate-pulse'
                      : selectedComplaint.status === 'Awaiting Verification'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  }`}
                >
                  {selectedComplaint.status}
                </span>
              </div>
            </div>

            {/* SLA Clock Bar */}
            <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${slaInfo?.color}`} />
                <span className={`font-bold ${slaInfo?.color}`}>{slaInfo?.text}</span>
              </div>

              {/* Demo Fast Escalation Button */}
              {['Submitted', 'Assigned', 'In Progress', 'Escalated'].includes(selectedComplaint.status) && (
                <button
                  onClick={() => triggerManualEscalation(selectedComplaint.id, 'Judge Demo Escalation')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] shadow-xs transition"
                >
                  <Zap className="w-3 h-3 fill-white" />
                  <span>Escalate (Demo)</span>
                </button>
              )}
            </div>

            {/* Assigned Authority Profile Box */}
            <div className="mt-3 p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  L-{selectedComplaint.currentEscalationLevel}
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Responsible Authority (Tier {selectedComplaint.currentEscalationLevel})
                  </div>
                  <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                    {selectedComplaint.assignedOfficerName}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    {selectedComplaint.department}
                  </div>
                </div>
              </div>

              <a
                href={`tel:${selectedComplaint.assignedOfficerContact}`}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 shadow-2xs"
                title="Call Officer"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* 1. CITIZEN RESOLUTION VERIFICATION PANEL (Active when status === 'Awaiting Verification') */}
          {selectedComplaint.status === 'Awaiting Verification' && (() => {
            const authDist = selectedComplaint.authorityResolutionMetadata
              ? calculateDistanceMeters(
                  selectedComplaint.location.lat,
                  selectedComplaint.location.lng,
                  selectedComplaint.authorityResolutionMetadata.lat,
                  selectedComplaint.authorityResolutionMetadata.lng
                )
              : 4;

            const citDist = citizenGpsTag
              ? calculateDistanceMeters(
                  selectedComplaint.location.lat,
                  selectedComplaint.location.lng,
                  citizenGpsTag.lat,
                  citizenGpsTag.lng
                )
              : null;

            const isCitizenWithin100m = citDist !== null ? citDist <= 100 : true;

            return (
              <div className="bg-gradient-to-br from-blue-50 via-teal-50/40 to-emerald-50/60 dark:from-slate-900 dark:via-blue-950/40 dark:to-emerald-950/40 border-2 border-emerald-500 rounded-3xl p-4 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 border-b border-emerald-200/80 dark:border-emerald-800/80 pb-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Citizen Triple-Photo Verification</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-snug">
                      Official work finished by <strong>{selectedComplaint.department}</strong>. Under smart governance anti-fraud rules, citizens must inspect the site and capture a live camera photo within 100m.
                    </p>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0 shadow-2xs">
                    Verification Pending
                  </span>
                </div>

                {/* Triple-Photo Comparison Display */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Photo 1: Citizen Before Photo */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-2.5 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase text-slate-500">1. Citizen Before Photo</span>
                      <span className="text-[9px] font-mono text-slate-400">Original Site</span>
                    </div>
                    <div className="h-36 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative">
                      <img
                        src={selectedComplaint.beforeImageUrl}
                        alt="Before Work"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5">
                      <div className="flex items-center gap-1 font-mono">
                        <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                        <span>
                          {(selectedComplaint.beforePhotoMetadata?.lat ?? selectedComplaint.location.lat).toFixed(4)},{' '}
                          {(selectedComplaint.beforePhotoMetadata?.lng ?? selectedComplaint.location.lng).toFixed(4)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>
                          {new Date(selectedComplaint.submittedAt).toLocaleString([], {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Photo 2: Authority Resolution Photo */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-2.5 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase text-blue-600 dark:text-blue-400">
                        2. Authority Fix Photo
                      </span>
                      <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {authDist}m from site
                      </span>
                    </div>
                    <div className="h-36 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative">
                      <img
                        src={selectedComplaint.afterImageUrl || selectedComplaint.beforeImageUrl}
                        alt="Authority Resolution"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5">
                      <div className="flex items-center gap-1 font-mono">
                        <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span>
                          {(selectedComplaint.authorityResolutionMetadata?.lat ?? selectedComplaint.location.lat).toFixed(4)},{' '}
                          {(selectedComplaint.authorityResolutionMetadata?.lng ?? selectedComplaint.location.lng).toFixed(4)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>
                          {new Date(selectedComplaint.resolvedAt || selectedComplaint.updatedAt).toLocaleString([], {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                    </div>
                    {selectedComplaint.workNotes && (
                      <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 text-[10px] text-slate-600 dark:text-slate-300 italic border border-slate-100 dark:border-slate-800 line-clamp-2">
                        "{selectedComplaint.workNotes}"
                      </div>
                    )}
                  </div>

                  {/* Photo 3: Citizen Live Inspection Photo */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-2.5 border-2 border-dashed border-emerald-400 dark:border-emerald-600/80 shadow-2xs space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400">
                          3. Citizen Inspection
                        </span>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                          Camera Only
                        </span>
                      </div>

                      {!citizenCapturedPhoto ? (
                        <div className="h-36 mt-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 flex flex-col items-center justify-center p-3 text-center">
                          <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs mb-2">
                            <Camera className="w-5 h-5" />
                          </div>
                          <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                            Live On-Site Capture
                          </p>
                          <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Gallery disabled • GPS validated
                          </p>
                        </div>
                      ) : (
                        <div className="mt-2 space-y-1.5">
                          <div className="h-36 rounded-xl overflow-hidden border-2 border-emerald-500 relative">
                            <img
                              src={citizenCapturedPhoto}
                              alt="Citizen Verification"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => setIsCitizenCameraOpen(true)}
                              className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-lg bg-slate-950/80 text-white text-[9px] font-bold backdrop-blur flex items-center gap-1 hover:bg-slate-900"
                            >
                              <RefreshCw className="w-2.5 h-2.5" />
                              <span>Retake</span>
                            </button>
                          </div>
                          {citizenGpsTag && (
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5">
                              <div className="flex items-center gap-1 font-mono">
                                <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                                <span>
                                  {citizenGpsTag.lat.toFixed(4)}, {citizenGpsTag.lng.toFixed(4)} (±{citizenGpsTag.accuracy}m)
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>
                                  {new Date(citizenGpsTag.timestamp).toLocaleString([], {
                                    dateStyle: 'short',
                                    timeStyle: 'short',
                                  })}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {!citizenCapturedPhoto && (
                      <button
                        type="button"
                        onClick={() => setIsCitizenCameraOpen(true)}
                        className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Capture Live Verification Photo</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* GPS Validation & 100m Radius Triangulation Audit */}
                {citizenGpsTag && citDist !== null && (
                  <div
                    className={`p-3 rounded-2xl border text-xs space-y-2 ${
                      isCitizenWithin100m
                        ? 'bg-emerald-100/70 border-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                        : 'bg-amber-100/80 border-amber-300 dark:bg-amber-950/50 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        <span>GPS Triangulation & Geofence Audit:</span>
                      </span>
                      <span className="font-mono text-[11px] font-extrabold">
                        {citDist}m from grievance coordinates
                      </span>
                    </div>

                    <div className="text-[11px] leading-relaxed">
                      {isCitizenWithin100m ? (
                        <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            <strong>GPS Verification Passed:</strong> You are <strong>{citDist}m</strong> from the complaint site (inside the permitted 100-meter physical radius).
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-start gap-1.5 text-amber-800 dark:text-amber-300">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <span>
                            <strong>Warning:</strong> You are <strong>{citDist}m</strong> away from the reported coordinates (&gt;100m radius). To ensure civic authenticity, you must inspect the actual physical site.
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-emerald-200 dark:border-emerald-800 text-[10px]">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Complaint GPS:</span>
                        <span className="font-mono font-semibold">
                          [{selectedComplaint.location.lat.toFixed(4)}, {selectedComplaint.location.lng.toFixed(4)}]
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Authority GPS:</span>
                        <span className="font-mono font-semibold">
                          [{(selectedComplaint.authorityResolutionMetadata?.lat ?? selectedComplaint.location.lat).toFixed(4)}, {(selectedComplaint.authorityResolutionMetadata?.lng ?? selectedComplaint.location.lng).toFixed(4)}]
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Citizen GPS:</span>
                        <span className="font-mono font-semibold">
                          [{citizenGpsTag.lat.toFixed(4)}, {citizenGpsTag.lng.toFixed(4)}]
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Citizen Inspection Comments Input */}
                {citizenCapturedPhoto && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Citizen Inspection Remarks
                    </label>
                    <input
                      type="text"
                      value={citizenNotes}
                      onChange={(e) => setCitizenNotes(e.target.value)}
                      placeholder="E.g., Surface is completely smooth, drainage unblocked..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}

                {/* Decision Actions */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (!citizenCapturedPhoto || !citizenGpsTag) {
                          setIsCitizenCameraOpen(true);
                          return;
                        }
                        verifyComplaintByCitizen(
                          selectedComplaint.id,
                          true,
                          citizenNotes || 'Citizen verified fix on site.',
                          citizenCapturedPhoto,
                          citizenGpsTag
                        );
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 transition cursor-pointer"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>✔ Verified & Fixed</span>
                    </button>

                    <button
                      onClick={() => {
                        if (!citizenCapturedPhoto || !citizenGpsTag) {
                          setIsCitizenCameraOpen(true);
                          return;
                        }
                        setShowRejectBox(!showRejectBox);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/30 transition cursor-pointer"
                    >
                      <ThumbsDown className="w-4 h-4" />
                      <span>✖ Not Fixed (Reject)</span>
                    </button>
                  </div>

                  {!citizenCapturedPhoto && (
                    <p className="text-[10px] text-center font-bold text-amber-600 dark:text-amber-400">
                      🔒 Live on-site camera verification photo required before confirming or rejecting.
                    </p>
                  )}
                </div>

                {/* Rejection input box */}
                {showRejectBox && citizenCapturedPhoto && citizenGpsTag && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-rose-400 dark:border-rose-900 shadow-md animate-in fade-in space-y-2">
                    <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Citizen Quality Rejection Notice</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Explain what is wrong with the work. Submitting rejection will immediately reopen the grievance, automatically escalate to the next higher authority tier, and deduct penalty points from {selectedComplaint.department}.
                    </p>
                    <textarea
                      required
                      rows={2}
                      value={rejectFeedback}
                      onChange={(e) => setRejectFeedback(e.target.value)}
                      placeholder="E.g., Patchwork is completely uneven and loose stones remain on the roadway..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    ></textarea>
                    <button
                      onClick={() => {
                        verifyComplaintByCitizen(
                          selectedComplaint.id,
                          false,
                          rejectFeedback || 'Work substandard upon physical inspection.',
                          citizenCapturedPhoto,
                          citizenGpsTag
                        );
                        setShowRejectBox(false);
                      }}
                      disabled={rejectFeedback.trim().length < 5}
                      className="w-full py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition"
                    >
                      Submit Official Rejection & Reopen Escalation
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 2. COMPLETED TRIPLE-PHOTO PROOF CERTIFICATE (When closed or verified) */}
          {(selectedComplaint.status === 'Closed' || selectedComplaint.verification) && (
            <div className="bg-white dark:bg-slate-800/95 rounded-3xl p-4 border border-emerald-300 dark:border-emerald-800/80 shadow-md space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold">
                    <CheckCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                      Triple-Photo Verification Audit
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      Physical On-Site Verification Completed & Audited
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    selectedComplaint.verification?.isSatisfied !== false
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  {selectedComplaint.verification?.isSatisfied !== false
                    ? '✔ Verified & Closed'
                    : '✖ Reopened on Rejection'}
                </span>
              </div>

              {/* 3 Photos in Audit */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">1. Before Photo</span>
                  <img
                    src={selectedComplaint.beforeImageUrl}
                    className="w-full h-20 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                    alt="Before"
                  />
                  <div className="text-[9px] text-slate-400 font-mono truncate">
                    {(selectedComplaint.beforePhotoMetadata?.lat ?? selectedComplaint.location.lat).toFixed(4)},{' '}
                    {(selectedComplaint.beforePhotoMetadata?.lng ?? selectedComplaint.location.lng).toFixed(4)}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase block">
                    2. Authority Fix
                  </span>
                  <img
                    src={selectedComplaint.afterImageUrl || selectedComplaint.beforeImageUrl}
                    className="w-full h-20 object-cover rounded-xl border border-blue-200 dark:border-blue-900"
                    alt="Authority Fix"
                  />
                  <div className="text-[9px] text-slate-400 font-mono truncate">
                    {(selectedComplaint.authorityResolutionMetadata?.lat ?? selectedComplaint.location.lat).toFixed(4)},{' '}
                    {(selectedComplaint.authorityResolutionMetadata?.lng ?? selectedComplaint.location.lng).toFixed(4)}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block">
                    3. Citizen Inspection
                  </span>
                  <img
                    src={
                      selectedComplaint.verification?.citizenVerificationPhoto ||
                      selectedComplaint.afterImageUrl ||
                      selectedComplaint.beforeImageUrl
                    }
                    className="w-full h-20 object-cover rounded-xl border-2 border-emerald-500"
                    alt="Citizen Proof"
                  />
                  <div className="text-[9px] text-slate-400 font-mono truncate">
                    {selectedComplaint.verification?.citizenGpsMetadata
                      ? `${selectedComplaint.verification.citizenGpsMetadata.lat.toFixed(4)}, ${selectedComplaint.verification.citizenGpsMetadata.lng.toFixed(4)}`
                      : `${selectedComplaint.location.lat.toFixed(4)}, ${selectedComplaint.location.lng.toFixed(4)}`}
                  </div>
                </div>
              </div>

              {/* Distance & Feedback Audit Trail */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-300">Citizen Inspection Distance:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedComplaint.verification?.distanceMetersFromSite ?? 14} meters from original site (Within 100m)
                  </span>
                </div>
                {selectedComplaint.verification?.citizenFeedback && (
                  <div className="text-slate-700 dark:text-slate-300">
                    <strong>Citizen Feedback:</strong> "{selectedComplaint.verification.citizenFeedback}"
                  </div>
                )}
                {selectedComplaint.workNotes && (
                  <div className="text-slate-500 dark:text-slate-400 text-[10px]">
                    <strong>Officer Repair Notes:</strong> {selectedComplaint.workNotes}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. GRIEVANCE EVIDENCE PHOTO (When in progress, assigned or submitted) */}
          {['Submitted', 'Assigned', 'In Progress', 'Escalated'].includes(selectedComplaint.status) && (
            <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-blue-600" />
                  <span>Grievance Live Evidence Photo</span>
                </h4>
                <span className="text-[10px] font-mono text-slate-400">
                  [{selectedComplaint.location.lat.toFixed(4)}, {selectedComplaint.location.lng.toFixed(4)}]
                </span>
              </div>

              <div className="flex gap-3 items-center">
                <img
                  src={selectedComplaint.beforeImageUrl}
                  alt="Evidence"
                  className="w-24 h-24 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
                    {selectedComplaint.description}
                  </p>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                    <span>{selectedComplaint.location.address}</span>
                  </div>
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold pt-1">
                    Field resolution in progress by {selectedComplaint.assignedOfficerName}.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Progress Bar & Timeline */}
          <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-md">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
              Grievance Lifecycle Timeline
            </h4>

            {/* Visual Stepper */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
              {TIMELINE_STEPS.map((step, idx) => {
                const isPassed = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <div key={step.key} className="relative flex items-start gap-3">
                    {/* Circle Indicator */}
                    <div
                      className={`absolute -left-6 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                        isCurrent
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900'
                          : isPassed
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                      }`}
                    >
                      {isPassed && !isCurrent ? '✓' : idx + 1}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold ${
                            isCurrent
                              ? 'text-blue-600 dark:text-blue-400'
                              : isPassed
                              ? 'text-slate-900 dark:text-white'
                              : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] font-extrabold uppercase px-2 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                            Current Stage
                          </span>
                        )}
                      </div>

                      {/* Timeline Sub-details */}
                      {step.key === 'Submitted' && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Logged at {new Date(selectedComplaint.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Geotagged at {selectedComplaint.location.ward}
                        </p>
                      )}
                      {step.key === 'Assigned' && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Assigned to {selectedComplaint.department}
                        </p>
                      )}
                      {step.key === 'In Progress' && selectedComplaint.isEscalated && (
                        <div className="mt-1 p-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-900 dark:text-red-200 text-[11px]">
                          <strong>Auto-Escalated to Level {selectedComplaint.currentEscalationLevel}:</strong> {selectedComplaint.assignedOfficerName}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Escalation Audit History Trail */}
          {selectedComplaint.escalationHistory.length > 0 && (
            <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-md">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Escalation Audit Trail ({selectedComplaint.escalationHistory.length})</span>
              </h4>

              <div className="space-y-2">
                {selectedComplaint.escalationHistory.map((esc) => (
                  <div
                    key={esc.id}
                    className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span>{new Date(esc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">Level {esc.level} Tier</span>
                    </div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {esc.fromRoleTitle} <ArrowRight className="w-3 h-3 inline text-slate-400 mx-1" /> {esc.toRoleTitle}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic">
                      "{esc.reason}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center text-xs text-slate-400">
          No complaints found matching criteria.
        </div>
      )}

      {/* Citizen Live Camera Modal for Site Inspection */}
      {selectedComplaint && (
        <CameraCaptureModal
          isOpen={isCitizenCameraOpen}
          onClose={() => setIsCitizenCameraOpen(false)}
          title={`Citizen Site Verification: ${selectedComplaint.id}`}
          expectedCoords={{ lat: selectedComplaint.location.lat, lng: selectedComplaint.location.lng }}
          onCapture={(imageUrl, gpsTag) => {
            setCitizenCapturedPhoto(imageUrl);
            setCitizenGpsTag(gpsTag);
            setIsCitizenCameraOpen(false);
          }}
        />
      )}
    </div>
  );
};
