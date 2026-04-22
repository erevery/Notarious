import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

type PaymentStatus = 'success' | 'pending' | 'refunded' | 'failed';
type PaymentMethod = 'card' | 'sbp' | 'yookassa';

interface PaymentRow {
  id: string;
  orderId: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  createdAt: string;
}

const STATUS_OPTIONS: readonly (PaymentStatus | 'Все')[] = [
  'Все',
  'success',
  'pending',
  'refunded',
  'failed',
];

const STATUS_LABELS: Record<PaymentStatus, string> = {
  success: 'Успешно',
  pending: 'Ожидает',
  refunded: 'Возврат',
  failed: 'Ошибка',
};

const METHOD_LABELS: Record<PaymentMethod, string> = {
  card: 'Банковская карта',
  sbp: 'СБП',
  yookassa: 'ЮKassa',
};

const PAYMENTS_MOCK: readonly PaymentRow[] = [
  {
    id: 'PAY-001',
    orderId: 'A-88349',
    amount: '2 500',
    currency: '₽',
    status: 'success',
    method: 'card',
    createdAt: '28 февраля 2026, 12:41',
  },
  {
    id: 'PAY-002',
    orderId: 'A-88290',
    amount: '1 800',
    currency: '₽',
    status: 'success',
    method: 'sbp',
    createdAt: '25 февраля 2026, 09:20',
  },
  {
    id: 'PAY-003',
    orderId: 'A-88412',
    amount: '4 100',
    currency: '₽',
    status: 'pending',
    method: 'yookassa',
    createdAt: '28 февраля 2026, 14:06',
  },
  {
    id: 'PAY-004',
    orderId: 'A-88101',
    amount: '2 100',
    currency: '₽',
    status: 'refunded',
    method: 'card',
    createdAt: '22 февраля 2026, 10:48',
  },
  {
    id: 'PAY-005',
    orderId: 'A-88357',
    amount: '2 500',
    currency: '₽',
    status: 'refunded',
    method: 'sbp',
    createdAt: '27 февраля 2026, 17:32',
  },
  {
    id: 'PAY-006',
    orderId: 'A-88420',
    amount: '3 600',
    currency: '₽',
    status: 'success',
    method: 'card',
    createdAt: '28 февраля 2026, 15:59',
  },
  {
    id: 'PAY-007',
    orderId: 'A-88433',
    amount: '2 900',
    currency: '₽',
    status: 'failed',
    method: 'yookassa',
    createdAt: '28 февраля 2026, 16:22',
  },
];

const normalizeToken = (value: string): string => value.trim().toLowerCase();

@Component({
  selector: 'lib-admin-payments',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-payments.html',
  styleUrl: './admin-payments.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPaymentsComponent {
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly methodLabels = METHOD_LABELS;
  protected readonly searchQuery = signal('');
  protected readonly statusFilter = signal<(typeof STATUS_OPTIONS)[number]>('Все');
  protected readonly payments = signal<readonly PaymentRow[]>(PAYMENTS_MOCK);

  protected readonly filteredPayments = computed(() => {
    const query = normalizeToken(this.searchQuery());
    const status = this.statusFilter();

    return this.payments().filter((row) => {
      const matchesStatus = status === 'Все' || row.status === status;

      if (!matchesStatus) {
        return false;
      }

      if (!query) {
        return true;
      }

      return normalizeToken(row.id).includes(query) || normalizeToken(row.orderId).includes(query);
    });
  });

  protected readonly totalLabel = computed(() => {
    const visible = this.filteredPayments().length;
    const total = this.payments().length;
    return visible === total ? `${total} платежей в каталоге` : `${visible} из ${total} платежей`;
  });

  protected readonly refundedCount = computed(
    () => this.payments().filter((row) => row.status === 'refunded').length,
  );

  protected readonly statusMessage = signal('');

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

  protected refundPayment(id: string): void {
    this.payments.update((current) =>
      current.map((row) => (row.id === id ? { ...row, status: 'refunded' as PaymentStatus } : row)),
    );
    this.statusMessage.set(`Платеж ${id} возвращен.`);
  }

  protected statusTone(status: PaymentStatus): 'success' | 'warning' | 'neutral' | 'accent' {
    switch (status) {
      case 'success':
        return 'success';
      case 'refunded':
        return 'warning';
      case 'pending':
        return 'accent';
      case 'failed':
        return 'neutral';
    }
  }

  protected labelForStatus(status: PaymentStatus): string {
    return STATUS_LABELS[status] ?? status;
  }

  protected labelForMethod(method: PaymentMethod): string {
    return METHOD_LABELS[method] ?? method;
  }
}
