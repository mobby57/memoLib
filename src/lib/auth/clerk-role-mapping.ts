const APPLICATION_ROLES = new Set([
  'ADMIN',
  'AVOCAT',
  'ASSOCIE',
  'COLLABORATEUR',
  'SECRETAIRE',
  'COMPTABLE',
]);

export function mapClerkOrganizationRole(clerkRole: string): string | null {
  if (clerkRole === 'org:admin') return 'ADMIN';
  if (clerkRole === 'org:member') return 'AVOCAT';

  const applicationRole = clerkRole.startsWith('org:')
    ? clerkRole.slice('org:'.length).toUpperCase()
    : '';

  return APPLICATION_ROLES.has(applicationRole) ? applicationRole : null;
}
