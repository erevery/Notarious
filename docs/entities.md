# Сущности и поля базы данных PostgreSQL для нотариальной оценки наследства

## 1. Пользователь (User)

- `Id` (UUID, PK) — уникальный идентификатор пользователя
- `Email` (varchar, unique) — электронная почта
- `PasswordHash` (varchar) — хэш пароля
- `FullName` (varchar) — полное имя
- `Role` (enum: Applicant, Notary, Admin) — роль пользователя
- `PhoneNumber` (varchar, nullable) — телефон
- `IsActive` (boolean) — активность аккаунта
- `CreatedAt` (timestamp) — дата регистрации
- `UpdatedAt` (timestamp) — дата последнего обновления

## 2. Справочник городов (City)

- `Id` (UUID, PK) — идентификатор города
- `Name` (varchar, unique) — название города

## 3. Справочник районов (District)

- `Id` (UUID, PK) — идентификатор района
- `CityId` (UUID, FK) — ссылка на город
- `Name` (varchar) — название района

## 4. Объект недвижимости (RealEstateObject)

- `Id` (UUID, PK) — уникальный идентификатор объекта недвижимости
- `CityId` (UUID, FK) — город из lookup-справочника `City`
- `DistrictId` (UUID, FK, nullable) — район из lookup-справочника `District`
- `Address` (varchar) — полный адрес объекта
- `CadastralNumber` (varchar, nullable) — кадастровый номер
- `Area` (numeric(10,2)) — площадь объекта в квадратных метрах
- `ObjectType` (enum: Apartment, House, Room, Apartments, LandPlot, CommercialProperty, Other) — тип объекта
- `RoomsCount` (integer, nullable) — количество комнат
- `FloorsTotal` (integer, nullable) — этажность здания
- `Floor` (integer, nullable) — этаж объекта
- `Condition` (enum: Excellent, Good, Satisfactory, Poor, nullable) — состояние объекта
- `YearBuilt` (integer, nullable) — год постройки
- `WallMaterial` (enum: Brick, Panel, Block, Monolithic, MonolithicBrick, Wooden, AeratedConcrete, nullable) — материал стен
- `ElevatorType` (enum: None, Cargo, Passenger, PassengerAndCargo, nullable) — тип лифта
- `HasBalconyOrLoggia` (boolean, nullable) — наличие балкона или лоджии
- `LandCategory` (varchar, nullable) — категория земли для участка
- `PermittedUse` (varchar, nullable) — вид разрешённого использования
- `Utilities` (text, nullable) — коммуникации
- `Description` (text, nullable) — дополнительное описание объекта
- `CreatedAt` (timestamp) — дата создания записи
- `UpdatedAt` (timestamp) — дата последнего обновления записи

## 5. Заявка на оценку (Assessment)

- `Id` (UUID, PK) — уникальный идентификатор заявки
- `UserId` (UUID, FK) — заявитель
- `NotaryId` (UUID, FK, nullable) — назначенный нотариус
- `RealEstateObjectId` (UUID, FK, nullable, unique) — связанный объект недвижимости
- `Status` (enum: New, Verified, InProgress, Completed, Cancelled) — статус процесса оценки
- `CancelReason` (text, nullable) — причина отмены заявки
- `CreatedAt` (timestamp) — дата создания
- `UpdatedAt` (timestamp) — дата последнего обновления
- `Address` (varchar) — краткий адрес заявки для списков и обратной совместимости с контрактом `Assessment`
- `Description` (text, nullable) — краткое описание заявки
- `EstimatedValue` (numeric(15,2), nullable) — итоговая оценочная стоимость

## 6. Документ (Document)

- `Id` (UUID, PK) — уникальный идентификатор документа
- `AssessmentId` (UUID, FK) — заявка, к которой относится файл
- `FileName` (varchar) — имя файла
- `FileType` (varchar) — MIME-тип файла
- `DocumentType` (enum: Passport, PropertyDeed, TechnicalPlan, CadastralPassport, Photo, Other) — классификация файла
- `FilePath` (varchar) — путь к файлу в хранилище
- `Version` (integer) — версия файла внутри одной пары `assessmentId + fileName`
- `UploadedAt` (timestamp) — дата загрузки
- `UploadedById` (UUID, FK) — пользователь, загрузивший файл

## 7. Подписка (Subscription)

