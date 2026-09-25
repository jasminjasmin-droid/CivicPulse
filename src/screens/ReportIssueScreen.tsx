import React, { useState, useEffect } from 'react';
import {
  Camera,
  MapPin,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building,
  RefreshCw,
  ArrowRight,
  Shield,
  Layers,
  Lock,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { IssueCategory, PriorityLevel, JurisdictionTier, GpsTag } from '../types';
import { aiService, AiScanResult } from '../services/aiService';
import { CameraCaptureModal } from '../components/common/CameraCaptureModal';

const CATEGORIES: IssueCategory[] = [
  'Road Damage',
  'Garbage',
  'Water Leakage',
  'Drainage',
  'Streetlight',
  'Power Failure',
  'Traffic Signal',
  'Fallen Tree',
  'Others',
];

export const ReportIssueScreen: React.FC = () => {
  const { complaints, submitNewComplaint, setActiveTab, setSelectedComplaintId, t } = useApp();

  // Photo & Live Camera State (No Gallery)
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [photoGpsTag, setPhotoGpsTag] = useState<GpsTag | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<IssueCategory>('Road Damage');
  const [priority, setPriority] = useState<PriorityLevel>('High');
  const [department, setDepartment] = useState<string>('Roads & Engineering Department');
  const [estimatedHours, setEstimatedHours] = useState<number>(24);
  const [jurisdictionTier, setJurisdictionTier] = useState<JurisdictionTier>('Municipal Corporation');

  // Live GPS Sensor State (Mandatory - No manual editing)
  const [isGpsLoading, setIsGpsLoading] = useState<boolean>(true);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [liveLocation, setLiveLocation] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    address: string;
    ward: string;
    zone: string;
    district: string;
    state: string;
    pincode: string;
    jurisdictionTier: JurisdictionTier;
  } | null>(null);

  // AI Scanning State
  const [isAiScanning, setIsAiScanning] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<AiScanResult | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  // Capture Live GPS immediately on screen mount
  const requestLiveLocation = () => {
    setIsGpsLoading(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('GPS hardware sensor is not supported on this device.');
      setIsGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy);

        setIsGpsLoading(false);
        setLiveLocation({
          lat,
          lng,
          accuracy,
          address: `GPS Pin [${lat.toFixed(5)}, ${lng.toFixed(5)}], T. Nagar, Chennai`,
          ward: 'Ward 42 (T. Nagar)',
          zone: 'South Zone',
          district: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600017',
          jurisdictionTier: 'Municipal Corporation',
        });
      },
      (err) => {
        setIsGpsLoading(false);
        console.warn('GPS location error:', err);
        setGpsError(
          'Live GPS Permission Denied or Unavailable. To prevent fraudulent civic reports, manual location selection is disabled. Please enable device location services.'
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    requestLiveLocation();
  }, []);

  // Run AI Analysis once photo + description are available
  const runAiAnalysis = async (imgUrl: string, descText: string) => {
    if (!liveLocation) return;
    setIsAiScanning(true);
    setDuplicateWarning(null);

    try {
      const result = await aiService.analyzeCivicIssue(
        descText || 'Civic issue captured live on camera',
        imgUrl,
        liveLocation.lat,
        liveLocation.lng,
        complaints
      );

      setAiResult(result);
      setCategory(result.category);
      setPriority(result.priority);
      setDepartment(result.department);
      setEstimatedHours(result.estimatedHours);
      setJurisdictionTier(result.jurisdictionTier);
      if (!title) {
        setTitle(`${result.category} issue at ${liveLocation.ward}`);
      }

      if (result.isDuplicateSuspect && result.duplicateComplaintId) {
        setDuplicateWarning(
          `AI Alert: Similar issue [${result.duplicateComplaintId}] was reported ${result.distanceToDuplicateMeters || 45}m away.`
        );
      }
    } finally {
      setIsAiScanning(false);
    }
  };

  const handlePhotoCaptured = (imgUrl: string, gpsTag: GpsTag) => {
    setCapturedImage(imgUrl);
    setPhotoGpsTag(gpsTag);
    runAiAnalysis(imgUrl, description);
  };

  // Description character count validation (20 - 200 chars)
  const descLength = description.trim().length;
  const isDescValid = descLength >= 20 && descLength <= 200;
  const isReadyToSubmit = Boolean(capturedImage) && Boolean(liveLocation) && isDescValid && !isAiScanning;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!capturedImage || !liveLocation || !isDescValid) return;

    const created = submitNewComplaint({
      title: title || `${category} reported at ${liveLocation.address.split(',')[0]}`,
      description: description.trim(),
      category,
      priority,
      location: {
        ...liveLocation,
        jurisdictionTier,
      },
      imageUrl: capturedImage,
      photoMetadata: photoGpsTag || {
        lat: liveLocation.lat,
        lng: liveLocation.lng,
        accuracy: liveLocation.accuracy,
        timestamp: new Date().toISOString(),
        address: liveLocation.address,
      },
      aiMetadata: aiResult
        ? {
            confidence: aiResult.confidence,
            detectedCategory: aiResult.category,
            estimatedHours,
          }
        : undefined,
    });

    setSubmittedId(created.id);
  };

  if (submittedId) {
    return (
      <div className="p-6 text-center max-w-lg mx-auto my-auto animate-in zoom-in-95 duration-200">
        <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#43A047] flex items-center justify-center mx-auto mb-4 shadow-soft-lg ring-8 ring-emerald-50 dark:ring-emerald-900/30">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <span className="text-xs font-extrabold uppercase tracking-widest text-[#43A047] bg-emerald-100 dark:bg-emerald-900/60 px-3.5 py-1 rounded-full">
          Verified Grievance Registered
        </span>

        <h3 className="text-2xl font-black text-[#263238] dark:text-white mt-3">
          Complaint {submittedId}
        </h3>

        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
          Your live GPS & camera-verified complaint has been logged and assigned to <strong>{department}</strong>.
        </p>

        {photoGpsTag && (
          <div className="mt-5 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-left text-xs space-y-1.5 font-mono text-blue-900 dark:text-blue-200">
            <div className="flex items-center gap-1.5 font-bold">
              <Shield className="w-4 h-4 text-[#1565C0]" />
              <span>Tamper-Proof Hardware Sensor Signature</span>
            </div>
            <div>• GPS: {photoGpsTag.lat.toFixed(5)}, {photoGpsTag.lng.toFixed(5)} (±{photoGpsTag.accuracy}m)</div>
            <div>• Timestamp: {new Date(photoGpsTag.timestamp).toLocaleString()}</div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={() => {
              setSelectedComplaintId(submittedId);
              setActiveTab('track');
            }}
            className="w-full py-3.5 rounded-2xl bg-[#1565C0] hover:bg-[#0D47A1] text-white font-bold text-sm shadow-soft-md transition flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Track Grievance Live</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSubmittedId(null);
              setCapturedImage(null);
              setDescription('');
              setTitle('');
              requestLiveLocation();
            }}
            className="w-full py-3 rounded-2xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Report Another Issue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-28 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-[#263238] dark:text-white tracking-tight flex items-center gap-2">
          <span>Smart Issue Reporting</span>
          <span className="text-[10px] font-bold text-[#1565C0] bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
            Live Sensors Only
          </span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          To prevent fake reports, CivicPulse requires an in-app live camera capture and hardware GPS location.
        </p>
      </div>

      {/* 1. LIVE GPS ENFORCEMENT BANNER */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-[#CFD8DC]/80 dark:border-slate-700 shadow-soft-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#263238] dark:text-white">
            <MapPin className="w-4 h-4 text-[#1565C0]" />
            <span>1. Mandatory Live GPS Location</span>
          </div>

          <div className="flex items-center gap-1.5">
            {liveLocation ? (
              <span className="text-[10px] font-bold text-[#43A047] bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#43A047] animate-ping"></span>
                GPS Locked (±{liveLocation.accuracy}m)
              </span>
            ) : isGpsLoading ? (
              <span className="text-[10px] font-bold text-[#FB8C00] flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Acquiring GPS...
              </span>
            ) : null}
          </div>
        </div>

        {/* GPS Error & Blocking Prompt */}
        {gpsError ? (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-[#E53935] text-xs space-y-2">
            <div className="flex items-start gap-2 text-[#E53935] font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>GPS Permission Required to Report</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              {gpsError}
            </p>
            <button
              type="button"
              onClick={requestLiveLocation}
              className="px-3.5 py-1.5 rounded-xl bg-[#E53935] text-white text-xs font-bold hover:bg-rose-700 transition"
            >
              Retry GPS Access
            </button>
          </div>
        ) : liveLocation ? (
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
            <div className="font-extrabold text-[#263238] dark:text-white flex items-center justify-between">
              <span>{liveLocation.address}</span>
              <span title="Read-only live sensor lock">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-medium">
              <span className="text-[#1565C0] font-bold">{liveLocation.jurisdictionTier}</span>
              <span>•</span>
              <span>{liveLocation.ward}</span>
              <span>•</span>
              <span className="font-mono text-slate-400">
                Lat: {liveLocation.lat.toFixed(5)}, Lng: {liveLocation.lng.toFixed(5)}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 2. CAMERA ONLY PHOTO CAPTURE (NO GALLERY) */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-[#CFD8DC]/80 dark:border-slate-700 shadow-soft-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#263238] dark:text-white">
              <Camera className="w-4 h-4 text-[#1565C0]" />
              <span>2. Mandatory In-App Live Photo</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              No Gallery Upload
            </span>
          </div>

          {capturedImage ? (
            <div className="space-y-2">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-[4/3] bg-black">
                <img src={capturedImage} alt="Live Captured" className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>GPS Watermarked</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4 text-[#1565C0]" />
                <span>Retake Live Camera Photo</span>
              </button>
            </div>
          ) : (
            <div className="p-8 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="w-14 h-14 rounded-2xl bg-[#1565C0]/10 text-[#1565C0] flex items-center justify-center mx-auto">
                <Camera className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-[#263238] dark:text-white">
                  Capture Live On-Site Photo
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-0.5">
                  Gallery uploads are disabled to prevent fake images. Open your camera to take a real-time geotagged snapshot.
                </p>
              </div>

              <button
                type="button"
                disabled={!liveLocation}
                onClick={() => setIsCameraOpen(true)}
                className="px-6 py-3 rounded-2xl bg-[#1565C0] hover:bg-[#0D47A1] text-white font-bold text-xs shadow-soft-sm transition flex items-center justify-center gap-2 mx-auto disabled:opacity-50 active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>Open Live Camera</span>
              </button>
            </div>
          )}
        </div>

        {/* 3. AI ISSUE IDENTIFICATION & ROUTING CARD */}
        {aiResult && (
          <div className="rounded-3xl p-5 bg-gradient-to-br from-blue-50/90 via-teal-50/60 to-white dark:from-blue-950/40 dark:via-teal-950/20 dark:to-slate-800 border-2 border-[#1565C0]/40 shadow-soft-md space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#1565C0] dark:text-blue-400 font-extrabold text-xs">
                <Sparkles className="w-4 h-4 fill-[#1565C0]" />
                <span>3. AI Issue Identification</span>
              </div>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-[#1565C0] text-white shadow-xs">
                {aiResult.confidence}% Confidence
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-soft-sm">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Issue Category</span>
                <div className="font-bold text-[#263238] dark:text-white mt-0.5">
                  {aiResult.category}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-soft-sm">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Severity / SLA</span>
                <div className="font-bold text-[#E53935] mt-0.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#E53935] animate-ping"></span>
                  {aiResult.priority} ({estimatedHours}h)
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-soft-sm text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Assigned Department</span>
                <span className="text-xs font-bold text-[#1565C0]">
                  Jurisdiction: {jurisdictionTier}
                </span>
              </div>
              <div className="font-extrabold text-[#263238] dark:text-white mt-1">
                {aiResult.department}
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 italic">
              "{aiResult.aiAnalysisSummary}"
            </p>
          </div>
        )}

        {/* Duplicate Warning */}
        {duplicateWarning && (
          <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-[#FB8C00] text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5 shadow-soft-sm">
            <AlertTriangle className="w-5 h-5 text-[#FB8C00] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Possible Duplicate Detected Nearby</span>
              <p className="text-[11px] mt-0.5">{duplicateWarning}</p>
            </div>
          </div>
        )}

        {/* 4. SHORT DESCRIPTION CONSTRAINT (20 - 200 CHARS) */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-[#CFD8DC]/80 dark:border-slate-700 shadow-soft-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-[#263238] dark:text-slate-300">
              4. Short Description (Required, 20–200 Chars)
            </label>
            <span
              className={`text-xs font-mono font-bold ${
                descLength < 20 ? 'text-[#FB8C00]' : descLength > 200 ? 'text-[#E53935]' : 'text-[#43A047]'
              }`}
            >
              {descLength}/200 chars
            </span>
          </div>

          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => {
              const val = e.target.value;
              setDescription(val);
              if (capturedImage && val.length >= 20) {
                runAiAnalysis(capturedImage, val);
              }
            }}
            placeholder="Describe the exact location and hazard (min 20 characters)..."
            className="w-full px-3.5 py-2.5 text-xs rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#1565C0] focus:outline-none"
          ></textarea>

          {descLength > 0 && descLength < 20 && (
            <p className="text-[11px] text-[#FB8C00] font-semibold">
              ⚠️ Minimum 20 characters required ({20 - descLength} more needed).
            </p>
          )}
          {descLength > 200 && (
            <p className="text-[11px] text-[#E53935] font-semibold">
              ⚠️ Description exceeds maximum 200 characters limit.
            </p>
          )}
        </div>

        {/* 5. EDITABLE AI CATEGORY & PRIORITY BEFORE SUBMISSION */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              Category (Editable)
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as IssueCategory)}
              className="w-full text-xs font-semibold px-3 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#1565C0]"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              Priority (SLA)
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as PriorityLevel)}
              className="w-full text-xs font-semibold px-3 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#1565C0]"
            >
              <option value="Critical">Critical (2h SLA)</option>
              <option value="High">High (24h SLA)</option>
              <option value="Medium">Medium (3d SLA)</option>
              <option value="Low">Low (7d SLA)</option>
            </select>
          </div>
        </div>

        {/* SUBMIT BUTTON (Gated by Live Location + Camera Photo + 20-200 Chars) */}
        <button
          type="submit"
          disabled={!isReadyToSubmit}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#1565C0] via-[#1976D2] to-[#0D47A1] hover:from-[#0D47A1] hover:to-[#1565C0] text-white font-extrabold text-sm shadow-soft-lg transition flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
        >
          <span>Submit Live-Verified Complaint</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {!capturedImage && (
          <p className="text-[11px] text-center text-slate-400">
            *Please capture an in-app live camera photo to enable submission.
          </p>
        )}
      </form>

      {/* Built-in Camera Modal with GPS Watermarking */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        title="Live Complaint Camera (GPS Stamped)"
        expectedCoords={liveLocation ? { lat: liveLocation.lat, lng: liveLocation.lng } : undefined}
        onCapture={handlePhotoCaptured}
      />
    </div>
  );
};
