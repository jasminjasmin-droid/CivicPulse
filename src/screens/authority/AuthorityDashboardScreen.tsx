import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  RefreshCw,
  Building,
  User,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  FileText,
  AlertCircle,
  MapPin,
  Check,
  Send,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  api,
  ApiComplaint,
  ApiComplaintHistory,
  ApiComplaintEvidence,
  ApiDepartment,
  ApiAuthorityDashboard,
  ApiUser,
} from '../../services/api';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Resolved'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];
const CATEGORY_OPTIONS = [
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

export const AuthorityDashboardScreen: React.FC = () => {
  const { apiUser } = useApp();

  // Dashboard Stats State (GET /dashboard)
  const [stats, setStats] = useState<ApiAuthorityDashboard | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  // Complaints State (GET /complaints)
  const [complaints, setComplaints] = useState<ApiComplaint[]>([]);
  const [isComplaintsLoading, setIsComplaintsLoading] = useState(true);
  const [complaintsError, setComplaintsError] = useState<string | null>(null);

  // Filter State
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterDeptId, setFilterDeptId] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Departments & Authority Users State (GET /departments, GET /users)
  const [departments, setDepartments] = useState<ApiDepartment[]>([]);
  const [authorityOfficers, setAuthorityOfficers] = useState<ApiUser[]>([]);

  // Selected Complaint for Details & Management
  const [activeComplaint, setActiveComplaint] = useState<ApiComplaint | null>(null);
  const [timeline, setTimeline] = useState<ApiComplaintHistory[]>([]);
  const [evidenceList, setEvidenceList] = useState<ApiComplaintEvidence[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Action / Feedback State
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);

  // Assignment Form State
  const [assignDeptId, setAssignDeptId] = useState<string>('');
  const [assignAuthId, setAssignAuthId] = useState<string>('');

  // 1. Fetch Dashboard Stats (GET /dashboard)
  const fetchDashboardStats = useCallback(async () => {
    setIsStatsLoading(true);
    try {
      const data = await api.dashboard.getAuthorityStats();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to fetch authority dashboard stats:', err);
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  // 2. Fetch Complaints (GET /complaints with filters)
  const fetchComplaints = useCallback(async () => {
    setIsComplaintsLoading(true);
    setComplaintsError(null);
    try {
      const data = await api.complaints.getAll({
        search: search.trim() || undefined,
        status: filterStatus !== 'All' ? filterStatus : undefined,
        category: filterCategory !== 'All' ? filterCategory : undefined,
        priority: filterPriority !== 'All' ? filterPriority : undefined,
        department_id: filterDeptId !== 'All' ? filterDeptId : undefined,
        start_date: startDate.trim() || undefined,
        end_date: endDate.trim() || undefined,
      });
      setComplaints(data);
    } catch (err: any) {
      setComplaintsError(err.message || 'Failed to load complaints from backend');
    } finally {
      setIsComplaintsLoading(false);
    }
  }, [search, filterStatus, filterCategory, filterPriority, filterDeptId, startDate, endDate]);

  // Load Initial Metadata: Stats, Departments, Authority Users
  useEffect(() => {
    fetchDashboardStats();
    fetchComplaints();

    const loadMetadata = async () => {
      try {
        const [deptData, usersData] = await Promise.all([
          api.departments.getAll(),
          api.users.getAll().catch(() => [] as ApiUser[]),
        ]);
        setDepartments(deptData);
        setAuthorityOfficers(usersData.filter((u) => u.role === 'authority'));
      } catch (err) {
        console.error('Failed to load initial metadata:', err);
      }
    };
    loadMetadata();
  }, [fetchDashboardStats, fetchComplaints]);

  // 3. Load Complaint Details, Timeline, and Evidence
  const loadComplaintDetails = async (id: number) => {
    setIsDetailLoading(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const [comp, hist, ev] = await Promise.all([
        api.complaints.getById(id),
        api.complaints.getHistory(id),
        api.complaints.getEvidence(id),
      ]);
      setActiveComplaint(comp);
      // Sort timeline chronologically (oldest first)
      const sorted = [...hist].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setTimeline(sorted);
      setEvidenceList(ev);

      // Prepopulate assignment inputs
      setAssignDeptId(comp.department_id ? String(comp.department_id) : '');
      setAssignAuthId(comp.assigned_authority_id ? String(comp.assigned_authority_id) : '');
    } catch (err: any) {
      console.error('Failed to load complaint details:', err);
      setActionError(err.message || 'Failed to load complaint details');
    } finally {
      setIsDetailLoading(false);
    }
  };

  // 4. Update Status (PATCH /complaints/{id}/status)
  const handleUpdateStatus = async (newStatus: string) => {
    if (!activeComplaint || activeComplaint.status === newStatus) return;
    setIsActionSubmitting(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const updated = await api.complaints.updateStatus(activeComplaint.id, newStatus);
      setActiveComplaint(updated);
      setActionSuccess(`Status successfully updated to "${newStatus}".`);

      // Refresh timeline & lists
      const newHist = await api.complaints.getHistory(activeComplaint.id);
      setTimeline(
        [...newHist].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      );
      fetchDashboardStats();
      fetchComplaints();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update complaint status');
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // 5. Update Priority (PATCH /complaints/{id}/priority)
  const handleUpdatePriority = async (newPriority: string) => {
    if (!activeComplaint || activeComplaint.priority === newPriority) return;
    setIsActionSubmitting(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const updated = await api.complaints.updatePriority(activeComplaint.id, newPriority);
      setActiveComplaint(updated);
      setActionSuccess(`Priority successfully updated to "${newPriority}".`);

      // Refresh timeline & lists
      const newHist = await api.complaints.getHistory(activeComplaint.id);
      setTimeline(
        [...newHist].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      );
      fetchDashboardStats();
      fetchComplaints();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update complaint priority');
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // 6. Update Assignment (PATCH /complaints/{id}/assignment)
  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeComplaint) return;

    const parsedDeptId = assignDeptId ? parseInt(assignDeptId, 10) : undefined;
    const parsedAuthId = assignAuthId ? parseInt(assignAuthId, 10) : undefined;

    if (parsedDeptId === undefined && parsedAuthId === undefined) {
      setActionError('Please select at least a Department or an Assigned Officer.');
      return;
    }

    setIsActionSubmitting(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const updated = await api.complaints.updateAssignment(activeComplaint.id, {
        department_id: parsedDeptId,
        assigned_authority_id: parsedAuthId,
      });
      setActiveComplaint(updated);
      setActionSuccess('Department & Authority assignment updated successfully.');

      // Refresh timeline & lists
      const newHist = await api.complaints.getHistory(activeComplaint.id);
      setTimeline(
        [...newHist].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      );
      fetchComplaints();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update assignment');
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setFilterStatus('All');
    setFilterCategory('All');
    setFilterPriority('All');
    setFilterDeptId('All');
    setStartDate('');
    setEndDate('');
  };

  const getDepartmentName = (deptId?: number | null) => {
    if (!deptId) return 'Unassigned';
    const d = departments.find((dept) => dept.id === deptId);
    return d ? d.name : `Dept #${deptId}`;
  };

  const getOfficerName = (authId?: number | null) => {
    if (!authId) return 'Unassigned';
    const o = authorityOfficers.find((u) => u.id === authId);
    return o ? `${o.name} (Officer #${o.id})` : `Officer #${authId}`;
  };

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
  // VIEW: COMPLAINT DETAILS & MANAGEMENT VIEW
  // ==========================================================
  if (activeComplaint) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto pb-28 space-y-6">
        {/* Navigation & Back Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setActiveComplaint(null)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Complaints List</span>
          </button>

          <span className="text-xs font-mono font-bold text-slate-400">
            ID #{activeComplaint.id}
          </span>
        </div>

        {/* Action Success / Error Feedback */}
        {actionSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {actionError && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* 1. Main Complaint Detail Card */}
        <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-soft-md space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-[#1565C0] dark:text-blue-400">
                Grievance #{activeComplaint.id}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Submitted {new Date(activeComplaint.created_at).toLocaleString()}
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
                <strong>Department:</strong> {getDepartmentName(activeComplaint.department_id)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                <strong>Assigned Authority:</strong>{' '}
                {getOfficerName(activeComplaint.assigned_authority_id)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Layers className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                <strong>Category:</strong> {activeComplaint.category}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                <strong>Citizen Submitter ID:</strong> #{activeComplaint.citizen_id}
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

        {/* 2. Authority Action Controls Grid: Status, Priority, Assignment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status & Priority Management */}
          <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-soft-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#1565C0] dark:text-blue-400" />
              <span>Update Workflow & Priority</span>
            </h3>

            {/* Status Update (PATCH /complaints/{id}/status) */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Complaint Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {STATUS_OPTIONS.map((st) => (
                  <button
                    key={st}
                    type="button"
                    disabled={isActionSubmitting || activeComplaint.status === st}
                    onClick={() => handleUpdateStatus(st)}
                    className={`py-2 px-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 ${
                      activeComplaint.status === st
                        ? 'bg-[#1565C0] text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {activeComplaint.status === st && <Check className="w-3 h-3" />}
                    <span>{st}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Update (PATCH /complaints/{id}/priority) */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Grievance Priority
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {PRIORITY_OPTIONS.map((pr) => (
                  <button
                    key={pr}
                    type="button"
                    disabled={isActionSubmitting || activeComplaint.priority === pr}
                    onClick={() => handleUpdatePriority(pr)}
                    className={`py-1.5 px-1 text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-0.5 cursor-pointer disabled:opacity-50 ${
                      activeComplaint.priority === pr
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {activeComplaint.priority === pr && <Check className="w-2.5 h-2.5" />}
                    <span>{pr}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Department & Officer Assignment (PATCH /complaints/{id}/assignment) */}
          <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-soft-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-4 h-4 text-[#1565C0] dark:text-blue-400" />
              <span>Department & Officer Assignment</span>
            </h3>

            <form onSubmit={handleUpdateAssignment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Responsible Department
                </label>
                <select
                  value={assignDeptId}
                  onChange={(e) => setAssignDeptId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1565C0]"
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={String(d.id)}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Assign Officer / Authority
                </label>
                <select
                  value={assignAuthId}
                  onChange={(e) => setAssignAuthId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1565C0]"
                >
                  <option value="">-- Select Authority Officer --</option>
                  {authorityOfficers.map((o) => (
                    <option key={o.id} value={String(o.id)}>
                      {o.name} ({o.email})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isActionSubmitting}
                className="w-full py-2 bg-[#1565C0] hover:bg-[#0D47A1] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isActionSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Save Assignment</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* 3. Evidence Viewer (GET /complaints/{id}/evidence) */}
        <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-soft-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#1565C0] dark:text-blue-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Submitted Evidence Files ({evidenceList.length})
              </h2>
            </div>
          </div>

          {evidenceList.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-400">
              No evidence files attached to this complaint.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {evidenceList.map((ev) => {
                const fileUrl = api.complaints.getEvidenceFileUrl(activeComplaint.id, ev.id);
                return (
                  <div
                    key={ev.id}
                    className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#1565C0] dark:text-blue-400 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
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
        </div>

        {/* 4. Chronological Timeline (GET /complaints/{id}/history) */}
        <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-soft-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1565C0] dark:text-blue-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Audit Timeline & Event Log
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {timeline.length} history events
            </span>
          </div>

          {timeline.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No historical events recorded for this complaint.
            </div>
          ) : (
            <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
              {timeline.map((hist, idx) => (
                <div key={hist.id || idx} className="relative group">
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

                    {(hist.old_value || hist.new_value) && (
                      <div className="mt-1 p-2 rounded-xl bg-white dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700 flex items-center gap-1.5 flex-wrap">
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
                        {hist.performed_by_name || `Authority #${hist.performed_by}`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================================
  // VIEW: MAIN AUTHORITY DASHBOARD & COMPLAINT MANAGEMENT
  // ==========================================================
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-28 space-y-6">
      {/* Top Authority Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#1565C0] dark:text-blue-300 text-xs font-semibold mb-2 border border-blue-200/60 dark:border-blue-800">
            <Shield className="w-3.5 h-3.5 text-[#1565C0]" />
            <span>Authority Redressal Console (GET /dashboard)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Authority Operations Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time public grievance monitoring, SLA redressal, and cross-department assignments.
          </p>
        </div>

        <button
          onClick={() => {
            fetchDashboardStats();
            fetchComplaints();
          }}
          title="Refresh Dashboard"
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isStatsLoading || isComplaintsLoading ? 'animate-spin' : ''}`}
          />
          <span>Refresh Live Data</span>
        </button>
      </div>

      {/* FEATURE 1: 6 LIVE DASHBOARD CARDS (GET /dashboard) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-blue-100 dark:border-slate-700 shadow-soft-sm flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Total Complaints
          </span>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {isStatsLoading ? '...' : stats?.total ?? 0}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">All tickets</p>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-amber-100 dark:border-slate-700 shadow-soft-sm flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Pending
          </span>
          <div className="mt-2">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {isStatsLoading ? '...' : stats?.pending ?? 0}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Awaiting triage</p>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-sky-100 dark:border-slate-700 shadow-soft-sm flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            In Progress
          </span>
          <div className="mt-2">
            <div className="text-2xl font-black text-sky-600 dark:text-sky-400">
              {isStatsLoading ? '...' : stats?.in_progress ?? 0}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Active field work</p>
          </div>
        </div>

        {/* Resolved */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-emerald-100 dark:border-slate-700 shadow-soft-sm flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Resolved
          </span>
          <div className="mt-2">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {isStatsLoading ? '...' : stats?.resolved ?? 0}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Completed</p>
          </div>
        </div>

        {/* High Priority */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-orange-100 dark:border-slate-700 shadow-soft-sm flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            High Priority
          </span>
          <div className="mt-2">
            <div className="text-2xl font-black text-orange-600 dark:text-orange-400">
              {isStatsLoading ? '...' : stats?.high_priority ?? 0}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">SLA: 24 Hours</p>
          </div>
        </div>

        {/* Critical Priority */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-rose-100 dark:border-slate-700 shadow-soft-sm flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Critical Priority
          </span>
          <div className="mt-2">
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {isStatsLoading ? '...' : stats?.critical_priority ?? 0}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">SLA: 2 Hours</p>
          </div>
        </div>
      </div>

      {/* FEATURE 2: COMPLAINT MANAGEMENT SEARCH & FILTERS (GET /complaints) */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-soft-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search across all complaints by title or description..."
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565C0] transition"
            />
          </div>

          {/* Toggle Advanced Filters */}
          <button
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className={`px-4 py-2.5 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              showFilterDrawer ||
              filterCategory !== 'All' ||
              filterPriority !== 'All' ||
              filterDeptId !== 'All' ||
              startDate ||
              endDate
                ? 'bg-blue-50 dark:bg-blue-950/60 text-[#1565C0] dark:text-blue-400 border-blue-200 dark:border-blue-800'
                : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Criteria</span>
          </button>
        </div>

        {/* Quick Status Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 shrink-0">Status:</span>
          {['All', ...STATUS_OPTIONS].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                filterStatus === st
                  ? 'bg-[#1565C0] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Advanced Filters Expandable Drawer */}
        {showFilterDrawer && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Category Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
              >
                {CATEGORY_OPTIONS.map((c) => (
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
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
              >
                {['All', ...PRIORITY_OPTIONS].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter (Loaded from GET /departments) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Department</label>
              <select
                value={filterDeptId}
                onChange={(e) => setFilterDeptId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
              >
                <option value="All">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={String(d.id)}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
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

      {/* COMPLAINTS LIST TABLE / CARDS */}
      {complaintsError && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{complaintsError}</span>
        </div>
      )}

      {isComplaintsLoading ? (
        <div className="py-12 text-center text-xs text-slate-400 space-y-2">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p>Querying grievance records from FastAPI backend...</p>
        </div>
      ) : complaints.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-700/80 text-center space-y-2">
          <Search className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No complaints found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            No grievance records match the current filter parameters.
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
            <span>Displaying {complaints.length} grievances across platform</span>
            <span>Click any grievance to view details, update status, and assign</span>
          </div>

          {complaints.map((c) => (
            <div
              key={c.id}
              onClick={() => loadComplaintDetails(c.id)}
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
                  <span>Dept: {getDepartmentName(c.department_id)}</span>
                  <span>•</span>
                  <span>Authority: {c.assigned_authority_id ? `#${c.assigned_authority_id}` : 'Unassigned'}</span>
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
