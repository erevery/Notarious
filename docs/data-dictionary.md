# Сущности и поля базы данных

## 1. Пользователь (User)

| Postgres      | Proto        | Prisma       | Type       | Description                               |
| :------------ | :----------- | :----------- | :--------- | :---------------------------------------- |
| **users**     | **User**     | **User**     | **Entity** | **Пользователи**                          |
| id            | id           | id           | UUID       | PK, уникальный идентификатор пользователя |
| email         | email        | email        | varchar    | Unique, электронная почта                 |
| password_hash | —            | passwordHash | varchar    | Хэш пароля                                |
| full_name     | full_name    | fullName     | varchar    | Полное имя                                |
| role          | role         | role         | enum       | Роль (Applicant, Notary, Admin)           |
| phone_number  | phone_number | phoneNumber  | varchar    | Телефон                                   |
| is_active     | is_active    | isActive     | boolean    | Активность аккаунта                       |
| created_at    | created_at   | createdAt    | timestamp  | Дата регистрации                          |
| updated_at    | updated_at   | updatedAt    | timestamp  | Дата последнего обновления                |

## 2. Город (City)

| Postgres   | Proto    | Prisma   | Type       | Description              |
| :--------- | :------- | :------- | :--------- | :----------------------- |
| **cities** | **City** | **City** | **Entity** | **Справочник городов**   |
| id         | id       | id       | UUID       | PK, идентификатор города |
| name       | name     | name     | varchar    | Unique, название города  |

## 3. Район (District)

| Postgres      | Proto        | Prisma       | Type       | Description              |
| :------------ | :----------- | :----------- | :--------- | :----------------------- |
| **districts** | **District** | **District** | **Entity** | **Справочник районов**   |
| id            | id           | id           | UUID       | PK, идентификатор района |
| city_id       | city_id      | cityId       | UUID       | FK, город                |
| name          | name         | name         | varchar    | Название района          |

## 4. Объект недвижимости (RealEstateObject)

| Postgres                | Proto                 | Prisma               | Type       | Description                              |
| :---------------------- | :-------------------- | :------------------- | :--------- | :--------------------------------------- |
| **real_estate_objects** | **RealEstateObject**  | **RealEstateObject** | **Entity** | **Параметры объекта недвижимости**       |
| id                      | id                    | id                   | UUID       | PK, идентификатор объекта                |
| city_id                 | city_id               | cityId               | UUID       | FK, город из справочника                 |
| district_id             | district_id           | districtId           | UUID       | FK, район из справочника, Nullable       |
| address                 | address               | address              | varchar    | Полный адрес объекта                     |
| cadastral_number        | cadastral_number      | cadastralNumber      | varchar    | Кадастровый номер, Nullable              |
| area                    | area                  | area                 | numeric    | Площадь объекта                          |
| object_type             | object_type           | objectType           | enum       | Тип объекта                              |
| rooms_count             | rooms_count           | roomsCount           | integer    | Количество комнат, Nullable              |
| floors_total            | floors_total          | floorsTotal          | integer    | Этажность здания, Nullable               |
| floor                   | floor                 | floor                | integer    | Этаж объекта, Nullable                   |
| condition               | condition             | condition            | enum       | Состояние объекта, Nullable              |
| year_built              | year_built            | yearBuilt            | integer    | Год постройки, Nullable                  |
| wall_material           | wall_material         | wallMaterial         | enum       | Материал стен, Nullable                  |
| elevator_type           | elevator_type         | elevatorType         | enum       | Тип лифта, Nullable                      |
| has_balcony_or_loggia   | has_balcony_or_loggia | hasBalconyOrLoggia   | boolean    | Балкон или лоджия, Nullable              |
| land_category           | land_category         | landCategory         | varchar    | Категория земли, Nullable                |
| permitted_use           | permitted_use         | permittedUse         | varchar    | Вид разрешённого использования, Nullable |
| utilities               | utilities             | utilities            | text       | Коммуникации, Nullable                   |
| description             | description           | description          | text       | Дополнительное описание, Nullable        |
| created_at              | created_at            | createdAt            | timestamp  | Дата создания                            |
| updated_at              | updated_at            | updatedAt            | timestamp  | Дата последнего обновления               |

## 5. Заявка на оценку (Assessment)

