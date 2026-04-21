import { type AuditLogViewModel } from '../models';

const CSV_HEADER = [
  'Дата',
  'Время',
  'Пользователь',
  'Email',
  'Роль',
  'Действие',
  'Объект',
  'Источник',
  'Уровень',
  'Событие безопасности',
];

const toCsvValue = (value: unknown): string => `"${String(value).replaceAll('"', '""')}"`;

export function exportAuditEventsAsCsv(rows: AuditLogViewModel[], filePrefix: string): void {
  const csvRows = rows.map((event) => [
    event.display.dateLabel,
    event.display.timeLabel,
    event.actor.name,
    event.actor.email,
    event.actor.role,
    event.action.title,
    event.entity.title,
    event.source.name,
    event.severity.label,
    event.security.isSecurityEvent ? 'Да' : 'Нет',
  ]);

  const csv = [CSV_HEADER, ...csvRows]
    .map((row) => row.map((cell) => toCsvValue(cell)).join(';'))
    .join('\n');

  if (typeof document === 'undefined') {
    return;
  }

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
