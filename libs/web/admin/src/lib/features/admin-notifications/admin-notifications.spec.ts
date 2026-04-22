import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminNotificationsComponent } from './admin-notifications';

describe('AdminNotificationsComponent', () => {
  let fixture: ComponentFixture<AdminNotificationsComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminNotificationsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminNotificationsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('renders the title', () => {
    expect(host.querySelector('[data-testid="notifications-title"]')?.textContent).toContain(
      'Уведомления',
    );
  });

  it('renders all mock notifications in the table', () => {
    const rows = host.querySelectorAll('[data-testid="notifications-body"] tr');
    expect(rows.length).toBeGreaterThanOrEqual(5);
  });

  it('toggleNotification sets a status message', () => {
    const component = fixture.componentInstance;
    component.toggleNotification('N-001');
    fixture.detectChanges();

    expect(component.statusMessage()).toContain('отключено');
  });

  it('toggleNotification switches status locally', () => {
    const component = fixture.componentInstance;
    const initial = component.notifications()[0].status;

    component.toggleNotification('N-001');
    fixture.detectChanges();

    const updated = component.notifications().find((n) => n.id === 'N-001');
    expect(updated?.status).not.toBe(initial);
  });
});
