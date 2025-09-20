import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { PlayerForm } from './PlayerForm';
import { PlayerList } from './PlayerList';
import { Id } from '../../../convex/_generated/dataModel';

interface Player {
  _id: Id<"players">;
  firstName: string;
  lastNameInitial: string;
  lastName?: string;
  isMinor: boolean;
  position: string;
  jerseyNumber?: number;
  _creationTime: number;
}

interface PlayerManagementProps {
  teamId: Id<"teams">;
  teamName: string;
}

export function PlayerManagement({ teamId, teamName }: PlayerManagementProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const handleAddPlayerSuccess = () => {
    setShowAddForm(false);
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    // For now, we'll just show an alert. In the future, we can implement an edit form
    alert(`Edit functionality for ${player.firstName} ${player.lastNameInitial}. will be implemented in the next iteration.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Player Management</h2>
          <p className="text-muted-foreground">Manage players for {teamName}</p>
        </div>
        
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Player
          </Button>
        )}
      </div>

      {/* Add Player Form */}
      {showAddForm && (
        <PlayerForm
          teamId={teamId}
          onSuccess={handleAddPlayerSuccess}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Player List */}
      <PlayerList
        teamId={teamId}
        onEditPlayer={handleEditPlayer}
      />
    </div>
  );
}