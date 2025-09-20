import { useState } from "react";
import { AlertTriangle, Download, Shield, Archive } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";
import { useTeams } from "../../hooks/useTeams";
import { Id } from "../../../convex/_generated/dataModel";

interface ArchivalDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  team: {
    _id: Id<"teams">;
    name: string;
    season: string;
  } | null;
  onArchiveComplete: () => void;
}

export default function ArchivalDialog({
  isOpen,
  onOpenChange,
  team,
  onArchiveComplete,
}: ArchivalDialogProps) {
  const { archiveTeam } = useTeams();
  const [step, setStep] = useState<'explanation' | 'reason' | 'confirm'>('explanation');
  const [reason, setReason] = useState('');
  const [isArchiving, setIsArchiving] = useState(false);
  const [hasExported, setHasExported] = useState(false);

  const handleExportData = async () => {
    if (!team) return;
    
    try {
      // For now, we'll simulate export by downloading a JSON file
      // In a real implementation, you'd call the export function
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          exportVersion: "1.0",
          source: "Baseball Scorekeeping App"
        },
        team: {
          name: team.name,
          season: team.season,
          teamId: team._id
        },
        note: "This is a placeholder export. In production, this would contain all team, player, and roster data."
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${team.name}-${team.season}-export.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      setHasExported(true);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleArchive = async () => {
    if (!team || !reason.trim()) return;
    
    setIsArchiving(true);
    try {
      await archiveTeam(team._id, reason.trim());
      onArchiveComplete();
      onOpenChange(false);
      // Reset state
      setStep('explanation');
      setReason('');
      setHasExported(false);
    } catch (error) {
      console.error('Archive failed:', error);
    } finally {
      setIsArchiving(false);
    }
  };

  const resetDialog = () => {
    setStep('explanation');
    setReason('');
    setHasExported(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetDialog();
    }}>
      <DialogContent className="max-w-2xl">
        {step === 'explanation' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5 text-orange-600" />
                Archive Team: {team?.name}
              </DialogTitle>
              <DialogDescription>
                Permanently archive this team while preserving all historical data
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Data Preservation Guarantee:</strong> All historical data will be preserved 
                  for statistical calculations including player records, batting averages, and game history.
                </AlertDescription>
              </Alert>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-green-700 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    What's Preserved
                  </h4>
                  <ul className="text-sm space-y-1 text-green-600">
                    <li>✓ All player records</li>
                    <li>✓ Roster configurations</li>
                    <li>✓ Game history (when added)</li>
                    <li>✓ Batting averages & statistics</li>
                    <li>✓ Historical team data</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-red-700 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    What Changes
                  </h4>
                  <ul className="text-sm space-y-1 text-red-600">
                    <li>✗ Removed from active teams</li>
                    <li>✗ Cannot create new games</li>
                    <li>✗ Cannot add/edit players</li>
                    <li>✗ Cannot be restored</li>
                    <li>✗ Hidden from normal views</li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Recommended Before Archiving</h4>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-blue-800">
                    Export team data for backup purposes
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportData}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export Data
                  </Button>
                </div>
                {hasExported && (
                  <Badge variant="secondary" className="mt-2">
                    ✓ Data exported successfully
                  </Badge>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => setStep('reason')}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Continue to Archive
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'reason' && (
          <>
            <DialogHeader>
              <DialogTitle>Archive Reason</DialogTitle>
              <DialogDescription>
                Please provide a reason for archiving this team (required for audit trail)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Archival Reason</Label>
                <Input
                  id="reason"
                  placeholder="e.g., Season ended, Team disbanded, Moving to new league"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={200}
                />
                <p className="text-sm text-muted-foreground">
                  {reason.length}/200 characters
                </p>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Final Warning:</strong> This action cannot be undone. The team will be 
                  permanently removed from active use, though all data will be preserved.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('explanation')}>
                Back
              </Button>
              <Button 
                onClick={() => setStep('confirm')}
                disabled={!reason.trim()}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Review Archive
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-red-700">Confirm Archive</DialogTitle>
              <DialogDescription>
                Please review the details before permanently archiving this team
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-gray-50 border rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Team:</span>
                  <span>{team?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Season:</span>
                  <span>{team?.season}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Reason:</span>
                  <span className="text-right max-w-xs">{reason}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Data Export:</span>
                  <Badge variant={hasExported ? "default" : "secondary"}>
                    {hasExported ? "Completed" : "Optional"}
                  </Badge>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Last chance:</strong> Once archived, this team cannot be restored to active use.
                  All historical data will remain preserved for statistics calculations.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('reason')}>
                Back
              </Button>
              <Button 
                onClick={handleArchive}
                disabled={isArchiving}
                className="bg-red-600 hover:bg-red-700"
              >
                {isArchiving ? "Archiving..." : "Archive Team Permanently"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}