import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

type NotificationChannel = 'push' | 'email' | 'sms';
type NotificationStatus = 'enabled' | 'disabled';

interface NotificationRow {
  id: string;
  channel: NotificationChannel;
  subject: string;
  trigger: string;
  status: NotificationStatus;
  lastFiredAt: string | null;
}

const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  push: 'Push',
  email: 'Email',
  sms: 'SMS',
};

const NOTIFICATIONS_MOCK: NotificationRow[] = [
  {
    id: 'N-001',
    channel: 'email',
    subject: 'Подтверждение заявки',
    trigger: 'Заявка создана',
    status: 'enabled',
    lastFiredAt: '28 февраля 2026, 14:05',
  },
  {
    id: 'N-002',
    channel: 'email',
    subject: 'Назначен нотариус',
    trigger: 'Нотариус назначен',
    status: 'enabled',
    lastFiredAt: '28 февраля 2026, 12:40',
  },
  {
    id: 'N-003',
    channel: 'push',
    subject: 'Заявка проверена',
    trigger: 'Заявка одобрена',
    status: 'enabled',
    lastFiredAt: '25 февраля 2026, 09:20',
  },
  {
    id: 'N-004',
    channel: 'sms',
    subject: 'Код верификации',
    trigger: 'Запрос кода',
    status: 'enabled',
    lastFiredAt: '28 февраля 2026, 16:20',
  },
  {
    id: 'N-005',
    channel: 'email',
    subject: 'Напоминание об оплате',
    trigger: 'Просрочка оплаты',
    status: 'enabled',
    lastFiredAt: '27 февраля 2026, 10:00',
  },
  {
    id: 'N-006',
    channel: 'email',
    subject: 'Итоги дня',
    trigger: 'Ежедневная рассылка',
    status: 'disabled',
    lastFiredAt: '26 февраля 2026, 20:00',
  },
  {
    id: 'N-007',
    channel: 'push',
    subject: 'Новое сообщение',
    trigger: 'Новое сообщение в чате',
    status: 'enabled',
    lastFiredAt: '28 февраля 2026, 15:58',
  },
];

@Component({
  selector: 'lib-admin-notifications',
  standalone: true,
  templateUrl: './admin-notifications.html',
  styleUrl: './admin-notifications.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminNotificationsComponent {
  protected readonly channelLabels = CHANNEL_LABELS;
  protected readonly notifications = signal<NotificationRow[]>([...NOTIFICATIONS_MOCK]);
  protected readonly statusMessage = signal('');

  protected readonly enabledCount = signal(
    NOTIFICATIONS_MOCK.filter((n) => n.status === 'enabled').length,
  );

  protected channelBadgeTone(channel: NotificationChannel): string {
    switch (channel) {
      case 'push':
        return 'accent';
      case 'email':
        return 'success';
      case 'sms':
        return 'warning';
    }
  }

  protected toggleNotification(id: string): void {
    this.notifications.update((current) =>
      current.map((row) =>
        row.id === id ? { ...row, status: row.status === 'enabled' ? 'disabled' : 'enabled' } : row,
      ),
    );

    const updated = this.notifications().find((n) => n.id === id);
    if (updated) {
      this.statusMessage.set(
        `Уведомление «${updated.subject}» ${updated.status === 'enabled' ? 'включено' : 'отключено'}.`,
      );
    }
  }
}
