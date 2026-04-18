import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SECURITY_EVENTS_FIXTURES, SECURITY_EVENTS_SOURCES_FIXTURES } from '../fixtures';
import { mapAuditLogSourceToViewModel } from '../models';
import {
  SecurityEventsComponent,
  type SecurityEventsExportRequest,
  type SecurityEventsFilters,
} from './security-events';

const OLDER_SECURITY_EVENT = mapAuditLogSourceToViewModel({
  ...SECURITY_EVENTS_SOURCES_FIXTURES[0],
  id: 'c0d0f189-0d2d-4be5-a8f9-older-security-event',
  createdAt: '2026-03-18T01:20:00Z',
  description: 'Старое событие для проверки фильтра по дате и 24ч',
});

describe('SecurityEventsComponent', () => {
  let fixture: ComponentFixture<SecurityEventsComponent>;
  let component: SecurityEventsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecurityEventsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SecurityEventsComponent);
    component = fixture.componentInstance;
  });

  async function setInputs(events = SECURITY_EVENTS_FIXTURES): Promise<void> {
    fixture.componentRef.setInput('events', events);
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('error', null);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('filters events by IP and emits filtersChanged', async () => {
    const emittedFilters: SecurityEventsFilters[] = [];
    component.filtersChanged.subscribe((filters) => emittedFilters.push(filters));

    await setInputs();

    const host = fixture.nativeElement as HTMLElement;
    const ipFilter = host.querySelector<HTMLInputElement>('[data-testid="ip-filter"]');

    ipFilter!.value = '176.32.70.91';
    ipFilter!.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const renderedRows = host.querySelectorAll('[data-testid="security-event-row"]');

    expect(renderedRows).toHaveLength(2);
    expect(host.textContent).toContain('Обнаружен невозможный вход');
    expect(host.textContent).toContain('Пользователь временно заблокирован');
    expect(emittedFilters.at(-1)).toEqual({
      ip: '176.32.70.91',
      user: '',
      dateFrom: '',
      dateTo: '',
    });
  });

  it('filters events by date range', async () => {
    await setInputs([...SECURITY_EVENTS_FIXTURES, OLDER_SECURITY_EVENT]);

    const host = fixture.nativeElement as HTMLElement;
    const dateToFilter = host.querySelector<HTMLInputElement>('[data-testid="date-to-filter"]');

    dateToFilter!.value = '2026-03-19';
    dateToFilter!.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const renderedRows = host.querySelectorAll('[data-testid="security-event-row"]');

    expect(renderedRows).toHaveLength(1);
    expect(host.textContent).toContain('Старое событие для проверки фильтра по дате и 24ч');
    expect(host.textContent).not.toContain('Обнаружен невозможный вход');
  });

  it('highlights suspicious and high risk rows', async () => {
    await setInputs();

    const host = fixture.nativeElement as HTMLElement;
    const suspiciousRow = host.querySelector<HTMLElement>(
      '[data-event-id="c0d0f189-0d2d-4be5-a8f9-7d13d6f60004"]',
    );
    const mediumRiskRow = host.querySelector<HTMLElement>(
      '[data-event-id="c0d0f189-0d2d-4be5-a8f9-7d13d6f60003"]',
    );

    expect(suspiciousRow?.classList.contains('security-events__row--high-risk')).toBe(true);
    expect(suspiciousRow?.classList.contains('security-events__row--suspicious')).toBe(true);
    expect(mediumRiskRow?.classList.contains('security-events__row--high-risk')).toBe(false);
    expect(mediumRiskRow?.classList.contains('security-events__row--suspicious')).toBe(false);
  });

  it('shows the 24h badge count relative to the freshest filtered event', async () => {
    await setInputs([...SECURITY_EVENTS_FIXTURES, OLDER_SECURITY_EVENT]);

    const host = fixture.nativeElement as HTMLElement;
    const badge = host.querySelector<HTMLElement>('[data-testid="events-24h-badge"]');

    expect(badge?.textContent).toContain('5 за 24ч');
  });

  it('emits export payload with filtered events and counters', async () => {
    await setInputs();

    const exportRequests: SecurityEventsExportRequest[] = [];
    component.exportRequested.subscribe((payload) => exportRequests.push(payload));

    const host = fixture.nativeElement as HTMLElement;
    host.querySelector<HTMLElement>('[data-testid="export-button"]')?.click();

    expect(exportRequests).toHaveLength(1);
    expect(exportRequests[0]).toEqual({
      filters: {
        ip: '',
        user: '',
        dateFrom: '',
        dateTo: '',
      },
      events: [
        SECURITY_EVENTS_FIXTURES[4],
        SECURITY_EVENTS_FIXTURES[3],
        SECURITY_EVENTS_FIXTURES[2],
        SECURITY_EVENTS_FIXTURES[1],
        SECURITY_EVENTS_FIXTURES[0],
      ],
      highlightedCount: 3,
      recentCount: 5,
    });
  });
});
