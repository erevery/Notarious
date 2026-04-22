import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

type Segment = 'all' | 'notaries' | 'applicants';

interface SentEmail {
  id: string;
  subject: string;
  segment: Segment;
  sentAt: string;
  recipientCount: number;
}

const SEGMENT_LABELS: Record<Segment, string> = {
  all: 'Все пользователи',
  notaries: 'Нотариусы',
  applicants: 'Заявители',
};

const SENT_EMAILS_MOCK: readonly SentEmail[] = [
  {
    id: 'E-001',
    subject: 'Обновление условий подписки на 2026 год',
    segment: 'notaries',
    sentAt: '14 февраля 2026, 10:00',
    recipientCount: 284,
  },
  {
    id: 'E-002',
    subject: 'Новые возможности платформы для заявителей',
    segment: 'applicants',
    sentAt: '01 февраля 2026, 09:00',
    recipientCount: 1203,
  },
  {
    id: 'E-003',
    subject: 'Итоги работы портала за 2025 год',
    segment: 'all',
    sentAt: '15 января 2026, 11:00',
    recipientCount: 1890,
  },
  {
    id: 'E-004',
    subject: 'Техническое обслуживание 28 января',
    segment: 'all',
    sentAt: '26 января 2026, 14:00',
    recipientCount: 1890,
  },
  {
    id: 'E-005',
    subject: 'Вебинар для нотариусов: практические кейсы',
    segment: 'notaries',
    sentAt: '10 декабря 2025, 15:00',
    recipientCount: 278,
  },
];

@Component({
  selector: 'lib-admin-newsletter',
  standalone: true,
  templateUrl: './admin-newsletter.html',
  styleUrl: './admin-newsletter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminNewsletterComponent {
  protected readonly segmentOptions: readonly Segment[] = ['all', 'notaries', 'applicants'];
  protected readonly segmentLabels = SEGMENT_LABELS;
  protected readonly subject = signal('');
  protected readonly segment = signal<Segment>('all');
  protected readonly body = signal('');
  protected readonly sentEmails = signal<readonly SentEmail[]>(SENT_EMAILS_MOCK);
  protected readonly savedMessage = signal('');

  protected readonly preview = computed(() => {
    const s = this.subject();
    const b = this.body();
    const seg = this.segmentLabels[this.segment()];

    if (!s && !b) {
      return 'Предпросмотр будет доступен после заполнения формы.';
    }

    return `[${seg}]\nТема: ${s || '(без темы)'}\n\n${b || '(пустое письмо)'}`;
  });

  protected readonly segmentCount = computed(() => {
    switch (this.segment()) {
      case 'notaries':
        return 284;
      case 'applicants':
        return 1203;
      case 'all':
        return 1890;
    }
  });

  protected updateSubject(value: string): void {
    this.subject.set(value);
  }

  protected updateSegment(value: string): void {
    const next = this.segmentOptions.includes(value as Segment) ? (value as Segment) : 'all';
    this.segment.set(next);
  }

  protected updateBody(value: string): void {
    this.body.set(value);
  }

  protected saveDraft(): void {
    this.savedMessage.set(
      `Черновик сохранен: «${this.subject() || 'без темы'}». Отправка будет доступна после подключения backend.`,
    );
  }

  protected labelForSegment(segment: Segment): string {
    return SEGMENT_LABELS[segment] ?? segment;
  }
}
