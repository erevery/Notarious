import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { type AuditEntityFeedExportRequest } from '../../monitoring/audit-entity-feed';
import { exportAuditEventsAsCsv } from '../../monitoring/contracts/audit-export.utils';
import { AUDIT_LOGS_MOCK, type AuditLogViewModel } from '../../monitoring/models';
import { OrderLogsPanelComponent } from '../../monitoring/order-logs-panel';
import {
  SecurityEventsComponent,
  type SecurityEventsExportRequest,
  type SecurityEventsFilters,
} from '../../monitoring/security-events';

type OrderStatus = 'Новая' | 'В работе' | 'Проверена' | 'Завершена' | 'Отменена';

interface OrderParticipant {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface OrderDocumentSummary {
  name: string;
  typeLabel: string;
  statusLabel: string;
  updatedAt: string;
}

interface OrderTimelineItem {
  title: string;
  at: string;
  note: string;
}

interface AdminOrderDetailViewModel {
  id: string;
  address: string;
  propertyType: string;
  purposeLabel: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  priceLabel: string;
  slaLabel: string;
  paymentLabel: string;
  adminComment: string;
  applicant: OrderParticipant;
  notary: OrderParticipant | null;
  documents: OrderDocumentSummary[];
  timeline: OrderTimelineItem[];
}

const STATUS_OPTIONS: OrderStatus[] = ['Новая', 'В работе', 'Проверена', 'Завершена', 'Отменена'];

const ORDER_DETAILS: Record<string, AdminOrderDetailViewModel> = {
  'A-88349': {
    id: 'A-88349',
    address: 'г. Екатеринбург, ул. Ленина, д. 52',
    propertyType: 'Квартира, 68 м²',
    purposeLabel: 'Оценка для нотариального действия',
    status: 'В работе',
    createdAt: '28 февраля 2026, 12:40',
    updatedAt: '28 февраля 2026, 12:57',
    priceLabel: '2 500 ₽',
    slaLabel: 'SLA: 10 часов до дедлайна',
    paymentLabel: 'Оплачена',
    adminComment:
      'Именно на эту карточку уже есть audit event изменения статуса, поэтому detail-screen сразу показывает живую order-ленту.',
    applicant: {
      id: 'U-2011',
      name: 'Ирина Соколова',
      email: 'irina.sokolova@example.com',
      phone: '+7 (922) 700-44-18',
    },
    notary: {
      id: 'notary-118',
      name: 'Анастасия Е.',
      email: 'notary@notary.local',
      phone: '+7 (912) 888-11-18',
    },
    documents: [
      {
        name: 'Выписка ЕГРН.pdf',
        typeLabel: 'PDF',
        statusLabel: 'Проверена',
        updatedAt: '28 февраля 2026, 12:48',
      },
      {
        name: 'Паспорт заявителя.jpg',
        typeLabel: 'Изображение',
        statusLabel: 'На модерации',
        updatedAt: '28 февраля 2026, 12:44',
      },
    ],
    timeline: [
      {
        title: 'Заявка создана',
        at: '28 февраля 2026, 12:40',
        note: 'Карточка создана заявителем через applicant cabinet.',
      },
      {
        title: 'Документы загружены',
        at: '28 февраля 2026, 12:44',
        note: 'Паспорт и выписка ЕГРН переданы на модерацию.',
      },
      {
        title: 'Нотариус взял заказ в работу',
        at: '28 февраля 2026, 12:57',
        note: 'Событие совпадает с mock audit trail для `/admin/orders/:id`.',
      },
    ],
  },
};

const normalizeToken = (value: string | undefined): string => value?.trim().toLowerCase() ?? '';

const normalizeId = (value: string | undefined): string => value?.trim().toUpperCase() ?? '';

const buildParticipantFromId = (id: string): OrderParticipant => ({
  id,
  name: `Нотариус ${id}`,
  email: `${normalizeToken(id)}@notary.local`,
  phone: '+7 (900) 000-00-00',
});

const buildFallbackOrder = (id: string): AdminOrderDetailViewModel => {
  const normalizedId = normalizeId(id) || 'A-DEMO';

  return {
    id: normalizedId,
    address: 'Адрес будет загружен из backend позднее',
    propertyType: 'Тип объекта не определен',
    purposeLabel: 'Демо-маршрут для нового detail-screen',
    status: 'Новая',
    createdAt: '20 марта 2026, 09:30',
    updatedAt: '20 марта 2026, 09:30',
    priceLabel: 'Не рассчитана',
    slaLabel: 'SLA не определен',
    paymentLabel: 'Нет данных',
    adminComment:
      'Для этого route-param нет специального mock-заказа. Экран остается реальным компонентом и корректно показывает пустые состояния для audit/security.',
    applicant: {
      id: 'U-DEMO',
      name: 'Демо-заявитель',
      email: 'demo-user@notary.local',
      phone: '+7 (900) 111-11-11',
    },
    notary: null,
    documents: [],
    timeline: [
      {
        title: 'Карточка открыта по fallback route',
        at: '20 марта 2026, 09:30',
        note: 'Этот сценарий нужен, чтобы `/admin/orders/:id` работал не только для hand-picked mock ids.',
      },
    ],
  };
};

const getOrderById = (id: string): AdminOrderDetailViewModel =>
  ORDER_DETAILS[normalizeId(id)] ?? buildFallbackOrder(id);

const matchesOrderSecurityContext = (
  event: AuditLogViewModel,
  order: AdminOrderDetailViewModel,
): boolean => {
  if (!event.security.isSecurityEvent) {
    return false;
  }

  const orderId = normalizeId(order.id);
  const applicantId = normalizeId(order.applicant.id);
  const applicantEmail = normalizeToken(order.applicant.email);
  const notaryId = normalizeId(order.notary?.id);
  const notaryEmail = normalizeToken(order.notary?.email);

  return (
    (event.entity.type === 'order' && normalizeId(event.entity.id) === orderId) ||
    (event.entity.type === 'user' &&
      (normalizeId(event.entity.id) === applicantId ||
        normalizeId(event.entity.id) === notaryId)) ||
    normalizeId(event.actor.id) === applicantId ||
    normalizeId(event.actor.id) === notaryId ||
    (!!applicantEmail && normalizeToken(event.actor.email) === applicantEmail) ||
    (!!notaryEmail && normalizeToken(event.actor.email) === notaryEmail)
  );
};

@Component({
  selector: 'lib-admin-order-detail',
  standalone: true,
  imports: [RouterLink, OrderLogsPanelComponent, SecurityEventsComponent],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminOrderDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly routeId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? 'A-88349')),
    { initialValue: 'A-88349' },
  );

  private readonly statusOverride = signal<OrderStatus | null>(null);
  protected readonly notaryDraft = signal('');
  private readonly notaryOverride = signal<OrderParticipant | null>(null);
  protected readonly cancelReason = signal('');

  protected readonly auditEvents = AUDIT_LOGS_MOCK;
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly pageMessage = signal(
    'Карточка заказа уже использует route-param, order-аудит и security-контекст участников без зависимости от placeholder-компонента.',
  );

  protected readonly order = computed(() => getOrderById(this.routeId()));

  protected readonly currentStatus = computed(() => this.statusOverride() ?? this.order().status);

  protected readonly assignedNotary = computed(
    () => this.notaryOverride() ?? this.order().notary ?? null,
  );

  protected readonly securityContextEvents = computed(() =>
    this.auditEvents.filter((event) => matchesOrderSecurityContext(event, this.order())),
  );

  protected readonly securitySummary = computed(() => {
    const count = this.securityContextEvents().length;
    return count
      ? `${count} security-события по участникам заявки доступны прямо в карточке.`
      : 'Security-контекст для этой заявки пока пуст, но компонент встроен и готов к backend-данным.';
  });

  protected updateStatus(status: string): void {
    const nextStatus = this.asStatus(status);
    this.statusOverride.set(nextStatus);
    this.pageMessage.set(`Статус заявки локально изменен на «${nextStatus}».`);
  }

  protected updateNotaryDraft(value: string): void {
    this.notaryDraft.set(value);
  }

  protected updateCancelReason(value: string): void {
    this.cancelReason.set(value);
  }

  protected assignNotary(): void {
    const rawId = normalizeId(this.notaryDraft());

    if (!rawId) {
      this.pageMessage.set('Введите notaryId, чтобы смоделировать действие «Взять в работу».');
      return;
    }

    this.notaryOverride.set(buildParticipantFromId(rawId));
    this.statusOverride.set('В работе');
    this.pageMessage.set(
      `Нотариус ${rawId} назначен на заявку локально. После backend-интеграции вызов уйдёт в verifyAssessment.`,
    );
  }

  protected cancelOrder(): void {
    const reason = this.cancelReason().trim();

    if (!reason) {
      this.pageMessage.set('Для отмены заявки нужна причина.');
      return;
    }

    this.statusOverride.set('Отменена');
    this.pageMessage.set(`Заявка переведена в статус «Отменена». Причина: ${reason}.`);
  }

  protected resetLocalState(): void {
    this.statusOverride.set(null);
    this.notaryOverride.set(null);
    this.notaryDraft.set('');
    this.cancelReason.set('');
    this.pageMessage.set('Локальные изменения заявки сброшены.');
  }

  protected handleAuditSelection(event: AuditLogViewModel): void {
    this.pageMessage.set(`В order-аудите выбрано событие: ${event.action.title}.`);
  }

  protected handleAuditExport(request: AuditEntityFeedExportRequest): void {
    exportAuditEventsAsCsv(request.events, 'order-audit-feed');
    this.pageMessage.set(
      `Экспорт order-аудита собран: ${request.events.length} строк для ${request.entityId ?? this.order().id}.`,
    );
  }

  protected handleSecuritySelection(event: AuditLogViewModel): void {
    this.pageMessage.set(`В security-контексте заявки выбрано событие: ${event.action.title}.`);
  }

  protected handleSecurityFiltersChanged(filters: SecurityEventsFilters): void {
    const parts = [
      filters.ip ? `IP ${filters.ip}` : '',
      filters.user ? `пользователь ${filters.user}` : '',
      filters.dateFrom ? `с ${filters.dateFrom}` : '',
      filters.dateTo ? `по ${filters.dateTo}` : '',
    ].filter(Boolean);

    this.pageMessage.set(
      parts.length ? `Security-фильтры: ${parts.join(', ')}.` : this.securitySummary(),
    );
  }

  protected handleSecurityExport(request: SecurityEventsExportRequest): void {
    exportAuditEventsAsCsv(request.events, 'order-security-events');
    this.pageMessage.set(
      `Security-экспорт собран: ${request.events.length} строк, ${request.highlightedCount} в фокусе, ${request.recentCount} за 24ч.`,
    );
  }

  private asStatus(status: string): OrderStatus {
    return STATUS_OPTIONS.includes(status as OrderStatus)
      ? (status as OrderStatus)
      : this.order().status;
  }
}
