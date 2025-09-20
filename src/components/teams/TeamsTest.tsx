import { useState } from 'react';
import { TeamList } from './TeamList';
import { DeletedTeamsList } from './DeletedTeamsList';
import { useAuth } from '../../hooks/useAuth';
import { Id } from '../../../convex/_generated/dataModel';

interface Team {
  _id: Id<"teams">;
  _creationTime: number;
  userId: string;
  name: string;
  season: string;
}

export function TeamsTest() {
  const { user } = useAuth();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

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
      <TeamList 
        selectedTeam={selectedTeam}
        onTeamSelect={setSelectedTeam}
      />
      {/* Only show deleted teams when not viewing a specific team */}
      {!selectedTeam && <DeletedTeamsList />}
    </div>
  );
}