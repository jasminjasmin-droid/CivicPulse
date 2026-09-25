import { Complaint, Department, NotificationItem, User, Role } from '../types';
import { INITIAL_COMPLAINTS, INITIAL_DEPARTMENTS, MOCK_USERS } from '../data/mockData';

const COMPLAINTS_KEY = 'civicpulse_complaints_v1';
const DEPARTMENTS_KEY = 'civicpulse_departments_v1';
const NOTIFICATIONS_KEY = 'civicpulse_notifications_v1';
const OFFLINE_DRAFTS_KEY = 'civicpulse_offline_drafts_v1';
const ACTIVE_USER_ROLE_KEY = 'civicpulse_active_role_v1';
const DEMO_MODE_KEY = 'civicpulse_demo_mode_v1';

export const storageService = {
  getComplaints(): Complaint[] {
    try {
      const data = localStorage.getItem(COMPLAINTS_KEY);
      if (!data) {
        localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(INITIAL_COMPLAINTS));
        return INITIAL_COMPLAINTS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_COMPLAINTS;
    }
  },

  saveComplaints(complaints: Complaint[]): void {
    localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(complaints));
  },

  getDepartments(): Department[] {
    try {
      const data = localStorage.getItem(DEPARTMENTS_KEY);
      if (!data) {
        localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(INITIAL_DEPARTMENTS));
        return INITIAL_DEPARTMENTS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_DEPARTMENTS;
    }
  },

  saveDepartments(departments: Department[]): void {
    localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(departments));
  },

  getNotifications(): NotificationItem[] {
    try {
      const data = localStorage.getItem(NOTIFICATIONS_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveNotifications(notifications: NotificationItem[]): void {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  },

  addNotification(notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>): NotificationItem {
    const notifications = this.getNotifications();
    const newNotif: NotificationItem = {
      ...notification,
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      read: false,
    };
    notifications.unshift(newNotif);
    this.saveNotifications(notifications.slice(0, 50));
    return newNotif;
  },

  getActiveRole(): Role {
    try {
      const role = localStorage.getItem(ACTIVE_USER_ROLE_KEY) as Role;
      return role || 'citizen';
    } catch {
      return 'citizen';
    }
  },

  saveActiveRole(role: Role): void {
    localStorage.setItem(ACTIVE_USER_ROLE_KEY, role);
  },

  isDemoMode(): boolean {
    return localStorage.getItem(DEMO_MODE_KEY) === 'true';
  },

  saveDemoMode(isDemo: boolean): void {
    localStorage.setItem(DEMO_MODE_KEY, String(isDemo));
  },

  getOfflineDrafts(): any[] {
    try {
      const data = localStorage.getItem(OFFLINE_DRAFTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveOfflineDraft(draft: any): void {
    const drafts = this.getOfflineDrafts();
    drafts.push({ ...draft, queuedAt: new Date().toISOString() });
    localStorage.setItem(OFFLINE_DRAFTS_KEY, JSON.stringify(drafts));
  },

  clearOfflineDrafts(): void {
    localStorage.removeItem(OFFLINE_DRAFTS_KEY);
  },

  resetAllData(): void {
    localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(INITIAL_COMPLAINTS));
    localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(INITIAL_DEPARTMENTS));
    localStorage.removeItem(NOTIFICATIONS_KEY);
    localStorage.removeItem(OFFLINE_DRAFTS_KEY);
    localStorage.setItem(ACTIVE_USER_ROLE_KEY, 'citizen');
    localStorage.setItem(DEMO_MODE_KEY, 'false');
  }
};
