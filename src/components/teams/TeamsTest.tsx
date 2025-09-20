import { useTeams } from '../../hooks/useTeams';
import { useAuth } from '../../hooks/useAuth';

export function TeamsTest() {
  const { user } = useAuth();
  const { teams, createTeam, isLoading } = useTeams();

  const handleCreateTeam = async () => {
    try {
      await createTeam("Test Team", "2025 Spring");
      alert("Team created successfully!");
    } catch (error) {
      console.error('Error creating team:', error);
      alert(`Error: ${error}`);
    }
  };

  if (!user) {
    return <div className="text-red-600">No user found - authentication issue</div>;
  }

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-2xl mx-auto">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Loading teams for user {user.id}...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-2xl mx-auto">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        🧪 Convex + Clerk Integration Test
      </h3>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">
            User: {user?.email || 'Unknown'}
          </p>
          <p className="text-sm text-gray-600">
            User ID: {user?.id || 'No ID'}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700">
            Teams ({teams?.length || 0}):
          </p>
          {teams && teams.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {teams.map((team) => (
                <li key={team._id} className="text-sm text-gray-600">
                  • {team.name} ({team.season})
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 mt-1">No teams found</p>
          )}
        </div>

        <button
          onClick={handleCreateTeam}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Create Test Team
        </button>
      </div>
    </div>
  );
}