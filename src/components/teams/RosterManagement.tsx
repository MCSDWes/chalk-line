import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { RosterForm } from './RosterForm';
import { RosterList } from './RosterList';
import { Id } from '../../../convex/_generated/dataModel';

interface Roster {
  _id: Id<"rosters">;
  teamId: Id<"teams">;
  name: string;
  gameDate: string;
  playerIds: Id<"players">[];
  isActive: boolean;
  _creationTime: number;
}

interface RosterManagementProps {
  teamId: Id<"teams">;
  teamName: string;
}

export function RosterManagement({ teamId, teamName }: RosterManagementProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRoster, setEditingRoster] = useState<Roster | null>(null);
  const [viewingRoster, setViewingRoster] = useState<Roster | null>(null);

  const handleAddRosterSuccess = () => {
    setShowAddForm(false);
  };

  const handleEditRosterSuccess = () => {
    setEditingRoster(null);
  };

  const handleEditRoster = (roster: Roster) => {
    setEditingRoster(roster);
  };

  const handleViewRoster = (roster: Roster) => {
    setViewingRoster(roster);
    // For now, we'll just show an alert. In the future, we can implement a detailed roster view
    alert(`Viewing roster: ${roster.name}\nGame Date: ${roster.gameDate}\nPlayers: ${roster.playerIds.length}\nStatus: ${roster.isActive ? 'Active' : 'Draft'}`);
  };

  const handleCancelEdit = () => {
    setEditingRoster(null);
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Roster Management</h2>
          <p className="text-muted-foreground">Manage rosters and lineups for {teamName}</p>
        </div>
        
        {!showAddForm && !editingRoster && (
          <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Roster
          </Button>
        )}
      </div>

      {/* Add Roster Form */}
      {showAddForm && (
        <RosterForm
          teamId={teamId}
          onSuccess={handleAddRosterSuccess}
          onCancel={handleCancelAdd}
        />
      )}

      {/* Edit Roster Form */}
      {editingRoster && (
        <RosterForm
          teamId={teamId}
          roster={editingRoster}
          onSuccess={handleEditRosterSuccess}
          onCancel={handleCancelEdit}
        />
      )}

      {/* Roster List - only show when not adding or editing */}
      {!showAddForm && !editingRoster && (
        <RosterList 
          teamId={teamId} 
          onEditRoster={handleEditRoster}
          onViewRoster={handleViewRoster}
        />
      )}
    </div>
  );
}