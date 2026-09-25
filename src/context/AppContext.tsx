import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Role,
  User,
  Complaint,
  Department,
  NotificationItem,
  PriorityLevel,
  IssueCategory,
  Language,
  GpsTag,
} from '../types';
import { MOCK_USERS, ROLE_DEFINITIONS } from '../data/mockData';
import { storageService } from '../services/storageService';
import { checkAndRunAutoEscalations, escalateComplaint, calculateSlaExpiry } from '../services/escalationEngine';
import { calculateDistanceMeters } from '../services/aiService';
import { TRANSLATIONS } from '../i18n/translations';

export type AppTab =
  | 'home'
  | 'report'
  | 'track'
  | 'ai'
  | 'profile'
  | 'nearby'
  | 'emergency'
  | 'trust'
  | 'leaderboard'
  | 'authority_dash'
  | 'analytics'
  | 'super_admin';

interface AppContextType {
  currentRole: Role;
  currentUser: User;
  switchRole: (role: Role) => void;
  complaints: Complaint[];
  departments: Department[];
  notifications: NotificationItem[];
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  selectedComplaintId: string | null;
  setSelectedComplaintId: (id: string | null) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  deviceMode: 'mobile' | 'desktop';
  toggleDeviceMode: () => void;
  // Complaint Actions
  submitNewComplaint: (data: {
    title: string;
    description: string;
    category: IssueCategory;
    priority: PriorityLevel;
    location: any;
    imageUrl: string;
    photoMetadata?: GpsTag;
    aiMetadata?: any;
  }) => Complaint;
  markComplaintResolved: (
    complaintId: string,
    afterImageUrl: string,
    workNotes: string,
    authorityGpsTag?: GpsTag
  ) => void;
  verifyComplaintByCitizen: (
    complaintId: string,
    isSatisfied: boolean,
    feedback: string,
    citizenPhotoUrl: string,
    citizenGpsTag: GpsTag
  ) => { isOutsideAllowedRadius: boolean; distanceMeters: number };
  triggerManualEscalation: (complaintId: string, customReason?: string) => void;
  markNotificationAsRead: (notificationId: string) => void;
  resetAllDataToDefaults: () => void;
  // Auth state
  isAuthenticated: boolean;
  loginUser: (emailOrPhone: string, role?: Role) => void;
  logoutUser: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<Role>(() => storageService.getActiveRole());
  const [currentUser, setCurrentUser] = useState<User>(() => MOCK_USERS[storageService.getActiveRole()]);
  const [complaints, setComplaints] = useState<Complaint[]>(() => storageService.getComplaints());
  const [departments, setDepartments] = useState<Department[]>(() => storageService.getDepartments());
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => storageService.getNotifications());
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => storageService.isDemoMode());
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('civicpulse_language_v1') as Language) || 'en';
  });
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [deviceMode, setDeviceMode] = useState<'mobile' | 'desktop'>('mobile');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('civicpulse_language_v1', lang);
  };

  const t = useCallback(
    (key: string): string => {
      const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
      return dict[key] || TRANSLATIONS.en[key] || key;
    },
    [language]
  );

  const switchRole = useCallback((role: Role) => {
    setCurrentRole(role);
    setCurrentUser(MOCK_USERS[role]);
    storageService.saveActiveRole(role);

    if (role !== 'citizen' && role !== 'super_admin') {
      setActiveTab('authority_dash');
    } else if (role === 'super_admin') {
      setActiveTab('super_admin');
    } else {
      setActiveTab('home');
    }
  }, []);

  const toggleDemoMode = () => {
    const next = !isDemoMode;
    setIsDemoMode(next);
    storageService.saveDemoMode(next);
  };

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  const toggleDeviceMode = () => {
    setDeviceMode((prev) => (prev === 'mobile' ? 'desktop' : 'mobile'));
  };

  const loginUser = (emailOrPhone: string, role: Role = 'citizen') => {
    setIsAuthenticated(true);
    switchRole(role);
  };

  const logoutUser = () => {
    setIsAuthenticated(false);
  };

  // Background Tick: checks auto-escalation every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const { updatedComplaints, updatedDepartments, countEscalated } = checkAndRunAutoEscalations(
        complaints,
        departments,
        isDemoMode
      );

      if (countEscalated > 0) {
        setComplaints(updatedComplaints);
        setDepartments(updatedDepartments);
        setNotifications(storageService.getNotifications());
        storageService.saveComplaints(updatedComplaints);
        storageService.saveDepartments(updatedDepartments);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [complaints, departments, isDemoMode]);

  // Submit new complaint with live GPS metadata
  const submitNewComplaint = (data: {
    title: string;
    description: string;
    category: IssueCategory;
    priority: PriorityLevel;
    location: any;
    imageUrl: string;
    photoMetadata?: GpsTag;
    aiMetadata?: any;
  }): Complaint => {
    const nowIso = new Date().toISOString();
    const id = `CP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const { hours, expiresAt } = calculateSlaExpiry(data.priority, isDemoMode);

    const matchingDept = departments.find((d) => d.category === data.category) || departments[0];

    const newComplaint: Complaint = {
      id,
      citizenId: currentUser.id,
      citizenName: currentUser.name,
      citizenPhone: currentUser.phone,
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority,
      severity: data.priority,
      status: 'Assigned',
      department: matchingDept.name,
      departmentId: matchingDept.id,
      assignedToRole: 'ward_officer',
      assignedOfficerName: 'Ankit Verma (Ward Officer)',
      assignedOfficerContact: '+91 98111 00001',
      currentEscalationLevel: 1,
      location: {
        ...data.location,
        district: data.location.district || currentUser.district || 'Chennai',
        state: data.location.state || currentUser.state || 'Tamil Nadu',
        jurisdictionTier: data.location.jurisdictionTier || 'Municipal Corporation',
      },
      beforeImageUrl: data.imageUrl,
      beforePhotoMetadata: data.photoMetadata || {
        lat: data.location.lat,
        lng: data.location.lng,
        accuracy: 5,
        timestamp: nowIso,
        address: data.location.address,
      },
      submittedAt: nowIso,
      updatedAt: nowIso,
      slaHours: hours,
      slaExpiresAt: expiresAt,
      isEscalated: false,
      escalationHistory: [
        {
          id: 'esc-init-' + Date.now(),
          timestamp: nowIso,
          fromRole: 'citizen',
          fromRoleTitle: 'Citizen Live Sensor Submission',
          toRole: 'ward_officer',
          toRoleTitle: 'Ward Officer (L-1)',
          reason: `Auto-routed via live GPS [${data.location.lat.toFixed(4)}, ${data.location.lng.toFixed(4)}] to ${matchingDept.name}.`,
          level: 1,
        },
      ],
      aiMetadata: data.aiMetadata,
    };

    const nextComplaints = [newComplaint, ...complaints];
    setComplaints(nextComplaints);
    storageService.saveComplaints(nextComplaints);

    storageService.addNotification({
      targetRole: 'citizen',
      userId: currentUser.id,
      complaintId: id,
      title: `Grievance Registered: ${id}`,
      message: `Your live GPS-verified complaint has been assigned to ${matchingDept.name}. SLA: ${data.priority} priority.`,
      type: 'info',
    });

    storageService.addNotification({
      targetRole: 'ward_officer',
      complaintId: id,
      title: `New Verified Grievance Assigned: ${id}`,
      message: `Live GPS tagged issue: "${data.title}" at ${data.location.address}.`,
      type: 'alert',
    });

    setNotifications(storageService.getNotifications());
    return newComplaint;
  };

  // Authority marks resolved with live GPS tagged photo
  const markComplaintResolved = (
    complaintId: string,
    afterImageUrl: string,
    workNotes: string,
    authorityGpsTag?: GpsTag
  ) => {
    const nowIso = new Date().toISOString();
    const nextComplaints = complaints.map((c) => {
      if (c.id === complaintId) {
        return {
          ...c,
          status: 'Awaiting Verification' as const,
          afterImageUrl,
          authorityResolutionMetadata: authorityGpsTag || {
            lat: c.location.lat,
            lng: c.location.lng,
            accuracy: 6,
            timestamp: nowIso,
          },
          workNotes,
          resolvedAt: nowIso,
          updatedAt: nowIso,
        };
      }
      return c;
    });

    setComplaints(nextComplaints);
    storageService.saveComplaints(nextComplaints);

    const targetComp = complaints.find((c) => c.id === complaintId);
    if (targetComp) {
      storageService.addNotification({
        targetRole: 'citizen',
        userId: targetComp.citizenId,
        complaintId: targetComp.id,
        title: `Work Completed – On-Site Verification Required!`,
        message: `Field repairs for [${targetComp.id}] are done. Please visit the location and capture a live verification photo to confirm.`,
        type: 'success',
      });
      setNotifications(storageService.getNotifications());
    }
  };

  // Citizen verification: compares live GPS against complaint coordinates (50-100m radius check)
  const verifyComplaintByCitizen = (
    complaintId: string,
    isSatisfied: boolean,
    feedback: string,
    citizenPhotoUrl: string,
    citizenGpsTag: GpsTag
  ): { isOutsideAllowedRadius: boolean; distanceMeters: number } => {
    const nowIso = new Date().toISOString();
    const targetComp = complaints.find((c) => c.id === complaintId);
    if (!targetComp) {
      return { isOutsideAllowedRadius: false, distanceMeters: 0 };
    }

    // Calculate distance between complaint site and citizen verification GPS
    const distanceMeters = calculateDistanceMeters(
      targetComp.location.lat,
      targetComp.location.lng,
      citizenGpsTag.lat,
      citizenGpsTag.lng
    );

    // Radius validation: allowed within 100 meters
    const isOutsideAllowedRadius = distanceMeters > 100;

    if (isSatisfied) {
      // Close ticket, award department points
      const nextComplaints = complaints.map((c) => {
        if (c.id === complaintId) {
          return {
            ...c,
            status: 'Closed' as const,
            closedAt: nowIso,
            updatedAt: nowIso,
            verification: {
              verifiedAt: nowIso,
              isSatisfied: true,
              citizenFeedback: feedback || 'Citizen verified and accepted resolution.',
              rating: 5,
              citizenVerificationPhoto: citizenPhotoUrl,
              citizenGpsMetadata: citizenGpsTag,
              distanceMetersFromSite: distanceMeters,
              isOutsideAllowedRadius,
            },
          };
        }
        return c;
      });

      const nextDepts = departments.map((d) => {
        if (d.id === targetComp.departmentId || d.name === targetComp.department) {
          return {
            ...d,
            credits: d.credits + 50,
            trustScore: Math.min(100, d.trustScore + 2),
            totalResolved: d.totalResolved + 1,
          };
        }
        return d;
      });

      setComplaints(nextComplaints);
      setDepartments(nextDepts);
      storageService.saveComplaints(nextComplaints);
      storageService.saveDepartments(nextDepts);

      storageService.addNotification({
        targetRole: targetComp.assignedToRole,
        complaintId: targetComp.id,
        title: `Work Verified on Site by Citizen!`,
        message: `Citizen verified fix on site (${distanceMeters}m from site). +50 Trust Credits awarded to ${targetComp.department}.`,
        type: 'success',
      });
      setNotifications(storageService.getNotifications());
    } else {
      // Citizen rejected: Reopen, deduct penalty, auto-escalate to next authority
      const res = escalateComplaint(
        {
          ...targetComp,
          verification: {
            verifiedAt: nowIso,
            isSatisfied: false,
            citizenFeedback: feedback || 'Citizen reported work was NOT satisfactorily fixed upon physical inspection.',
            rating: 1,
            citizenVerificationPhoto: citizenPhotoUrl,
            citizenGpsMetadata: citizenGpsTag,
            distanceMetersFromSite: distanceMeters,
            isOutsideAllowedRadius,
          },
        },
        `Citizen Verification Rejected on Site (${distanceMeters}m away): Issue NOT fixed ("${feedback || 'Field work unacceptable'}")`,
        departments,
        isDemoMode
      );

      const nextComplaints = complaints.map((c) => (c.id === complaintId ? res.updatedComplaint : c));
      setComplaints(nextComplaints);
      setDepartments(res.updatedDepartments);
      storageService.saveComplaints(nextComplaints);
      storageService.saveDepartments(res.updatedDepartments);
      setNotifications(storageService.getNotifications());
    }

    return { isOutsideAllowedRadius, distanceMeters };
  };

  const triggerManualEscalation = (complaintId: string, customReason?: string) => {
    const comp = complaints.find((c) => c.id === complaintId);
    if (!comp) return;

    const res = escalateComplaint(
      comp,
      customReason || 'Manual Demo Escalation Triggered',
      departments,
      isDemoMode
    );

    const nextComplaints = complaints.map((c) => (c.id === complaintId ? res.updatedComplaint : c));
    setComplaints(nextComplaints);
    setDepartments(res.updatedDepartments);
    storageService.saveComplaints(nextComplaints);
    storageService.saveDepartments(res.updatedDepartments);
    setNotifications(storageService.getNotifications());
  };

  const markNotificationAsRead = (notificationId: string) => {
    const nextNotifs = notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n));
    setNotifications(nextNotifs);
    storageService.saveNotifications(nextNotifs);
  };

  const resetAllDataToDefaults = () => {
    storageService.resetAllData();
    setComplaints(storageService.getComplaints());
    setDepartments(storageService.getDepartments());
    setNotifications([]);
    setCurrentRole('citizen');
    setCurrentUser(MOCK_USERS.citizen);
    setIsDemoMode(false);
    setActiveTab('home');
  };

  return (
    <AppContext.Provider
      value={{
        currentRole,
        currentUser,
        switchRole,
        complaints,
        departments,
        notifications,
        isDemoMode,
        toggleDemoMode,
        activeTab,
        setActiveTab,
        selectedComplaintId,
        setSelectedComplaintId,
        language,
        setLanguage,
        t,
        theme,
        toggleTheme,
        deviceMode,
        toggleDeviceMode,
        submitNewComplaint,
        markComplaintResolved,
        verifyComplaintByCitizen,
        triggerManualEscalation,
        markNotificationAsRead,
        resetAllDataToDefaults,
        isAuthenticated,
        loginUser,
        logoutUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
