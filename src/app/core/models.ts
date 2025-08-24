export type Role = 'LIQUIDATOR'|'OFFICIAL'|'CHIEF_MASTER';
export type ApprovalStatus = 'NOT_REQUIRED'|'PENDING'|'APPROVED'|'DECLINED';
export type LicenseStatus = 'ACTIVE'|'EXPIRED'|'REVOKED'|'SUSPENDED'|'PENDING_ACTIVATION';

export interface OfficialFlags { isAdminOfficial?: boolean; }

export interface UserLite {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: Role;
  isActive: boolean;
  emailVerifiedAt?: string;
  lastLoginAt?: string;
  approval?: { status: ApprovalStatus; decidedAt?: string; decidedBy?: string; reason?: string; };
  officialFlags?: OfficialFlags;
  createdAt?: string;
  updatedAt?: string;
}

export interface Paged<T> { page: number; limit: number; total: number; pages: number; items: T[]; }

export interface Meeting {
  _id: string;
  windowId: string;
  start: string; end: string;
  link?: string; venue?: string;
  quorum: Array<{ userId: string; response: 'PENDING'|'ACCEPT'|'DECLINE'; respondedAt?: string; declineReason?: string; }>;
}

export interface QuorumSummary {
  total: number; accepted: number; declined: number; pending: number;
  minAccepts: number; hasQuorum: boolean;
}

export interface AppWindow {
  _id: string;
  openingDate: string;
  closingDate: string;
  createdAt?: string;
}

export interface License {
  _id: string;
  holder_id: string;
  application_id: string;
  status: LicenseStatus;
  number?: string;
  approved_at?: string;
  starts_at?: string;
  expires_at?: string;
  revoked_at?: string;
  reason?: string;
}

export interface AuditLog {
  _id: string;
  actorId: string;
  action: string;
  target: { model: string; id: string; label?: string; };
  metadata?: any;
  createdAt: string;
}
