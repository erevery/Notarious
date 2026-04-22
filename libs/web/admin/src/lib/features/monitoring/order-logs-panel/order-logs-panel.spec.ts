import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ENTITY_AUDIT_LOG_FIXTURES, ORDER_AUDIT_LOG_FIXTURES } from '../fixtures';
import { type AuditEntityFeedExportRequest } from '../audit-entity-feed';
import { OrderLogsPanelComponent } from './order-logs-panel';

const ORDER_ID = '582aa314-1dc9-48ed-a9a1-5d65418cc4e0';
const ORDER_EVENT_ID = '29c2e9ee-abea-4603-a7c5-42dfa5afcd8a';

describe('OrderLogsPanelComponent', () => {
  let fixture: ComponentFixture<OrderLogsPanelComponent>;
  let component: OrderLogsPanelComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderLogsPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderLogsPanelComponent);
    component = fixture.componentInstance;
  });

  async function setRequiredInputs(): Promise<void> {
    fixture.componentRef.setInput('entityId', ORDER_ID);
    fixture.componentRef.setInput('events', ENTITY_AUDIT_LOG_FIXTURES);
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('error', null);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('passes inputs to the audit entity feed and renders the order title/count', async () => {
    await setRequiredInputs();

    const host = fixture.nativeElement as HTMLElement;
    const renderedEvents = host.querySelectorAll('[data-testid="feed-event"]');

    expect(host.querySelector('[data-testid="feed-title"]')?.textContent).toContain(
      'Лента аудита заказа',
    );
    expect(host.querySelector('[data-testid="feed-count"]')?.textContent).toContain('3 события');
    expect(renderedEvents).toHaveLength(3);
    expect(host.textContent).toContain(ORDER_ID);
    expect(host.textContent).toContain('Отчет по заказу seed 1 подписан нотариусом');
  });

  it('re-emits child outputs without changing the payload', async () => {
    await setRequiredInputs();

    const selectedEvents: string[] = [];
    const exportRequests: AuditEntityFeedExportRequest[] = [];

    component.eventSelected.subscribe((event) => selectedEvents.push(event.id));
    component.exportRequested.subscribe((payload) => exportRequests.push(payload));

    const host = fixture.nativeElement as HTMLElement;
    const targetEvent = host.querySelector<HTMLElement>(`[data-event-id="${ORDER_EVENT_ID}"]`);

    expect(targetEvent).not.toBeNull();

    targetEvent?.click();
    host.querySelector<HTMLElement>('[data-testid="export-button"]')?.click();

    expect(selectedEvents).toEqual([ORDER_EVENT_ID]);
    expect(exportRequests).toEqual([
      {
        entityType: 'order',
        entityId: ORDER_ID,
        entityEmail: undefined,
        filterMode: 'entityId',
        events: ORDER_AUDIT_LOG_FIXTURES,
      },
    ]);
  });
});
