import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

interface SystemSettings {
  portalName: string;
  slaThresholdHours: number;
  dailyOrderLimit: number;
  supportEmail: string;
  maintenanceMode: boolean;
}

const DEFAULT_SETTINGS: SystemSettings = {
  portalName: 'Нотариальный портал',
  slaThresholdHours: 24,
  dailyOrderLimit: 50,
  supportEmail: 'support@notary-portal.example.com',
  maintenanceMode: false,
};

@Component({
  selector: 'lib-admin-settings',
  standalone: true,
  templateUrl: './admin-settings.html',
  styleUrl: './admin-settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSettingsComponent {
  protected readonly settings = signal<SystemSettings>({ ...DEFAULT_SETTINGS });
  protected readonly savedMessage = signal('');
  protected readonly hasChanges = signal(false);

  protected updateField<K extends keyof SystemSettings>(key: K, value: SystemSettings[K]): void {
    this.settings.update((current) => ({ ...current, [key]: value }));
    this.hasChanges.set(true);
    this.savedMessage.set('');
  }

  protected saveLocally(): void {
    this.savedMessage.set(
      'Настройки сохранены локально. Backend-синхронизация будет добавлена на этапе интеграции.',
    );
    this.hasChanges.set(false);
  }

  protected resetSettings(): void {
    this.settings.set({ ...DEFAULT_SETTINGS });
    this.savedMessage.set('Настройки сброшены к значениям по умолчанию.');
    this.hasChanges.set(false);
  }

  protected isCheckbox(key: string): boolean {
    return key === 'maintenanceMode';
  }
}
