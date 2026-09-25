export type Language = 'en' | 'ta' | 'hi';

export type Role =
  | 'citizen'
  | 'ward_officer'
  | 'junior_engineer'
  | 'department_officer'
  | 'municipal_commissioner'
  | 'district_collector'
  | 'state_secretary'
  | 'minister'
  | 'cm_grievance_cell'
  | 'super_admin';

export interface RoleInfo {
  role: Role;
  title: string;
  shortTitle: string;
  level: number;
  department?: string;
  badgeColor: string;
  description: string;
}

export type IssueCategory =
  | 'Road Damage'
  | 'Garbage'
  | 'Water Leakage'
  | 'Drainage'
  | 'Streetlight'
  | 'Power Failure'
  | 'Traffic Signal'
  | 'Fallen Tree'
  | 'Others';

export type JurisdictionTier =
  | 'Village Panchayat'
  | 'Town Panchayat'
  | 'Municipality'
  | 'Municipal Corporation'
  | 'District Collectorate';

export type PriorityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export type ComplaintStatus =
  | 'Submitted'
  | 'Assigned'
  | 'In Progress'
  | 'Escalated'
  | 'Resolved'
  | 'Awaiting Verification'
  | 'Closed';

export interface GpsTag {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: string;
  address?: string;
}

export interface LocationCoordinate {
  lat: number;
  lng: number;
  accuracy?: number;
  address: string;
  ward: string;
  zone: string;
  district: string;
  state: string;
  pincode: string;
  landmark?: string;
  jurisdictionTier: JurisdictionTier;
}

export interface EscalationRecord {
  id: string;
  timestamp: string;
  fromRole: Role;
  fromRoleTitle: string;
  toRole: Role;
  toRoleTitle: string;
  reason: string;
  level: number;
}

export interface VerificationData {
  verifiedAt?: string;
  isSatisfied?: boolean;
  citizenFeedback?: string;
  rating?: number;
  citizenVerificationPhoto?: string;
  citizenGpsMetadata?: GpsTag;
  distanceMetersFromSite?: number;
  isOutsideAllowedRadius?: boolean;
}

export interface Complaint {
  id: string;
  citizenId: string;
  citizenName: string;
  citizenPhone: string;
  title: string;
  description: string;
  category: IssueCategory;
  priority: PriorityLevel;
  severity: PriorityLevel;
  status: ComplaintStatus;
  department: string;
  departmentId: string;
  assignedToRole: Role;
  assignedOfficerName: string;
  assignedOfficerContact: string;
  currentEscalationLevel: number;
  location: LocationCoordinate;
  beforeImageUrl: string;
  beforePhotoMetadata?: GpsTag;
  afterImageUrl?: string;
  authorityResolutionMetadata?: GpsTag;
  workNotes?: string;
  submittedAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  slaHours: number;
  slaExpiresAt: string;
  isEscalated: boolean;
  escalationHistory: EscalationRecord[];
  verification?: VerificationData;
  aiMetadata?: {
    confidence: number;
    detectedCategory: IssueCategory;
    estimatedHours: number;
    duplicateSuspect?: boolean;
    duplicateOfId?: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  avatarUrl?: string;
  ward?: string;
  zone?: string;
  district?: string;
  state?: string;
  department?: string;
  designation?: string;
  reputationScore?: number;
  badges?: string[];
}

export interface Department {
  id: string;
  name: string;
  code: string;
  category: IssueCategory;
  district: string;
  state: string;
  trustScore: number;
  credits: number;
  penaltyPoints: number;
  avgResolutionHours: number;
  verificationRate: number;
  citizenSatisfaction: number;
  totalResolved: number;
  totalComplaints: number;
  headOfficer: string;
  emergencyContact: string;
}

export type LeaderboardCategory =
  | 'districts'
  | 'municipal_corporations'
  | 'municipalities'
  | 'town_panchayats'
  | 'village_panchayats'
  | 'departments';

export type TimeframeFilter = 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';

export interface LeaderboardEntity {
  id: string;
  name: string;
  category: LeaderboardCategory;
  tier: JurisdictionTier;
  state: string;
  district: string;
  localBodyType?: string;
  departmentCategory?: IssueCategory;
  trustScore: number;
  totalReceived: number;
  totalResolved: number;
  resolutionRate: number;
  avgResolutionHours: number;
  citizenVerificationRate: number;
  citizenSatisfaction: number;
  escalatedCount: number;
  reopenedCount: number;
  slaCompliance: number;
  badges: string[];
  trend: number;
  historicalTrust: { month: string; score: number }[];
  coordinates?: { lat: number; lng: number };
}

export interface DistrictLeaderboardEntry {
  rank: number;
  district: string;
  state: string;
  department: string;
  category: IssueCategory;
  trustScore: number;
  complaintsResolved: number;
  avgResolutionHours: number;
  citizenSatisfaction: number;
  verificationRate: number;
  timeframe: 'Weekly' | 'Monthly' | 'Yearly';
}

export interface NotificationItem {
  id: string;
  userId?: string;
  targetRole?: Role | 'all';
  complaintId?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'success' | 'escalation';
  timestamp: string;
  read: boolean;
}

export interface EmergencyContact {
  id: string;
  title: string;
  number: string;
  category: 'Police' | 'Fire' | 'Ambulance' | 'Women Helpline' | 'Child Helpline' | 'Electricity' | 'Water' | 'Disaster Management';
  icon: string;
  nearestStation: string;
  address: string;
  responseTime: string;
  lat: number;
  lng: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedActions?: {
    label: string;
    actionType: 'view_complaint' | 'navigate' | 'call';
    payload?: string;
  }[];
}