| Postgres              | Proto                 | Prisma             | Type       | Description                                        |
| :-------------------- | :-------------------- | :----------------- | :--------- | :------------------------------------------------- |
| **assessments**       | **Assessment**        | **Assessment**     | **Entity** | **Процесс оценки и состояние заявки**              |
| id                    | id                    | id                 | UUID       | PK, идентификатор заявки                           |
| user_id               | user_id               | userId             | UUID       | FK, заявитель                                      |
| notary_id             | —                     | notaryId           | UUID       | FK, назначенный нотариус, Nullable                 |
| real_estate_object_id | real_estate_object_id | realEstateObjectId | UUID       | FK, связанный объект недвижимости, Nullable        |
| status                | status                | status             | enum       | Статус заявки                                      |
| cancel_reason         | —                     | cancelReason       | text       | Причина отмены, Nullable                           |
| created_at            | created_at            | createdAt          | timestamp  | Дата создания                                      |
| updated_at            | updated_at            | updatedAt          | timestamp  | Дата последнего обновления                         |
| address               | address               | address            | varchar    | Краткий адрес для списков и обратной совместимости |
| description           | description           | description        | text       | Краткое описание заявки, Nullable                  |
| estimated_value       | estimated_value       | estimatedValue     | numeric    | Итоговая стоимость, Nullable                       |

## 6. Документ (Document)

| Postgres      | Proto          | Prisma       | Type       | Description                                     |
| :------------ | :------------- | :----------- | :--------- | :---------------------------------------------- |
| **documents** | **Document**   | **Document** | **Entity** | **Файлы заявки**                                |
| id            | id             | id           | UUID       | PK, идентификатор документа                     |
| assessment_id | assessment_id  | assessmentId | UUID       | FK, заявка                                      |
| file_name     | file_name      | fileName     | varchar    | Имя файла                                       |
| file_type     | file_type      | fileType     | varchar    | MIME-тип файла                                  |
| document_type | document_type  | documentType | enum       | Тип файла (Photo, Other и др.)                  |
| file_path     | file_path      | filePath     | varchar    | Путь к файлу в хранилище                        |
| version       | version        | version      | integer    | Версия файла в рамках пары `assessment_id+name` |
| uploaded_at   | uploaded_at    | uploadedAt   | timestamp  | Дата загрузки                                   |
| uploaded_by   | uploaded_by_id | uploadedById | UUID       | FK, пользователь, загрузивший документ          |

## 7. Подписка (Subscription)

| Postgres          | Proto            | Prisma           | Type       | Description                             |
| :---------------- | :--------------- | :--------------- | :--------- | :-------------------------------------- |
| **subscriptions** | **Subscription** | **Subscription** | **Entity** | **Подписки нотариусов**                 |
| id                | id               | id               | UUID       | PK, идентификатор подписки              |
| user_id           | user_id          | userId           | UUID       | FK, пользователь                        |
| plan              | plan             | plan             | enum       | Тариф                                   |
| base_price        | —                | basePrice        | numeric    | Цена тарифа на момент покупки, Nullable |
| currency          | —                | currency         | varchar    | Валюта                                  |
| start_date        | start_date       | startDate        | date       | Дата начала                             |
| end_date          | end_date         | endDate          | date       | Дата окончания                          |
| is_active         | is_active        | isActive         | boolean    | Активность подписки                     |

## 8. Платёж (Payment)

| Postgres             | Proto                | Prisma             | Type       | Description               |
| :------------------- | :------------------- | :----------------- | :--------- | :------------------------ |
| **payments**         | **Payment**          | **Payment**        | **Entity** | **Платежи**               |
| id                   | id                   | id                 | UUID       | PK, идентификатор платежа |
| user_id              | user_id              | userId             | UUID       | FK, пользователь          |
| type                 | type                 | type               | enum       | Тип платежа               |
| status               | status               | status             | enum       | Статус платежа            |
| payment_date         | payment_date         | paymentDate        | timestamp  | Дата платежа              |
| transaction_id       | transaction_id       | transactionId      | varchar    | Внешний ID транзакции     |
| amount               | amount               | amount             | numeric    | Сумма платежа             |
| payment_method       | payment_method       | paymentMethod      | varchar    | Метод оплаты, Nullable    |
| attachment_file_name | attachment_file_name | attachmentFileName | varchar    | Название чека, Nullable   |
| attachment_file_url  | attachment_file_url  | attachmentFileUrl  | varchar    | Ссылка на чек, Nullable   |
| subscription_id      | subscription_id      | subscriptionId     | UUID       | FK, подписка, Nullable    |
| assessment_id        | assessment_id        | assessmentId       | UUID       | FK, заявка, Nullable      |
| promo_id             | —                    | promoId            | UUID       | FK, промокод, Nullable    |
| discount_amount      | —                    | discountAmount     | numeric    | Сумма скидки, Nullable    |

`Payment.description` есть в proto-модели истории платежей, но отдельной колонкой в БД не хранится.

## 9. Отчёт об оценке (AssessmentReport)

