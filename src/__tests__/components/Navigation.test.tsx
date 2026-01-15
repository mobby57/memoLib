import { render, screen } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import { Navigation } from '@/components/Navigation'

// Mock next-auth
const mockSession = {
  user: {
    name: 'Test User',
    email: 'test@example.com',
    tenantId: 'cabinet-test',
    role: 'avocat',
  },
  expires: '2026-12-31',
}

describe('Navigation Component', () => {
  it('renders navigation with session', () => {
    render(
      <SessionProvider session={mockSession}>
        <Navigation />
      </SessionProvider>
    )
    
    expect(screen.getByText(/IAPosteManage/i)).toBeInTheDocument()
  })

  it('renders navigation without crashing', () => {
    render(
      <SessionProvider session={null}>
        <Navigation />
      </SessionProvider>
    )
    
    const nav = screen.getByRole('navigation')
    expect(nav).toBeInTheDocument()
  })
})
