import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TeamsTest } from '../../components/teams/TeamsTest'

// Mock the hooks
const mockCreateTeam = vi.fn()
const mockUseAuth = vi.fn()
const mockUseTeams = vi.fn()

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth()
}))

vi.mock('../../hooks/useTeams', () => ({
  useTeams: () => mockUseTeams()
}))

/**
 * Integration Tests for React Components
 * 
 * These tests verify that our React components:
 * 1. Render correctly with authentication
 * 2. Display data from Convex queries
 * 3. Handle user interactions properly
 * 4. Show appropriate loading and error states
 */

describe('TeamsTest Component Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default auth state
    mockUseAuth.mockReturnValue({
      user: {
        id: 'test-user-123',
        email: 'test@example.com',
        name: 'Test User'
      }
    })
    
    // Default teams state
    mockUseTeams.mockReturnValue({
      teams: [
        {
          _id: 'team-1',
          name: 'Test Team',
          season: '2025 Spring',
          userId: 'test-user-123'
        }
      ],
      createTeam: mockCreateTeam,
      isLoading: false
    })
  })

  it('should render with authenticated user', () => {
    render(<TeamsTest />)
    
    expect(screen.getByText('🧪 Convex + Clerk Integration Test')).toBeInTheDocument()
    expect(screen.getByText('User: test@example.com')).toBeInTheDocument()
    expect(screen.getByText('User ID: test-user-123')).toBeInTheDocument()
  })

  it('should display teams list', () => {
    render(<TeamsTest />)
    
    expect(screen.getByText('Teams (1):')).toBeInTheDocument()
    expect(screen.getByText('• Test Team (2025 Spring)')).toBeInTheDocument()
  })

  it('should show create team button', () => {
    render(<TeamsTest />)
    
    const createButton = screen.getByRole('button', { name: /create test team/i })
    expect(createButton).toBeInTheDocument()
  })

  it('should show loading state', () => {
    mockUseTeams.mockReturnValue({
      teams: undefined,
      createTeam: mockCreateTeam,
      isLoading: true
    })

    render(<TeamsTest />)
    
    expect(screen.getByText(/Loading teams for user test-user-123/)).toBeInTheDocument()
    expect(screen.queryByText('Teams (1):')).not.toBeInTheDocument()
  })

  it('should show empty teams state', () => {
    mockUseTeams.mockReturnValue({
      teams: [],
      createTeam: mockCreateTeam,
      isLoading: false
    })

    render(<TeamsTest />)
    
    expect(screen.getByText('Teams (0):')).toBeInTheDocument()
    expect(screen.getByText('No teams found')).toBeInTheDocument()
  })

  it('should handle create team button click', async () => {
    const user = userEvent.setup()
    mockCreateTeam.mockResolvedValue({ _id: 'new-team-id' })
    
    // Mock window.alert
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    
    render(<TeamsTest />)
    
    const createButton = screen.getByRole('button', { name: /create test team/i })
    await user.click(createButton)
    
    expect(mockCreateTeam).toHaveBeenCalledWith('Test Team', '2025 Spring')
    
    // Wait for the success alert
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Team created successfully!')
    })
    
    alertSpy.mockRestore()
  })

  it('should handle create team error', async () => {
    const user = userEvent.setup()
    const error = new Error('Team already exists')
    mockCreateTeam.mockRejectedValue(error)
    
    // Mock console.error and window.alert
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    
    render(<TeamsTest />)
    
    const createButton = screen.getByRole('button', { name: /create test team/i })
    await user.click(createButton)
    
    expect(mockCreateTeam).toHaveBeenCalledWith('Test Team', '2025 Spring')
    
    // Wait for the error handling
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error creating team:', error)
      expect(alertSpy).toHaveBeenCalledWith('Error: Error: Team already exists')
    })
    
    consoleSpy.mockRestore()
    alertSpy.mockRestore()
  })

  it('should show error when no user is found', () => {
    mockUseAuth.mockReturnValue({ user: null })
    
    render(<TeamsTest />)
    
    expect(screen.getByText('No user found - authentication issue')).toBeInTheDocument()
    expect(screen.queryByText('🧪 Convex + Clerk Integration Test')).not.toBeInTheDocument()
  })
})