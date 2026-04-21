import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { type AuditEntityFeedExportRequest } from './audit-entity-feed';
import { exportAuditEventsAsCsv } from './contracts/audit-export.utils';
import { AUDIT_LOGS_MOCK, type AuditLogViewModel } from './models';
import { OrderLogsPanelComponent } from './order-logs-panel';
import {
  SecurityEventsComponent,
  type SecurityEventsExportRequest,
  type SecurityEventsFilters,
} from './security-events';
import { UserLogsPanelComponent } from './user-logs-panel';

type MonitoringChip = 'all' | 'role' | 'export' | 'access';
type MonitoringTab = 'all' | 'by-entity' | 'security';

interface MonitoringFilters {
  query: string;
  dateFrom: string;
  dateTo: string;
  role: string;
  type: string;
  object: string;
  severity: string;
  securityOnly: boolean;
}

interface MonitoringEntityFilters {
  userId: string;
  userEmail: string;
  orderId: string;
}

const DEFAULT_FILTERS: MonitoringFilters = {
  query: '',
  dateFrom: '2026-02-01',
  dateTo: '2026-02-28',
  role: 'all',
  type: 'all',
  object: 'all',
  severity: 'all',
  securityOnly: false,
};

const DEFAULT_ENTITY_FILTERS: MonitoringEntityFilters = {
  userId: '',
  userEmail: '',
  orderId: '',
};

const DEFAULT_SECURITY_FILTERS: SecurityEventsFilters = {
  ip: '',
  user: '',
  dateFrom: '',
  dateTo: '',
};

const CHIP_OPTIONS: Array<{ id: MonitoringChip; label: string }> = [
  { id: 'all', label: 'Все события' },
  { id: 'role', label: 'Изменения ролей' },
  { id: 'export', label: 'Экспорт' },
  { id: 'access', label: 'Ошибки доступа' },
];

const TAB_OPTIONS: Array<{ id: MonitoringTab; label: string }> = [
  { id: 'all', label: 'Все события' },
  { id: 'by-entity', label: 'By entity' },
  { id: 'security', label: 'Security' },
];

const normalizeValue = (value: string | undefined | null): string =>
  value?.trim().toLowerCase() ?? '';

const trimToUndefined = (value: string | undefined | null): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const getEventDate = (event: AuditLogViewModel): string => event.occurredAt.slice(0, 10);

const parseTimestamp = (value: string): number | null => {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
};

const resolveChip = (event: AuditLogViewModel): MonitoringChip => {
  if (event.action.category === 'Изменение ролей') {
    return 'role';
  }

  if (event.action.category === 'Экспорт') {
    return 'export';
  }

  if (event.security.isSecurityEvent) {
    return 'access';
  }

  return 'all';
};

const matchesUserEvent = (event: AuditLogViewModel, userId: string, userEmail: string): boolean => {
  const normalizedUserId = normalizeValue(userId);
  const normalizedUserEmail = normalizeValue(userEmail);

  const matchesUserEntityById =
    event.entity.type === 'user' &&
    !!normalizedUserId &&
    normalizeValue(event.entity.id) === normalizedUserId;
  const matchesActorById =
    !!normalizedUserId && normalizeValue(event.actor.id) === normalizedUserId;
  const matchesActorByEmail =
    !!normalizedUserEmail && normalizeValue(event.actor.email) === normalizedUserEmail;

  if (normalizedUserId || normalizedUserEmail) {
    return matchesUserEntityById || matchesActorById || matchesActorByEmail;
  }

  return event.entity.type === 'user';
};

const matchesOrderEvent = (event: AuditLogViewModel, orderId: string): boolean => {
  const normalizedOrderId = normalizeValue(orderId);

  if (event.entity.type !== 'order') {
    return false;
  }

  return !normalizedOrderId || normalizeValue(event.entity.id) === normalizedOrderId;
};

const matchesSecurityUserFilter = (event: AuditLogViewModel, userFilter: string): boolean => {
  const normalizedUserFilter = normalizeValue(userFilter);

  if (!normalizedUserFilter) {
    return true;
  }

  const searchableParts = [
    event.actor.id,
    event.actor.name,
    event.actor.email,
    event.entity.type === 'user' ? event.entity.id : '',
    event.entity.type === 'user' ? event.entity.title : '',
    event.entity.type === 'user' ? event.entity.subtitle : '',
  ];

  return searchableParts.some((part) => normalizeValue(part).includes(normalizedUserFilter));
};

