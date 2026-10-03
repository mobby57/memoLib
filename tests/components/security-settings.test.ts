import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

// Note: ce test importe une page Next.js (.tsx). Il vit dans tests/components/
// car la config vitest "node" (vitest.config.ts) n'a pas de transform JSX
// (tsconfig utilise jsx: "preserve" requis par Next.js). La config components
// (vitest.components.config.ts, environnement jsdom) transforme bien le JSX.

vi.mock('@clerk/nextjs', () => ({
  UserProfile: 'clerk-user-profile',
}));

import SecuritySettingsPage from '@/app/[locale]/settings/security/[[...rest]]/page';

describe('security settings routes', () => {
  it('mounts Clerk UserProfile at the locale-aware security path', async () => {
    const page = await SecuritySettingsPage({
      params: Promise.resolve({ locale: 'fr' }),
    });
    const section = page.props.children as ReactElement<{
      children: ReactElement[];
    }>;
    const userProfile = section.props.children[2] as ReactElement<{
      path: string;
      routing: string;
    }>;

    expect(userProfile.props).toMatchObject({
      path: '/fr/settings/security',
      routing: 'path',
    });
  });
});
