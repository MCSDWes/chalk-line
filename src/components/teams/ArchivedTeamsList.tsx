import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { useTeams } from "../../hooks/useTeams";

export default function ArchivedTeamsList() {
  const { archivedTeams, isLoading } = useTeams();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Archived Teams</CardTitle>
          <CardDescription>
            Teams permanently archived with historical data preserved
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading archived teams...</p>
        </CardContent>
      </Card>
    );
  }

  if (!archivedTeams || archivedTeams.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Archived Teams</CardTitle>
          <CardDescription>
            Teams permanently archived with historical data preserved
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No archived teams found.</p>
          <p className="text-sm text-muted-foreground mt-2">
            When teams are archived, they appear here with their historical data preserved for statistics.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Archived Teams</CardTitle>
        <CardDescription>
          Teams permanently archived with historical data preserved
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {archivedTeams.map((team) => (
            <div
              key={team._id}
              className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-muted-foreground line-through">
                    {team.name}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {team.season}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Archived
                  </Badge>
                </div>
                
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    <strong>Archived:</strong>{" "}
                    {team.archivedAt 
                      ? new Date(team.archivedAt).toLocaleDateString()
                      : "Unknown"
                    }
                  </p>
                  <p>
                    <strong>Reason:</strong>{" "}
                    {team.archivalReason || "No reason provided"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs font-mono">
                  Data Preserved
                </Badge>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">About Archived Teams</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• All historical data (players, rosters, games) is preserved</li>
            <li>• Statistics and batting averages remain calculable</li>
            <li>• Teams cannot be restored from archived state</li>
            <li>• Data can be exported for backup purposes</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}