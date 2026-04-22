import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminPaymentsComponent } from './admin-payments';

describe('AdminPaymentsComponent', () => {
  let fixture: ComponentFixture<AdminPaymentsComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPaymentsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminPaymentsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('renders the title', () => {
    expect(host.querySelector('[data-testid="payments-title"]')?.textContent).toContain('Платежи');
  });

  it('renders all mock payments in the table body', () => {
    const rows = host.querySelectorAll('[data-testid="payments-body"] tr');
    expect(rows.length).toBeGreaterThanOrEqual(5);
  });

  it('filters payments by search on id', async () => {
    const input = host.querySelector<HTMLInputElement>('[data-testid="payments-search"]');

    if (!input) {
      throw new Error('search input not found');
    }

    input.value = 'PAY-002';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const rows = host.querySelectorAll('[data-testid="payments-body"] tr');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('PAY-002');
  });

  it('refundPayment updates the row status', () => {
    const component = fixture.componentInstance;
    component.refundPayment('PAY-001');
    fixture.detectChanges();

    expect(component.statusMessage()).toContain('PAY-001 возвращен');
  });
});
