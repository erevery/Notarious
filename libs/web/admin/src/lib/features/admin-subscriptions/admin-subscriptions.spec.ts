import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminSubscriptionsComponent } from './admin-subscriptions';

describe('AdminSubscriptionsComponent', () => {
  let fixture: ComponentFixture<AdminSubscriptionsComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminSubscriptionsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminSubscriptionsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('renders the title', () => {
    expect(host.querySelector('[data-testid="subscriptions-title"]')?.textContent).toContain(
      'Подписки',
    );
  });

  it('renders all mock subscriptions in the table body', () => {
    const rows = host.querySelectorAll('[data-testid="subscriptions-body"] tr');
    expect(rows.length).toBeGreaterThanOrEqual(5);
  });

  it('filters subscriptions by search on user name', async () => {
    const input = host.querySelector<HTMLInputElement>('[data-testid="subscriptions-search"]');

    if (!input) {
      throw new Error('search input not found');
    }

    input.value = 'марина';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const rows = host.querySelectorAll('[data-testid="subscriptions-body"] tr');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('Марина Киселева');
  });

  it('navigates to user detail from a row link', () => {
    const rowLink = host.querySelector<HTMLAnchorElement>(
      '[data-testid="subscriptions-body"] a[href]',
    );

    expect(rowLink?.getAttribute('href')).toMatch(/\/admin\/users\//);
  });
});
