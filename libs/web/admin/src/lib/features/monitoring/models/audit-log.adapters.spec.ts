import {
  mapAuditLogSourceToViewModel,
  normalizeAuditEntityType,
  normalizeAuditLogSource,
  normalizeAuditSeverity,
  normalizeSecurityRiskLevel,
} from './audit-log.adapters';
import {
  type AuditEntityType,
  type AuditLogViewModel,
  type AuditSeverity,
} from './audit-log.models';

type Assert<T extends true> = T;
type IsExact<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

const VIEW_MODEL_RETURN_TYPE_ASSERTION: Assert<
  IsExact<ReturnType<typeof mapAuditLogSourceToViewModel>, AuditLogViewModel>
> = true;

const ENTITY_TYPE_RETURN_TYPE_ASSERTION: Assert<
  IsExact<ReturnType<typeof normalizeAuditEntityType>, AuditEntityType>
> = true;

const SEVERITY_RETURN_TYPE_ASSERTION: Assert<
  IsExact<ReturnType<typeof normalizeAuditSeverity>, AuditSeverity>
> = true;

describe('audit log adapters', () => {
  it('keeps adapter return types canonical at compile time', () => {
    expect(VIEW_MODEL_RETURN_TYPE_ASSERTION).toBe(true);
    expect(ENTITY_TYPE_RETURN_TYPE_ASSERTION).toBe(true);
    expect(SEVERITY_RETURN_TYPE_ASSERTION).toBe(true);
  });

  it('normalizes entity aliases to canonical entity types', () => {
    expect(normalizeAuditEntityType('User')).toBe('user');
    expect(normalizeAuditEntityType('Пользователи')).toBe('user');
    expect(normalizeAuditEntityType('Assessment')).toBe('order');
    expect(normalizeAuditEntityType('Заказы')).toBe('order');
    expect(normalizeAuditEntityType('Payment')).toBe('system');
  });

  it('normalizes severity aliases and derives risk level', () => {
    expect(normalizeAuditSeverity('error')).toBe('critical');
    expect(normalizeAuditSeverity('warn')).toBe('warning');
    expect(normalizeAuditSeverity('Успешно')).toBe('success');
    expect(normalizeSecurityRiskLevel(undefined, 'critical', true)).toBe('high');
    expect(normalizeSecurityRiskLevel(undefined, 'warning', true)).toBe('medium');
    expect(normalizeSecurityRiskLevel(undefined, 'info', false)).toBe('low');
  });

  it('normalizes source records before building the view model', () => {
    const normalized = normalizeAuditLogSource({
      id: 'evt-test',
      actorId: 'user-42',
      actorName: 'Ирина И.',
      actorEmail: 'irina@example.com',
      actorRole: 'Администратор',
      action: 'user.login_failed',
      entityType: 'User',
      entityId: 'U-42',
      entityTitle: 'Пользователь #U-42',
      source: 'Admin panel',
      location: 'Страница входа',
      ipAddress: '127.0.0.1',
      createdAt: '2026-03-20T08:45:00Z',
      severity: 'error',
      reason: '3 неудачные попытки входа',
    });

    expect(normalized).toEqual({
      id: 'evt-test',
      actorId: 'user-42',
      actorName: 'Ирина И.',
      actorEmail: 'irina@example.com',
      actorRole: 'Администратор',
      action: 'user.login_failed',
      actionTitle: 'user login failed',
      actionSubtitle: '',
      actionCategory: 'Безопасность',
      entityType: 'user',
      entityId: 'U-42',
      entityTitle: 'Пользователь #U-42',
      entitySubtitle: '',
      entityLabel: 'Пользователи',
      source: 'Admin panel',
      location: 'Страница входа',
      ipAddress: '127.0.0.1',
      userAgent: '',
      createdAt: '2026-03-20T08:45:00Z',
      severity: 'critical',
      severityLabel: 'Критично',
      isSecurityEvent: true,
      securityRiskLevel: 'high',
      reason: '3 неудачные попытки входа',
      changes: {
        before: [],
        after: [],
      },
    });
  });

  it('maps normalized source data into AuditLogViewModel', () => {
    const viewModel = mapAuditLogSourceToViewModel({
      id: 'evt-order',
      actorId: 'notary-7',
      actorName: 'Нотариус Т.',
      actorEmail: 'notary@example.com',
      actorRole: 'Нотариус',
      action: 'assessment.status_changed',
      actionTitle: 'Статус заказа обновлён',
      actionSubtitle: 'Draft -> In Review',
      entityType: 'Assessment',
      entityId: 'A-77',
      entityTitle: 'Заказ #A-77',
      entitySubtitle: 'Рыночная оценка',
      source: 'Notary cabinet',
      location: 'Карточка заказа',
      ipAddress: '10.0.0.7',
      createdAt: '2026-03-20T08:45:00Z',
      severity: 'info',
      changes: {
        before: ['status: draft'],
        after: ['status: in_review'],
      },
    });

    expect(viewModel).toMatchObject({
      id: 'evt-order',
      occurredAt: '2026-03-20T08:45:00Z',
      actor: {
        id: 'notary-7',
        name: 'Нотариус Т.',
        email: 'notary@example.com',
        role: 'Нотариус',
      },
      action: {
        code: 'assessment.status_changed',
        title: 'Статус заказа обновлён',
        subtitle: 'Draft -> In Review',
        category: 'Операции с заказами',
      },
      entity: {
        type: 'order',
        id: 'A-77',
        title: 'Заказ #A-77',
        subtitle: 'Рыночная оценка',
        label: 'Заказы',
      },
      source: {
        name: 'Notary cabinet',
        location: 'Карточка заказа',
        ipAddress: '10.0.0.7',
        userAgent: '',
      },
      severity: {
        level: 'info',
        label: 'Инфо',
      },
      security: {
        isSecurityEvent: false,
        riskLevel: 'low',
        reason: '',
      },
      changes: {
        before: ['status: draft'],
        after: ['status: in_review'],
      },
      display: {
        dateLabel: '20 мар 2026',
        timeLabel: '08:45',
      },
    });

    expect(viewModel.searchText).toContain('notary-7');
    expect(viewModel.searchText).toContain('a-77');
    expect(viewModel.searchText).toContain('статус заказа обновлён');
  });
});
