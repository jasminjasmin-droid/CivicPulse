import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Upload,
  FileText,
  X,
  ArrowRight,
  Shield,
  Navigation,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api, ApiComplaint } from '../services/api';

const SUPPORTED_CATEGORIES = [
  'Sanitation',
  'Roads',
  'Water Supply',
  'Electricity',
  'Public Health',
  'Street Lighting',
  'Public Safety',
  'Drainage',
  'Other',
];

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export const ReportIssueScreen: React.FC = () => {
  const { setActiveTab, setSelectedComplaintId, refreshCitizenStats, refreshBackendComplaints } = useApp();

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(SUPPORTED_CATEGORIES[0]);
  const [priority, setPriority] = useState('Medium');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');

  // Evidence File (Optional)
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Submission State
  const [isGpsDetecting, setIsGpsDetecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdComplaint, setCreatedComplaint] = useState<ApiComplaint | null>(null);

  // Auto-detect GPS coordinates on mount if available
  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setIsGpsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        if (!address) {
          setAddress(`Near [${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}]`);
        }
        setIsGpsDetecting(false);
      },
      () => {
        setIsGpsDetecting(false);
      },
      { timeout: 8000 }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (!e.target.files || e.target.files.length === 0) {
      setEvidenceFile(null);
      return;
    }

    const file = e.target.files[0];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      setFileError('Allowed file types: JPG, PNG, PDF.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFileError('File size exceeds the 10 MB limit.');
      return;
    }

    setEvidenceFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Please enter a complaint title.');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('Please enter a detailed description of the issue.');
      return;
    }

    const latNum = latitude.trim() ? parseFloat(latitude.trim()) : undefined;
    const lngNum = longitude.trim() ? parseFloat(longitude.trim()) : undefined;

    if (latNum !== undefined && (isNaN(latNum) || latNum < -90 || latNum > 90)) {
      setErrorMsg('Latitude must be a valid number between -90 and 90.');
      return;
    }

    if (lngNum !== undefined && (isNaN(lngNum) || lngNum < -180 || lngNum > 180)) {
      setErrorMsg('Longitude must be a valid number between -180 and 180.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create complaint via backend API
      const newComp = await api.complaints.create({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        address: address.trim() || undefined,
        latitude: latNum,
        longitude: lngNum,
      });

      // 2. Upload evidence if attached
      if (evidenceFile) {
        try {
          await api.complaints.uploadEvidence(newComp.id, evidenceFile);
        } catch (uploadErr) {
          console.warn('Complaint created but evidence upload failed:', uploadErr);
        }
      }

      setCreatedComplaint(newComp);
      refreshCitizenStats();
      refreshBackendComplaints();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit complaint. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory(SUPPORTED_CATEGORIES[0]);
    setPriority('Medium');
    setAddress('');
    setEvidenceFile(null);
    setFileError(null);
    setCreatedComplaint(null);
    setErrorMsg(null);
  };

  // SUCCESS STATE
  if (createdComplaint) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto pb-28">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-emerald-200 dark:border-emerald-800 shadow-soft-lg text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center ring-8 ring-emerald-50 dark:ring-emerald-950/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-900/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              Grievance Registered Successfully
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2">
              Complaint #{createdComplaint.id}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Your grievance has been submitted to the CivicPulse portal with status{' '}
              <strong className="text-amber-600">Pending</strong>. You will receive updates as the grievance is assigned and resolved.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 text-left space-y-2 border border-slate-200/80 dark:border-slate-700 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Title:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{createdComplaint.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Category:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{createdComplaint.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Priority:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{createdComplaint.priority}</span>
            </div>
            {createdComplaint.address && (
              <div className="flex justify-between">
                <span className="text-slate-500">Location:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
                  {createdComplaint.address}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Submission Date:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {new Date(createdComplaint.created_at).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => {
                setSelectedComplaintId(String(createdComplaint.id));
                setActiveTab('track');
              }}
              className="flex-1 py-3 bg-[#1565C0] hover:bg-[#0D47A1] text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <span>Track in My Complaints</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={resetForm}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-2xl text-xs font-semibold transition cursor-pointer"
            >
              File Another Grievance
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto pb-28 space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#1565C0] dark:text-blue-300 text-xs font-semibold mb-2 border border-blue-200/60 dark:border-blue-800">
          <Shield className="w-3.5 h-3.5" />
          <span>Official Grievance Registration</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          File a Civic Grievance
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Submit issues to the municipality for inspection, department assignment, and resolution.
        </p>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800/90 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-soft-md space-y-5">
        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Complaint Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g., Pothole on Gandhi Road / Water Pipeline Leakage"
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565C0] transition"
          />
        </div>

        {/* Category & Priority Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1565C0] transition"
            >
              {SUPPORTED_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1565C0] transition"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Detailed Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            placeholder="Describe the problem, severity, exact landmarks, or any safety concerns..."
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565C0] transition"
          />
        </div>

        {/* Location & GPS */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#1565C0]" />
              Location Details
            </label>
            <button
              type="button"
              onClick={detectLocation}
              disabled={isGpsDetecting}
              className="text-[11px] font-semibold text-[#1565C0] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Navigation className={`w-3 h-3 ${isGpsDetecting ? 'animate-spin' : ''}`} />
              <span>{isGpsDetecting ? 'Detecting GPS...' : 'Auto-detect GPS'}</span>
            </button>
          </div>

          <div>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Address / Street Name / Landmark"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565C0] transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="block text-[10px] text-slate-500 mb-1">Latitude (optional)</span>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="13.0827"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565C0] transition"
              />
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 mb-1">Longitude (optional)</span>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="80.2707"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565C0] transition"
              />
            </div>
          </div>
        </div>

        {/* Evidence File Upload (Optional) */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Attach Evidence Photo / Document (Optional)
          </label>

          {fileError && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-[11px] text-rose-700 dark:text-rose-300">
              {fileError}
            </div>
          )}

          {evidenceFile ? (
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-[#1565C0] shrink-0" />
                <div className="truncate">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate">
                    {evidenceFile.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {(evidenceFile.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEvidenceFile(null)}
                className="p-1 text-slate-400 hover:text-rose-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-400 rounded-2xl p-4 text-center cursor-pointer transition">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Click to attach photo or PDF document
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Supports JPG, PNG, PDF up to 10 MB
              </p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-[#1565C0] hover:bg-[#0D47A1] text-white rounded-2xl text-xs font-bold shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Registering Grievance in Portal...</span>
            </>
          ) : (
            <>
              <PlusCircle className="w-4 h-4" />
              <span>Submit Grievance to CivicPulse</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
