import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminStatisticsComponent } from './admin-statistics';

describe('AdminStatisticsComponent', () => {
  let fixture: ComponentFixture<AdminStatisticsComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminStatisticsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminStatisticsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('renders the title', () => {
    expect(host.querySelector('[data-testid="statistics-title"]')?.textContent).toContain(
      'Метрики и отчёты',
    );
  });

  it('renders all five metric cards', () => {
    const metrics = host.querySelectorAll('.admin-statistics__metric');
    expect(metrics.length).toBe(5);
  });

  it('renders the last 10 reports in the table', () => {
    const rows = host.querySelectorAll('[data-testid="statistics-body"] tr');
    expect(rows.length).toBe(10);
  });

  it('downloadReport sets a status message', () => {
    const component = fixture.componentInstance;
    component.downloadReport('R-001');
    fixture.detectChanges();

    expect(component.statusMessage()).toContain('R-001');
  });
});
