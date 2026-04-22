import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ENTITY_AUDIT_LOG_FIXTURES, USER_AUDIT_LOG_FIXTURES } from '../fixtures';
import { type AuditEntityFeedExportRequest } from '../audit-entity-feed';
import { UserLogsPanelComponent } from './user-logs-panel';

const USER_ID = 'b3b8fde7-28ee-4e36-ac8a-4c265db55b43';
const USER_EMAIL = 'seed-user-000@seed.local';
const USER_EVENT_ID = 'a4e9f900-a4c1-437b-a5c1-3e0dce86141b';

describe('UserLogsPanelComponent', () => {
  let fixture: ComponentFixture<UserLogsPanelComponent>;
  let component: UserLogsPanelComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserLogsPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UserLogsPanelComponent);
    component = fixture.componentInstance;
  });

  async function setRequiredInputs(): Promise<void> {
    fixture.componentRef.setInput('entityId', USER_ID);
    fixture.componentRef.setInput('entityEmail', USER_EMAIL);
    fixture.componentRef.setInput('events', ENTITY_AUDIT_LOG_FIXTURES);
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('error', null);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('passes inputs to the audit entity feed and renders the user title/count', async () => {
    await setRequiredInputs();

    const host = fixture.nativeElement as HTMLElement;
    const renderedEvents = host.querySelectorAll('[data-testid="feed-event"]');

    expect(host.querySelector('[data-testid="feed-title"]')?.textContent).toContain(
      'Лента аудита пользователя',
    );
    expect(host.querySelector('[data-testid="feed-count"]')?.textContent).toContain('3 события');
    expect(renderedEvents).toHaveLength(3);
    expect(host.textContent).toContain(USER_EMAIL);
    expect(host.textContent).toContain('Создан заказ на оценку объекта seed 1');
  });

  it('re-emits child outputs without changing the payload', async () => {
    await setRequiredInputs();

    const selectedEvents: string[] = [];
    const exportRequests: AuditEntityFeedExportRequest[] = [];

    component.eventSelected.subscribe((event) => selectedEvents.push(event.id));
    component.exportRequested.subscribe((payload) => exportRequests.push(payload));

    const host = fixture.nativeElement as HTMLElement;
    const targetEvent = host.querySelector<HTMLElement>(`[data-event-id="${USER_EVENT_ID}"]`);

    expect(targetEvent).not.toBeNull();

    targetEvent?.click();
    host.querySelector<HTMLElement>('[data-testid="export-button"]')?.click();

    expect(selectedEvents).toEqual([USER_EVENT_ID]);
    expect(exportRequests).toEqual([
      {
        entityType: 'user',
        entityId: USER_ID,
        entityEmail: USER_EMAIL,
        filterMode: 'entityEmail',
        events: USER_AUDIT_LOG_FIXTURES,
      },
    ]);
  });
});
