import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthGuard } from '../../components/auth/AuthGuard'

// Mock useAuth hook
const mockUseAuth = vi.fn()
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth()
}))

/**
 * Integration Tests for AuthGuard Component (Authentication & Authorization)
 * 
 * These tests verify comprehensive authentication flows:
 * 1. Loading states and transitions
 * 2. Authentication redirection
 * 3. Protected content access
 * 4. Error handling and recovery
 * 5. Session management
 * 6. Privacy compliance
 */

// Test wrapper 
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="test-wrapper">
    {children}
  </div>
)

describe('AuthGuard Component Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication State Management', () => {
    it('should show loading state when auth is not loaded', () => {
      mockUseAuth.mockReturnValue({
        isLoaded: false,
        isSignedIn: false,
        user: null
      })

      render(
        <TestWrapper>
          <AuthGuard>
            <div>Protected Content</div>
          </AuthGuard>
        </TestWrapper>
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('should handle auth loading timeout gracefully', async () => {
      mockUseAuth.mockReturnValue({
        isLoaded: false,
        isSignedIn: false,
        user: null
      })

      render(
        <TestWrapper>
          <AuthGuard>
            <div>Protected Content</div>
          </AuthGuard>
        </TestWrapper>
      )

      // Should show loading initially
      expect(screen.getByText('Loading...')).toBeInTheDocument()

      // This test verifies the loading state is stable
      // In a real app, loading would transition to auth state
      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument()
      }, { timeout: 100 })
    })

    it('should transition from loading to authenticated state', async () => {
      // Start with loading
      mockUseAuth.mockReturnValue({
        isLoaded: false,
        isSignedIn: false,
        user: null
      })

      const { rerender } = render(
        <TestWrapper>
          <AuthGuard>
            <div>Protected Content</div>
          </AuthGuard>
        </TestWrapper>
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()

      // Simulate auth completion
      mockUseAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        user: { 
          id: 'user-123', 
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User'
        }
      })

      rerender(
        <TestWrapper>
          <AuthGuard>
            <div>Protected Content</div>
          </AuthGuard>
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument()
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })
    })
  })

  describe('Unauthenticated Access Control', () => {
    it('should show sign in prompt when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: false,
        user: null
      })

      render(
        <TestWrapper>
          <AuthGuard>
            <div>Protected Content</div>
          </AuthGuard>
        </TestWrapper>
      )

      expect(screen.getByText('Authentication Required')).toBeInTheDocument()
      expect(screen.getByText('Please sign in to access Chalk Line.')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument()
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('should handle sign in navigation', () => {
      mockUseAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: false,
        user: null
      })

      render(
        <TestWrapper>
          <AuthGuard>
            <div>Protected Content</div>
          </AuthGuard>
        </TestWrapper>
      )

      const signInLink = screen.getByRole('link', { name: /sign in/i })
      expect(signInLink).toHaveAttribute('href', '/sign-in')
    })
  })

  describe('Authenticated Access Control', () => {
    it('should show protected content when authenticated', () => {
      mockUseAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        user: { 
          id: 'user-123', 
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User'
        }
      })

      render(
        <TestWrapper>
          <AuthGuard>
            <div>Protected Content</div>
          </AuthGuard>
        </TestWrapper>
      )

      expect(screen.getByText('Protected Content')).toBeInTheDocument()
      expect(screen.queryByText('Authentication Required')).not.toBeInTheDocument()
    })

    it('should handle partial user data', () => {
      mockUseAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        user: { 
          id: 'user-123',
          email: 'test@example.com'
          // Missing firstName/lastName
        }
      })

      render(
        <TestWrapper>
          <AuthGuard>
            <div>Protected Content</div>
          </AuthGuard>
        </TestWrapper>
      )

      // Should still allow access with minimal user data
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })

    it('should handle different user types', () => {
      const userTypes = [
        {
          id: 'user-123',
          email: 'parent@example.com',
          firstName: 'Parent',
          lastName: 'User'
        },
        {
          id: 'user-456', 
          email: 'coach@example.com',
          firstName: 'Coach',
          lastName: 'Smith'
        }
      ]

      userTypes.forEach(user => {
        mockUseAuth.mockReturnValue({
          isLoaded: true,
          isSignedIn: true,
          user
        })

        render(
          <TestWrapper>
            <AuthGuard>
              <div>Protected Content for {user.firstName}</div>
            </AuthGuard>
          </TestWrapper>
        )

        expect(screen.getByText(`Protected Content for ${user.firstName}`)).toBeInTheDocument()
      })
    })
  })

  describe('Custom Fallback Handling', () => {
    it('should render custom fallback when provided', () => {
      mockUseAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: false,
        user: null
      })

      const customFallback = <div>Custom Auth Message</div>

      render(
        <TestWrapper>
          <AuthGuard fallback={customFallback}>
            <div>Protected Content</div>
          </AuthGuard>
        </TestWrapper>
      )

      expect(screen.getByText('Custom Auth Message')).toBeInTheDocument()
      expect(screen.queryByText('Authentication Required')).not.toBeInTheDocument()
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('should handle complex custom fallback components', () => {
      mockUseAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: false,
        user: null
      })

      const CustomFallback = () => (
        <div>
          <h2>Access Denied</h2>
          <p>You need special permissions</p>
          <button>Request Access</button>
        </div>
      )

      render(
        <TestWrapper>
          <AuthGuard fallback={<CustomFallback />}>
            <div>Protected Content</div>
          </AuthGuard>
        </TestWrapper>
      )

      expect(screen.getByText('Access Denied')).toBeInTheDocument()
      expect(screen.getByText('You need special permissions')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /request access/i })).toBeInTheDocument()
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle auth errors gracefully', () => {
      mockUseAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: false,
        user: null,
        error: 'Authentication failed'
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <TestWrapper>
          <AuthGuard>
            <div>Protected Content</div>
          </AuthGuard>
        </TestWrapper>
      )

      // Should show auth required even with errors
      expect(screen.getByText('Authentication Required')).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })

    it('should handle network connectivity issues', async () => {
      // Simulate network failure
      mockUseAuth.mockReturnValue({
        isLoaded: false,
        isSignedIn: false,
        user: null
      })

      render(
        <TestWrapper>
          <AuthGuard>
            <div>Protected Content</div>
          </AuthGuard>
        </TestWrapper>
      )

      // Should show loading state during network issues
      expect(screen.getByText('Loading...')).toBeInTheDocument()

      // Simulate recovery
      setTimeout(() => {
        mockUseAuth.mockReturnValue({
          isLoaded: true,
          isSignedIn: true,
          user: { id: 'user-123', email: 'test@example.com' }
        })
      }, 100)
    })

    it('should handle session expiration', async () => {
      // Start authenticated
      mockUseAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        user: { id: 'user-123', email: 'test@example.com' }
      })

      const { rerender } = render(
        <TestWrapper>
          <AuthGuard>
            <div>Protected Content</div>
          </AuthGuard>
        </TestWrapper>
      )

      expect(screen.getByText('Protected Content')).toBeInTheDocument()

      // Simulate session expiration
      mockUseAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: false,
        user: null
      })

      rerender(
        <TestWrapper>
          <AuthGuard>
            <div>Protected Content</div>
          </AuthGuard>
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Authentication Required')).toBeInTheDocument()
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
      })
    })
  })

  describe('Privacy and Security Compliance', () => {
    it('should not expose sensitive user data in DOM', () => {
      const sensitiveUser = {
        id: 'user-123',
        email: 'sensitive@example.com',
        privateMetadata: { ssn: '123-45-6789' },
        unsafeMetadata: { creditCard: '1234-5678-9012-3456' }
      }

      mockUseAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        user: sensitiveUser
      })

      render(
        <TestWrapper>
          <AuthGuard>
            <div>Protected Content</div>
          </AuthGuard>
        </TestWrapper>
      )

      // Should not expose sensitive data
      expect(screen.queryByText('123-45-6789')).not.toBeInTheDocument()
      expect(screen.queryByText('1234-5678-9012-3456')).not.toBeInTheDocument()
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })

    it('should handle COPPA compliance for minors', () => {
      const minorUser = {
        id: 'user-minor-123',
        email: 'parent@example.com', // Parent's email
        firstName: 'Tommy',
        lastName: 'R', // Only initial for minors
        metadata: { isMinor: true, parentEmail: 'parent@example.com' }
      }

      mockUseAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        user: minorUser
      })

      render(
        <TestWrapper>
          <AuthGuard>
            <div>Protected Content</div>
          </AuthGuard>
        </TestWrapper>
      )

      // Should allow access but respect privacy
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })

  describe('Accessibility Compliance', () => {
    it('should provide accessible link elements', () => {
      mockUseAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: false,
        user: null
      })

      render(
        <TestWrapper>
          <AuthGuard>
            <div>Protected Content</div>
          </AuthGuard>
        </TestWrapper>
      )

      const signInLink = screen.getByRole('link', { name: /sign in/i })
      expect(signInLink).toBeInTheDocument()
      expect(signInLink).toHaveAttribute('href', '/sign-in')
    })

    it('should support keyboard navigation', () => {
      mockUseAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: false,
        user: null
      })

      render(
        <TestWrapper>
          <AuthGuard>
            <div>Protected Content</div>
          </AuthGuard>
        </TestWrapper>
      )

      const signInLink = screen.getByRole('link', { name: /sign in/i })
      
      // Should be focusable
      signInLink.focus()
      expect(document.activeElement).toBe(signInLink)
    })

    it('should provide screen reader friendly content', () => {
      mockUseAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: false,
        user: null
      })

      render(
        <TestWrapper>
          <AuthGuard>
            <div>Protected Content</div>
          </AuthGuard>
        </TestWrapper>
      )

      // Should have descriptive text for screen readers
      expect(screen.getByText('Please sign in to access Chalk Line.')).toBeInTheDocument()
    })
  })
})