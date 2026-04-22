import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

type UserRole = 'Администратор' | 'Нотариус' | 'Заявитель';

type UserStatus = 'Активен' | 'Заблокирован' | 'Ожидает верификации';

interface UserListRow {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  city: string;
  status: UserStatus;
  lastSeenAt: string;
  subscriptionLabel: string;
}

const ROLE_OPTIONS: readonly (UserRole | 'Все')[] = [
  'Все',
  'Заявитель',
  'Нотариус',
  'Администратор',
];

const USERS_LIST: readonly UserListRow[] = [
  {
    id: 'U-1942',
    fullName: 'Марина Киселева',
    email: 'marina.kiseleva@notary.local',
    role: 'Нотариус',
    city: 'Екатеринбург',
    status: 'Активен',
    lastSeenAt: '28 февраля 2026, 17:18',
    subscriptionLabel: 'Business Annual',
  },
  {
    id: 'U-2011',
    fullName: 'Ирина Соколова',
    email: 'irina.sokolova@example.com',
    role: 'Заявитель',
    city: 'Москва',
    status: 'Заблокирован',
    lastSeenAt: '28 февраля 2026, 11:06',
    subscriptionLabel: 'Free',
  },
  {
    id: 'U-2037',
    fullName: 'Егор Лунев',
    email: 'elunev@example.com',
    role: 'Заявитель',
    city: 'Санкт-Петербург',
    status: 'Активен',
    lastSeenAt: '27 февраля 2026, 22:41',
    subscriptionLabel: 'Standard',
  },
  {
    id: 'U-2109',
    fullName: 'Анастасия Е.',
    email: 'notary@notary.local',
    role: 'Нотариус',
    city: 'Тюмень',
    status: 'Активен',
    lastSeenAt: '28 февраля 2026, 09:12',
    subscriptionLabel: 'Business',
  },
  {
    id: 'U-1500',
    fullName: 'Денис Алексеев',
    email: 'd.alexeev@admin.local',
    role: 'Администратор',
    city: 'Москва',
    status: 'Активен',
    lastSeenAt: '28 февраля 2026, 18:02',
    subscriptionLabel: 'Internal',
  },
  {
    id: 'U-2188',
    fullName: 'Ольга Павлова',
    email: 'olga.p@example.com',
    role: 'Заявитель',
    city: 'Казань',
    status: 'Ожидает верификации',
    lastSeenAt: '26 февраля 2026, 14:30',
    subscriptionLabel: 'Free',
  },
  {
    id: 'U-2203',
    fullName: 'Тимур Хабиров',
    email: 't.habirov@notary.local',
    role: 'Нотариус',
    city: 'Уфа',
    status: 'Активен',
    lastSeenAt: '28 февраля 2026, 12:55',
    subscriptionLabel: 'Business Annual',
  },
  {
    id: 'U-2234',
    fullName: 'Наталья Гришина',
    email: 'ngrishina@example.com',
    role: 'Заявитель',
    city: 'Новосибирск',
    status: 'Активен',
    lastSeenAt: '27 февраля 2026, 19:48',
    subscriptionLabel: 'Standard',
  },
];

const normalizeToken = (value: string): string => value.trim().toLowerCase();

@Component({
  selector: 'lib-admin-users-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './users-list.html',
  styleUrl: './users-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsersListComponent {
  protected readonly roleOptions = ROLE_OPTIONS;
  protected readonly searchQuery = signal('');
  protected readonly roleFilter = signal<(typeof ROLE_OPTIONS)[number]>('Все');

  protected readonly users = signal<readonly UserListRow[]>(USERS_LIST);

  protected readonly filteredUsers = computed(() => {
    const query = normalizeToken(this.searchQuery());
    const role = this.roleFilter();

    return this.users().filter((row) => {
      const matchesRole = role === 'Все' || row.role === role;

      if (!matchesRole) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        normalizeToken(row.fullName).includes(query) ||
        normalizeToken(row.email).includes(query) ||
        normalizeToken(row.id).includes(query) ||
        normalizeToken(row.city).includes(query)
      );
    });
  });

  protected readonly totalLabel = computed(() => {
    const visible = this.filteredUsers().length;
    const total = this.users().length;

    return visible === total
      ? `${total} пользователей в каталоге`
      : `${visible} из ${total} пользователей`;
  });

  protected readonly blockedCount = computed(
    () => this.users().filter((row) => row.status === 'Заблокирован').length,
  );

  protected readonly notaryCount = computed(
    () => this.users().filter((row) => row.role === 'Нотариус').length,
  );

  protected updateSearch(value: string): void {
    this.searchQuery.set(value);
  }

  protected updateRoleFilter(value: string): void {
    const next = ROLE_OPTIONS.find((option) => option === value) ?? 'Все';
    this.roleFilter.set(next);
  }

  protected resetFilters(): void {
    this.searchQuery.set('');
    this.roleFilter.set('Все');
  }

  protected statusTone(row: UserListRow): 'success' | 'warning' | 'neutral' {
    if (row.status === 'Заблокирован') {
      return 'warning';
    }

    if (row.status === 'Ожидает верификации') {
      return 'neutral';
    }

    return 'success';
  }
}
