import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

type FileStatus = 'На модерации' | 'Проверено' | 'Отклонено';
type FileType = 'PDF' | 'Изображение';

interface FileModerationRow {
  id: string;
  name: string;
  type: FileType;
  orderId: string;
  uploadedById: string;
  uploadedByName: string;
  uploadedAt: string;
  status: FileStatus;
}

const STATUS_OPTIONS: readonly (FileStatus | 'Все')[] = [
  'Все',
  'На модерации',
  'Проверено',
  'Отклонено',
];

const FILES_MOCK: readonly FileModerationRow[] = [
  {
    id: 'F-001',
    name: 'Паспорт_Иванов_И.pdf',
    type: 'PDF',
    orderId: 'A-88349',
    uploadedById: 'U-2011',
    uploadedByName: 'Ирина Соколова',
    uploadedAt: '28 февраля 2026, 14:22',
    status: 'На модерации',
  },
  {
    id: 'F-002',
    name: 'Договор_купли_продажи.pdf',
    type: 'PDF',
    orderId: 'A-88290',
    uploadedById: 'U-1942',
    uploadedByName: 'Марина Киселева',
    uploadedAt: '27 февраля 2026, 09:55',
    status: 'Проверено',
  },
  {
    id: 'F-003',
    name: 'Фото_объекта_2026.jpg',
    type: 'Изображение',
    orderId: 'A-88412',
    uploadedById: 'U-2188',
    uploadedByName: 'Ольга Павлова',
    uploadedAt: '28 февраля 2026, 15:30',
    status: 'На модерации',
  },
  {
    id: 'F-004',
    name: 'Справка_об_отсутствии_обременений.pdf',
    type: 'PDF',
    orderId: 'A-88101',
    uploadedById: 'U-2234',
    uploadedByName: 'Наталья Гришина',
    uploadedAt: '26 февраля 2026, 11:15',
    status: 'Отклонено',
  },
  {
    id: 'F-005',
    name: 'Схема_расположения_земельного_участка.jpg',
    type: 'Изображение',
    orderId: 'A-88357',
    uploadedById: 'U-2037',
    uploadedByName: 'Егор Лунев',
    uploadedAt: '27 февраля 2026, 18:05',
    status: 'Проверено',
  },
  {
    id: 'F-006',
    name: 'Нотариальная_доверенность.pdf',
    type: 'PDF',
    orderId: 'A-88420',
    uploadedById: 'U-1500',
    uploadedByName: 'Денис Алексеев',
    uploadedAt: '28 февраля 2026, 16:00',
    status: 'На модерации',
  },
  {
    id: 'F-007',
    name: 'Выписка_из_ЕГРН.pdf',
    type: 'PDF',
    orderId: 'A-88433',
    uploadedById: 'U-2011',
    uploadedByName: 'Ирина Соколова',
    uploadedAt: '28 февраля 2026, 16:40',
    status: 'На модерации',
  },
];

const normalizeToken = (value: string): string => value.trim().toLowerCase();

@Component({
  selector: 'lib-admin-files',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-files.html',
  styleUrl: './admin-files.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminFilesComponent {
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly searchQuery = signal('');
  protected readonly statusFilter = signal<(typeof STATUS_OPTIONS)[number]>('Все');
  protected readonly files = signal<readonly FileModerationRow[]>(FILES_MOCK);

  protected readonly filteredFiles = computed(() => {
    const query = normalizeToken(this.searchQuery());
    const status = this.statusFilter();

    return this.files().filter((row) => {
      const matchesStatus = status === 'Все' || row.status === status;

      if (!matchesStatus) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        normalizeToken(row.name).includes(query) ||
        normalizeToken(row.id).includes(query) ||
        normalizeToken(row.uploadedByName).includes(query)
      );
    });
  });

  protected readonly totalLabel = computed(() => {
    const visible = this.filteredFiles().length;
    const total = this.files().length;
    return visible === total ? `${total} файлов в каталоге` : `${visible} из ${total} файлов`;
  });

  protected readonly pendingCount = computed(
    () => this.files().filter((row) => row.status === 'На модерации').length,
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

  protected acceptFile(id: string): void {
    this.files.update((current) =>
      current.map((row) => (row.id === id ? { ...row, status: 'Проверено' as FileStatus } : row)),
    );
    this.statusMessage.set(`Файл ${id} одобрен и переведен в статус «Проверено».`);
  }

  protected rejectFile(id: string): void {
    this.files.update((current) =>
      current.map((row) => (row.id === id ? { ...row, status: 'Отклонено' as FileStatus } : row)),
    );
    this.statusMessage.set(`Файл ${id} отклонен и переведен в статус «Отклонено».`);
  }

  protected statusTone(status: FileStatus): 'accent' | 'success' | 'warning' {
    switch (status) {
      case 'На модерации':
        return 'accent';
      case 'Проверено':
        return 'success';
      case 'Отклонено':
        return 'warning';
    }
  }
}
