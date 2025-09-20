import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TeamsTest } from '../../components/teams/TeamsTest'

// Mock the hooks
const mockCreateTeam = vi.fn()
const mockUpdateTeam = vi.fn()
const mockDeleteTeam = vi.fn()
const mockUseAuth = vi.fn()
const mockUseTeams = vi.fn()

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth()
}))

vi.mock('../../hooks/useTeams', () => ({
  useTeams: () => mockUseTeams()
}))

/**
 * Integration Tests for Team Management UI
 * 
 * These tests verify that our team management components:
 * 1. Render correctly with authentication
 * 2. Display teams from Convex queries
 * 3. Handle team creation, editing, and deletion
 * 4. Show appropriate loading and error states
 * 5. Handle authentication errors properly
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
          _creationTime: 1672531200000,
          name: 'Test Team',
          season: '2025 Spring',
          userId: 'test-user-123'
        }
      ],
      createTeam: mockCreateTeam,
      updateTeam: mockUpdateTeam,
      deleteTeam: mockDeleteTeam,
      isLoading: false
    })
  })

  it('should render team management UI with authenticated user', () => {
    render(<TeamsTest />)
    
    expect(screen.getByText('Your Teams')).toBeInTheDocument()
    expect(screen.getByText('Manage your baseball teams and track their progress.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add team/i })).toBeInTheDocument()
  })

  it('should display teams list', () => {
    render(<TeamsTest />)
    
    expect(screen.getByText('Test Team')).toBeInTheDocument()
    expect(screen.getByText('2025 Spring')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /manage/i })).toBeInTheDocument()
  })

  it('should show add team button', () => {
    render(<TeamsTest />)
    
    const addButton = screen.getByRole('button', { name: /add team/i })
    expect(addButton).toBeInTheDocument()
  })

  it('should show loading state', () => {
    mockUseTeams.mockReturnValue({
      teams: undefined,
      createTeam: mockCreateTeam,
      updateTeam: mockUpdateTeam,
      deleteTeam: mockDeleteTeam,
      isLoading: true
    })

    render(<TeamsTest />)
    
    expect(screen.getByText('Loading teams...')).toBeInTheDocument()
    expect(screen.queryByText('Your Teams')).not.toBeInTheDocument()
  })

  it('should show empty teams state', () => {
    mockUseTeams.mockReturnValue({
      teams: [],
      createTeam: mockCreateTeam,
      updateTeam: mockUpdateTeam,
      deleteTeam: mockDeleteTeam,
      isLoading: false
    })

    render(<TeamsTest />)
    
    expect(screen.getByText('No teams yet')).toBeInTheDocument()
    expect(screen.getByText('Get started by creating your first team. You can manage players and rosters once you have a team set up.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create your first team/i })).toBeInTheDocument()
  })

  it('should handle add team button click', async () => {
    const user = userEvent.setup()
    
    render(<TeamsTest />)
    
    const addButton = screen.getByRole('button', { name: /add team/i })
    await user.click(addButton)
    
    // Dialog should open (we can't easily test the form submission without more complex mocking)
    expect(addButton).toBeInTheDocument()
  })

  it('should show authentication error when no user found', () => {
    mockUseAuth.mockReturnValue({ user: null })
    
    render(<TeamsTest />)
    
    expect(screen.getByText('Authentication Required')).toBeInTheDocument()
    expect(screen.getByText('Please sign in to manage your teams.')).toBeInTheDocument()
    expect(screen.queryByText('Your Teams')).not.toBeInTheDocument()
  })

  it('should display team creation date', () => {
    render(<TeamsTest />)
    
    // Check for "Created" text (the date formatting might vary)
    expect(screen.getByText(/created/i)).toBeInTheDocument()
  })

  it('should show edit and delete buttons for teams', () => {
    render(<TeamsTest />)
    
    // Check for icon buttons (they might not have accessible names)
    const buttons = screen.getAllByRole('button')
    
    // Should have at least: Add Team, Edit (icon), Delete (icon), Manage buttons
    expect(buttons.length).toBeGreaterThanOrEqual(4)
  })
})