import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminSettingsComponent } from './admin-settings';

describe('AdminSettingsComponent', () => {
  let fixture: ComponentFixture<AdminSettingsComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminSettingsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminSettingsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('renders the title', () => {
    expect(host.querySelector('[data-testid="settings-title"]')?.textContent).toContain(
      'Настройки системы',
    );
  });

  it('renders all form fields with default values', () => {
    expect(
      host.querySelector<HTMLInputElement>('[data-testid="settings-portal-name"]')?.value,
    ).toContain('Нотариальный портал');
    expect(
      host.querySelector<HTMLInputElement>('[data-testid="settings-sla-threshold"]')?.value,
    ).toBe('24');
    expect(
      host.querySelector<HTMLInputElement>('[data-testid="settings-daily-limit"]')?.value,
    ).toBe('50');
  });

  it('saveLocally sets a saved message', () => {
    const component = fixture.componentInstance;
    component.saveLocally();
    fixture.detectChanges();

    expect(component.savedMessage()).toContain('сохранены');
  });

  it('resetSettings restores default values', () => {
    const component = fixture.componentInstance;
    component.updateField('portalName', 'Новый портал');
    component.resetSettings();
    fixture.detectChanges();

    expect(component.settings().portalName).toBe('Нотариальный портал');
  });
});
