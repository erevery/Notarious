import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminUsersListComponent } from './users-list';

describe('AdminUsersListComponent', () => {
  let fixture: ComponentFixture<AdminUsersListComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminUsersListComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminUsersListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('renders the title and all mock users by default', () => {
    expect(host.querySelector('[data-testid="users-list-title"]')?.textContent).toContain(
      'Пользователи',
    );

    const rows = host.querySelectorAll('[data-testid="users-list-body"] tr');
    expect(rows.length).toBeGreaterThanOrEqual(5);
  });

  it('filters users by free-text search on name/email/id', async () => {
    const input = host.querySelector<HTMLInputElement>('[data-testid="users-list-search"]');

    if (!input) {
      throw new Error('search input not found');
    }

    input.value = 'ирина';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const rows = host.querySelectorAll('[data-testid="users-list-body"] tr');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('Ирина Соколова');
  });

  it('navigates to detail route from a row link', () => {
    const rowLink = host.querySelector<HTMLAnchorElement>(
      '[data-testid="users-list-body"] a[href]',
    );

    expect(rowLink?.getAttribute('href')).toMatch(/\/admin\/users\//);
  });
});
