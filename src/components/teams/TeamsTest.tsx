import { useState } from 'react';
import { TeamList } from './TeamList';
import { DeletedTeamsList } from './DeletedTeamsList';
import ArchivedTeamsList from './ArchivedTeamsList';
import { useAuth } from '../../hooks/useAuth';
import { Id } from '../../../convex/_generated/dataModel';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Users, Trash2, Archive } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'active' | 'deleted' | 'archived'>('active');

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
      {selectedTeam ? (
        <TeamList 
          selectedTeam={selectedTeam}
          onTeamSelect={setSelectedTeam}
        />
      ) : (
        <div className="space-y-6">
          {/* Tab Navigation */}
          <Card>
            <CardHeader>
              <CardTitle>Team Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Button
                  variant={activeTab === 'active' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('active')}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Active Teams
                </Button>
                <Button
                  variant={activeTab === 'deleted' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('deleted')}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Deleted Teams
                </Button>
                <Button
                  variant={activeTab === 'archived' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('archived')}
                  className="flex items-center gap-2"
                >
                  <Archive className="h-4 w-4" />
                  Archived Teams
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tab Content */}
          {activeTab === 'active' && (
            <TeamList 
              selectedTeam={selectedTeam}
              onTeamSelect={setSelectedTeam}
            />
          )}
          
          {activeTab === 'deleted' && <DeletedTeamsList />}
          
          {activeTab === 'archived' && <ArchivedTeamsList />}
        </div>
      )}
    </div>
  );
}