import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { type AuditEntityFeedExportRequest } from '../../monitoring/audit-entity-feed';
import { exportAuditEventsAsCsv } from '../../monitoring/contracts/audit-export.utils';
import { AUDIT_LOGS_MOCK, type AuditLogViewModel } from '../../monitoring/models';
import {
  SecurityEventsComponent,
  type SecurityEventsExportRequest,
  type SecurityEventsFilters,
} from '../../monitoring/security-events';
import { UserLogsPanelComponent } from '../../monitoring/user-logs-panel';

type UserRole = 'Администратор' | 'Нотариус' | 'Заявитель';

interface UserSubscriptionSummary {
  planName: string;
  statusLabel: string;
  renewAt: string;
  volumeLabel: string;
}

interface UserOrderSummary {
  id: string;
  address: string;
  statusLabel: string;
  createdAt: string;
  amountLabel: string;
}

interface AdminUserDetailViewModel {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  isBlocked: boolean;
  registeredAt: string;
  lastSeenAt: string;
  city: string;
  note: string;
  tags: string[];
  subscription: UserSubscriptionSummary;
  orders: UserOrderSummary[];
}

const ROLE_OPTIONS: UserRole[] = ['Заявитель', 'Нотариус', 'Администратор'];

const USER_DETAILS: Record<string, AdminUserDetailViewModel> = {
  'U-1942': {
    id: 'U-1942',
    fullName: 'Марина Киселева',
    email: 'marina.kiseleva@notary.local',
    phone: '+7 (912) 555-18-24',
    role: 'Нотариус',
    isBlocked: false,
    registeredAt: '14 февраля 2026',
    lastSeenAt: '28 февраля 2026, 17:18',
    city: 'Екатеринбург',
    note: 'Профиль недавно переведен из заявителя в нотариусы, поэтому аудит и security-события особенно важны для ручной проверки.',
    tags: ['Новая роль', 'Документы проверены', 'Повышенный контроль'],
    subscription: {
      planName: 'Business Annual',
      statusLabel: 'Активна',
      renewAt: '14 февраля 2027',
      volumeLabel: 'Лимит: 120 заказов / месяц',
    },
    orders: [
      {
        id: 'A-88349',
        address: 'г. Екатеринбург, ул. Ленина, д. 52',
        statusLabel: 'В работе',
        createdAt: '28 февраля 2026',
        amountLabel: '2 500 ₽',
      },
      {
        id: 'A-88290',
        address: 'г. Тюмень, ул. Республики, д. 41',
        statusLabel: 'Проверена',
        createdAt: '25 февраля 2026',
        amountLabel: '1 800 ₽',
      },
    ],
  },
  'U-2011': {
    id: 'U-2011',
    fullName: 'Ирина Соколова',
    email: 'irina.sokolova@example.com',
    phone: '+7 (922) 700-44-18',
    role: 'Заявитель',
    isBlocked: true,
    registeredAt: '08 января 2026',
    lastSeenAt: '28 февраля 2026, 11:06',
    city: 'Москва',
    note: 'Для профиля сработало antifraud-правило. Карточка специально показывает и пользовательский аудит, и security-контекст без перехода в общий monitoring.',
    tags: ['Antifraud', 'Временная блокировка', 'Требует верификации'],
    subscription: {
      planName: 'Free',
      statusLabel: 'Ожидает верификации',
      renewAt: 'Без автопродления',
      volumeLabel: '1 активная заявка',
    },
    orders: [
      {
        id: 'A-88349',
        address: 'г. Екатеринбург, ул. Ленина, д. 52',
        statusLabel: 'В работе',
        createdAt: '28 февраля 2026',
        amountLabel: '2 500 ₽',
      },
    ],
  },
};

const normalizeToken = (value: string | undefined): string => value?.trim().toLowerCase() ?? '';

const normalizeId = (value: string | undefined): string => value?.trim().toUpperCase() ?? '';

const buildFallbackUser = (id: string): AdminUserDetailViewModel => {
  const normalizedId = normalizeId(id) || 'U-DEMO';

  return {
    id: normalizedId,
    fullName: 'Демо-пользователь',
    email: `${normalizedId.toLowerCase()}@demo.local`,
    phone: '+7 (900) 000-00-00',
    role: 'Заявитель',
    isBlocked: false,
    registeredAt: '01 марта 2026',
    lastSeenAt: '20 марта 2026, 09:00',
    city: 'Не указан',
    note: 'Для этого route-param нет специального mock-профиля, поэтому экран показывает универсальную карточку и те audit events, которые совпадут по id или email.',
    tags: ['Fallback route'],
    subscription: {
      planName: 'Demo',
      statusLabel: 'Не привязана',
      renewAt: 'Без данных',
      volumeLabel: 'Лимиты неизвестны',
    },
    orders: [],
  };
};

