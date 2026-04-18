import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ENTITY_AUDIT_LOG_FIXTURES,
  ORDER_AUDIT_LOG_FIXTURES,
  USER_AUDIT_LOG_FIXTURES,
} from '../fixtures';
import { AuditEntityFeedComponent, type AuditEntityFeedExportRequest } from './audit-entity-feed';

describe('AuditEntityFeedComponent', () => {
  let fixture: ComponentFixture<AuditEntityFeedComponent>;
  let component: AuditEntityFeedComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditEntityFeedComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditEntityFeedComponent);
    component = fixture.componentInstance;
  });

  async function setRequiredInputs(): Promise<void> {
    fixture.componentRef.setInput('entityType', 'user');
    fixture.componentRef.setInput('entityEmail', 'seed-user-000@seed.local');
    fixture.componentRef.setInput('events', ENTITY_AUDIT_LOG_FIXTURES);
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('error', null);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('renders filtered events for the selected entity', async () => {
    await setRequiredInputs();

    const host = fixture.nativeElement as HTMLElement;
    const renderedEvents = host.querySelectorAll('[data-testid="feed-event"]');

    expect(host.querySelector('[data-testid="feed-title"]')?.textContent).toContain(
      'Лента аудита пользователя',
    );
    expect(host.querySelector('[data-testid="feed-count"]')?.textContent).toContain('3 события');
    expect(renderedEvents).toHaveLength(3);
    expect(host.textContent).toContain('Пользователь seed-user-000@seed.local');
    expect(host.textContent).toContain('Создан заказ на оценку объекта seed 1');
  });

  it('shows empty state when nothing matches the entity filter', async () => {
    fixture.componentRef.setInput('entityType', 'order');
    fixture.componentRef.setInput('entityId', 'missing-order');
    fixture.componentRef.setInput('events', ORDER_AUDIT_LOG_FIXTURES);
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('error', null);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-testid="empty-state"]')).not.toBeNull();
    expect(host.textContent).toContain('Для сущности missing-order пока нет событий в аудите.');
  });

  it('switches to email filtering mode for user feeds', async () => {
    await setRequiredInputs();

    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-testid="filter-mode"]')?.textContent).toContain(
      'По email пользователя',
    );
    expect(host.textContent).toContain('seed-user-000@seed.local');
  });

  it('emits selected event when a row is clicked', async () => {
    await setRequiredInputs();

    const selectedEvents: string[] = [];
    component.eventSelected.subscribe((event) => selectedEvents.push(event.id));

    const host = fixture.nativeElement as HTMLElement;
    const targetEvent = host.querySelector<HTMLElement>(
      '[data-event-id="a4e9f900-a4c1-437b-a5c1-3e0dce86141b"]',
    );

    targetEvent?.click();
    fixture.detectChanges();

    expect(selectedEvents).toEqual(['a4e9f900-a4c1-437b-a5c1-3e0dce86141b']);
    expect(targetEvent?.classList.contains('audit-entity-feed__event--selected')).toBe(true);
    expect(host.querySelector('[data-testid="selected-event-details"]')).not.toBeNull();
  });

  it('emits export request with filtered events', async () => {
    await setRequiredInputs();

    const exportRequests: AuditEntityFeedExportRequest[] = [];
    component.exportRequested.subscribe((payload) => exportRequests.push(payload));

    const host = fixture.nativeElement as HTMLElement;
    host.querySelector<HTMLElement>('[data-testid="export-button"]')?.click();

    expect(exportRequests).toHaveLength(1);
    expect(exportRequests[0]).toEqual({
      entityType: 'user',
      entityId: undefined,
      entityEmail: 'seed-user-000@seed.local',
      filterMode: 'entityEmail',
      events: USER_AUDIT_LOG_FIXTURES,
    });
  });
});
