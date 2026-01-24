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
    
    // Le composant affiche "IA Poste Manager" (avec espaces)
    expect(screen.getByText(/IA Poste Manager/i)).toBeInTheDocument()
  })

  it('renders navigation without crashing', () => {
    render(
      <SessionProvider session={mockSession}>
        <Navigation />
      </SessionProvider>
    )
    
    // Navigation est rendue avec role="navigation" via la balise <nav>
    const nav = screen.getByRole('navigation')
    expect(nav).toBeInTheDocument()
  })
})
