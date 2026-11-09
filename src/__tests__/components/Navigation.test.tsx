import { describe, it, expect, beforeEach, afterEach } from 'vitest';

﻿import { render, screen } from '@testing-library/react'
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
      
        <Navigation />
      
    )
    
    // Le composant affiche "memoLib" (avec espaces)
    expect(screen.getByText('memoLib')).toBeInTheDocument()
  })

  it('renders navigation without crashing', () => {
    render(
      
        <Navigation />
      
    )
    
    // Navigation est rendue avec role="navigation" via la balise <nav>
    const nav = screen.getByRole('navigation')
    expect(nav).toBeInTheDocument()
  })
})
