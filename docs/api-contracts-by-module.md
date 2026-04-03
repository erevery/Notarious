# Распределение контрактов API по модулям

Источник истины для текущего состояния контрактов:

- proto-файлы: `libs/shared/api-contracts/proto/notary/**`
- экспорт SDK: `libs/shared/api-contracts/src/index.ts`
- реально поднятые RPC-маршруты: `apps/api/src/app/connect-router.registry.ts`

Для текущего applicant flow формы параметров объекта фронтенд работает напрямую через `AssessmentService` и `DocumentService`. `FormsService` существует только как proto/SDK-контракт и в `apps/api` сейчас не зарегистрирован.

---

## Регистрация / Вход / Восстановление сессии

| API-сервис      | RPC-методы                            |
| --------------- | ------------------------------------- |
| **AuthService** | Register, Login, RefreshToken, Logout |

Создание аккаунта, авторизация и обновление сессии.

---

## Личный кабинет заявителя / заявки на оценку

| API-сервис            | RPC-методы                                                                                    |
| --------------------- | --------------------------------------------------------------------------------------------- |
| **AssessmentService** | CreateAssessment, GetAssessment, UpdateAssessment, ListAssessments, ListCities, ListDistricts |
| **DocumentService**   | CreateDocument, GetDocument, ListDocumentsByAssessment, DeleteDocument                        |

Создание и продолжение черновика заявки, загрузка файлов заявки, восстановление последнего draft, lookup-справочники городов и районов.

---

## Личный кабинет нотариуса

| API-сервис            | RPC-методы                                                                                               |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| **AssessmentService** | ListAssessments, GetAssessment, UpdateAssessment, VerifyAssessment, CompleteAssessment, CancelAssessment |
| **DocumentService**   | GetDocument, ListDocumentsByAssessment, DeleteDocument                                                   |
| **PaymentService**    | GetPaymentHistory, GetSubscription, CreateSubscription                                                   |
| **ReportService**     | CreateReport, GetReport, ListReports, SignReport, DeleteReport                                           |

Просмотр заявок, работа со статусами, доступ к прикреплённым документам и отчётам.

---

## Личный кабинет администратора

| API-сервис              | RPC-методы                                                                                               |
| ----------------------- | -------------------------------------------------------------------------------------------------------- |
| **UserService**         | GetProfile, UpdateProfile, GetUserById, ListUsers                                                        |
| **AssessmentService**   | ListAssessments, GetAssessment, UpdateAssessment, VerifyAssessment, CompleteAssessment, CancelAssessment |
| **DocumentService**     | CreateDocument, GetDocument, ListDocumentsByAssessment, DeleteDocument                                   |
| **PaymentService**      | CreatePayment, GetPaymentHistory, GetSubscription, CreateSubscription                                    |
| **NotificationService** | ListNotifications, MarkAsRead, MarkAllAsRead, DeleteNotification                                         |
| **ReportService**       | CreateReport, GetReport, ListReports, SignReport, DeleteReport                                           |

Админ работает только с теми сервисами, которые реально зарегистрированы в Connect-router приложения API.

---

## Форма параметров объекта и draft flow оценки

| API-сервис            | RPC-методы                                                                                    |
| --------------------- | --------------------------------------------------------------------------------------------- |
| **AssessmentService** | CreateAssessment, GetAssessment, UpdateAssessment, ListAssessments, ListCities, ListDistricts |
| **DocumentService**   | CreateDocument, ListDocumentsByAssessment                                                     |

Текущий flow формы:

- `ListAssessments(statusFilter=NEW, limit=1)` — найти последний draft пользователя
- `GetAssessment` — открыть draft по `assessmentId` из query params
- `CreateAssessment` / `UpdateAssessment` — сохранить draft и параметры `RealEstateObject`
- `ListCities` / `ListDistricts` — lookup-справочники
- `CreateDocument` / `ListDocumentsByAssessment` — файлы заявки, привязанные к `assessmentId`

---

## Загрузка и управление файлами заявки

| API-сервис          | RPC-методы                                                             |
| ------------------- | ---------------------------------------------------------------------- |
| **DocumentService** | CreateDocument, GetDocument, ListDocumentsByAssessment, DeleteDocument |

Документный flow привязан к заявке через `assessmentId`. В текущем applicant flow фото объекта и общие документы загружаются как записи `Document`, а не как вложения `RealEstateObject`.

---

## Просмотр результатов оценки

| API-сервис            | RPC-методы                                                     |
| --------------------- | -------------------------------------------------------------- |
| **AssessmentService** | GetAssessment, ListAssessments                                 |
| **ReportService**     | CreateReport, GetReport, ListReports, SignReport, DeleteReport |

Карточка результата опирается на статус `Assessment` и связанные `AssessmentReport`.

---

## Платежи

| API-сервис         | RPC-методы                                                            |
| ------------------ | --------------------------------------------------------------------- |
| **PaymentService** | CreatePayment, GetPaymentHistory, GetSubscription, CreateSubscription |

История платежей и checkout работают через `PaymentService`.

---

## Уведомления

| API-сервис              | RPC-методы                                                       |
| ----------------------- | ---------------------------------------------------------------- |
| **NotificationService** | ListNotifications, MarkAsRead, MarkAllAsRead, DeleteNotification |

In-app уведомления и состояние прочитанности.

---

## Разделы без текущих контрактов

В репозитории сейчас нет отдельных proto-контрактов и поднятых RPC-маршрутов для следующих направлений:

- тарифные планы / promo management
- sale / выдача копий документов
- audit log API
- чат поддержки
- справочный раздел / knowledge base

Если эти модули будут реализованы, их нужно добавить одновременно в три места:

1. `libs/shared/api-contracts/proto/notary/**`
2. `libs/shared/api-contracts/src/index.ts`
3. `apps/api/src/app/connect-router.registry.ts`

---

## Сводка по доступным сервисам

| Сервис              | Proto-файл                               | Экспорт в `@notary-portal/api-contracts` | Зарегистрирован в `apps/api` |
| ------------------- | ---------------------------------------- | ---------------------------------------- | ---------------------------- |
| AssessmentService   | assessment/v1alpha1/assessment.proto     | Да                                       | Да                           |
| AuthService         | auth/v1alpha1/auth.proto                 | Да                                       | Да                           |
| DocumentService     | document/v1alpha1/document.proto         | Да                                       | Да                           |
| FormsService        | forms/v1alpha1/forms.proto               | Да                                       | Нет                          |
| NotificationService | notification/v1alpha1/notification.proto | Да                                       | Да                           |
| PaymentService      | payment/v1alpha1/payment.proto           | Да                                       | Да                           |
| ReportService       | report/v1alpha1/report.proto             | Да                                       | Да                           |
| UserService         | user/v1alpha1/user.proto                 | Да                                       | Да                           |

Отдельных proto-файлов для `PromoService`, `SaleService` и `AuditLogService` в текущем дереве `libs/shared/api-contracts/proto/notary` нет.
