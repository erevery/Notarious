import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { type AuditLogViewModel } from '../models';

export type AuditEntityFeedType = 'user' | 'order';
export type AuditEntityFeedFilterMode = 'entityType' | 'entityId' | 'entityEmail';

export interface AuditEntityFeedExportRequest {
  entityType: AuditEntityFeedType;
  entityId?: string;
  entityEmail?: string;
  filterMode: AuditEntityFeedFilterMode;
  events: AuditLogViewModel[];
}

const trimToUndefined = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const normalizeValue = (value: string | undefined): string =>
  trimToUndefined(value)?.toLowerCase() ?? '';

@Component({
  selector: 'lib-audit-entity-feed',
  standalone: true,
  imports: [],
  templateUrl: './audit-entity-feed.html',
  styleUrl: './audit-entity-feed.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditEntityFeedComponent {
  readonly entityType = input.required<AuditEntityFeedType>();
  readonly entityId = input<string>();
  readonly entityEmail = input<string>();
  readonly events = input<AuditLogViewModel[]>([]);
  readonly loading = input(false);
  readonly error = input<string | null>(null);

  readonly eventSelected = output<AuditLogViewModel>();
  readonly exportRequested = output<AuditEntityFeedExportRequest>();

  private readonly selectedEventId = signal<string | null>(null);

  protected readonly filteredEvents = computed(() => {
    const entityType = this.entityType();
    const entityId = normalizeValue(this.entityId());
    const entityEmail = normalizeValue(this.entityEmail());

    return this.events().filter((event) =>
      entityType === 'order'
        ? this.matchesOrderEvent(event, entityId)
        : this.matchesUserEvent(event, entityId, entityEmail),
    );
  });

  protected readonly selectedEvent = computed(() => {
    const selectedEventId = this.selectedEventId();
    return this.filteredEvents().find((event) => event.id === selectedEventId) ?? null;
  });

  protected readonly filterMode = computed<AuditEntityFeedFilterMode>(() => {
    if (this.entityType() === 'user' && trimToUndefined(this.entityEmail())) {
      return 'entityEmail';
    }

    if (trimToUndefined(this.entityId())) {
      return 'entityId';
    }

    return 'entityType';
  });

  protected readonly feedTitle = computed(() =>
    this.entityType() === 'user' ? 'Лента аудита пользователя' : 'Лента аудита заказа',
  );

  protected readonly filterModeLabel = computed(() => {
    switch (this.filterMode()) {
      case 'entityEmail':
        return 'По email пользователя';
      case 'entityId':
        return 'По ID сущности';
      case 'entityType':
        return 'По типу сущности';
    }
  });

  protected readonly filterTargetLabel = computed(() => {
    const entityEmail = trimToUndefined(this.entityEmail());
    const entityId = trimToUndefined(this.entityId());

    if (this.filterMode() === 'entityEmail' && entityEmail) {
      return entityEmail;
    }

    if (this.filterMode() === 'entityId' && entityId) {
      return entityId;
    }

    return this.entityType() === 'user' ? 'Все пользовательские записи' : 'Все записи по заказам';
  });

  protected readonly feedSubtitle = computed(() => {
    if (this.filterMode() === 'entityEmail') {
      return `Показываем все события, которые связаны с пользователем ${this.filterTargetLabel()}.`;
    }

    if (this.filterMode() === 'entityId') {
      return `Показываем все события для сущности ${this.filterTargetLabel()}.`;
    }

    return this.entityType() === 'user'
      ? 'Фид собирает прямые пользовательские события без зависимости от родительского monitoring-screen.'
      : 'Фид собирает события по заказам и может встраиваться в любую карточку сущности.';
  });

  protected readonly resultsLabel = computed(() => {
    const count = this.filteredEvents().length;
    return `${count} ${this.pluralize(count, 'событие', 'события', 'событий')}`;
  });

  protected readonly emptyStateDescription = computed(() => {
    switch (this.filterMode()) {
      case 'entityEmail':
        return `Для пользователя ${this.filterTargetLabel()} пока нет событий в аудите.`;
      case 'entityId':
        return `Для сущности ${this.filterTargetLabel()} пока нет событий в аудите.`;
      case 'entityType':
        return 'Попробуйте передать entityId или entityEmail, если нужен фид по конкретной записи.';
    }
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

  protected selectEvent(event: AuditLogViewModel): void {
    this.selectedEventId.set(event.id);
    this.eventSelected.emit(event);
  }

  protected requestExport(): void {
    this.exportRequested.emit({
      entityType: this.entityType(),
      entityId: trimToUndefined(this.entityId()),
      entityEmail: trimToUndefined(this.entityEmail()),
      filterMode: this.filterMode(),
      events: this.filteredEvents(),
    });
  }

  protected getEventSubtitle(event: AuditLogViewModel): string {
    return event.action.subtitle || event.action.category;
  }

  protected getRiskLabel(riskLevel: AuditLogViewModel['security']['riskLevel']): string {
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

  private matchesOrderEvent(event: AuditLogViewModel, entityId: string): boolean {
    if (event.entity.type !== 'order') {
      return false;
    }

    return !entityId || normalizeValue(event.entity.id) === entityId;
  }

  private matchesUserEvent(
    event: AuditLogViewModel,
    entityId: string,
    entityEmail: string,
  ): boolean {
    const matchesUserEntityById =
      event.entity.type === 'user' && !!entityId && normalizeValue(event.entity.id) === entityId;
    const matchesActorById = !!entityId && normalizeValue(event.actor.id) === entityId;
    const matchesActorByEmail = !!entityEmail && normalizeValue(event.actor.email) === entityEmail;

    if (entityId || entityEmail) {
      return matchesUserEntityById || matchesActorById || matchesActorByEmail;
    }

    return event.entity.type === 'user';
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
