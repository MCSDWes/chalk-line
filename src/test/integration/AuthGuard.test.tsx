import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthGuard } from '../../components/auth/AuthGuard'

// Mock useAuth hook
const mockUseAuth = vi.fn()
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth()
}))

/**
 * Integration Tests for AuthGuard Component
 * 
 * These tests verify authentication flows and protection mechanisms
 */

describe('AuthGuard Component Integration', () => {
  it('should show loading state when auth is not loaded', () => {
    mockUseAuth.mockReturnValue({
      isLoaded: false,
      isSignedIn: false,
      user: null
    })

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should show sign in prompt when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
      user: null
    })

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    )

    expect(screen.getByText('Authentication Required')).toBeInTheDocument()
    expect(screen.getByText('Please sign in to access Chalk Line.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should show protected content when authenticated', () => {
    mockUseAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      user: { id: 'user-123', email: 'test@example.com' }
    })

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
    expect(screen.queryByText('Authentication Required')).not.toBeInTheDocument()
  })

  it('should render custom fallback when provided', () => {
    mockUseAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
      user: null
    })

    const customFallback = <div>Custom Auth Message</div>

    render(
      <AuthGuard fallback={customFallback}>
        <div>Protected Content</div>
      </AuthGuard>
    )

    expect(screen.getByText('Custom Auth Message')).toBeInTheDocument()
    expect(screen.queryByText('Authentication Required')).not.toBeInTheDocument()
  })
})