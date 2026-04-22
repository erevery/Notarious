import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

type OrderStatus = 'Новая' | 'В работе' | 'Проверена' | 'Завершена' | 'Отменена';

type PaymentState = 'Оплачена' | 'Ожидает оплаты' | 'Возврат';

interface OrderListRow {
  id: string;
  address: string;
  propertyType: string;
  status: OrderStatus;
  applicantName: string;
  applicantId: string;
  notaryName: string | null;
  createdAt: string;
  slaLabel: string;
  priceLabel: string;
  paymentState: PaymentState;
}

const STATUS_OPTIONS: readonly (OrderStatus | 'Все')[] = [
  'Все',
  'Новая',
  'В работе',
  'Проверена',
  'Завершена',
  'Отменена',
];

const ORDERS_LIST: readonly OrderListRow[] = [
  {
    id: 'A-88349',
    address: 'г. Екатеринбург, ул. Ленина, д. 52',
    propertyType: 'Квартира, 68 м²',
    status: 'В работе',
    applicantName: 'Ирина Соколова',
    applicantId: 'U-2011',
    notaryName: 'Анастасия Е.',
    createdAt: '28 февраля 2026, 12:40',
    slaLabel: '10 часов до дедлайна',
    priceLabel: '2 500 ₽',
    paymentState: 'Оплачена',
  },
  {
    id: 'A-88290',
    address: 'г. Тюмень, ул. Республики, д. 41',
    propertyType: 'Дом, 112 м²',
    status: 'Проверена',
    applicantName: 'Марина Киселева',
    applicantId: 'U-1942',
    notaryName: 'Марина Киселева',
    createdAt: '25 февраля 2026, 09:18',
    slaLabel: 'Готово к завершению',
    priceLabel: '1 800 ₽',
    paymentState: 'Оплачена',
  },
  {
    id: 'A-88412',
    address: 'г. Казань, ул. Баумана, д. 7',
    propertyType: 'Коммерческое, 240 м²',
    status: 'Новая',
    applicantName: 'Ольга Павлова',
    applicantId: 'U-2188',
    notaryName: null,
    createdAt: '28 февраля 2026, 14:05',
    slaLabel: '24 часа до назначения',
    priceLabel: '4 100 ₽',
    paymentState: 'Ожидает оплаты',
  },
  {
    id: 'A-88101',
    address: 'г. Новосибирск, ул. Красный проспект, д. 18',
    propertyType: 'Квартира, 52 м²',
    status: 'Завершена',
    applicantName: 'Наталья Гришина',
    applicantId: 'U-2234',
    notaryName: 'Тимур Хабиров',
    createdAt: '22 февраля 2026, 10:46',
    slaLabel: 'Закрыта без нарушений',
    priceLabel: '2 100 ₽',
    paymentState: 'Оплачена',
  },
  {
    id: 'A-88357',
    address: 'г. Санкт-Петербург, ул. Рубинштейна, д. 9',
    propertyType: 'Квартира, 74 м²',
    status: 'Отменена',
    applicantName: 'Егор Лунев',
    applicantId: 'U-2037',
    notaryName: null,
    createdAt: '27 февраля 2026, 17:31',
    slaLabel: 'Отменена заявителем',
    priceLabel: '2 500 ₽',
    paymentState: 'Возврат',
  },
  {
    id: 'A-88420',
    address: 'г. Уфа, ул. Пушкина, д. 31',
    propertyType: 'Офис, 95 м²',
    status: 'В работе',
    applicantName: 'Денис Алексеев',
    applicantId: 'U-1500',
    notaryName: 'Тимур Хабиров',
    createdAt: '28 февраля 2026, 15:58',
    slaLabel: '8 часов до дедлайна',
    priceLabel: '3 600 ₽',
    paymentState: 'Оплачена',
  },
  {
    id: 'A-88433',
    address: 'г. Москва, ул. Тверская, д. 12',
    propertyType: 'Квартира, 45 м²',
    status: 'Новая',
    applicantName: 'Ирина Соколова',
    applicantId: 'U-2011',
    notaryName: null,
    createdAt: '28 февраля 2026, 16:20',
    slaLabel: '23 часа до назначения',
    priceLabel: '2 900 ₽',
    paymentState: 'Ожидает оплаты',
  },
];

const normalizeToken = (value: string): string => value.trim().toLowerCase();

@Component({
  selector: 'lib-admin-orders-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './orders-list.html',
  styleUrl: './orders-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminOrdersListComponent {
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly searchQuery = signal('');
  protected readonly statusFilter = signal<(typeof STATUS_OPTIONS)[number]>('Все');

  protected readonly orders = signal<readonly OrderListRow[]>(ORDERS_LIST);

  protected readonly filteredOrders = computed(() => {
    const query = normalizeToken(this.searchQuery());
    const status = this.statusFilter();

    return this.orders().filter((row) => {
      const matchesStatus = status === 'Все' || row.status === status;

      if (!matchesStatus) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        normalizeToken(row.id).includes(query) ||
        normalizeToken(row.address).includes(query) ||
        normalizeToken(row.applicantName).includes(query) ||
        normalizeToken(row.applicantId).includes(query) ||
        (row.notaryName ? normalizeToken(row.notaryName).includes(query) : false)
      );
    });
  });

  protected readonly totalLabel = computed(() => {
    const visible = this.filteredOrders().length;
    const total = this.orders().length;

    return visible === total ? `${total} заявок в каталоге` : `${visible} из ${total} заявок`;
  });

  protected readonly unassignedCount = computed(
    () => this.orders().filter((row) => row.notaryName === null).length,
  );

  protected readonly inProgressCount = computed(
    () => this.orders().filter((row) => row.status === 'В работе').length,
  );

  protected updateSearch(value: string): void {
    this.searchQuery.set(value);
  }

  protected updateStatusFilter(value: string): void {
    const next = STATUS_OPTIONS.find((option) => option === value) ?? 'Все';
    this.statusFilter.set(next);
  }

  protected resetFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('Все');
  }

  protected statusTone(row: OrderListRow): 'success' | 'warning' | 'neutral' | 'accent' {
    switch (row.status) {
      case 'Отменена':
        return 'warning';
      case 'Завершена':
        return 'success';
      case 'В работе':
        return 'accent';
      default:
        return 'neutral';
    }
  }

  protected paymentTone(row: OrderListRow): 'success' | 'warning' | 'neutral' {
    switch (row.paymentState) {
      case 'Оплачена':
        return 'success';
      case 'Возврат':
        return 'warning';
      default:
        return 'neutral';
    }
  }
}