| Postgres               | Proto                | Prisma               | Type       | Description                       |
| :--------------------- | :------------------- | :------------------- | :--------- | :-------------------------------- |
| **assessment_reports** | **AssessmentReport** | **AssessmentReport** | **Entity** | **Отчёты об оценке**              |
| id                     | id                   | id                   | UUID       | PK, идентификатор отчёта          |
| assessment_id          | assessment_id        | assessmentId         | UUID       | FK, заявка                        |
| report_path            | report_path          | reportPath           | varchar    | Путь к PDF                        |
| generated_at           | generated_at         | generatedAt          | timestamp  | Дата генерации                    |
| signed_by              | signed_by_id         | signedById           | UUID       | FK, нотариус                      |
| signature_data         | —                    | signatureData        | bytea      | Бинарные данные подписи, Nullable |
| version                | version              | version              | integer    | Версия отчёта                     |
| status                 | status               | status               | enum       | Статус отчёта                     |

`AssessmentReport.has_signature` есть в proto-ответах, но вычисляется из `signatureData` и не хранится отдельной колонкой.

## 10. Уведомление (Notification)

| Postgres          | Proto            | Prisma           | Type       | Description                   |
| :---------------- | :--------------- | :--------------- | :--------- | :---------------------------- |
| **notifications** | **Notification** | **Notification** | **Entity** | **Уведомления**               |
| id                | id               | id               | UUID       | PK, идентификатор уведомления |
| user_id           | user_id          | userId           | UUID       | FK, получатель                |
| type              | type             | type             | enum       | Тип уведомления               |
| message           | message          | message          | text       | Текст уведомления             |
| sent_at           | sent_at          | sentAt           | timestamp  | Время отправки                |
| read_at           | read_at          | readAt           | timestamp  | Время прочтения, Nullable     |
| status            | status           | status           | enum       | Статус доставки               |

## 11. Лог действий (AuditLog)

| Postgres       | Proto | Prisma       | Type       | Description                     |
| :------------- | :---- | :----------- | :--------- | :------------------------------ |
| **audit_logs** | —     | **AuditLog** | **Entity** | **Логи действий**               |
| id             | —     | id           | UUID       | PK, идентификатор записи        |
| user_id        | —     | userId       | UUID       | FK, пользователь                |
| action_type    | —     | actionType   | varchar    | Тип действия                    |
| entity_name    | —     | entityName   | varchar    | Имя сущности                    |
| entity_id      | —     | entityId     | UUID       | ID объекта                      |
| timestamp      | —     | timestamp    | timestamp  | Время действия                  |
| details        | —     | details      | jsonb      | Дополнительные данные, Nullable |

## 12. Промокод (Promo)

| Postgres         | Proto | Prisma          | Type       | Description                   |
| :--------------- | :---- | :-------------- | :--------- | :---------------------------- |
| **promos**       | —     | **Promo**       | **Entity** | **Промокоды**                 |
| id               | —     | id              | UUID       | PK, идентификатор промокода   |
| code             | —     | code            | varchar    | Unique, код                   |
| description      | —     | description     | text       | Описание, Nullable            |
| discount_percent | —     | discountPercent | numeric    | Размер скидки                 |
| usage_limit      | —     | usageLimit      | integer    | Лимит использований, Nullable |
| used_count       | —     | usedCount       | integer    | Количество использований      |
| expires_at       | —     | expiresAt       | timestamp  | Срок действия, Nullable       |

## 13. Скидка (Sale)

| Postgres        | Proto | Prisma         | Type       | Description              |
| :-------------- | :---- | :------------- | :--------- | :----------------------- |
| **sales**       | —     | **Sale**       | **Entity** | **Скидки**               |
| id              | —     | id             | UUID       | PK, идентификатор скидки |
| type            | —     | type           | enum       | Тип скидки               |
| start_date      | —     | startDate      | date       | Дата начала              |
| end_date        | —     | endDate        | date       | Дата окончания           |
| percent         | —     | percent        | numeric    | Процент скидки           |
| is_active       | —     | isActive       | boolean    | Активность               |
| subscription_id | —     | subscriptionId | UUID       | FK, подписка, Nullable   |
| promo_id        | —     | promoId        | UUID       | FK, промокод, Nullable   |

---

## Примечание для enum и связанных словарей

| Name                    | Postgres                  | Proto                  | Prisma                 |
| :---------------------- | :------------------------ | :--------------------- | :--------------------- |
| AssessmentStatus        | `assessment_status`       | `AssessmentStatus`     | `AssessmentStatus`     |
| DocumentType            | `document_type`           | `DocumentType`         | `DocumentType`         |
| RealEstateObjectType    | `real_estate_object_type` | `RealEstateObjectType` | `RealEstateObjectType` |
| RealEstateCondition     | `real_estate_condition`   | `RealEstateCondition`  | `RealEstateCondition`  |
| WallMaterial            | `wall_material`           | `WallMaterial`         | `WallMaterial`         |
| ElevatorType            | `elevator_type`           | `ElevatorType`         | `ElevatorType`         |
| City / District lookups | `cities`, `districts`     | `City`, `District`     | `City`, `District`     |