const matchesUserSecurityContext = (
  event: AuditLogViewModel,
  user: AdminUserDetailViewModel,
): boolean => {
  if (!event.security.isSecurityEvent) {
    return false;
  }

  const userId = normalizeId(user.id);
  const userEmail = normalizeToken(user.email);

  return (
    (event.entity.type === 'user' && normalizeId(event.entity.id) === userId) ||
    normalizeId(event.actor.id) === userId ||
    (!!userEmail && normalizeToken(event.actor.email) === userEmail)
  );
};

const getUserById = (id: string): AdminUserDetailViewModel =>
  USER_DETAILS[normalizeId(id)] ?? buildFallbackUser(id);

@Component({
  selector: 'lib-admin-user-detail',
  standalone: true,
  imports: [RouterLink, UserLogsPanelComponent, SecurityEventsComponent],
  templateUrl: './user-detail.html',
  styleUrl: './user-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUserDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly routeId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? 'U-1942')),
    { initialValue: 'U-1942' },
  );

  private readonly blockedOverride = signal<boolean | null>(null);
  private readonly roleOverride = signal<UserRole | null>(null);

  protected readonly roleOptions = ROLE_OPTIONS;
  protected readonly statusMessage = signal(
    'Карточка работает на локальных mock-данных, но экспорт и фильтрация уже настоящие для встроенных monitoring-панелей.',
  );
  protected readonly auditEvents = AUDIT_LOGS_MOCK;

  protected readonly user = computed(() => getUserById(this.routeId()));

  protected readonly currentRole = computed(() => this.roleOverride() ?? this.user().role);

  protected readonly isBlocked = computed(() => this.blockedOverride() ?? this.user().isBlocked);

  protected readonly statusLabel = computed(() => (this.isBlocked() ? 'Заблокирован' : 'Активен'));

  protected readonly statusTone = computed(() => (this.isBlocked() ? 'warning' : 'success'));

  protected readonly securityContextEvents = computed(() =>
    this.auditEvents.filter((event) => matchesUserSecurityContext(event, this.user())),
  );

  protected readonly securitySummary = computed(() => {
    const count = this.securityContextEvents().length;

    return count
      ? `${count} security-события уже привязаны к карточке ${this.user().id}.`
      : 'Связанных security-событий пока нет. Компонент остается встроенным и готов к реальным данным.';
  });

  protected readonly totalOrderLabel = computed(
    () => `${this.user().orders.length} заявки в карточке`,
  );

  protected updateRole(role: string): void {
    const nextRole = this.asRole(role);
    this.roleOverride.set(nextRole);
    this.statusMessage.set(
      `Роль локально переключена на «${nextRole}». Сохранение в backend появится на этапе 2.`,
    );
  }

  protected toggleBlocked(): void {
    const nextBlocked = !this.isBlocked();
    this.blockedOverride.set(nextBlocked);
    this.statusMessage.set(
      nextBlocked
        ? 'Пользователь помечен как заблокированный в текущем UI-сеансе.'
        : 'Локальная блокировка снята. После backend-интеграции здесь будет подтверждение действия.',
    );
  }

  protected resetLocalState(): void {
    this.blockedOverride.set(null);
    this.roleOverride.set(null);
    this.statusMessage.set('Локальные изменения карточки сброшены к исходному mock-state.');
  }

  protected handleAuditSelection(event: AuditLogViewModel): void {
    this.statusMessage.set(`В пользовательской ленте выбрано событие: ${event.action.title}.`);
  }

  protected handleAuditExport(request: AuditEntityFeedExportRequest): void {
    exportAuditEventsAsCsv(request.events, 'user-audit-feed');
    const target = request.entityEmail ?? request.entityId ?? this.user().id;
    this.statusMessage.set(
      `Экспорт user-аудита собран: ${request.events.length} строк (${target}).`,
    );
  }

  protected handleSecuritySelection(event: AuditLogViewModel): void {
    this.statusMessage.set(`В security-блоке выбрано событие: ${event.action.title}.`);
  }

  protected handleSecurityFiltersChanged(filters: SecurityEventsFilters): void {
    const parts = [
      filters.ip ? `IP ${filters.ip}` : '',
      filters.user ? `пользователь ${filters.user}` : '',
      filters.dateFrom ? `с ${filters.dateFrom}` : '',
      filters.dateTo ? `по ${filters.dateTo}` : '',
    ].filter(Boolean);

    this.statusMessage.set(
      parts.length ? `Security-фильтры: ${parts.join(', ')}.` : this.securitySummary(),
    );
  }

  protected handleSecurityExport(request: SecurityEventsExportRequest): void {
    exportAuditEventsAsCsv(request.events, 'user-security-events');
    this.statusMessage.set(
      `Security-экспорт собран: ${request.events.length} строк, ${request.highlightedCount} в фокусе, ${request.recentCount} за 24ч.`,
    );
  }

  private asRole(role: string): UserRole {
    return ROLE_OPTIONS.includes(role as UserRole) ? (role as UserRole) : this.user().role;
  }
}
