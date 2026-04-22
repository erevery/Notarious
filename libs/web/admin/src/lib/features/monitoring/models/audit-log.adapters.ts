import {
  type AuditEntityType,
  type AuditLogSource,
  type AuditLogViewModel,
  type AuditSeverity,
  type NormalizedAuditLogSource,
  type SecurityRiskLevel,
} from './audit-log.models';

const RU_MONTHS_SHORT = [
  'янв',
  'фев',
  'мар',
  'апр',
  'мая',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
];

const SECURITY_ACTION_TOKENS = [
  'login',
  'logout',
  'auth',
  'security',
  'token',
  'permission',
  'blocked',
  'role',
];

const normalizeToken = (value: string | null | undefined): string =>
  (value ?? '').trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');

const humanizeAction = (action: string): string =>
  action.replace(/[._]+/g, ' ').replace(/\s+/g, ' ').trim();

const isSecurityAction = (action: string): boolean => {
  const token = normalizeToken(action);
  return SECURITY_ACTION_TOKENS.some((securityToken) => token.includes(securityToken));
};

export const normalizeAuditEntityType = (value: string): AuditEntityType => {
  const normalized = normalizeToken(value);

  if (
    ['user', 'users', 'пользователь', 'пользователи', 'actor', 'account', 'accounts'].includes(
      normalized,
    )
  ) {
    return 'user';
  }

  if (
    [
      'order',
      'orders',
      'assessment',
      'assessments',
      'заказ',
      'заказы',
      'заявка',
      'заявки',
    ].includes(normalized)
  ) {
    return 'order';
  }

  return 'system';
};

export const normalizeAuditSeverity = (value: string): AuditSeverity => {
  const normalized = normalizeToken(value);

  if (['critical', 'error', 'fatal', 'crit'].includes(normalized)) {
    return 'critical';
  }

  if (['warning', 'warn', 'предупреждение'].includes(normalized)) {
    return 'warning';
  }

  if (['success', 'ok', 'done', 'успешно'].includes(normalized)) {
    return 'success';
  }

  return 'info';
};

export const getAuditSeverityLabel = (severity: AuditSeverity): string => {
  switch (severity) {
    case 'critical':
      return 'Критично';
    case 'warning':
      return 'Предупреждение';
    case 'success':
      return 'Успешно';
    case 'info':
      return 'Инфо';
  }
};

export const normalizeSecurityRiskLevel = (
  value: string | null | undefined,
  severity: AuditSeverity,
  isSecurityEvent: boolean,
): SecurityRiskLevel => {
  const normalized = normalizeToken(value);

  if (['high', 'critical', 'elevated', 'высокий'].includes(normalized)) {
    return 'high';
  }

  if (['medium', 'warning', 'moderate', 'средний'].includes(normalized)) {
    return 'medium';
  }

  if (['low', 'info', 'низкий'].includes(normalized)) {
    return 'low';
  }

  if (!isSecurityEvent) {
    return 'low';
  }

  if (severity === 'critical') {
    return 'high';
  }

  if (severity === 'warning') {
    return 'medium';
  }

  return 'low';
};

export const getDefaultEntityLabel = (entityType: AuditEntityType): string => {
  switch (entityType) {
    case 'user':
      return 'Пользователи';
    case 'order':
      return 'Заказы';
    case 'system':
      return 'Система';
  }
};

export const deriveAuditActionCategory = (action: string): string => {
  const normalized = normalizeToken(action);

  if (normalized.includes('export')) {
    return 'Экспорт';
  }

  if (normalized.includes('role') || normalized.includes('permission')) {
    return 'Изменение ролей';
  }

  if (
    normalized.includes('security') ||
    normalized.includes('login') ||
    normalized.includes('auth') ||
    normalized.includes('blocked') ||
    normalized.includes('token')
  ) {
    return 'Безопасность';
  }

  if (normalized.includes('payment')) {
    return 'Платежи';
  }

  if (
    normalized.includes('order') ||
    normalized.includes('assessment') ||
    normalized.includes('status')
  ) {
    return 'Операции с заказами';
  }

  return 'Системные события';
};

