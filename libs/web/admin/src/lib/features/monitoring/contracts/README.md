# Monitoring Integration Contract

Этот файл фиксирует контракт интеграции между общей страницей `/admin/monitoring` и standalone-компонентами внутри `libs/web/admin/src/lib/features/monitoring/`.

## Владение файлами

- Лукьян владеет только файлами:
  - `monitoring.ts`
  - `monitoring.html`
  - `monitoring.scss`
- Дмитрий владеет всеми подкаталогами внутри `monitoring/`, созданными для интеграции и переиспользования:
  - `audit-entity-feed/`
  - `order-logs-panel/`
  - `user-logs-panel/`
  - `security-events/`
  - `models/`
  - `fixtures/`
  - `contracts/`
- Любые новые shared-типы, mock-данные, адаптеры и вспомогательные утилиты добавляются только в подкаталоги, а не в `monitoring.ts/html/scss`.

## Согласованные @Input/@Output

### Общие входы для дочерних панелей Дмитрия

- `events: AuditLogViewModel[]`
- `loading: boolean`
- `error: string | null`

### Дополнительные входы

- `lib-user-logs-panel`
  - `entityId?: string`
  - `entityEmail?: string`
- `lib-order-logs-panel`
  - `entityId?: string`
- `lib-security-events`
  - обязательных дополнительных входов нет, локальные фильтры живут внутри компонента

### Выходы, которые обрабатывает Лукьян при встраивании

- `lib-user-logs-panel`
  - `eventSelected: AuditLogViewModel`
  - `exportRequested: AuditEntityFeedExportRequest`
- `lib-order-logs-panel`
  - `eventSelected: AuditLogViewModel`
  - `exportRequested: AuditEntityFeedExportRequest`
- `lib-security-events`
  - `rowSelected: AuditLogViewModel`
  - `exportRequested: SecurityEventsExportRequest`
  - `filtersChanged: SecurityEventsFilters` только если нужно показывать page-level статус/аналитику

### Правило по naming

- На этапе интеграции не переименовываем существующие outputs ради "красоты".
- Для общей логики выбора записи считаем каноническим payload типа `AuditLogViewModel`.
- `rowSelected` в `lib-security-events` считается допустимым частным именем, а не поводом править уже готовые подпапки.

## Общий event row/detail format

Канонический формат события для списка и боковой детали: `AuditLogViewModel` из `models/audit-log.models.ts`.

### Поля, которые обязаны быть готовы для строки

- `id`
- `action.title`
- `action.subtitle`
- `action.category`
- `actor.name`
- `actor.email`
- `actor.role`
- `entity.title`
- `entity.subtitle`
- `entity.label`
- `source.name`
- `source.location`
- `source.ipAddress`
- `severity.level`
- `severity.label`
- `security.isSecurityEvent`
- `security.reason`
- `display.dateLabel`
- `display.timeLabel`

### Поля, которые обязаны быть готовы для detail view

- все поля row-format
- `entity.id`
- `entity.type`
- `source.userAgent`
- `security.riskLevel`
- `changes.before`
- `changes.after`

### Правило по трансформациям

- Не вводим отдельный DTO "для строки" и отдельный DTO "для деталей".
- Общий render-ready формат один: `AuditLogViewModel`.
- Если backend или mock не дают нужное поле, оно нормализуется в `models/audit-log.adapters.ts`, а не собирается локально в `monitoring.ts`.

## Shared mock source

- Владелец shared mock source: Дмитрий
- Raw source of truth:
  - `models/audit-logs.mock.ts` -> `AUDIT_LOG_SOURCES_MOCK`
- Render-ready source of truth:
  - `models/audit-logs.mock.ts` -> `AUDIT_LOGS_MOCK`
- Лукьян использует `AUDIT_LOGS_MOCK` только как read-only входной массив.
- Если для экрана нужен новый атрибут события, он добавляется по цепочке:
  - `AuditLogSource`
  - `AUDIT_LOG_SOURCES_MOCK`
  - `mapAuditLogSourceToViewModel`
  - `AuditLogViewModel`
  - затем потребляется в `monitoring.ts/html`

## Backend boundary

- Текущая итерация ограничена frontend-подготовкой и mock-driven интеграцией.
- D10 с реальной audit backend/API интеграцией выполняется отдельно после подготовки фронта.
- Причины блокировки D10 в текущем репозитории:
  - отсутствует `audit.proto`
  - отсутствует `libs/api/audit`
  - отсутствует регистрация сервиса в `apps/api/src/app/connect-router.registry.ts`

## Антиконфликтные правила

- `monitoring.ts/html/scss` отвечают только за page composition, layout, табы, wiring и page-level actions.
- В подпапках живут component internals, локальная фильтрация, адаптеры, fixtures, mock-данные и тесты.
- В `monitoring.ts` запрещено:
  - дублировать интерфейсы события
  - заводить локальный mock-массив
  - добавлять util-функции для нормализации полей, если им место в `models/`
- Любое расширение event contract сначала вносится в файлы Дмитрия, затем подключается Лукьяном в его трёх файлах.
