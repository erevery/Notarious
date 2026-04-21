import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AuditEntityFeedComponent, type AuditEntityFeedExportRequest } from '../audit-entity-feed';
import { type AuditLogViewModel } from '../models';

@Component({
  selector: 'lib-user-logs-panel',
  standalone: true,
  imports: [AuditEntityFeedComponent],
  template: `
    <lib-audit-entity-feed
      [entityType]="'user'"
      [entityId]="entityId()"
      [entityEmail]="entityEmail()"
      [events]="events()"
      [loading]="loading()"
      [error]="error()"
      (eventSelected)="eventSelected.emit($event)"
      (exportRequested)="exportRequested.emit($event)"></lib-audit-entity-feed>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserLogsPanelComponent {
  readonly entityId = input<string>();
  readonly entityEmail = input<string>();
  readonly events = input<AuditLogViewModel[]>([]);
  readonly loading = input(false);
  readonly error = input<string | null>(null);

  readonly eventSelected = output<AuditLogViewModel>();
  readonly exportRequested = output<AuditEntityFeedExportRequest>();
}
