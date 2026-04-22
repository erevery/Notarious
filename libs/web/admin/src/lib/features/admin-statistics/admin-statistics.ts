import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

interface MetricCard {
  label: string;
  value: string;
  trend: string;
  tone: 'accent' | 'success' | 'warning';
}

interface ReportRow {
  id: string;
  name: string;
  period: string;
  author: string;
  sizeLabel: string;
  createdAt: string;
}

const METRICS: readonly MetricCard[] = [
  {
    label: 'Заявок за сутки',
    value: '14',
    trend: '+3 к вчера',
    tone: 'accent',
  },
  {
    label: 'Заявок за неделю',
    value: '78',
    trend: '+12 к прошлой',
    tone: 'accent',
  },
  {
    label: 'Заявок за месяц',
    value: '312',
    trend: '+24 к прошлому',
    tone: 'accent',
  },
  {
    label: 'Conversion',
    value: '67%',
    trend: '+2.3 п.п.',
    tone: 'success',
  },
  {
    label: 'Avg resolution',
    value: '18.4 ч',
    trend: '-1.2 ч к прошлой неделе',
    tone: 'success',
  },
];

const REPORTS_MOCK: readonly ReportRow[] = [
  {
    id: 'R-001',
    name: 'Еженедельный отчет по заявкам',
    period: '16 — 22 февраля 2026',
    author: 'Денис Алексеев',
    sizeLabel: '1.2 МБ',
    createdAt: '22 февраля 2026, 18:00',
  },
  {
    id: 'R-002',
    name: 'Отчет по подпискам за январь',
    period: 'Январь 2026',
    author: 'Денис Алексеев',
    sizeLabel: '840 КБ',
    createdAt: '01 февраля 2026, 10:00',
  },
  {
    id: 'R-003',
    name: 'Метрики конверсии за квартал',
    period: 'Q4 2025',
    author: 'Денис Алексеев',
    sizeLabel: '2.4 МБ',
    createdAt: '15 января 2026, 09:30',
  },
  {
    id: 'R-004',
    name: 'Security-события за месяц',
    period: 'Декабрь 2025',
    author: 'Денис Алексеев',
    sizeLabel: '620 КБ',
    createdAt: '31 декабря 2025, 23:59',
  },
  {
    id: 'R-005',
    name: 'География заявок за ноябрь',
    period: 'Ноябрь 2025',
    author: 'Денис Алексеев',
    sizeLabel: '1.8 МБ',
    createdAt: '30 ноября 2025, 17:00',
  },
  {
    id: 'R-006',
    name: 'Финансовый отчет за октябрь',
    period: 'Октябрь 2025',
    author: 'Денис Алексеев',
    sizeLabel: '2.1 МБ',
    createdAt: '01 ноября 2025, 08:00',
  },
  {
    id: 'R-007',
    name: 'Активность нотариусов за сентябрь',
    period: 'Сентябрь 2025',
    author: 'Денис Алексеев',
    sizeLabel: '1.5 МБ',
    createdAt: '30 сентября 2025, 14:00',
  },
  {
    id: 'R-008',
    name: 'Анализ SLA за август',
    period: 'Август 2025',
    author: 'Денис Алексеев',
    sizeLabel: '980 КБ',
    createdAt: '31 августа 2025, 12:00',
  },
  {
    id: 'R-009',
    name: 'Отчет по платежам за июль',
    period: 'Июль 2025',
    author: 'Денис Алексеев',
    sizeLabel: '1.1 МБ',
    createdAt: '31 июля 2025, 16:00',
  },
  {
    id: 'R-010',
    name: 'Итоговый отчет за первое полугодие',
    period: 'Январь — Июнь 2025',
    author: 'Денис Алексеев',
    sizeLabel: '4.7 МБ',
    createdAt: '01 июля 2025, 10:00',
  },
];

@Component({
  selector: 'lib-admin-statistics',
  standalone: true,
  templateUrl: './admin-statistics.html',
  styleUrl: './admin-statistics.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminStatisticsComponent {
  protected readonly metrics = METRICS;
  protected readonly reports = signal<readonly ReportRow[]>(REPORTS_MOCK);
  protected readonly statusMessage = signal('');

  protected readonly recentReports = computed(() => this.reports().slice(0, 10));

  protected metricTone(index: number): string {
    return METRICS[index]?.tone ?? 'accent';
  }

  protected downloadReport(id: string): void {
    this.statusMessage.set(`Загрузка отчета ${id} начнется после подключения backend.`);
  }
}
