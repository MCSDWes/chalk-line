import { TeamList } from './TeamList';
import { useAuth } from '../../hooks/useAuth';

export function TeamsTest() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-2">Authentication Required</div>
          <p className="text-gray-600">Please sign in to manage your teams.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <TeamList />
    </div>
  );
}