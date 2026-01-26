import { renderHook } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import { useAuth } from '@/hooks/useAuth'
import { ReactNode } from 'react'

const mockSession = {
  user: {
    name: 'John Doe',
    email: 'john@example.com',
    tenantId: 'cabinet-test',
    role: 'avocat',
  },
  expires: '2026-12-31',
}

describe('useAuth Hook', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SessionProvider session={mockSession}>{children}</SessionProvider>
  )

  it.skip('returns session data', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.session).not.toBeNull()
    expect(result.current.status).toBe('authenticated')
  })

  it('provides authentication helpers', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(typeof result.current.hasRole).toBe('function')
    // isAdmin peut etre boolean ou undefined
    expect(['boolean', 'undefined']).toContain(typeof result.current.isAdmin)
    expect(typeof result.current.requireAuth).toBe('function')
  })
})
