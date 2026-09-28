import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  ArrowLeft,
  ArrowRight,
  Shield,
  MapPin,
  RefreshCw,
  Building,
  User,
  ExternalLink,
  X,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  api,
  ApiComplaint,
  ApiComplaintHistory,
  ApiComplaintEvidence,
  ApiDepartment,
} from '../services/api';

const CATEGORIES = [
  'All',
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

const STATUSES = ['All', 'Pending', 'In Progress', 'Resolved'];
const PRIORITIES = ['All', 'Low', 'Medium', 'High', 'Critical'];

export const TrackScreen: React.FC = () => {
  const {
    selectedComplaintId,
    setSelectedComplaintId,
    departmentsList,
    refreshDepartments,
    apiUser,
  } = useApp();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [selectedDeptId, setSelectedDeptId] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Complaints Data
  const [complaints, setComplaints] = useState<ApiComplaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Selected Complaint Detail Data
  const [activeComplaint, setActiveComplaint] = useState<ApiComplaint | null>(null);
  const [historyList, setHistoryList] = useState<ApiComplaintHistory[]>([]);
  const [evidenceList, setEvidenceList] = useState<ApiComplaintEvidence[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Evidence Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Load Departments once
  useEffect(() => {
    refreshDepartments();
  }, [refreshDepartments]);

  // Fetch complaints with filters
  const fetchComplaints = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await api.complaints.getAll({
        search: search.trim() || undefined,
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        priority: selectedPriority !== 'All' ? selectedPriority : undefined,
        department_id: selectedDeptId !== 'All' ? selectedDeptId : undefined,
        start_date: startDate.trim() || undefined,
        end_date: endDate.trim() || undefined,
      });
      setComplaints(data);
    } catch (err: any) {
      setLoadError(err.message || 'Failed to fetch complaints');
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedStatus, selectedCategory, selectedPriority, selectedDeptId, startDate, endDate]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // Load complaint detail (history & evidence)
  const loadComplaintDetail = useCallback(async (id: number) => {
    setIsDetailLoading(true);
    try {
      const [comp, hist, ev] = await Promise.all([
        api.complaints.getById(id),
        api.complaints.getHistory(id),
        api.complaints.getEvidence(id),
      ]);
      setActiveComplaint(comp);
      // Ensure chronological ordering (oldest first or newest first)
      const sortedHist = [...hist].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setHistoryList(sortedHist);
      setEvidenceList(ev);
    } catch (err: any) {
      console.error('Failed to load complaint details:', err);
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  // When selectedComplaintId changes from parent or context
  useEffect(() => {
    if (selectedComplaintId) {
      const numId = parseInt(selectedComplaintId, 10);
      if (!isNaN(numId)) {
        loadComplaintDetail(numId);
      }
    } else {
      setActiveComplaint(null);
    }
  }, [selectedComplaintId, loadComplaintDetail]);

  const handleSelectComplaint = (c: ApiComplaint) => {
    setSelectedComplaintId(String(c.id));
    loadComplaintDetail(c.id);
  };

  const handleBackToList = () => {
    setSelectedComplaintId(null);
    setActiveComplaint(null);
    setUploadFile(null);
    setUploadError(null);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedStatus('All');
    setSelectedCategory('All');
    setSelectedPriority('All');
    setSelectedDeptId('All');
    setStartDate('');
    setEndDate('');
  };

  // Upload evidence handler
  const handleUploadEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeComplaint || !uploadFile) return;

    setUploadError(null);
    setIsUploading(true);
    try {
      const newEv = await api.complaints.uploadEvidence(activeComplaint.id, uploadFile);
      setEvidenceList((prev) => [newEv, ...prev]);
      setUploadFile(null);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload evidence');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (!e.target.files || e.target.files.length === 0) {
      setUploadFile(null);
      return;
    }
    const file = e.target.files[0];
    const allowed = ['.jpg', '.jpeg', '.png', '.pdf'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!allowed.includes(ext)) {
      setUploadError('Allowed formats: JPG, PNG, PDF.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File exceeds 10 MB limit.');
      return;
    }

    setUploadFile(file);
  };

  // Helper to resolve department name
  const getDeptName = (deptId?: number | null) => {
    if (!deptId) return 'Unassigned';
    const dept = departmentsList.find((d) => d.id === deptId);
    return dept ? dept.name : `Dept #${deptId}`;
  };

  // Helper status color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolved':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'In Progress':
        return 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800';
      default:
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'High':
        return 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      case 'Medium':
        return 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  // ==========================================================
  // VIEW: COMPLAINT DETAILS + TIMELINE + EVIDENCE
  // ==========================================================
  if (activeComplaint) {
    return (
      <div className="p-4 sm:p-6 max-w-3xl mx-auto pb-28 space-y-6">
        {/* Back navigation button */}
        <button
          onClick={handleBackToList}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Complaints</span>
        </button>

        {/* Complaint Main Details Card */}
        <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-soft-md space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-[#1565C0] dark:text-blue-400">
                Complaint #{activeComplaint.id}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Filed {new Date(activeComplaint.created_at).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${getStatusBadge(
                  activeComplaint.status
                )}`}
              >
                {activeComplaint.status}
              </span>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${getPriorityBadge(
                  activeComplaint.priority
                )}`}
              >
                {activeComplaint.priority} Priority
              </span>
            </div>
          </div>

          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {activeComplaint.title}
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed whitespace-pre-line">
              {activeComplaint.description}
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Building className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                <strong>Department:</strong> {getDeptName(activeComplaint.department_id)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                <strong>Assigned Authority:</strong>{' '}
                {activeComplaint.assigned_authority_id ? `Officer #${activeComplaint.assigned_authority_id}` : 'Pending assignment'}
              </span>
            </div>
            {activeComplaint.address && (
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 sm:col-span-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">
                  <strong>Location:</strong> {activeComplaint.address}
                  {activeComplaint.latitude && activeComplaint.longitude
                    ? ` (${activeComplaint.latitude.toFixed(4)}, ${activeComplaint.longitude.toFixed(4)})`
                    : ''}
                </span>
              </div>
            )}
            <div className="text-[11px] text-slate-400 sm:col-span-2">
              Last updated: {new Date(activeComplaint.updated_at).toLocaleString()}
            </div>
          </div>
        </div>

        {/* FEATURE 17 - COMPLAINT TIMELINE (GET /complaints/{id}/history) */}
        <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-soft-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1565C0] dark:text-blue-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Complaint Timeline & History
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {historyList.length} events
            </span>
          </div>

          {isDetailLoading ? (
            <div className="py-6 text-center text-xs text-slate-400">Loading timeline events...</div>
          ) : historyList.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No history events recorded yet.
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
              {historyList.map((hist, idx) => (
                <div key={hist.id || idx} className="relative group">
                  {/* Timeline Node dot */}
                  <span className="absolute -left-[19px] top-1 w-3.5 h-3.5 rounded-full bg-[#1565C0] dark:bg-blue-400 ring-4 ring-white dark:ring-slate-800"></span>

                  <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-3.5 border border-slate-200/70 dark:border-slate-700/70 text-xs">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {hist.action}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(hist.created_at).toLocaleString()}
                      </span>
                    </div>

                    {/* Old value -> New value */}
                    {(hist.old_value || hist.new_value) && (
                      <div className="mt-1.5 p-2 rounded-xl bg-white dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700 flex items-center gap-1.5 flex-wrap">
                        {hist.old_value ? (
                          <>
                            <span className="line-through text-slate-400">{hist.old_value}</span>
                            <ArrowRight className="w-3 h-3 text-[#1565C0]" />
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {hist.new_value}
                            </span>
                          </>
                        ) : (
                          <span className="font-semibold">{hist.new_value}</span>
                        )}
                      </div>
                    )}

                    <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                      Logged by:{' '}
                      <span className="font-medium">
                        {hist.performed_by_name || `User #${hist.performed_by}`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FEATURE 17 - EVIDENCE SECTION */}
        <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-soft-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#1565C0] dark:text-blue-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Complaint Evidence ({evidenceList.length})
              </h2>
            </div>
          </div>

          {/* Evidence List */}
          {evidenceList.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-400">
              No evidence files attached to this complaint.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {evidenceList.map((ev) => {
                const isImg =
                  ev.file_type.includes('image') ||
                  ev.file_name.endsWith('.jpg') ||
                  ev.file_name.endsWith('.jpeg') ||
                  ev.file_name.endsWith('.png');
                const fileUrl = api.complaints.getEvidenceFileUrl(activeComplaint.id, ev.id);

                return (
                  <div
                    key={ev.id}
                    className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#1565C0] dark:text-blue-400 flex items-center justify-center shrink-0">
                        {isImg ? <FileText className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                      </div>
                      <div className="truncate">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                          {ev.file_name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {(ev.file_size / 1024).toFixed(1)} KB • {new Date(ev.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 text-[11px] font-semibold text-[#1565C0] hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition shrink-0 flex items-center gap-1"
                    >
                      <span>View</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                );
              })}
            </div>
          )}

          {/* Evidence Upload Form */}
          <form
            onSubmit={handleUploadEvidence}
            className="pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-3"
          >
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Upload Additional Evidence (JPG, PNG, PDF up to 10 MB)
            </label>

            {uploadError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300">
                {uploadError}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileSelection}
                className="flex-1 text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#1565C0] hover:file:bg-blue-100 dark:file:bg-slate-800 dark:file:text-blue-300 cursor-pointer"
              />
              <button
                type="submit"
                disabled={!uploadFile || isUploading}
                className="py-2 px-4 bg-[#1565C0] hover:bg-[#0D47A1] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {isUploading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================================
  // VIEW: MY COMPLAINTS LIST + ADVANCED FILTERS & SEARCH
  // ==========================================================
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto pb-28 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#1565C0] dark:text-blue-300 text-xs font-semibold mb-2 border border-blue-200/60 dark:border-blue-800">
            <Shield className="w-3.5 h-3.5" />
            <span>Official Grievance Registry</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            My Complaints
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Search, filter, and track all submitted civic grievances in real time.
          </p>
        </div>

        <button
          onClick={fetchComplaints}
          title="Refresh List"
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold shadow-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-soft-sm space-y-3">
        <div className="flex gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search complaints by title or description..."
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565C0] transition"
            />
          </div>

          {/* Toggle More Filters */}
          <button
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className={`px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              showFilterDrawer ||
              selectedCategory !== 'All' ||
              selectedPriority !== 'All' ||
              selectedDeptId !== 'All' ||
              startDate ||
              endDate
                ? 'bg-blue-50 dark:bg-blue-950/60 text-[#1565C0] dark:text-blue-400 border-blue-200 dark:border-blue-800'
                : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>
        </div>

        {/* Quick Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 shrink-0">Status:</span>
          {STATUSES.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedStatus === st
                  ? 'bg-[#1565C0] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Expandable Advanced Filters */}
        {showFilterDrawer && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Category Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Priority</label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Department</label>
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
              >
                <option value="All">All Departments</option>
                {departmentsList.map((d) => (
                  <option key={d.id} value={String(d.id)}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filters */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Date Range</label>
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-1/2 px-1.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] text-slate-800 dark:text-white"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-1/2 px-1.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] text-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Reset Filters button */}
            <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-semibold text-[#1565C0] dark:text-blue-400 hover:underline cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* COMPLAINTS LIST */}
      {loadError && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{loadError}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400 space-y-2">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p>Fetching grievances from CivicPulse...</p>
        </div>
      ) : complaints.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-700/80 text-center space-y-2">
          <Search className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No complaints found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            No grievances matched your current filter criteria. Try clearing or relaxing filters.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Showing {complaints.length} grievances</span>
            <span>Click any grievance to view details, timeline & evidence</span>
          </div>

          {complaints.map((c) => (
            <div
              key={c.id}
              onClick={() => handleSelectComplaint(c)}
              className="bg-white dark:bg-slate-800/90 hover:bg-slate-50/80 dark:hover:bg-slate-750 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-soft-sm transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-extrabold text-[#1565C0] dark:text-blue-400">
                    #{c.id}
                  </span>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-md">
                    {c.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                    {c.category}
                  </span>
                  <span>•</span>
                  <span>Dept: {getDeptName(c.department_id)}</span>
                  <span>•</span>
                  <span>{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Status & Priority Badges */}
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${getStatusBadge(
                    c.status
                  )}`}
                >
                  {c.status}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${getPriorityBadge(
                    c.priority
                  )}`}
                >
                  {c.priority}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
