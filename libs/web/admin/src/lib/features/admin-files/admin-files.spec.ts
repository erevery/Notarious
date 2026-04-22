import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminFilesComponent } from './admin-files';

describe('AdminFilesComponent', () => {
  let fixture: ComponentFixture<AdminFilesComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminFilesComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminFilesComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('renders the title', () => {
    expect(host.querySelector('[data-testid="files-title"]')?.textContent).toContain(
      'Модерация файлов',
    );
  });

  it('renders all mock files in the table body', () => {
    const rows = host.querySelectorAll('[data-testid="files-body"] tr');
    expect(rows.length).toBeGreaterThanOrEqual(5);
  });

  it('filters files by search on name', async () => {
    const input = host.querySelector<HTMLInputElement>('[data-testid="files-search"]');

    if (!input) {
      throw new Error('search input not found');
    }

    input.value = 'паспорт';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const rows = host.querySelectorAll('[data-testid="files-body"] tr');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('Паспорт');
  });

  it('acceptFile updates the row status', () => {
    const component = fixture.componentInstance;
    component.acceptFile('F-001');
    fixture.detectChanges();

    expect(component.statusMessage()).toContain('F-001 одобрен');
  });

  it('rejectFile updates the row status', () => {
    const component = fixture.componentInstance;
    component.rejectFile('F-001');
    fixture.detectChanges();

    expect(component.statusMessage()).toContain('F-001 отклонен');
  });
});
