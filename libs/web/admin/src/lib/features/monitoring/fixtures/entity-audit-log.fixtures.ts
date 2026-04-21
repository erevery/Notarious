import { mapAuditLogSourceToViewModel } from '../models/audit-log.adapters';
import { type AuditLogSource } from '../models/audit-log.models';

const APPLICANT_SEED_USER = {
  id: 'b3b8fde7-28ee-4e36-ac8a-4c265db55b43',
  name: 'Заявитель 1',
  email: 'seed-user-000@seed.local',
  role: 'Applicant',
} as const;

const NOTARY_SEED_USER = {
  id: '007bbfee-adde-40ab-a117-6cc34106e110',
  name: 'Нотариус 11',
  email: 'seed-user-010@seed.local',
  role: 'Notary',
} as const;

const ADMIN_SEED_USER = {
  id: '11b5a060-57c1-4b98-aa62-bfaeee25f04d',
  name: 'Администратор 21',
  email: 'seed-user-020@seed.local',
  role: 'Admin',
} as const;

const SEED_ASSESSMENT_ID = '582aa314-1dc9-48ed-a9a1-5d65418cc4e0';
const SEED_SUBSCRIPTION_ID = '49beabc5-5cf9-4808-a6f2-43165d3a2922';
const SEED_PAYMENT_ID = 'cafb883d-6ed0-40c6-a57e-ef471ecf8aad';

const USER_LOGIN_EVENT: AuditLogSource = {
  id: '229a983f-c346-44ba-aadc-06cbe3db29b6',
  actorId: APPLICANT_SEED_USER.id,
  actorName: APPLICANT_SEED_USER.name,
  actorEmail: APPLICANT_SEED_USER.email,
  actorRole: APPLICANT_SEED_USER.role,
  action: 'user.login',
  description: 'Пользователь seed-user-000@seed.local вошел в систему',
  entityType: 'User',
  entityId: APPLICANT_SEED_USER.id,
  entityTitle: 'Пользователь Заявитель 1',
  entitySubtitle: 'Seed applicant account',
  source: 'Web guest login',
  location: 'Страница входа',
  ipAddress: '95.55.120.10',
  createdAt: '2026-03-19T06:30:00Z',
  severity: 'info',
  reason: 'Успешный вход в seed-аккаунт',
  changes: {
    before: ['session: missing'],
    after: ['session: issued'],
  },
};

const SUBSCRIPTION_CREATED_EVENT: AuditLogSource = {
  id: '7a6eba1b-f7cf-4a6d-a7db-978a46885902',
  actorId: APPLICANT_SEED_USER.id,
  actorName: APPLICANT_SEED_USER.name,
  actorEmail: APPLICANT_SEED_USER.email,
  actorRole: APPLICANT_SEED_USER.role,
  action: 'subscription.created',
  description: 'Оформлена подписка Basic для seed-пользователя',
  entityType: 'Subscription',
  entityId: SEED_SUBSCRIPTION_ID,
  entityTitle: 'Подписка Basic',
  entitySubtitle: 'Seed subscription #0',
  source: 'Web guest cabinet',
  location: 'Раздел "Подписка"',
  ipAddress: '95.55.120.10',
  createdAt: '2026-03-19T06:45:00Z',
  severity: 'success',
  reason: 'Создание подписки после первого входа',
  changes: {
    before: ['plan: none', 'status: missing'],
    after: ['plan: basic', 'status: active'],
  },
};

const ASSESSMENT_CREATED_EVENT: AuditLogSource = {
  id: 'a4e9f900-a4c1-437b-a5c1-3e0dce86141b',
  actorId: APPLICANT_SEED_USER.id,
  actorName: APPLICANT_SEED_USER.name,
  actorEmail: APPLICANT_SEED_USER.email,
  actorRole: APPLICANT_SEED_USER.role,
  action: 'assessment.created',
  description: 'Создан заказ на оценку объекта seed 1',
  entityType: 'Assessment',
  entityId: SEED_ASSESSMENT_ID,
  entityTitle: 'Заказ #582aa314',
  entitySubtitle: 'г. Екатеринбург, ул. Малышева, 18, 0',
  source: 'Web guest cabinet',
  location: 'Создание заказа',
  ipAddress: '95.55.120.10',
  createdAt: '2026-03-19T07:00:00Z',
  severity: 'info',
  reason: 'Первичное создание заказа заявителем',
  changes: {
    before: ['status: missing', 'estimatedValue: missing'],
    after: ['status: new', 'estimatedValue: 5000000.00'],
  },
};