const toFileToken = (value: string | undefined): string =>
  (value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

@Component({
  selector: 'lib-monitoring',
  standalone: true,
  imports: [OrderLogsPanelComponent, SecurityEventsComponent, UserLogsPanelComponent],
  templateUrl: './monitoring.html',
  styleUrl: './monitoring.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Monitoring {
  protected readonly auditEvents = AUDIT_LOGS_MOCK;
  protected readonly chipOptions = CHIP_OPTIONS;
  protected readonly tabOptions = TAB_OPTIONS;

  protected readonly currentTab = signal<MonitoringTab>('all');
  protected readonly filters = signal<MonitoringFilters>({ ...DEFAULT_FILTERS });
  protected readonly entityFilters = signal<MonitoringEntityFilters>({ ...DEFAULT_ENTITY_FILTERS });
  protected readonly securityFilters = signal<SecurityEventsFilters>({
    ...DEFAULT_SECURITY_FILTERS,
  });
  protected readonly activeChip = signal<MonitoringChip>('all');
  protected readonly selectedEventId = signal<string | null>(this.auditEvents[0]?.id ?? null);
  protected readonly lastUpdated = signal<string>(
    this.formatLastUpdated(new Date('2026-02-28T14:20:00Z')),
  );
  protected readonly statusMessage = signal<string>(
    'Фильтры применяются сразу, кнопка "Применить" подтверждает выбор.',
  );

  protected readonly filteredEvents = computed(() => {
    const filters = this.filters();
    const activeChip = this.activeChip();
    const query = normalizeValue(filters.query);

    return this.auditEvents.filter((event) => {
      if (activeChip !== 'all' && resolveChip(event) !== activeChip) {
        return false;
      }

      if (filters.role !== 'all' && event.actor.role !== filters.role) {
        return false;
      }

      if (filters.type !== 'all' && event.action.category !== filters.type) {
        return false;
      }

      if (filters.object !== 'all' && event.entity.label !== filters.object) {
        return false;
      }

      if (filters.severity !== 'all' && event.severity.label !== filters.severity) {
        return false;
      }

      if (filters.securityOnly && !event.security.isSecurityEvent) {
        return false;
      }

      if (filters.dateFrom && getEventDate(event) < filters.dateFrom) {
        return false;
      }

      if (filters.dateTo && getEventDate(event) > filters.dateTo) {
        return false;
      }

      if (!query) {
        return true;
      }

      return event.searchText.includes(query);
    });
  });

  protected readonly entityContextEvents = computed(() => {
    const filters = this.entityFilters();
    const hasUserContext =
      !!trimToUndefined(filters.userId) || !!trimToUndefined(filters.userEmail);
    const hasOrderContext = !!trimToUndefined(filters.orderId);

    return this.auditEvents.filter((event) => {
      const userMatch = hasUserContext
        ? matchesUserEvent(event, filters.userId, filters.userEmail)
        : event.entity.type === 'user';
      const orderMatch = hasOrderContext
        ? matchesOrderEvent(event, filters.orderId)
        : event.entity.type === 'order';

      if (hasUserContext && hasOrderContext) {
        return userMatch || orderMatch;
      }

      if (hasUserContext) {
        return userMatch;
      }

      if (hasOrderContext) {
        return orderMatch;
      }

      return userMatch || orderMatch;
    });
  });

  protected readonly filteredSecurityEvents = computed(() => {
    const filters = this.securityFilters();
    const ipFilter = normalizeValue(filters.ip);

    return [...this.auditEvents]
      .filter((event) => event.security.isSecurityEvent)
      .sort((left, right) => {
        const leftTimestamp = parseTimestamp(left.occurredAt) ?? 0;
        const rightTimestamp = parseTimestamp(right.occurredAt) ?? 0;
        return rightTimestamp - leftTimestamp;
      })
      .filter((event) => {
        if (ipFilter && !normalizeValue(event.source.ipAddress).includes(ipFilter)) {
          return false;
        }

        if (!matchesSecurityUserFilter(event, filters.user)) {
          return false;
        }

        if (filters.dateFrom && getEventDate(event) < filters.dateFrom) {
          return false;
        }

        if (filters.dateTo && getEventDate(event) > filters.dateTo) {
          return false;
        }

        return true;
      });
  });

  protected readonly currentVisibleEvents = computed(() => {
    switch (this.currentTab()) {
      case 'by-entity':
        return this.entityContextEvents();
      case 'security':
        return this.filteredSecurityEvents();
      case 'all':
        return this.filteredEvents();
    }
  });

  protected readonly selectedEvent = computed(() => {
    const events = this.currentVisibleEvents();
    const selectedEventId = this.selectedEventId();

    if (!events.length) {
      return null;
    }

    return events.find((event) => event.id === selectedEventId) ?? events[0];
  });

  protected readonly toolbarDescription = computed(() => {
    const count = this.currentVisibleEvents().length;
    const countLabel = `${count} ${this.pluralize(count, 'событие', 'события', 'событий')}`;

    switch (this.currentTab()) {
      case 'by-entity':
        return `Панели by-entity используют общий mock stream. Сейчас в фокусе ${countLabel}.`;
      case 'security':
        return `Security-поток вынесен отдельно: ${countLabel} после IP/user/date-фильтров.`;
      case 'all':
        return `Показаны события за последние 30 дней. В текущей выборке ${countLabel}.`;
    }
  });

  protected readonly stats = computed(() => {
    const events = this.currentVisibleEvents();

    return {
      total: events.length,
      critical: events.filter((event) => event.severity.level === 'critical').length,
      security: events.filter((event) => event.security.isSecurityEvent).length,
      exports: events.filter((event) => event.action.category === 'Экспорт').length,
    };
  });

  protected readonly securityHighlights = computed(() =>
    this.currentVisibleEvents()
      .filter((event) => event.security.isSecurityEvent)
      .slice(0, 3),
  );

  protected readonly entityContextSummary = computed(() => {
    const filters = this.entityFilters();
    const parts = [
      trimToUndefined(filters.userId) ? `User ID: ${filters.userId.trim()}` : '',
      trimToUndefined(filters.userEmail) ? `Email: ${filters.userEmail.trim()}` : '',
      trimToUndefined(filters.orderId) ? `Order ID: ${filters.orderId.trim()}` : '',
    ].filter(Boolean);

    const count = this.entityContextEvents().length;
    const countLabel = `${count} ${this.pluralize(count, 'событие', 'события', 'событий')}`;

    if (!parts.length) {
      return `${countLabel} из user/order-контекста. Можно сузить поток вручную или подтянуть контекст из выделенной записи.`;
    }

    return `${countLabel} для контекста: ${parts.join(' · ')}.`;
  });

  protected readonly canApplySelectedUserContext = computed(() => {
    const current = this.selectedEvent();
    return !!current && (current.entity.type === 'user' || current.actor.role !== 'Система');
  });

  protected readonly canApplySelectedOrderContext = computed(
    () => this.selectedEvent()?.entity.type === 'order',
  );

  constructor() {
    effect(() => {
      const visibleEvents = this.currentVisibleEvents();
      const selectedEventId = this.selectedEventId();

      if (!visibleEvents.length) {
        if (selectedEventId !== null) {
          this.selectedEventId.set(null);
        }

        return;
      }

      if (!selectedEventId || !visibleEvents.some((event) => event.id === selectedEventId)) {
        this.selectedEventId.set(visibleEvents[0].id);
      }
    });
  }

  protected updateFilter<K extends keyof MonitoringFilters>(
    key: K,
    value: MonitoringFilters[K],
  ): void {
    this.filters.update((filters) => ({ ...filters, [key]: value }));
  }

  protected updateEntityFilter<K extends keyof MonitoringEntityFilters>(
    key: K,
    value: MonitoringEntityFilters[K],
  ): void {
    this.entityFilters.update((filters) => ({ ...filters, [key]: value }));
    this.statusMessage.set('Контекст by-entity обновлён.');
  }

  protected setChip(chip: MonitoringChip): void {
    this.activeChip.set(chip);
    this.statusMessage.set(
      `Быстрый фильтр: ${this.chipOptions.find((item) => item.id === chip)?.label ?? 'Все события'}.`,
    );
  }

  protected setTab(tab: MonitoringTab): void {
    this.currentTab.set(tab);

    switch (tab) {
      case 'by-entity':
        this.statusMessage.set(
          'Открыт by-entity режим с локальными панелями пользователя и заказа.',
        );
        break;
      case 'security':
        this.statusMessage.set('Открыт security-поток с отдельными фильтрами и экспортом.');
        break;
      case 'all':
        this.statusMessage.set('Возвращены общий audit trail и верхние фильтры.');
        break;
    }
  }

  protected selectEvent(eventId: string): void {
    this.selectedEventId.set(eventId);
  }

  protected selectIntegratedEvent(event: AuditLogViewModel): void {
    this.selectedEventId.set(event.id);
    this.statusMessage.set(`Выбрано событие: ${event.action.title}.`);
  }

  protected applyFilters(): void {
    this.statusMessage.set(`Найдено событий: ${this.filteredEvents().length}.`);
  }

  protected resetFilters(): void {
    this.filters.set({ ...DEFAULT_FILTERS });
    this.activeChip.set('all');
    this.statusMessage.set('Фильтры сброшены.');
  }

  protected clearEntityFilters(): void {
    this.entityFilters.set({ ...DEFAULT_ENTITY_FILTERS });
    this.statusMessage.set('Контекст by-entity очищен.');
  }

  protected applySelectedUserContext(): void {
    const current = this.selectedEvent();

    if (!current) {
      return;
    }

    if (current.entity.type === 'user') {
      this.entityFilters.set({
        userId: current.entity.id,
        userEmail: '',
        orderId: this.entityFilters().orderId,
      });
    } else {
      this.entityFilters.set({
        userId: current.actor.id,
        userEmail: current.actor.email,
        orderId: this.entityFilters().orderId,
      });
    }

    this.statusMessage.set('Пользовательский контекст применён из выделенного события.');
  }

  protected applySelectedOrderContext(): void {
    const current = this.selectedEvent();

    if (!current || current.entity.type !== 'order') {
      return;
    }

    this.entityFilters.update((filters) => ({
      ...filters,
      orderId: current.entity.id,
    }));
    this.statusMessage.set('Контекст заказа применён из выделенного события.');
  }

  protected refresh(): void {
    this.lastUpdated.set(this.formatLastUpdated());

    const visibleCount = this.currentVisibleEvents().length;
    this.statusMessage.set(
      `Данные обновлены. В активной вкладке ${visibleCount} ${this.pluralize(
        visibleCount,
        'запись',
        'записи',
        'записей',
      )}.`,
    );
  }

  protected saveView(): void {
    this.statusMessage.set('Сохранение представления пока работает как UI-стаб.');
  }

  protected exportCsv(): void {
    const rows = this.filteredEvents();

    if (!rows.length) {
      this.statusMessage.set('Экспорт пропущен: в текущей выборке нет строк.');
      return;
    }

    exportAuditEventsAsCsv(rows, 'audit-log');
    this.statusMessage.set(`CSV сформирован: ${rows.length} строк.`);
  }

  protected handleEntityExportRequested(request: AuditEntityFeedExportRequest): void {
    if (!request.events.length) {
      this.statusMessage.set('Экспорт пропущен: by-entity панель сейчас пустая.');
      return;
    }

    const fileToken =
      toFileToken(request.entityId) || toFileToken(request.entityEmail) || request.entityType;

    exportAuditEventsAsCsv(request.events, `audit-${request.entityType}-${fileToken}`);
    this.statusMessage.set(
      `Экспорт by-entity выполнен: ${request.events.length} ${this.pluralize(
        request.events.length,
        'событие',
        'события',
        'событий',
      )}.`,
    );
  }

  protected handleSecurityFiltersChanged(filters: SecurityEventsFilters): void {
    this.securityFilters.set({ ...filters });

    const parts = [
      trimToUndefined(filters.ip) ? `IP ${filters.ip.trim()}` : '',
      trimToUndefined(filters.user) ? `пользователь ${filters.user.trim()}` : '',
      trimToUndefined(filters.dateFrom) ? `с ${filters.dateFrom}` : '',
      trimToUndefined(filters.dateTo) ? `по ${filters.dateTo}` : '',
    ].filter(Boolean);

    this.statusMessage.set(
      parts.length
        ? `Security-фильтры обновлены: ${parts.join(' · ')}.`
        : 'Security-фильтры очищены.',
    );
  }

  protected handleSecurityExportRequested(request: SecurityEventsExportRequest): void {
    if (!request.events.length) {
      this.statusMessage.set('Экспорт пропущен: security-панель не содержит событий.');
      return;
    }

    exportAuditEventsAsCsv(request.events, 'security-events');

    const recentLabel = `${request.recentCount} за 24ч`;
    const highlightedLabel = `${request.highlightedCount} в фокусе`;
    this.statusMessage.set(
      `Security-экспорт сформирован: ${request.events.length} строк, ${recentLabel}, ${highlightedLabel}.`,
    );
  }

  private formatLastUpdated(now = new Date()): string {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(now);
  }

  private pluralize(count: number, one: string, few: string, many: string): string {
    const remainder10 = count % 10;
    const remainder100 = count % 100;

    if (remainder10 === 1 && remainder100 !== 11) {
      return one;
    }

    if (remainder10 >= 2 && remainder10 <= 4 && (remainder100 < 12 || remainder100 > 14)) {
      return few;
    }

    return many;
  }
}
