import {
  ENTITY_AUDIT_LOG_FIXTURES,
  ORDER_AUDIT_LOG_FIXTURES,
  USER_AUDIT_LOG_FIXTURES,
} from './entity-audit-log.fixtures';
import { SECURITY_EVENTS_FIXTURES, SUSPICIOUS_ACTIVITY_FIXTURES } from './security-events.fixtures';

describe('monitoring fixtures smoke', () => {
  it('cover user and order audit scenarios', () => {
    expect(USER_AUDIT_LOG_FIXTURES).toHaveLength(3);
    expect(
      USER_AUDIT_LOG_FIXTURES.every((event) => event.actor.email.endsWith('@seed.local')),
    ).toBe(true);
    expect(USER_AUDIT_LOG_FIXTURES.map((event) => event.action.code)).toEqual([
      'user.login',
      'subscription.created',
      'assessment.created',
    ]);

    expect(ORDER_AUDIT_LOG_FIXTURES).toHaveLength(3);
    expect(ORDER_AUDIT_LOG_FIXTURES.every((event) => event.entity.type === 'order')).toBe(true);
    expect(new Set(ORDER_AUDIT_LOG_FIXTURES.map((event) => event.entity.id)).size).toBe(1);
    expect(ORDER_AUDIT_LOG_FIXTURES.map((event) => event.action.code)).toEqual([
      'assessment.created',
      'payment.completed',
      'report.signed',
    ]);
  });

  it('cover security events and suspicious activity scenarios', () => {
    expect(SECURITY_EVENTS_FIXTURES).toHaveLength(5);
    expect(SECURITY_EVENTS_FIXTURES.every((event) => event.security.isSecurityEvent)).toBe(true);
    expect(SECURITY_EVENTS_FIXTURES.some((event) => event.severity.level === 'warning')).toBe(true);
    expect(SECURITY_EVENTS_FIXTURES.some((event) => event.severity.level === 'critical')).toBe(
      true,
    );
    expect(SECURITY_EVENTS_FIXTURES.map((event) => event.action.code)).toEqual([
      'user.login_failed',
      'token.revoked',
      'permission.denied',
      'security.suspicious_activity_detected',
      'user.blocked',
    ]);

    expect(SUSPICIOUS_ACTIVITY_FIXTURES).toHaveLength(2);
    expect(SUSPICIOUS_ACTIVITY_FIXTURES.every((event) => event.security.riskLevel === 'high')).toBe(
      true,
    );
    expect(SUSPICIOUS_ACTIVITY_FIXTURES.map((event) => event.action.code)).toEqual([
      'security.suspicious_activity_detected',
      'user.blocked',
    ]);
  });

  it('keep all fixture ids unique across scenario groups', () => {
    const ids = [...ENTITY_AUDIT_LOG_FIXTURES, ...SECURITY_EVENTS_FIXTURES].map(
      (event) => event.id,
    );

    expect(new Set(ids).size).toBe(ids.length);
  });
});
