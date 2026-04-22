---
title: '[ADMIN] Логи по пользователю / заказу и события безопасности'
labels: ['frontend', 'admin', 'logs', 'security']
assignees: ['getpaintoo']
---

## Описание

Детальный просмотр логов в контексте конкретного пользователя или заказа, а также отдельный раздел событий безопасности (входы, смены пароля, подозрительная активность).

## Технический source of truth

- Этап 1: реализуем автономные standalone-компоненты в `libs/web/admin/src/lib/features/monitoring/` и не блокируемся на отсутствующих `/admin/users/:id` и `/admin/orders/:id`.
- Этап 2: после появления точки встраивания подключаем те же компоненты либо во вкладки общего `MonitoringComponent`, либо в карточки пользователя и заказа.

> **Нибылицын Лукьян (issue-22):** общая лента аудита.  
> **Черненко Дмитрий (getpaintoo):** данное issue — логи по сущности + безопасность.

## Затронутые роли

- Администратор
- Нотариус (частично — только по своим заказам)

## Экраны / компоненты

- [ ] **`AuditByEntityComponent`** (`libs/web/admin/src/lib/features/monitoring/`) — автономный компонент логов по пользователю или заказу: входы, изменения профиля, платежи, история статусов
- [ ] **`SecurityEventsComponent`** (`libs/web/admin/src/lib/features/monitoring/`) — автономный компонент событий безопасности: неудачные входы, смены пароля, подозрительные IP, блокировки
- [ ] **Интеграция этапа 2** — подключение тех же компонентов либо в `/admin/monitoring`, либо в `/admin/users/:id` и `/admin/orders/:id` после появления этих экранов
- [ ] **Badge «Подозрительная активность»** — выделение строк с высоким риском цветовой кодировкой

## Технические требования

- Текущий путь интеграции: `libs/web/admin/src/lib/features/monitoring/`
- На этапе 1 не делаем жёсткую привязку к `/admin/users/:id` и `/admin/orders/:id`
- На этапе 2 точкой встраивания могут стать вкладки в `/admin/monitoring` или страницы `/admin/users/:id` и `/admin/orders/:id`
- Защита: `roleGuard(UserRole.Admin)` из `@notary-portal/ui`
- На текущей frontend-итерации работаем только от mock-данных и не блокируемся на backend/API-интеграции audit
- D10 (`AuditService`/`AuditLogService` backend integration с фильтрами по `userId` / `orderId` / `eventType=security`) выделен в отдельный этап:
  отсутствуют `audit.proto`, `libs/api/audit` и регистрация в `apps/api/src/app/connect-router.registry.ts`
- Компонент логов — переиспользуемый: принимает `@Input() entityType` и `@Input() entityId`
- Координация с issue-22 (Нибылицын): общие компоненты строки лога / детали события

## Acceptance criteria

- [ ] `AuditByEntityComponent` показывает только события выбранного пользователя или заказа независимо от контейнера встраивания
- [ ] `SecurityEventsComponent` показывает только события безопасности и выделяет подозрительные события цветом
- [ ] Компоненты реализованы автономно в `libs/web/admin/src/lib/features/monitoring/` и могут быть встроены без переписывания
- [ ] Отсутствие `/admin/users/:id` и `/admin/orders/:id` не блокирует выполнение этапа 1
- [ ] Фильтрация по IP-адресу работает корректно

## Связанные файлы

- `libs/web/admin/src/lib/features/monitoring/`
- Backend prerequisites для D10 пока отсутствуют: `audit.proto`, `libs/api/audit`, `apps/api/src/app/connect-router.registry.ts`
- Зависимость: issue-22 (Нибылицын Лукьян — общий аудит)
