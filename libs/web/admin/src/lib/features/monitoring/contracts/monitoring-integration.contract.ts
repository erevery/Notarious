import { type AuditEntityFeedExportRequest } from '../audit-entity-feed';
import { type AuditLogViewModel } from '../models';
import { type SecurityEventsExportRequest, type SecurityEventsFilters } from '../security-events';

export interface MonitoringSharedInputs {
  events: AuditLogViewModel[];
  loading: boolean;
  error: string | null;
}

export interface MonitoringUserLogsInputs extends MonitoringSharedInputs {
  entityId?: string;
  entityEmail?: string;
}

export interface MonitoringOrderLogsInputs extends MonitoringSharedInputs {
  entityId?: string;
}

export type MonitoringSecurityInputs = MonitoringSharedInputs;

export type MonitoringSelectionPayload = AuditLogViewModel;
export type MonitoringRowFormat = AuditLogViewModel;
export type MonitoringDetailFormat = AuditLogViewModel;

export interface MonitoringUserLogsOutputs {
  eventSelected: MonitoringSelectionPayload;
  exportRequested: AuditEntityFeedExportRequest;
}

export interface MonitoringOrderLogsOutputs {
  eventSelected: MonitoringSelectionPayload;
  exportRequested: AuditEntityFeedExportRequest;
}

/**
 * Security panel keeps the current `rowSelected` output name to avoid churn
 * during parent-screen integration. The payload format stays identical to the
 * shared selected-event contract.
 */
export interface MonitoringSecurityOutputs {
  filtersChanged: SecurityEventsFilters;
  rowSelected: MonitoringSelectionPayload;
  exportRequested: SecurityEventsExportRequest;
}

export const MONITORING_INTEGRATION_OWNERSHIP = {
  lukyan: ['monitoring.ts', 'monitoring.html', 'monitoring.scss'],
  dmitry: [
    'audit-entity-feed/',
    'order-logs-panel/',
    'user-logs-panel/',
    'security-events/',
    'models/',
    'fixtures/',
    'contracts/',
  ],
} as const;

export const MONITORING_SHARED_MOCK_SOURCE = {
  owner: 'dmitry',
  rawSource: 'models/audit-logs.mock.ts#AUDIT_LOG_SOURCES_MOCK',
  viewModelSource: 'models/audit-logs.mock.ts#AUDIT_LOGS_MOCK',
  sharedEventFormat: 'AuditLogViewModel',
} as const;
