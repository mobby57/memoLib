import { describe, expect, it } from 'vitest';
import { mapClerkOrganizationRole } from '@/lib/auth/clerk-role-mapping';

describe('mapClerkOrganizationRole', () => {
  it('maps Clerk default organization roles to non-elevating application roles', () => {
    expect(mapClerkOrganizationRole('org:admin')).toBe('ADMIN');
    expect(mapClerkOrganizationRole('org:member')).toBe('AVOCAT');
  });

  it('maps supported custom organization roles and rejects unknown roles', () => {
    expect(mapClerkOrganizationRole('org:secretaire')).toBe('SECRETAIRE');
    expect(mapClerkOrganizationRole('org:owner')).toBeNull();
    expect(mapClerkOrganizationRole('ADMIN')).toBeNull();
  });
});
