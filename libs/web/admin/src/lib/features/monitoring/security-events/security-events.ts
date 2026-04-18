import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { type AuditLogViewModel, type SecurityRiskLevel } from '../models';

export interface SecurityEventsFilters {
  ip: string;
  user: string;
  dateFrom: string;
  dateTo: string;
}

export interface SecurityEventsExportRequest {
  filters: SecurityEventsFilters;
  events: AuditLogViewModel[];
  highlightedCount: number;
  recentCount: number;
}

const DEFAULT_FILTERS: SecurityEventsFilters = {
  ip: '',
  user: '',
  dateFrom: '',
  dateTo: '',
};

const DAY_MS = 24 * 60 * 60 * 1000;

const normalizeValue = (value: string | undefined): string => value?.trim().toLowerCase() ?? '';

const getEventDate = (event: AuditLogViewModel): string => event.occurredAt.slice(0, 10);

const parseTimestamp = (value: string): number | null => {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
};

@Component({
  selector: 'lib-security-events',
  standalone: true,
  imports: [],
  templateUrl: './security-events.html',
  styleUrl: './security-events.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecurityEventsComponent {
  readonly events = input<AuditLogViewModel[]>([]);
  readonly loading = input(false);
  readonly error = input<string | null>(null);

  readonly filtersChanged = output<SecurityEventsFilters>();
  readonly rowSelected = output<AuditLogViewModel>();
  readonly exportRequested = output<SecurityEventsExportRequest>();

  protected readonly filters = signal<SecurityEventsFilters>({ ...DEFAULT_FILTERS });

  private readonly selectedEventId = signal<string | null>(null);

  private readonly securityEvents = computed(() =>
    [...this.events()]
      .filter((event) => event.security.isSecurityEvent)
      .sort((left, right) => {
        const leftTimestamp = parseTimestamp(left.occurredAt) ?? 0;
        const rightTimestamp = parseTimestamp(right.occurredAt) ?? 0;
        return rightTimestamp - leftTimestamp;
      }),
  );

  protected readonly filteredEvents = computed(() => {
    const filters = this.filters();
    const ipFilter = normalizeValue(filters.ip);
    const userFilter = normalizeValue(filters.user);

    return this.securityEvents().filter((event) => {
      if (ipFilter && !normalizeValue(event.source.ipAddress).includes(ipFilter)) {
        return false;
      }

      if (!this.matchesUserFilter(event, userFilter)) {
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

  protected readonly selectedEvent = computed(() => {
    const selectedEventId = this.selectedEventId();
    return this.filteredEvents().find((event) => event.id === selectedEventId) ?? null;
  });

  protected readonly recentCount = computed(() => {
    const filteredEvents = this.filteredEvents();
    const anchorTimestamp = this.getAnchorTimestamp(filteredEvents);

    if (anchorTimestamp === null) {
      return 0;
    }

    return filteredEvents.filter((event) => {
      const timestamp = parseTimestamp(event.occurredAt);

      if (timestamp === null || timestamp > anchorTimestamp) {
        return false;
      }

      return anchorTimestamp - timestamp <= DAY_MS;
    }).length;
  });

  protected readonly highlightedCount = computed(
    () => this.filteredEvents().filter((event) => this.isHighlighted(event)).length,
  );

  protected readonly totalCountLabel = computed(() => {
    const count = this.filteredEvents().length;
    return `${count} ${this.pluralize(count, 'событие', 'события', 'событий')}`;
  });

  protected readonly recentCountLabel = computed(() => {
    const count = this.recentCount();
    return `${count} за 24ч`;
  });

  protected readonly highlightedCountLabel = computed(() => {
    const count = this.highlightedCount();
    return `${count} в фокусе`;
  });

  protected readonly activeFiltersSummary = computed(() => {
    const filters = this.filters();
    const parts = [
      filters.ip ? `IP: ${filters.ip}` : '',
      filters.user ? `Пользователь: ${filters.user}` : '',
      filters.dateFrom ? `С: ${filters.dateFrom}` : '',
      filters.dateTo ? `По: ${filters.dateTo}` : '',
    ].filter(Boolean);

    return parts.length ? parts.join(' · ') : 'Все security-события из входного массива.';
  });

  protected readonly hasActiveFilters = computed(() => {
    const filters = this.filters();
    return !!filters.ip || !!filters.user || !!filters.dateFrom || !!filters.dateTo;
  });

  protected readonly canExport = computed(
    () => !this.loading() && !this.error() && this.filteredEvents().length > 0,
  );

  constructor() {
    effect(() => {
      const filteredEvents = this.filteredEvents();
      const selectedEventId = this.selectedEventId();

      if (!filteredEvents.length) {
        if (selectedEventId !== null) {
          this.selectedEventId.set(null);
        }

        return;
      }

      if (!selectedEventId || !filteredEvents.some((event) => event.id === selectedEventId)) {
        this.selectedEventId.set(filteredEvents[0].id);
      }
    });
  }

  protected updateFilter<K extends keyof SecurityEventsFilters>(
    key: K,
    value: SecurityEventsFilters[K],
  ): void {
    const nextFilters = { ...this.filters(), [key]: value };
    this.filters.set(nextFilters);
    this.filtersChanged.emit(nextFilters);
  }

  protected resetFilters(): void {
    this.filters.set({ ...DEFAULT_FILTERS });
    this.filtersChanged.emit(this.filters());
  }

  protected selectRow(event: AuditLogViewModel): void {
    this.selectedEventId.set(event.id);
    this.rowSelected.emit(event);
  }

  protected requestExport(): void {
    this.exportRequested.emit({
      filters: { ...this.filters() },
      events: this.filteredEvents(),
      highlightedCount: this.highlightedCount(),
      recentCount: this.recentCount(),
    });
  }

  protected isSuspicious(event: AuditLogViewModel): boolean {
    return event.searchText.includes('suspicious') || event.searchText.includes('подозр');
  }

  protected isHighlighted(event: AuditLogViewModel): boolean {
    return this.isSuspicious(event) || event.security.riskLevel === 'high';
  }

  protected getRiskLabel(riskLevel: SecurityRiskLevel): string {
    switch (riskLevel) {
      case 'high':
        return 'High risk';
      case 'medium':
        return 'Medium risk';
      case 'low':
        return 'Low risk';
    }
  }

  protected hasChanges(event: AuditLogViewModel): boolean {
    return event.changes.before.length > 0 || event.changes.after.length > 0;
  }

  private matchesUserFilter(event: AuditLogViewModel, userFilter: string): boolean {
    if (!userFilter) {
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

    return searchableParts.some((part) => normalizeValue(part).includes(userFilter));
  }

  private getAnchorTimestamp(events: AuditLogViewModel[]): number | null {
    const timestamps = events
      .map((event) => parseTimestamp(event.occurredAt))
      .filter((timestamp): timestamp is number => timestamp !== null);

    if (!timestamps.length) {
      return null;
    }

    return Math.max(...timestamps);
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
