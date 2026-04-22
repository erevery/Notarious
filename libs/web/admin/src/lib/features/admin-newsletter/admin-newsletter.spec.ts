import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminNewsletterComponent } from './admin-newsletter';

describe('AdminNewsletterComponent', () => {
  let fixture: ComponentFixture<AdminNewsletterComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminNewsletterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminNewsletterComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('renders the title', () => {
    expect(host.querySelector('[data-testid="newsletter-title"]')?.textContent).toContain(
      'Рассылка',
    );
  });

  it('renders the form fields', () => {
    expect(host.querySelector('[data-testid="newsletter-subject"]')).toBeTruthy();
    expect(host.querySelector('[data-testid="newsletter-body"]')).toBeTruthy();
  });

  it('preview updates reactively from form input', async () => {
    const component = fixture.componentInstance;
    component.updateSubject('Тестовая тема');
    component.updateBody('Тестовое тело письма');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const preview = host.querySelector('[data-testid="newsletter-preview"]');
    expect(preview?.textContent).toContain('Тестовая тема');
    expect(preview?.textContent).toContain('Тестовое тело письма');
  });

  it('saveDraft sets a saved message', () => {
    const component = fixture.componentInstance;
    component.updateSubject('Тест');
    component.saveDraft();
    fixture.detectChanges();

    expect(component.savedMessage()).toContain('Черновик сохранен');
  });

  it('renders all mock sent emails in history', () => {
    const rows = host.querySelectorAll('[data-testid="newsletter-history-body"] tr');
    expect(rows.length).toBeGreaterThanOrEqual(5);
  });
});