export const formatAuditDateParts = (
  createdAt: string,
): { dateLabel: string; timeLabel: string } => {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return {
      dateLabel: createdAt.slice(0, 10),
      timeLabel: createdAt.slice(11, 16),
    };
  }

  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = RU_MONTHS_SHORT[date.getUTCMonth()] ?? RU_MONTHS_SHORT[0];
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');

  return {
    dateLabel: `${day} ${month} ${year}`,
    timeLabel: `${hours}:${minutes}`,
  };
};

export const normalizeAuditLogSource = (source: AuditLogSource): NormalizedAuditLogSource => {
  const severity = normalizeAuditSeverity(source.severity);
  const entityType = normalizeAuditEntityType(source.entityType);
  const isSecurityEvent = source.isSecurityEvent ?? isSecurityAction(source.action);

  return {
    id: source.id,
    actorId: source.actorId,
    actorName: source.actorName,
    actorEmail: source.actorEmail,
    actorRole: source.actorRole,
    action: source.action,
    actionTitle: source.actionTitle ?? source.description ?? humanizeAction(source.action),
    actionSubtitle: source.actionSubtitle ?? '',
    actionCategory: source.actionCategory ?? deriveAuditActionCategory(source.action),
    entityType,
    entityId: source.entityId,
    entityTitle: source.entityTitle,
    entitySubtitle: source.entitySubtitle ?? '',
    entityLabel: source.entityLabel ?? getDefaultEntityLabel(entityType),
    source: source.source,
    location: source.location,
    ipAddress: source.ipAddress,
    userAgent: source.userAgent ?? '',
    createdAt: source.createdAt,
    severity,
    severityLabel: source.severityLabel ?? getAuditSeverityLabel(severity),
    isSecurityEvent,
    securityRiskLevel: normalizeSecurityRiskLevel(
      source.securityRiskLevel,
      severity,
      isSecurityEvent,
    ),
    reason: source.reason ?? '',
    changes: {
      before: source.changes?.before ?? [],
      after: source.changes?.after ?? [],
    },
  };
};

export const mapAuditLogSourceToViewModel = (source: AuditLogSource): AuditLogViewModel => {
  const normalized = normalizeAuditLogSource(source);
  const display = formatAuditDateParts(normalized.createdAt);

  const searchText = [
    normalized.id,
    normalized.actorId,
    normalized.actorName,
    normalized.actorEmail,
    normalized.actorRole,
    normalized.action,
    normalized.actionTitle,
    normalized.actionSubtitle,
    normalized.actionCategory,
    normalized.entityId,
    normalized.entityTitle,
    normalized.entitySubtitle,
    normalized.entityLabel,
    normalized.source,
    normalized.location,
    normalized.ipAddress,
    normalized.reason,
  ]
    .join(' ')
    .toLowerCase();

  return {
    id: normalized.id,
    occurredAt: normalized.createdAt,
    actor: {
      id: normalized.actorId,
      name: normalized.actorName,
      email: normalized.actorEmail,
      role: normalized.actorRole,
    },
    action: {
      code: normalized.action,
      title: normalized.actionTitle,
      subtitle: normalized.actionSubtitle,
      category: normalized.actionCategory,
    },
    entity: {
      type: normalized.entityType,
      id: normalized.entityId,
      title: normalized.entityTitle,
      subtitle: normalized.entitySubtitle,
      label: normalized.entityLabel,
    },
    source: {
      name: normalized.source,
      location: normalized.location,
      ipAddress: normalized.ipAddress,
      userAgent: normalized.userAgent,
    },
    severity: {
      level: normalized.severity,
      label: normalized.severityLabel,
    },
    security: {
      isSecurityEvent: normalized.isSecurityEvent,
      riskLevel: normalized.securityRiskLevel,
      reason: normalized.reason,
    },
    changes: normalized.changes,
    display,
    searchText,
  };
};
