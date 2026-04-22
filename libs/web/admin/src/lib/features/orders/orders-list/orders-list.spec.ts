import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminOrdersListComponent } from './orders-list';

describe('AdminOrdersListComponent', () => {
  let fixture: ComponentFixture<AdminOrdersListComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminOrdersListComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminOrdersListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('renders the title and mock orders by default', () => {
    expect(host.querySelector('[data-testid="orders-list-title"]')?.textContent).toContain(
      'Заявки',
    );

    const rows = host.querySelectorAll('[data-testid="orders-list-body"] tr');
    expect(rows.length).toBeGreaterThanOrEqual(5);
  });

  it('filters orders by free-text search on id/address/applicant', async () => {
    const input = host.querySelector<HTMLInputElement>('[data-testid="orders-list-search"]');

    if (!input) {
      throw new Error('search input not found');
    }

    input.value = 'екатеринбург';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const rows = host.querySelectorAll('[data-testid="orders-list-body"] tr');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('A-88349');
  });

  it('filters orders by status', async () => {
    const select = host.querySelector<HTMLSelectElement>('select');

    if (!select) {
      throw new Error('status select not found');
    }

    select.value = 'Отменена';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const rows = host.querySelectorAll('[data-testid="orders-list-body"] tr');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('A-88357');
  });

  it('links each row to its detail route', () => {
    const rowLink = host.querySelector<HTMLAnchorElement>(
      '[data-testid="orders-list-body"] tr a[href*="/admin/orders/"]',
    );

    expect(rowLink?.getAttribute('href')).toMatch(/\/admin\/orders\//);
  });
});
