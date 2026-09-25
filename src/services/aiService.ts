import { IssueCategory, PriorityLevel, Complaint, Department, JurisdictionTier } from '../types';

export interface AiScanResult {
  category: IssueCategory;
  subcategory: string;
  severity: PriorityLevel;
  priority: PriorityLevel;
  department: string;
  departmentId: string;
  estimatedHours: number;
  confidence: number;
  tags: string[];
  aiAnalysisSummary: string;
  jurisdictionTier: JurisdictionTier;
  isDuplicateSuspect: boolean;
  duplicateComplaintId?: string;
  distanceToDuplicateMeters?: number;
}

// Distance helper using Haversine formula (meters)
export const calculateDistanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
};

export const aiService = {
  /**
   * Multimodal AI scan simulator for image + text routing across 8 departments
   */
  async analyzeCivicIssue(
    description: string,
    imageUrl: string,
    lat: number,
    lng: number,
    existingComplaints: Complaint[]
  ): Promise<AiScanResult> {
    // Artificial latency for authentic scanning feel (600ms)
    await new Promise((resolve) => setTimeout(resolve, 600));

    const text = description.toLowerCase();

    let category: IssueCategory = 'Road Damage';
    let subcategory = 'Road Surface Wear';
    let severity: PriorityLevel = 'High';
    let department = 'Roads & Engineering Department';
    let departmentId = 'dept-roads';
    let estimatedHours = 24;
    let confidence = 95.8;
    let tags = ['roads', 'infrastructure'];

    // 1. Road Damage → Roads / Engineering Department
    if (
      text.includes('pothole') ||
      text.includes('road') ||
      text.includes('asphalt') ||
      text.includes('crater') ||
      imageUrl.includes('pothole') ||
      text.includes('tar') ||
      text.includes('flyover')
    ) {
      category = 'Road Damage';
      subcategory = 'Pothole & Surface Wear';
      severity = text.includes('deep') || text.includes('danger') || text.includes('accident') ? 'High' : 'Medium';
      department = 'Roads & Engineering Department';
      departmentId = 'dept-roads';
      estimatedHours = severity === 'High' ? 24 : 72;
      confidence = 96.8;
      tags = ['asphalt', 'pothole', 'traffic-hazard', 'roads-dept'];
    }
    // 2. Garbage → Sanitation Department
    else if (
      text.includes('garbage') ||
      text.includes('trash') ||
      text.includes('waste') ||
      text.includes('dump') ||
      text.includes('stench') ||
      text.includes('bin') ||
      text.includes('clean')
    ) {
      category = 'Garbage';
      subcategory = 'Black Spot Waste Accumulation';
      severity = 'High';
      department = 'Sanitation & Solid Waste Department';
      departmentId = 'dept-sanitation';
      estimatedHours = 24;
      confidence = 97.4;
      tags = ['sanitation', 'waste-clearance', 'hygiene', 'swm'];
    }
    // 3. Water Leakage → Water Supply Department
    else if (
      text.includes('leak') ||
      text.includes('pipe') ||
      text.includes('burst') ||
      text.includes('gushing') ||
      text.includes('water supply') ||
      text.includes('drinking water')
    ) {
      category = 'Water Leakage';
      subcategory = 'High Pressure Pipe Rupture';
      severity = 'Critical';
      department = 'Metro Water Supply Department';
      departmentId = 'dept-water';
      estimatedHours = 2;
      confidence = 98.6;
      tags = ['water-board', 'burst-pipe', 'critical-resource', 'drinking-water'];
    }
    // 4. Drainage → Public Works Department
    else if (
      text.includes('drain') ||
      text.includes('sewage') ||
      text.includes('overflow') ||
      text.includes('manhole') ||
      text.includes('gutter') ||
      text.includes('stormwater')
    ) {
      category = 'Drainage';
      subcategory = 'Stormwater Blockage / Open Manhole';
      severity = text.includes('open') || text.includes('manhole') ? 'Critical' : 'High';
      department = 'Public Works & Stormwater Drainage';
      departmentId = 'dept-drainage';
      estimatedHours = severity === 'Critical' ? 2 : 24;
      confidence = 98.1;
      tags = ['drainage', 'manhole-safety', 'stormwater', 'pwd'];
    }
    // 5. Streetlight → Municipal Electrical Wing
    else if (
      text.includes('streetlight') ||
      text.includes('street light') ||
      text.includes('lamp') ||
      text.includes('dark') ||
      text.includes('luminaire')
    ) {
      category = 'Streetlight';
      subcategory = 'Luminaire / Streetlight Failure';
      severity = 'Medium';
      department = 'Municipal Electrical Wing';
      departmentId = 'dept-electrical';
      estimatedHours = 72;
      confidence = 95.3;
      tags = ['lighting', 'pedestrian-safety', 'electrical-division'];
    }
    // 6. Power Failure → Electricity Board (EB)
    else if (
      text.includes('power') ||
      text.includes('electricity') ||
      text.includes('wire') ||
      text.includes('spark') ||
      text.includes('transformer') ||
      text.includes('eb') ||
      text.includes('tneb')
    ) {
      category = 'Power Failure';
      subcategory = 'High Voltage / Grid Failure';
      severity = 'Critical';
      department = 'Electricity Board (TANGEDCO / EB)';
      departmentId = 'dept-eb';
      estimatedHours = 2;
      confidence = 97.5;
      tags = ['power-grid', 'high-voltage', 'electricity-board'];
    }
    // 7. Traffic Signal → Traffic Police
    else if (
      text.includes('traffic') ||
      text.includes('signal') ||
      text.includes('junction light') ||
      text.includes('red light')
    ) {
      category = 'Traffic Signal';
      subcategory = 'Signal Malfunction at Junction';
      severity = 'High';
      department = 'Traffic Police & Road Safety Cell';
      departmentId = 'dept-traffic';
      estimatedHours = 24;
      confidence = 96.2;
      tags = ['traffic-signal', 'road-safety', 'police'];
    }
    // 8. Fallen Tree → Parks / Forest Department
    else if (
      text.includes('tree') ||
      text.includes('branch') ||
      text.includes('fallen') ||
      text.includes('park') ||
      text.includes('horticulture')
    ) {
      category = 'Fallen Tree';
      subcategory = 'Fallen Branch Obstructing Passage';
      severity = 'High';
      department = 'Parks & Forest Department';
      departmentId = 'dept-tree';
      estimatedHours = 24;
      confidence = 96.5;
      tags = ['parks-forest', 'tree-removal', 'emergency-clearing'];
    }

    // Determine Jurisdiction Tier based on coordinates/location
    const jurisdictionTier: JurisdictionTier = 'Municipal Corporation';

    // Check for nearby duplicates within 150m
    let isDuplicateSuspect = false;
    let duplicateComplaintId: string | undefined;
    let distanceToDuplicateMeters: number | undefined;

    for (const comp of existingComplaints) {
      if (['Submitted', 'Assigned', 'In Progress', 'Escalated'].includes(comp.status)) {
        if (comp.category === category) {
          const dist = calculateDistanceMeters(lat, lng, comp.location.lat, comp.location.lng);
          if (dist <= 150) {
            isDuplicateSuspect = true;
            duplicateComplaintId = comp.id;
            distanceToDuplicateMeters = dist;
            break;
          }
        }
      }
    }

    return {
      category,
      subcategory,
      severity,
      priority: severity,
      department,
      departmentId,
      estimatedHours,
      confidence,
      tags,
      jurisdictionTier,
      aiAnalysisSummary: `Visual model identified ${subcategory} with ${confidence}% confidence. Designated to ${department} under SLA of ${estimatedHours} hours.`,
      isDuplicateSuspect,
      duplicateComplaintId,
      distanceToDuplicateMeters,
    };
  },

  /**
   * Conversational Assistant: contextual answers
   */
  async getAiAssistantReply(
    query: string,
    complaints: Complaint[],
    departments: Department[],
    currentWard: string = 'Ward 42 (T. Nagar)'
  ): Promise<{ text: string; actions?: { label: string; actionType: 'view_complaint' | 'navigate' | 'call'; payload?: string }[] }> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const q = query.toLowerCase();

    // Specific Complaint ID lookup
    const idMatch = query.match(/CP-\d{4}-\d{4}/i);
    if (idMatch) {
      const complaintId = idMatch[0].toUpperCase();
      const comp = complaints.find((c) => c.id.toUpperCase() === complaintId);
      if (comp) {
        const remainingHours = Math.round(
          (new Date(comp.slaExpiresAt).getTime() - Date.now()) / (3600 * 1000)
        );
        const timeStatus =
          remainingHours > 0
            ? `⏱️ **${remainingHours} hours remaining** before SLA breach.`
            : `⚠️ **SLA EXPIRED**. Currently escalated to **${comp.assignedOfficerName}** (Level ${comp.currentEscalationLevel}).`;

        return {
          text: `### 📋 Status for Complaint ${comp.id}\n\n- **Issue:** ${comp.title}\n- **Current Status:** \`${comp.status}\`\n- **Responsible Authority:** ${comp.assignedOfficerName} (${comp.department})\n- **Escalation Level:** Level ${comp.currentEscalationLevel} / 7\n- **SLA Status:** ${timeStatus}\n- **Location:** ${comp.location.address}`,
          actions: [
            { label: `View ${comp.id}`, actionType: 'view_complaint', payload: comp.id },
            { label: `Call Officer (${comp.assignedOfficerContact})`, actionType: 'call', payload: comp.assignedOfficerContact },
          ],
        };
      }
    }

    if (q.includes('road') && (q.includes('why') || q.includes('delay') || q.includes('repair'))) {
      const roadComp = complaints.find((c) => c.category === 'Road Damage');
      if (roadComp) {
        return {
          text: `**Regarding Road Grievance [${roadComp.id}]:**\n\nThe ${roadComp.department} has logged this issue at **${roadComp.location.address}**.\n\n- **Assigned Officer:** ${roadComp.assignedOfficerName}\n- **Current Status:** \`${roadComp.status}\`\n- **Escalation Level:** Level ${roadComp.currentEscalationLevel}\n\nIf not resolved within the defined SLA of **${roadComp.slaHours} hours**, CivicPulse will automatically escalate the ticket to the **Municipal Commissioner (L-3)**.`,
          actions: [
            { label: `Track ${roadComp.id}`, actionType: 'view_complaint', payload: roadComp.id },
            { label: 'Check Nearby Issues', actionType: 'navigate', payload: 'nearby' },
          ],
        };
      }
    }

    if (q.includes('who') && (q.includes('handling') || q.includes('officer'))) {
      const active = complaints.find((c) => ['Submitted', 'Assigned', 'In Progress', 'Escalated'].includes(c.status));
      if (active) {
        return {
          text: `Your active complaint **[${active.id}]** is assigned to:\n\n👤 **${active.assignedOfficerName}**\n🏛️ **${active.department}**\n📞 **Phone:** \`${active.assignedOfficerContact}\`\n📈 **Escalation Level:** Level ${active.currentEscalationLevel}`,
          actions: [
            { label: `Track ${active.id}`, actionType: 'view_complaint', payload: active.id },
            { label: `Call Officer`, actionType: 'call', payload: active.assignedOfficerContact },
          ],
        };
      }
    }

    return {
      text: `Hello! I am your **CivicPulse AI Governance Assistant**.\n\nYou can ask me:\n- *"Why isn't my road repaired?"*\n- *"Who is handling my complaint CP-2026-8941?"*\n- *"What complaints are nearby in ${currentWard}?"*\n- *"How does the 7-tier SLA escalation work?"*`,
      actions: [
        { label: 'Why is my road delayed?', actionType: 'navigate', payload: 'ask_road' },
        { label: 'Who is handling my complaint?', actionType: 'navigate', payload: 'ask_who' },
        { label: 'Show nearby issues', actionType: 'navigate', payload: 'nearby' },
      ],
    };
  },
};
