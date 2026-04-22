import { mapAuditLogSourceToViewModel } from '../models/audit-log.adapters';
import { type AuditLogSource } from '../models/audit-log.models';

const APPLICANT_SEED_USER = {
  id: 'b3b8fde7-28ee-4e36-ac8a-4c265db55b43',
  name: 'Заявитель 1',
  email: 'seed-user-000@seed.local',
  role: 'Applicant',
} as const;

const NOTARY_SEED_USER = {
  id: '007bbfee-adde-40ab-a117-6cc34106e110',
  name: 'Нотариус 11',
  email: 'seed-user-010@seed.local',
  role: 'Notary',
} as const;

const SECURITY_BOT = {
  id: 'security-bot',
  name: 'Security Bot',
  email: 'security-bot@seed.local',
  role: 'System',
} as const;

const USER_LOGIN_FAILED_EVENT: AuditLogSource = {
  id: 'c0d0f189-0d2d-4be5-a8f9-7d13d6f60001',
  actorId: APPLICANT_SEED_USER.id,
  actorName: APPLICANT_SEED_USER.name,
  actorEmail: APPLICANT_SEED_USER.email,
  actorRole: APPLICANT_SEED_USER.role,
  action: 'user.login_failed',
  description: 'Неуспешная попытка входа в seed-аккаунт',
  entityType: 'User',
  entityId: APPLICANT_SEED_USER.id,
  entityTitle: 'Пользователь Заявитель 1',
  entitySubtitle: 'Неизвестное устройство',
  source: 'Auth gateway',
  location: 'Страница входа',
  ipAddress: '188.17.44.90',
  createdAt: '2026-03-20T03:41:00Z',
  severity: 'error',
  isSecurityEvent: true,
  securityRiskLevel: 'high',
  reason: '5 неуспешных попыток входа за 10 минут',
  changes: {
    before: ['loginAttempts: 4', 'deviceTrusted: false'],
    after: ['loginAttempts: 5', 'deviceTrusted: false'],
  },
};

const TOKEN_REVOKED_EVENT: AuditLogSource = {
  id: 'c0d0f189-0d2d-4be5-a8f9-7d13d6f60002',
  actorId: SECURITY_BOT.id,
  actorName: SECURITY_BOT.name,
  actorEmail: SECURITY_BOT.email,
  actorRole: SECURITY_BOT.role,
  action: 'token.revoked',
  description: 'Refresh token пользователя отозван после смены пароля',
  entityType: 'User',
  entityId: APPLICANT_SEED_USER.id,
  entityTitle: 'Пользователь Заявитель 1',
  entitySubtitle: 'Активная веб-сессия',
  source: 'Auth gateway',
  location: 'Менеджер сессий',
  ipAddress: '10.10.0.12',
  createdAt: '2026-03-20T03:48:00Z',
  severity: 'warning',
  isSecurityEvent: true,
  securityRiskLevel: 'medium',
  reason: 'Принудительный logout после восстановления доступа',
  changes: {
    before: ['refreshToken: active', 'sessionCount: 2'],
    after: ['refreshToken: revoked', 'sessionCount: 1'],
  },
};

const PERMISSION_DENIED_EVENT: AuditLogSource = {
  id: 'c0d0f189-0d2d-4be5-a8f9-7d13d6f60003',
  actorId: NOTARY_SEED_USER.id,
  actorName: NOTARY_SEED_USER.name,
  actorEmail: NOTARY_SEED_USER.email,
  actorRole: NOTARY_SEED_USER.role,
  action: 'permission.denied',
  actionCategory: 'Безопасность',
  description: 'Отклонен доступ нотариуса к экспорту полного аудита',
  entityType: 'System',
  entityId: 'admin-monitoring-export',
  entityTitle: 'Экспорт аудита',
  entitySubtitle: 'Мониторинг / CSV',
  source: 'Web admin panel',
  location: 'Раздел "Мониторинг"',
  ipAddress: '10.15.2.91',
  createdAt: '2026-03-20T03:55:00Z',
  severity: 'warning',
  isSecurityEvent: true,
  securityRiskLevel: 'medium',
  reason: 'Роль Notary не может выгружать полный журнал действий',
  changes: {
    before: ['permission: denied_pending'],
    after: ['permission: denied'],
  },
};

const SUSPICIOUS_ACTIVITY_DETECTED_EVENT: AuditLogSource = {
  id: 'c0d0f189-0d2d-4be5-a8f9-7d13d6f60004',
  actorId: SECURITY_BOT.id,
  actorName: SECURITY_BOT.name,
  actorEmail: SECURITY_BOT.email,
  actorRole: SECURITY_BOT.role,
  action: 'security.suspicious_activity_detected',
  description: 'Обнаружен невозможный вход: Екатеринбург и Алматы с интервалом 6 минут',
  entityType: 'User',
  entityId: APPLICANT_SEED_USER.id,
  entityTitle: 'Пользователь Заявитель 1',
  entitySubtitle: 'Geo-velocity alert',
  source: 'Anti-fraud',
  location: 'Профиль безопасности',
  ipAddress: '176.32.70.91',
  createdAt: '2026-03-20T04:03:00Z',
  severity: 'warning',
  isSecurityEvent: true,
  securityRiskLevel: 'high',
  reason: 'Нарушено правило geovelocity для одного аккаунта',
  changes: {
    before: ['riskScore: 45', 'country: RU'],
    after: ['riskScore: 87', 'country: KZ'],
  },
};

const USER_BLOCKED_EVENT: AuditLogSource = {
  id: 'c0d0f189-0d2d-4be5-a8f9-7d13d6f60005',
  actorId: SECURITY_BOT.id,
  actorName: SECURITY_BOT.name,
  actorEmail: SECURITY_BOT.email,
  actorRole: SECURITY_BOT.role,
  action: 'user.blocked',
  description: 'Пользователь временно заблокирован после suspicious activity',
  entityType: 'User',
  entityId: APPLICANT_SEED_USER.id,
  entityTitle: 'Пользователь Заявитель 1',
  entitySubtitle: 'Temporary antifraud block',
  source: 'Anti-fraud',
  location: 'Профиль безопасности',
  ipAddress: '176.32.70.91',
  createdAt: '2026-03-20T04:08:00Z',
  severity: 'error',
  isSecurityEvent: true,
  securityRiskLevel: 'high',
  reason: 'Автоматическая блокировка до ручной проверки администратором',
  changes: {
    before: ['status: active', 'blockedUntil: null'],
    after: ['status: temporarily_blocked', 'blockedUntil: 2026-03-21T04:08:00Z'],
  },
};

export const SECURITY_EVENTS_SOURCES_FIXTURES: AuditLogSource[] = [
  USER_LOGIN_FAILED_EVENT,
  TOKEN_REVOKED_EVENT,
  PERMISSION_DENIED_EVENT,
  SUSPICIOUS_ACTIVITY_DETECTED_EVENT,
  USER_BLOCKED_EVENT,
];

export const SUSPICIOUS_ACTIVITY_SOURCES_FIXTURES: AuditLogSource[] = [
  SUSPICIOUS_ACTIVITY_DETECTED_EVENT,
  USER_BLOCKED_EVENT,
];

export const SECURITY_EVENTS_FIXTURES = SECURITY_EVENTS_SOURCES_FIXTURES.map(
  mapAuditLogSourceToViewModel,
);

export const SUSPICIOUS_ACTIVITY_FIXTURES = SUSPICIOUS_ACTIVITY_SOURCES_FIXTURES.map(
  mapAuditLogSourceToViewModel,
);
