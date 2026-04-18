export type AuditEntityType = 'user' | 'order' | 'system';

export type AuditSeverity = 'info' | 'warning' | 'critical' | 'success';

export type SecurityRiskLevel = 'low' | 'medium' | 'high';

export interface AuditLogSourceChanges {
  before?: string[];
  after?: string[];
}

export interface AuditLogSource {
  id: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  actionTitle?: string;
  actionSubtitle?: string;
  actionCategory?: string;
  description?: string;
  entityType: string;
  entityId: string;
  entityTitle: string;
  entitySubtitle?: string;
  entityLabel?: string;
  source: string;
  location: string;
  ipAddress: string;
  userAgent?: string;
  createdAt: string;
  severity: string;
  severityLabel?: string;
  isSecurityEvent?: boolean;
  securityRiskLevel?: string | null;
  reason?: string;
  changes?: AuditLogSourceChanges;
}

export interface NormalizedAuditLogSource {
  id: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  actionTitle: string;
  actionSubtitle: string;
  actionCategory: string;
  entityType: AuditEntityType;
  entityId: string;
  entityTitle: string;
  entitySubtitle: string;
  entityLabel: string;
  source: string;
  location: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  severity: AuditSeverity;
  severityLabel: string;
  isSecurityEvent: boolean;
  securityRiskLevel: SecurityRiskLevel;
  reason: string;
  changes: {
    before: string[];
    after: string[];
  };
}

export interface AuditLogViewModel {
  id: string;
  occurredAt: string;
  actor: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  action: {
    code: string;
    title: string;
    subtitle: string;
    category: string;
  };
  entity: {
    type: AuditEntityType;
    id: string;
    title: string;
    subtitle: string;
    label: string;
  };
  source: {
    name: string;
    location: string;
    ipAddress: string;
    userAgent: string;
  };
  severity: {
    level: AuditSeverity;
    label: string;
  };
  security: {
    isSecurityEvent: boolean;
    riskLevel: SecurityRiskLevel;
    reason: string;
  };
  changes: {
    before: string[];
    after: string[];
  };
  display: {
    dateLabel: string;
    timeLabel: string;
  };
  searchText: string;
}
