import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard';

describe('AdminDashboardComponent', () => {
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('renders the title', () => {
    expect(host.querySelector('[data-testid="dashboard-title"]')?.textContent).toContain(
      'администратор',
    );
  });

  it('renders all four metric cards', () => {
    const metrics = host.querySelectorAll('.admin-dashboard__metric');
    expect(metrics.length).toBe(4);
  });

  it('renders all quick links', () => {
    const links = host.querySelectorAll('.admin-dashboard__link');
    expect(links.length).toBe(4);
  });

  it('quick links navigate to correct routes', () => {
    const hrefs = Array.from(host.querySelectorAll('.admin-dashboard__link')).map((el) =>
      (el as HTMLAnchorElement).getAttribute('href'),
    );

    expect(hrefs).toContain('/admin/users');
    expect(hrefs).toContain('/admin/orders');
    expect(hrefs).toContain('/admin/monitoring');
    expect(hrefs).toContain('/admin/files');
  });
});
