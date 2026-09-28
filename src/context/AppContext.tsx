import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Role,
  User,
  Complaint,
  ComplaintStatus,
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
import {
  api,
  tokenStorage,
  ApiUser,
  ApiCitizenDashboard,
  ApiDepartment,
  ApiComplaint,
  ApiNotification,
  ApiLoginResponse,
} from '../services/api';

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
  isAuthLoading: boolean;
  apiUser: ApiUser | null;
  loginUser: (emailOrPhone: string, role?: Role) => void;
  loginWithCredentials: (email: string, password: string) => Promise<ApiLoginResponse>;
  registerCitizen: (data: { name: string; email: string; password: string }) => Promise<ApiUser>;
  logoutUser: () => void;
  // Real Backend Data & State
  backendNotifications: ApiNotification[];
  unreadNotificationsCount: number;
  refreshNotifications: () => Promise<void>;
  markBackendNotificationAsRead: (id: number) => Promise<void>;
  markAllBackendNotificationsAsRead: () => Promise<void>;
  citizenStats: ApiCitizenDashboard | null;
  refreshCitizenStats: () => Promise<void>;
  backendComplaints: ApiComplaint[];
  refreshBackendComplaints: (params?: any) => Promise<void>;
  departmentsList: ApiDepartment[];
  refreshDepartments: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<Role>(() => storageService.getActiveRole());
  const [currentUser, setCurrentUser] = useState<User>(() => MOCK_USERS[storageService.getActiveRole()]);
  const [complaints, setComplaints] = useState<Complaint[]>(() => storageService.getComplaints());
  const [departments, setDepartments] = useState<Department[]>(() => storageService.getDepartments());
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => storageService.getNotifications());
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => storageService.isDemoMode());
  const [activeTab, setActiveTabState] = useState<AppTab>('home');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('civicpulse_language_v1') as Language) || 'en';
  });
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [deviceMode, setDeviceMode] = useState<'mobile' | 'desktop'>('mobile');

  // Backend Integration State
  const [apiUser, setApiUser] = useState<ApiUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!tokenStorage.get());
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [backendNotifications, setBackendNotifications] = useState<ApiNotification[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [citizenStats, setCitizenStats] = useState<ApiCitizenDashboard | null>(null);
  const [backendComplaints, setBackendComplaints] = useState<ApiComplaint[]>([]);
  const [departmentsList, setDepartmentsList] = useState<ApiDepartment[]>([]);

  // RBAC Guarded Tab Navigator
  const setActiveTab = useCallback(
    (tab: AppTab) => {
      // Citizens cannot access authority or admin screens
      if (apiUser?.role === 'citizen' && ['authority_dash', 'analytics', 'super_admin'].includes(tab)) {
        console.warn(`Access denied to tab '${tab}' for role citizen`);
        setActiveTabState('home');
        return;
      }
      setActiveTabState(tab);
    },
    [apiUser]
  );

  // Initialize Auth on startup via backend /me
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      const token = tokenStorage.get();
      if (!token) {
        if (isMounted) {
          setIsAuthenticated(false);
          setApiUser(null);
          setIsAuthLoading(false);
        }
        return;
      }

      try {
        const me = await api.auth.getMe();
        if (isMounted) {
          setApiUser(me);
          setIsAuthenticated(true);
          const mappedRole = (me.role === 'admin' ? 'super_admin' : me.role) as Role;
          setCurrentRole(mappedRole);
          setCurrentUser((prev) => ({
            ...prev,
            id: String(me.id),
            name: me.name,
            email: me.email,
            role: mappedRole,
          }));
        }
      } catch (err) {
        if (isMounted) {
          tokenStorage.remove();
          setIsAuthenticated(false);
          setApiUser(null);
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    };

    initAuth();

    const handleUnauthorized = () => {
      if (isMounted) {
        setIsAuthenticated(false);
        setApiUser(null);
        tokenStorage.remove();
      }
    };
    window.addEventListener('civicpulse:unauthorized', handleUnauthorized);

    return () => {
      isMounted = false;
      window.removeEventListener('civicpulse:unauthorized', handleUnauthorized);
    };
  }, []);

  // Backend Data Fetchers
  const refreshNotifications = useCallback(async () => {
    if (!tokenStorage.get()) return;
    try {
      const [list, countRes] = await Promise.all([
        api.notifications.getAll(),
        api.notifications.getUnreadCount(),
      ]);
      setBackendNotifications(list);
      setUnreadNotificationsCount(countRes.unread_count);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, []);

  const markBackendNotificationAsRead = useCallback(
    async (id: number) => {
      try {
        await api.notifications.markAsRead(id);
        await refreshNotifications();
      } catch (err) {
        console.error('Failed to mark notification read:', err);
      }
    },
    [refreshNotifications]
  );

  const markAllBackendNotificationsAsRead = useCallback(async () => {
    try {
      await api.notifications.markAllAsRead();
      await refreshNotifications();
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  }, [refreshNotifications]);

  const refreshCitizenStats = useCallback(async () => {
    if (!tokenStorage.get()) return;
    try {
      const stats = await api.dashboard.getCitizenStats();
      setCitizenStats(stats);
    } catch (err) {
      console.error('Failed to fetch citizen stats:', err);
    }
  }, []);

  const refreshBackendComplaints = useCallback(async (params?: any) => {
    if (!tokenStorage.get()) return;
    try {
      const list = await api.complaints.getAll(params);
      setBackendComplaints(list);
    } catch (err) {
      console.error('Failed to fetch complaints:', err);
    }
  }, []);

  const refreshDepartments = useCallback(async () => {
    try {
      const list = await api.departments.getAll();
      setDepartmentsList(list);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  }, []);

  // Fetch backend data once authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshNotifications();
      refreshCitizenStats();
      refreshBackendComplaints();
      refreshDepartments();
    }
  }, [isAuthenticated, refreshNotifications, refreshCitizenStats, refreshBackendComplaints, refreshDepartments]);

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

  const switchRole = useCallback(
    (role: Role) => {
      // If user is logged into backend as citizen, lock down RBAC
      if (apiUser?.role === 'citizen') {
        console.warn('Citizen cannot switch to authority or admin role.');
        return;
      }

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
    },
    [apiUser, setActiveTab]
  );

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

  const loginWithCredentials = async (email: string, password: string): Promise<ApiLoginResponse> => {
    const res = await api.auth.login({ email, password });
    const me = await api.auth.getMe();
    setApiUser(me);
    setIsAuthenticated(true);
    const mappedRole = (me.role === 'admin' ? 'super_admin' : me.role) as Role;
    setCurrentRole(mappedRole);
    setCurrentUser((prev) => ({
      ...prev,
      id: String(me.id),
      name: me.name,
      email: me.email,
      role: mappedRole,
    }));

    if (me.role === 'citizen') {
      setActiveTabState('home');
    } else if (me.role === 'authority') {
      setActiveTabState('authority_dash');
    } else if (me.role === 'admin') {
      setActiveTabState('super_admin');
    }

    refreshNotifications();
    refreshCitizenStats();
    refreshBackendComplaints();
    refreshDepartments();

    return res;
  };

  const registerCitizen = async (data: { name: string; email: string; password: string }): Promise<ApiUser> => {
    return api.auth.register({
      name: data.name,
      email: data.email,
      password: data.password,
      role: 'citizen',
    });
  };

  const loginUser = (emailOrPhone: string, role: Role = 'citizen') => {
    setIsAuthenticated(true);
    switchRole(role);
  };

  const logoutUser = () => {
    api.auth.logout();
    setApiUser(null);
    setIsAuthenticated(false);
    setActiveTabState('home');
  };

  // Background Tick: checks auto-escalation every 3 seconds for prototype
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
    return newComplaint;
  };

  const markComplaintResolved = (
    complaintId: string,
    afterImageUrl: string,
    workNotes: string,
    authorityGpsTag?: GpsTag
  ) => {
    const next = complaints.map((c) => {
      if (c.id === complaintId) {
        return {
          ...c,
          status: 'Awaiting Verification' as const,
          afterImageUrl,
          workNotes,
          authorityResolutionMetadata: authorityGpsTag,
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });
    setComplaints(next);
    storageService.saveComplaints(next);
  };

  const verifyComplaintByCitizen = (
    complaintId: string,
    isSatisfied: boolean,
    feedback: string,
    citizenPhotoUrl: string,
    citizenGpsTag: GpsTag
  ) => {
    const complaint = complaints.find((c) => c.id === complaintId);
    let distance = 0;
    let isOutside = false;

    if (complaint && complaint.location) {
      distance = calculateDistanceMeters(
        complaint.location.lat,
        complaint.location.lng,
        citizenGpsTag.lat,
        citizenGpsTag.lng
      );
      isOutside = distance > 150;
    }

    const next = complaints.map((c) => {
      if (c.id === complaintId) {
        return {
          ...c,
          status: (isSatisfied ? 'Resolved' : 'In Progress') as ComplaintStatus,
          verification: {
            verifiedAt: new Date().toISOString(),
            isSatisfied,
            citizenFeedback: feedback,
            citizenVerificationPhoto: citizenPhotoUrl,
            citizenGpsMetadata: citizenGpsTag,
            distanceMetersFromSite: distance,
            isOutsideAllowedRadius: isOutside,
          },
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });

    setComplaints(next);
    storageService.saveComplaints(next);
    return { isOutsideAllowedRadius: isOutside, distanceMeters: distance };
  };

  const triggerManualEscalation = (complaintId: string, customReason?: string) => {
    const c = complaints.find((comp) => comp.id === complaintId);
    if (!c) return;
    const { updatedComplaint, updatedDepartments } = escalateComplaint(
      c,
      customReason || 'Citizen triggered manual escalation',
      departments,
      isDemoMode
    );
    const next = complaints.map((item) => (item.id === complaintId ? updatedComplaint : item));
    setComplaints(next);
    setDepartments(updatedDepartments);
    storageService.saveComplaints(next);
    storageService.saveDepartments(updatedDepartments);
  };

  const markNotificationAsRead = (notificationId: string) => {
    const next = notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n));
    setNotifications(next);
    storageService.saveNotifications(next);
  };

  const resetAllDataToDefaults = () => {
    storageService.resetAllData();
    setComplaints(storageService.getComplaints());
    setDepartments(storageService.getDepartments());
    setNotifications(storageService.getNotifications());
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
        isAuthLoading,
        apiUser,
        loginUser,
        loginWithCredentials,
        registerCitizen,
        logoutUser,
        backendNotifications,
        unreadNotificationsCount,
        refreshNotifications,
        markBackendNotificationAsRead,
        markAllBackendNotificationsAsRead,
        citizenStats,
        refreshCitizenStats,
        backendComplaints,
        refreshBackendComplaints,
        departmentsList,
        refreshDepartments,
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