const PAYMENT_COMPLETED_EVENT: AuditLogSource = {
  id: '29c2e9ee-abea-4603-a7c5-42dfa5afcd8a',
  actorId: ADMIN_SEED_USER.id,
  actorName: ADMIN_SEED_USER.name,
  actorEmail: ADMIN_SEED_USER.email,
  actorRole: ADMIN_SEED_USER.role,
  action: 'payment.completed',
  description: 'Оплата заказа seed 1 подтверждена администратором',
  entityType: 'Assessment',
  entityId: SEED_ASSESSMENT_ID,
  entityTitle: 'Заказ #582aa314',
  entitySubtitle: `Платеж ${SEED_PAYMENT_ID.slice(0, 8)}`,
  source: 'Admin payments',
  location: 'Раздел "Платежи"',
  ipAddress: '10.14.7.31',
  createdAt: '2026-03-19T07:15:00Z',
  severity: 'success',
  reason: 'Платеж из seed-истории переведен в completed',
  changes: {
    before: ['paymentStatus: pending', 'receipt: missing'],
    after: ['paymentStatus: completed', 'receipt: generated'],
  },
};

const REPORT_SIGNED_EVENT: AuditLogSource = {
  id: '798c0777-c625-4c75-aec7-eb47ef1093eb',
  actorId: NOTARY_SEED_USER.id,
  actorName: NOTARY_SEED_USER.name,
  actorEmail: NOTARY_SEED_USER.email,
  actorRole: NOTARY_SEED_USER.role,
  action: 'report.signed',
  description: 'Отчет по заказу seed 1 подписан нотариусом',
  entityType: 'Assessment',
  entityId: SEED_ASSESSMENT_ID,
  entityTitle: 'Заказ #582aa314',
  entitySubtitle: 'Финальный отчет',
  source: 'Notary cabinet',
  location: 'Карточка заказа',
  ipAddress: '10.15.2.91',
  createdAt: '2026-03-19T11:40:00Z',
  severity: 'success',
  reason: 'Нотариус завершил обработку seed-заказа',
  changes: {
    before: ['reportStatus: draft', 'signature: missing'],
    after: ['reportStatus: signed', 'signature: qualified'],
  },
};

export const USER_AUDIT_LOG_SOURCES_FIXTURES: AuditLogSource[] = [
  USER_LOGIN_EVENT,
  SUBSCRIPTION_CREATED_EVENT,
  ASSESSMENT_CREATED_EVENT,
];

export const ORDER_AUDIT_LOG_SOURCES_FIXTURES: AuditLogSource[] = [
  ASSESSMENT_CREATED_EVENT,
  PAYMENT_COMPLETED_EVENT,
  REPORT_SIGNED_EVENT,
];

export const ENTITY_AUDIT_LOG_SOURCES_FIXTURES: AuditLogSource[] = [
  USER_LOGIN_EVENT,
  SUBSCRIPTION_CREATED_EVENT,
  ASSESSMENT_CREATED_EVENT,
  PAYMENT_COMPLETED_EVENT,
  REPORT_SIGNED_EVENT,
];

export const USER_AUDIT_LOG_FIXTURES = USER_AUDIT_LOG_SOURCES_FIXTURES.map(
  mapAuditLogSourceToViewModel,
);

export const ORDER_AUDIT_LOG_FIXTURES = ORDER_AUDIT_LOG_SOURCES_FIXTURES.map(
  mapAuditLogSourceToViewModel,
);

export const ENTITY_AUDIT_LOG_FIXTURES = ENTITY_AUDIT_LOG_SOURCES_FIXTURES.map(
  mapAuditLogSourceToViewModel,
);
