import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

type SubscriptionStatus = 'active' | 'past_due' | 'canceled';

interface SubscriptionRow {
  id: string;
  userId: string;
  userName: string;
  planName: string;
  status: SubscriptionStatus;
  startedAt: string;
  renewAt: string;
}

const STATUS_OPTIONS: readonly (SubscriptionStatus | 'Все')[] = [
  'Все',
  'active',
  'past_due',
  'canceled',
];

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: 'Активна',
  past_due: 'Просрочена',
  canceled: 'Отменена',
};

const SUBSCRIPTIONS_MOCK: readonly SubscriptionRow[] = [
  {
    id: 'SUB-001',
    userId: 'U-1942',
    userName: 'Марина Киселева',
    planName: 'Business Annual',
    status: 'active',
    startedAt: '14 февраля 2026',
    renewAt: '14 февраля 2027',
  },
  {
    id: 'SUB-002',
    userId: 'U-2109',
    userName: 'Анастасия Е.',
    planName: 'Business',
    status: 'active',
    startedAt: '01 марта 2026',
    renewAt: '01 марта 2027',
  },
  {
    id: 'SUB-003',
    userId: 'U-2203',
    userName: 'Тимур Хабиров',
    planName: 'Business Annual',
    status: 'past_due',
    startedAt: '14 ноября 2025',
    renewAt: '14 ноября 2026',
  },
  {
    id: 'SUB-004',
    userId: 'U-2234',
    userName: 'Наталья Гришина',
    planName: 'Standard',
    status: 'canceled',
    startedAt: '01 февраля 2026',
    renewAt: '01 февраля 2026',
  },
  {
    id: 'SUB-005',
    userId: 'U-2188',
    userName: 'Ольга Павлова',
    planName: 'Free',
    status: 'active',
    startedAt: '08 января 2026',
    renewAt: 'Без автопродления',
  },
  {
    id: 'SUB-006',
    userId: 'U-2037',
    userName: 'Егор Лунев',
    planName: 'Standard',
    status: 'active',
    startedAt: '10 декабря 2025',
    renewAt: '10 декабря 2026',
  },
];

const normalizeToken = (value: string): string => value.trim().toLowerCase();

@Component({
  selector: 'lib-admin-subscriptions',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-subscriptions.html',
  styleUrl: './admin-subscriptions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSubscriptionsComponent {
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly searchQuery = signal('');
  protected readonly statusFilter = signal<(typeof STATUS_OPTIONS)[number]>('Все');
  protected readonly subscriptions = signal<readonly SubscriptionRow[]>(SUBSCRIPTIONS_MOCK);

  protected readonly filteredSubscriptions = computed(() => {
    const query = normalizeToken(this.searchQuery());
    const status = this.statusFilter();

    return this.subscriptions().filter((row) => {
      const matchesStatus = status === 'Все' || row.status === status;

      if (!matchesStatus) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        normalizeToken(row.userName).includes(query) ||
        normalizeToken(row.planName).includes(query) ||
        normalizeToken(row.userId).includes(query)
      );
    });
  });

  protected readonly totalLabel = computed(() => {
    const visible = this.filteredSubscriptions().length;
    const total = this.subscriptions().length;
    return visible === total ? `${total} подписок в каталоге` : `${visible} из ${total} подписок`;
  });

  protected readonly activeCount = computed(
    () => this.subscriptions().filter((row) => row.status === 'active').length,
  );

  protected updateSearch(value: string): void {
    this.searchQuery.set(value);
  }

  protected updateStatusFilter(value: string): void {
    const next = STATUS_OPTIONS.find((opt) => opt === value) ?? 'Все';
    this.statusFilter.set(next);
  }

  protected resetFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('Все');
  }

  protected statusTone(status: SubscriptionStatus): 'success' | 'warning' | 'neutral' {
    switch (status) {
      case 'active':
        return 'success';
      case 'past_due':
        return 'warning';
      case 'canceled':
        return 'neutral';
    }
  }

  protected labelForStatus(status: SubscriptionStatus): string {
    return STATUS_LABELS[status] ?? status;
  }
}
