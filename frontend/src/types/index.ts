export type UserRole = 'admin' | 'customer' | 'inspector';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface Customer {
  id: string;
  fullName: string;
  nationalId: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export type ExtinguisherStatus =
  | 'IN_STOCK'
  | 'ACTIVE'
  | 'EXPIRING_SOON'
  | 'EXPIRED'
  | 'RENEWED';

export type ExtinguisherType = 'WATER' | 'CO2' | 'FOAM' | 'DRY_CHEMICAL';
export type ExtinguisherSize = '2.5_LB' | '5_LB' | '9_LB' | '12_LB';

export interface FireExtinguisher {
  id: string;
  serialNumber: string;
  location: string;
  type: ExtinguisherType;
  size: ExtinguisherSize;
  installationDate: string;
  expiryDate: string;
  status: ExtinguisherStatus;
  customerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type InspectionStatus = 'PENDING' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';

export interface InspectionSchedule {
  id: string;
  extinguisherId: string;
  customerId: string;
  scheduledByUserId: string;
  inspectorUserId: string | null;
  inspectionDate: string;
  inspectionTime: string;
  status: InspectionStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInspectionPayload {
  extinguisherId: string;
  inspectionDate: string;
  inspectionTime: string;
  customerId?: string;
  inspectorUserId?: string;
  notes?: string;
}

export interface MaintenanceLog {
  id: string;
  extinguisherId: string;
  inspectorUserId: string;
  actionTaken: string;
  maintenanceDate: string;
  issuesIdentified: string | null;
  notes: string | null;
  recommendations: string | null;
  createdAt: string;
}

export interface CreateMaintenancePayload {
  extinguisherId: string;
  actionTaken: string;
  maintenanceDate: string;
  issuesIdentified?: string;
  notes?: string;
  recommendations?: string;
}

export type RenewalRequestType = 'SERVICE' | 'REPLACEMENT' | 'INSPECTION';
export type RenewalRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED';

export interface RenewalRequest {
  id: string;
  customerId: string | null;
  extinguisherId: string;
  requestType: RenewalRequestType;
  status: RenewalRequestStatus;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CaseStatus =
  | 'OPEN'
  | 'WARNING_SENT'
  | 'FINAL_WARNING'
  | 'ESCALATED'
  | 'CLOSED';

export interface ComplianceCase {
  id: string;
  customerId: string | null;
  extinguisherId: string;
  caseStatus: CaseStatus;
  closedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  customerId: string | null;
  extinguisherId: string;
  message: string;
  type: string;
  channel: string;
  status: string;
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface DashboardSummary {
  charts: {
    expiredCount: number;
    expiringSoonCount: number;
    complianceIssues: number;
    pendingRenewals: number;
    recentNotifications: number;
  };
  breakdown: {
    expiredByMonth: Record<string, number>;
    expiringByDays: Record<string, number>;
    complianceByStatus: Record<string, number>;
  };
  generatedAt: string;
}

export type ReportFormat = 'pdf' | 'xlsx' | 'csv';

export type ReportType =
  | 'expired-extinguishers'
  | 'expiring-soon'
  | 'customer-compliance'
  | 'renewal-requests'
  | 'notifications'
  | 'inventory-summary'
  | 'inspections-pending'
  | 'inspections-completed'
  | 'inspections-overdue'
  | 'maintenance-history'
  | 'maintenance-recent';

export interface ApiError {
  message: string;
  statusCode?: number;
}

export interface NotificationScheduleSettings {
  expiryDays: number[];
  reminderDays: number[];
  defaultChannel: string;
}

export interface EscalationRulesSettings {
  warningAfterDays: number;
  finalWarningAfterDays: number;
  escalateAfterDays: number;
}

export interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ExtinguisherFilters extends ListQuery {
  status?: ExtinguisherStatus;
  customerId?: string;
  /** true = warehouse only */
  inStock?: boolean;
  /** true = assigned to a customer only */
  assignedOnly?: boolean;
  expiryFrom?: string;
  expiryTo?: string;
}

export interface RenewalFilters extends ListQuery {
  status?: RenewalRequestStatus;
  requestType?: RenewalRequestType;
  customerId?: string;
}

export interface ComplianceFilters extends ListQuery {
  caseStatus?: CaseStatus;
  customerId?: string;
}

export interface NotificationFilters extends ListQuery {
  status?: string;
  type?: string;
}
