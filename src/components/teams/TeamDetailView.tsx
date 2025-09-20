import { useState } from "react";
import { ArrowLeft, Users, Calendar, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayerManagement } from "./PlayerManagement";
import { Id } from "../../../convex/_generated/dataModel";

interface Team {
  _id: Id<"teams">;
  _creationTime: number;
  userId: string;
  name: string;
  season: string;
}

interface TeamDetailViewProps {
  team: Team;
  onBack: () => void;
}

export function TeamDetailView({ team, onBack }: TeamDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'players' | 'settings'>('players');

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Teams
        </Button>
      </div>

      {/* Team Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{team.name}</CardTitle>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {team.season}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Created {formatDate(team._creationTime)}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'players' ? 'default' : 'outline'}
          onClick={() => setActiveTab('players')}
          className="flex items-center gap-2"
        >
          <Users className="h-4 w-4" />
          Players
        </Button>
        <Button
          variant={activeTab === 'settings' ? 'default' : 'outline'}
          onClick={() => setActiveTab('settings')}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === 'players' && (
        <PlayerManagement teamId={team._id} teamName={team.name} />
      )}

      {activeTab === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle>Team Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Team settings and configuration options will be available in a future update.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}