import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface DashboardMetric {
  label: string;
  value: number;
  tone: 'accent' | 'warning' | 'neutral';
  description: string;
}

interface QuickLink {
  label: string;
  href: string;
  icon: string;
}

const METRICS: readonly DashboardMetric[] = [
  {
    label: 'Заявок в работе',
    value: 3,
    tone: 'accent',
    description: 'Активные заявки у нотариусов прямо сейчас',
  },
  {
    label: 'Заблокированные пользователи',
    value: 1,
    tone: 'warning',
    description: 'Профили с ограниченным доступом',
  },
  {
    label: 'Файлы на модерации',
    value: 7,
    tone: 'accent',
    description: 'Ожидают проверки перед утверждением',
  },
  {
    label: 'Security-события за 24 ч',
    value: 12,
    tone: 'warning',
    description: 'Неподтвержденные события в журнале',
  },
];

const QUICK_LINKS: readonly QuickLink[] = [
  { label: 'Пользователи', href: '/admin/users', icon: 'users' },
  { label: 'Заявки', href: '/admin/orders', icon: 'orders' },
  { label: 'Мониторинг', href: '/admin/monitoring', icon: 'monitoring' },
  { label: 'Файлы', href: '/admin/files', icon: 'files' },
];

@Component({
  selector: 'lib-admin-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent {
  protected readonly metrics = METRICS;
  protected readonly quickLinks = QUICK_LINKS;
  protected readonly greeting = signal(this.buildGreeting());

  private buildGreeting(): string {
    const hour = new Date().getHours();

    if (hour < 6) {
      return 'Доброй ночи';
    }
    if (hour < 12) {
      return 'Доброе утро';
    }
    if (hour < 18) {
      return 'Добрый день';
    }

    return 'Добрый вечер';
  }

  protected metricTone(index: number): string {
    return METRICS[index]?.tone ?? 'neutral';
  }
}