- `Id` (UUID, PK) — идентификатор подписки
- `UserId` (UUID, FK) — нотариус
- `Plan` (enum: Basic, Premium, Enterprise) — тариф
- `BasePrice` (numeric(15,2), nullable) — базовая цена тарифа на момент покупки
- `Currency` (varchar(3)) — валюта
- `StartDate` (date) — дата начала
- `EndDate` (date) — дата окончания
- `IsActive` (boolean) — активность подписки

## 8. Платёж (Payment)

- `Id` (UUID, PK) — идентификатор платежа
- `UserId` (UUID, FK) — пользователь
- `Type` (enum: Subscription, Assessment, DocumentCopy) — тип платежа
- `SubscriptionId` (UUID, FK, nullable) — привязка к подписке
- `AssessmentId` (UUID, FK, nullable) — привязка к заявке
- `PromoId` (UUID, FK, nullable) — применённый промокод
- `Amount` (numeric(15,2)) — сумма платежа
- `DiscountAmount` (numeric(15,2), nullable) — сумма скидки
- `PaymentDate` (timestamp) — дата платежа
- `Status` (enum: Pending, Completed, Failed, Refunded) — статус
- `PaymentMethod` (varchar, nullable) — метод оплаты
- `TransactionId` (varchar, nullable, unique) — внешний ID транзакции
- `AttachmentFileName` (varchar, nullable) — название чека
- `AttachmentFileUrl` (varchar, nullable) — ссылка на чек

## 9. Отчёт об оценке (AssessmentReport)

- `Id` (UUID, PK) — идентификатор отчёта
- `AssessmentId` (UUID, FK) — заявка
- `ReportPath` (varchar) — путь к PDF с отчётом
- `GeneratedAt` (timestamp) — дата создания отчёта
- `SignedById` (UUID, FK) — нотариус, подписавший отчёт
- `SignatureData` (bytea, nullable) — бинарные данные подписи
- `Version` (integer) — версия отчёта
- `Status` (enum: Draft, Signed) — статус отчёта

## 10. Уведомление (Notification)

- `Id` (UUID, PK) — идентификатор уведомления
- `UserId` (UUID, FK) — получатель
- `Type` (enum: Email, SMS, Push) — тип уведомления
- `Message` (text) — текст уведомления
- `SentAt` (timestamp) — время отправки
- `ReadAt` (timestamp, nullable) — время прочтения
- `Status` (enum: Pending, Sent, Failed) — статус доставки

## 11. Лог действий (AuditLog)

- `Id` (UUID, PK) — идентификатор лога
- `UserId` (UUID, FK) — пользователь, инициировавший действие
- `ActionType` (varchar) — тип действия
- `EntityName` (varchar) — имя сущности
- `EntityId` (UUID) — идентификатор объекта действия
- `Timestamp` (timestamp) — время действия
- `Details` (jsonb, nullable) — дополнительные данные

## 12. Промокод (Promo)

- `Id` (UUID, PK) — идентификатор промокода
- `Code` (varchar, unique) — код
- `Description` (text, nullable) — описание
- `DiscountPercent` (numeric(5,2)) — процент скидки
- `UsageLimit` (integer, nullable) — лимит применений
- `UsedCount` (integer) — количество использований
- `ExpiresAt` (timestamp, nullable) — срок действия

## 13. Скидка (Sale)

- `Id` (UUID, PK) — идентификатор скидки
- `Type` (enum: Permanent, Subscription, Product, Promo) — тип скидки
- `StartDate` (date) — дата начала
- `EndDate` (date) — дата окончания
- `Percent` (numeric(5,2)) — размер скидки
- `IsActive` (boolean) — активность скидки
- `SubscriptionId` (UUID, FK, nullable) — ссылка на подписку
- `PromoId` (UUID, FK, nullable) — ссылка на промокод

---

## Ключевые связи и поток данных

- `Assessment` — процессная сущность заявки. Она хранит владельца, статус, краткие поля для списков и связывает весь дальнейший flow.
- `RealEstateObject` — отдельная сущность с параметрами недвижимости. Форма параметров объекта работает именно с ней, а `Assessment` хранит ссылку `realEstateObjectId`.
- `City` и `District` — lookup-справочники. `District` всегда принадлежит `City`, а `RealEstateObject` ссылается на них по `cityId` и `districtId`.
- Файлы заявки живут в `Document` и привязываются к заявке через `assessmentId`. В текущем applicant flow фронтенд загружает фото объекта как `DocumentType.Photo`, а общие прикрепления формы как `DocumentType.Other`.
- `AssessmentReport` связан с `Assessment` отдельно от `Document` и описывает уже результат сформированного отчёта, а не исходные файлы заявки.
