import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface PlayerStatistics {
  playerId: string;
  playerName: string;
  position: string;
  battingOrder?: number;
  atBats: number;
  hits: number;
  runs: number;
  rbis: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  walks: number;
  strikeouts: number;
  stolenBases: number;
  errors: number;
  pitchesThrown?: number;
  inningsPitched?: number;
  earnedRuns?: number;
  hitsAllowed?: number;
  walksAllowed?: number;
  strikeoutsRecorded?: number;
}

interface PlayerStatsTrackerProps {
  homeTeamName: string;
  awayTeamName: string;
  homeTeamPlayers: PlayerStatistics[];
  awayTeamPlayers: PlayerStatistics[];
  onUpdateStats: (playerId: string, statCategory: string, increment: number) => void;
}

export const PlayerStatsTracker: React.FC<PlayerStatsTrackerProps> = ({
  homeTeamName,
  awayTeamName,
  homeTeamPlayers,
  awayTeamPlayers,
  onUpdateStats
}) => {
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');
  const [viewMode, setViewMode] = useState<'batting' | 'pitching' | 'fielding'>('batting');

  const currentPlayers = selectedTeam === 'home' ? homeTeamPlayers : awayTeamPlayers;

  const calculateBattingAverage = (hits: number, atBats: number) => {
    if (atBats === 0) return '---';
    return (hits / atBats).toFixed(3);
  };

  const calculateOnBasePercentage = (hits: number, walks: number, hbp: number, atBats: number, sacFlies: number = 0) => {
    const onBaseEvents = hits + walks + hbp;
    const plateAppearances = atBats + walks + hbp + sacFlies;
    if (plateAppearances === 0) return '---';
    return (onBaseEvents / plateAppearances).toFixed(3);
  };

  const calculateSluggingPercentage = (hits: number, doubles: number, triples: number, homeRuns: number, atBats: number) => {
    if (atBats === 0) return '---';
    const totalBases = hits + doubles + (triples * 2) + (homeRuns * 3);
    return (totalBases / atBats).toFixed(3);
  };

  const calculateERA = (earnedRuns: number, inningsPitched: number) => {
    if (inningsPitched === 0) return '---';
    return ((earnedRuns * 9) / inningsPitched).toFixed(2);
  };

  const calculateWHIP = (walksAllowed: number, hitsAllowed: number, inningsPitched: number) => {
    if (inningsPitched === 0) return '---';
    return ((walksAllowed + hitsAllowed) / inningsPitched).toFixed(2);
  };

  const StatButton: React.FC<{ label: string; value: number; statKey: string; playerId: string; increment?: number }> = ({
    label,
    value,
    statKey,
    playerId,
    increment = 1
  }) => (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
      <span className="text-sm font-medium">{label}:</span>
      <div className="flex items-center gap-2">
        <span className="font-bold text-lg w-8 text-center">{value}</span>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-6 w-6 p-0 text-xs"
            onClick={() => onUpdateStats(playerId, statKey, increment)}
          >
            +
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-6 w-6 p-0 text-xs"
            onClick={() => onUpdateStats(playerId, statKey, -increment)}
            disabled={value <= 0}
          >
            -
          </Button>
        </div>
      </div>
    </div>
  );

  const sortedPlayers = useMemo(() => {
    return [...currentPlayers].sort((a, b) => {
      if (a.battingOrder !== undefined && b.battingOrder !== undefined) {
        return a.battingOrder - b.battingOrder;
      }
      return a.playerName.localeCompare(b.playerName);
    });
  }, [currentPlayers]);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <h2 className="text-2xl font-bold">Player Statistics Tracker</h2>
          
          {/* Team Selector */}
          <div className="flex gap-2">
            <Button
              onClick={() => setSelectedTeam('home')}
              variant={selectedTeam === 'home' ? 'default' : 'outline'}
              className="font-semibold"
            >
              {homeTeamName}
            </Button>
            <Button
              onClick={() => setSelectedTeam('away')}
              variant={selectedTeam === 'away' ? 'default' : 'outline'}
              className="font-semibold"
            >
              {awayTeamName}
            </Button>
          </div>

          {/* View Mode Selector */}
          <div className="flex gap-2">
            <Button
              onClick={() => setViewMode('batting')}
              variant={viewMode === 'batting' ? 'default' : 'outline'}
              size="sm"
            >
              Batting
            </Button>
            <Button
              onClick={() => setViewMode('pitching')}
              variant={viewMode === 'pitching' ? 'default' : 'outline'}
              size="sm"
            >
              Pitching
            </Button>
            <Button
              onClick={() => setViewMode('fielding')}
              variant={viewMode === 'fielding' ? 'default' : 'outline'}
              size="sm"
            >
              Fielding
            </Button>
          </div>
        </div>
      </Card>

      {/* Player Statistics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedPlayers.map((player) => (
          <Card key={player.playerId} className="p-4">
            <div className="mb-4">
              <h3 className="text-lg font-bold">{player.playerName}</h3>
              <div className="flex gap-2 text-sm text-gray-600">
                <span>{player.position}</span>
                {player.battingOrder && <span>• #{player.battingOrder}</span>}
              </div>
            </div>

            {viewMode === 'batting' && (
              <div className="space-y-3">
                {/* Key Batting Stats */}
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <div className="font-bold text-lg">{calculateBattingAverage(player.hits, player.atBats)}</div>
                    <div className="text-gray-600">AVG</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg">{calculateOnBasePercentage(player.hits, player.walks, 0, player.atBats)}</div>
                    <div className="text-gray-600">OBP</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg">{calculateSluggingPercentage(player.hits, player.doubles, player.triples, player.homeRuns, player.atBats)}</div>
                    <div className="text-gray-600">SLG</div>
                  </div>
                </div>

                {/* Batting Stats Controls */}
                <div className="space-y-2">
                  <StatButton label="At Bats" value={player.atBats} statKey="atBats" playerId={player.playerId} />
                  <StatButton label="Hits" value={player.hits} statKey="hits" playerId={player.playerId} />
                  <StatButton label="Runs" value={player.runs} statKey="runs" playerId={player.playerId} />
                  <StatButton label="RBIs" value={player.rbis} statKey="rbis" playerId={player.playerId} />
                  <StatButton label="Doubles" value={player.doubles} statKey="doubles" playerId={player.playerId} />
                  <StatButton label="Triples" value={player.triples} statKey="triples" playerId={player.playerId} />
                  <StatButton label="Home Runs" value={player.homeRuns} statKey="homeRuns" playerId={player.playerId} />
                  <StatButton label="Walks" value={player.walks} statKey="walks" playerId={player.playerId} />
                  <StatButton label="Strikeouts" value={player.strikeouts} statKey="strikeouts" playerId={player.playerId} />
                  <StatButton label="Stolen Bases" value={player.stolenBases} statKey="stolenBases" playerId={player.playerId} />
                </div>
              </div>
            )}

            {viewMode === 'pitching' && (
              <div className="space-y-3">
                {/* Key Pitching Stats */}
                <div className="grid grid-cols-2 gap-2 text-center text-sm">
                  <div>
                    <div className="font-bold text-lg">{calculateERA(player.earnedRuns || 0, player.inningsPitched || 0)}</div>
                    <div className="text-gray-600">ERA</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg">{calculateWHIP(player.walksAllowed || 0, player.hitsAllowed || 0, player.inningsPitched || 0)}</div>
                    <div className="text-gray-600">WHIP</div>
                  </div>
                </div>

                {/* Pitching Stats Controls */}
                <div className="space-y-2">
                  <StatButton label="Innings Pitched" value={player.inningsPitched || 0} statKey="inningsPitched" playerId={player.playerId} increment={0.1} />
                  <StatButton label="Pitches Thrown" value={player.pitchesThrown || 0} statKey="pitchesThrown" playerId={player.playerId} />
                  <StatButton label="Hits Allowed" value={player.hitsAllowed || 0} statKey="hitsAllowed" playerId={player.playerId} />
                  <StatButton label="Walks Allowed" value={player.walksAllowed || 0} statKey="walksAllowed" playerId={player.playerId} />
                  <StatButton label="Strikeouts" value={player.strikeoutsRecorded || 0} statKey="strikeoutsRecorded" playerId={player.playerId} />
                  <StatButton label="Earned Runs" value={player.earnedRuns || 0} statKey="earnedRuns" playerId={player.playerId} />
                </div>
              </div>
            )}

            {viewMode === 'fielding' && (
              <div className="space-y-3">
                {/* Fielding Stats */}
                <div className="space-y-2">
                  <StatButton label="Errors" value={player.errors} statKey="errors" playerId={player.playerId} />
                  <div className="text-center text-sm text-gray-600 mt-4">
                    More fielding statistics will be available as plays are recorded
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Team Summary */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Team Summary - {selectedTeam === 'home' ? homeTeamName : awayTeamName}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {currentPlayers.reduce((sum, p) => sum + p.runs, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Runs</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {currentPlayers.reduce((sum, p) => sum + p.hits, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Hits</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {currentPlayers.reduce((sum, p) => sum + p.rbis, 0)}
            </div>
            <div className="text-sm text-gray-600">Total RBIs</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {currentPlayers.reduce((sum, p) => sum + p.errors, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Errors</div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-4">
        <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button 
            className="bg-green-500 hover:bg-green-600 text-white font-bold"
            onClick={() => {
              // Find current batter and add a hit
              const currentBatter = sortedPlayers[0]; // Simplified
              if (currentBatter) {
                onUpdateStats(currentBatter.playerId, 'hits', 1);
                onUpdateStats(currentBatter.playerId, 'atBats', 1);
              }
            }}
          >
            Single
          </Button>
          
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white font-bold"
            onClick={() => {
              const currentBatter = sortedPlayers[0];
              if (currentBatter) {
                onUpdateStats(currentBatter.playerId, 'hits', 1);
                onUpdateStats(currentBatter.playerId, 'doubles', 1);
                onUpdateStats(currentBatter.playerId, 'atBats', 1);
              }
            }}
          >
            Double
          </Button>
          
          <Button 
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold"
            onClick={() => {
              const currentBatter = sortedPlayers[0];
              if (currentBatter) {
                onUpdateStats(currentBatter.playerId, 'walks', 1);
              }
            }}
          >
            Walk
          </Button>
          
          <Button 
            className="bg-red-500 hover:bg-red-600 text-white font-bold"
            onClick={() => {
              const currentBatter = sortedPlayers[0];
              if (currentBatter) {
                onUpdateStats(currentBatter.playerId, 'strikeouts', 1);
                onUpdateStats(currentBatter.playerId, 'atBats', 1);
              }
            }}
          >
            Strikeout
          </Button>
        </div>
      </Card>
    </div>
  );
};