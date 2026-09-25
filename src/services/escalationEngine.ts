import { Complaint, Role, PriorityLevel, Department } from '../types';
import { ROLE_DEFINITIONS, HIERARCHY_ORDER, MOCK_USERS } from '../data/mockData';
import { storageService } from './storageService';

// Standard vs Demo SLA durations
export const SLA_DURATIONS: Record<PriorityLevel, { standardHours: number; demoSeconds: number }> = {
  Critical: { standardHours: 2, demoSeconds: 30 },
  High: { standardHours: 24, demoSeconds: 60 },
  Medium: { standardHours: 72, demoSeconds: 90 },
  Low: { standardHours: 168, demoSeconds: 120 },
};

export const getNextEscalationRole = (currentRole: Role): Role | null => {
  const currentIndex = HIERARCHY_ORDER.indexOf(currentRole);
  if (currentIndex === -1) {
    return HIERARCHY_ORDER[0]; // Ward Officer
  }
  if (currentIndex < HIERARCHY_ORDER.length - 1) {
    return HIERARCHY_ORDER[currentIndex + 1];
  }
  return null; // Already at apex: CM Grievance Cell
};

export const calculateSlaExpiry = (priority: PriorityLevel, isDemoMode: boolean): { hours: number; expiresAt: string } => {
  const config = SLA_DURATIONS[priority] || SLA_DURATIONS.Medium;
  const now = Date.now();
  
  if (isDemoMode) {
    const expiresAt = new Date(now + config.demoSeconds * 1000).toISOString();
    return { hours: config.demoSeconds / 3600, expiresAt };
  } else {
    const expiresAt = new Date(now + config.standardHours * 3600 * 1000).toISOString();
    return { hours: config.standardHours, expiresAt };
  }
};

export interface EscalationResult {
  updatedComplaint: Complaint;
  escalated: boolean;
  notificationMessage?: string;
}

export const escalateComplaint = (
  complaint: Complaint,
  reason: string,
  departments: Department[],
  isDemoMode: boolean
): { updatedComplaint: Complaint; updatedDepartments: Department[] } => {
  const nextRole = getNextEscalationRole(complaint.assignedToRole);
  
  if (!nextRole) {
    return { updatedComplaint: complaint, updatedDepartments: departments };
  }

  const nextRoleInfo = ROLE_DEFINITIONS[nextRole];
  const nextUser = MOCK_USERS[nextRole];
  const newLevel = complaint.currentEscalationLevel + 1;
  const nowIso = new Date().toISOString();

  // Reset SLA timer for the new authority level
  const { hours, expiresAt } = calculateSlaExpiry(complaint.priority, isDemoMode);

  const escalationRecord = {
    id: 'esc-' + Date.now(),
    timestamp: nowIso,
    fromRole: complaint.assignedToRole,
    fromRoleTitle: ROLE_DEFINITIONS[complaint.assignedToRole].title,
    toRole: nextRole,
    toRoleTitle: nextRoleInfo.title,
    reason: reason || `Automated SLA Breach escalation to Level ${newLevel}`,
    level: newLevel,
  };

  const updatedComplaint: Complaint = {
    ...complaint,
    assignedToRole: nextRole,
    assignedOfficerName: nextUser ? nextUser.name : nextRoleInfo.title,
    assignedOfficerContact: nextUser ? nextUser.phone : 'N/A',
    currentEscalationLevel: newLevel,
    isEscalated: true,
    status: 'Escalated',
    slaHours: hours,
    slaExpiresAt: expiresAt,
    updatedAt: nowIso,
    escalationHistory: [...complaint.escalationHistory, escalationRecord],
  };

  // Penalize department trust index
  const updatedDepartments = departments.map((dept) => {
    if (dept.id === complaint.departmentId || dept.name === complaint.department) {
      return {
        ...dept,
        penaltyPoints: dept.penaltyPoints + 25,
        trustScore: Math.max(10, dept.trustScore - 4),
      };
    }
    return dept;
  });

  // Notify Citizen
  storageService.addNotification({
    targetRole: 'citizen',
    userId: complaint.citizenId,
    complaintId: complaint.id,
    title: `Complaint Escalated to ${nextRoleInfo.shortTitle}`,
    message: `Your grievance [${complaint.id}] has exceeded SLA and is automatically escalated to ${nextRoleInfo.title}.`,
    type: 'escalation',
  });

  // Notify the newly assigned Authority
  storageService.addNotification({
    targetRole: nextRole,
    complaintId: complaint.id,
    title: `URGENT: Escalated Complaint Assigned (L-${newLevel})`,
    message: `Grievance [${complaint.id}] (${complaint.category}) was escalated to your desk due to SLA expiry.`,
    type: 'alert',
  });

  return { updatedComplaint, updatedDepartments };
};

export const checkAndRunAutoEscalations = (
  complaints: Complaint[],
  departments: Department[],
  isDemoMode: boolean
): { updatedComplaints: Complaint[]; updatedDepartments: Department[]; countEscalated: number } => {
  const now = Date.now();
  let countEscalated = 0;
  let currentDepartments = [...departments];

  const updatedComplaints = complaints.map((complaint) => {
    // Only active tickets that haven't been resolved or closed
    if (['Resolved', 'Awaiting Verification', 'Closed'].includes(complaint.status)) {
      return complaint;
    }

    const expiryTime = new Date(complaint.slaExpiresAt).getTime();
    if (now > expiryTime) {
      // Check if already reached top level (CM Grievance Cell)
      if (complaint.assignedToRole === 'cm_grievance_cell') {
        return complaint;
      }

      countEscalated++;
      const res = escalateComplaint(
        complaint,
        `Automated SLA Timer Expired (${complaint.priority} priority SLA deadline elapsed)`,
        currentDepartments,
        isDemoMode
      );
      currentDepartments = res.updatedDepartments;
      return res.updatedComplaint;
    }

    return complaint;
  });

  return {
    updatedComplaints,
    updatedDepartments: currentDepartments,
    countEscalated,
  };
};
