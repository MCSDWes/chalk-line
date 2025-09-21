import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Printer, Share2, FileText, BarChart3, Trophy } from 'lucide-react';

interface GameSummaryProps {
  gameId: string;
  homeTeamName: string;
  awayTeamName: string;
  gameDate: string;
  gameTime?: string;
  field?: string;
  homeScore: number;
  awayScore: number;
  currentInning: number;
  gameStatus: string;
  innings: Array<{
    inningNumber: number;
    homeRuns: number;
    awayRuns: number;
    homeHits: number;
    awayHits: number;
    homeErrors: number;
    awayErrors: number;
  }>;
  playByPlay: Array<{
    inning: number;
    half: 'top' | 'bottom';
    batter: string;
    play: string;
    description: string;
    timestamp: string;
  }>;
  playerStats: {
    home: Array<{
      playerName: string;
      position: string;
      atBats: number;
      hits: number;
      runs: number;
      rbis: number;
      avg: number;
    }>;
    away: Array<{
      playerName: string;
      position: string;
      atBats: number;
      hits: number;
      runs: number;
      rbis: number;
      avg: number;
    }>;
  };
}

export const GameSummary: React.FC<GameSummaryProps> = ({
  gameId,
  homeTeamName,
  awayTeamName,
  gameDate,
  gameTime,
  field,
  homeScore,
  awayScore,
  currentInning,
  gameStatus,
  innings,
  playByPlay,
  playerStats
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'boxscore' | 'plays' | 'stats'>('summary');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getWinner = () => {
    if (homeScore > awayScore) return homeTeamName;
    if (awayScore > homeScore) return awayTeamName;
    return 'Tie';
  };

  const getGameStatusBadge = () => {
    const statusColors = {
      'completed': 'bg-green-500',
      'in_progress': 'bg-blue-500',
      'suspended': 'bg-yellow-500',
      'cancelled': 'bg-red-500'
    };
    
    return (
      <Badge className={`${statusColors[gameStatus as keyof typeof statusColors] || 'bg-gray-500'} text-white`}>
        {gameStatus === 'completed' ? 'Final' : 
         gameStatus === 'in_progress' ? 'In Progress' : 
         gameStatus.charAt(0).toUpperCase() + gameStatus.slice(1)}
      </Badge>
    );
  };

  const exportGameData = (format: 'json' | 'csv' | 'pdf') => {
    console.log(`Exporting game data as ${format.toUpperCase()}`);
    // TODO: Implement export functionality
  };

  const shareGame = () => {
    console.log('Sharing game summary');
    // TODO: Implement share functionality
  };

  const printSummary = () => {
    window.print();
  };

  const totalHits = {
    home: innings.reduce((sum, inning) => sum + (inning.homeHits || 0), 0),
    away: innings.reduce((sum, inning) => sum + (inning.awayHits || 0), 0)
  };

  const totalErrors = {
    home: innings.reduce((sum, inning) => sum + (inning.homeErrors || 0), 0),
    away: innings.reduce((sum, inning) => sum + (inning.awayErrors || 0), 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Game Summary</h1>
            <div className="text-lg text-gray-600">
              {formatDate(gameDate)}
              {gameTime && ` at ${formatTime(gameTime)}`}
              {field && ` - ${field}`}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {getGameStatusBadge()}
            <Button onClick={() => exportGameData('pdf')} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
            <Button onClick={printSummary} variant="outline" className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button onClick={shareGame} variant="outline" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </Card>

      {/* Final Score */}
      <Card className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-6">Final Score</h2>
          <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto">
            <div className={`text-center p-6 rounded-lg ${awayScore > homeScore ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-100'}`}>
              <h3 className="text-xl font-semibold mb-2">{awayTeamName}</h3>
              <div className="text-6xl font-bold text-blue-600 mb-2">{awayScore}</div>
              <Badge variant="outline">Away</Badge>
              {awayScore > homeScore && (
                <div className="mt-2">
                  <Trophy className="h-6 w-6 mx-auto text-yellow-500" />
                  <div className="text-sm font-semibold text-green-700">Winner</div>
                </div>
              )}
            </div>
            
            <div className={`text-center p-6 rounded-lg ${homeScore > awayScore ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-100'}`}>
              <h3 className="text-xl font-semibold mb-2">{homeTeamName}</h3>
              <div className="text-6xl font-bold text-red-600 mb-2">{homeScore}</div>
              <Badge variant="outline">Home</Badge>
              {homeScore > awayScore && (
                <div className="mt-2">
                  <Trophy className="h-6 w-6 mx-auto text-yellow-500" />
                  <div className="text-sm font-semibold text-green-700">Winner</div>
                </div>
              )}
            </div>
          </div>
          
          {homeScore === awayScore && (
            <div className="mt-4 text-lg font-semibold text-gray-600">
              Game ended in a tie
            </div>
          )}
        </div>
      </Card>

      {/* Tab Navigation */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            onClick={() => setActiveTab('summary')}
            variant={activeTab === 'summary' ? 'default' : 'outline'}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Summary
          </Button>
          <Button
            onClick={() => setActiveTab('boxscore')}
            variant={activeTab === 'boxscore' ? 'default' : 'outline'}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Box Score
          </Button>
          <Button
            onClick={() => setActiveTab('plays')}
            variant={activeTab === 'plays' ? 'default' : 'outline'}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Play by Play
          </Button>
          <Button
            onClick={() => setActiveTab('stats')}
            variant={activeTab === 'stats' ? 'default' : 'outline'}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Player Stats
          </Button>
        </div>
      </Card>

      {/* Tab Content */}
      {activeTab === 'summary' && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Game Info */}
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Game Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Game ID:</span>
                <span>{gameId}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Duration:</span>
                <span>{currentInning} innings</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Winner:</span>
                <span className="font-bold">{getWinner()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Margin:</span>
                <span>{Math.abs(homeScore - awayScore)} runs</span>
              </div>
            </div>
          </Card>

          {/* Team Totals */}
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Team Totals</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Team</th>
                    <th className="text-center py-2">R</th>
                    <th className="text-center py-2">H</th>
                    <th className="text-center py-2">E</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 font-medium">{awayTeamName}</td>
                    <td className="text-center py-2 font-bold">{awayScore}</td>
                    <td className="text-center py-2">{totalHits.away}</td>
                    <td className="text-center py-2">{totalErrors.away}</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">{homeTeamName}</td>
                    <td className="text-center py-2 font-bold">{homeScore}</td>
                    <td className="text-center py-2">{totalHits.home}</td>
                    <td className="text-center py-2">{totalErrors.home}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'boxscore' && (
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Inning by Inning</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 font-bold">Team</th>
                  {Array.from({ length: Math.max(9, currentInning) }, (_, i) => (
                    <th key={i} className="text-center py-3 min-w-[40px] font-bold">
                      {i + 1}
                    </th>
                  ))}
                  <th className="text-center py-3 font-bold bg-blue-100">R</th>
                  <th className="text-center py-3 font-bold bg-green-100">H</th>
                  <th className="text-center py-3 font-bold bg-red-100">E</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 font-bold">{awayTeamName}</td>
                  {Array.from({ length: Math.max(9, currentInning) }, (_, i) => {
                    const inning = innings.find(inn => inn.inningNumber === i + 1);
                    return (
                      <td key={i} className="text-center py-3">
                        {inning?.awayRuns ?? (i < currentInning ? 0 : '-')}
                      </td>
                    );
                  })}
                  <td className="text-center py-3 font-bold bg-blue-50">{awayScore}</td>
                  <td className="text-center py-3 bg-green-50">{totalHits.away}</td>
                  <td className="text-center py-3 bg-red-50">{totalErrors.away}</td>
                </tr>
                <tr>
                  <td className="py-3 font-bold">{homeTeamName}</td>
                  {Array.from({ length: Math.max(9, currentInning) }, (_, i) => {
                    const inning = innings.find(inn => inn.inningNumber === i + 1);
                    return (
                      <td key={i} className="text-center py-3">
                        {inning?.homeRuns ?? (i < currentInning ? 0 : '-')}
                      </td>
                    );
                  })}
                  <td className="text-center py-3 font-bold bg-blue-50">{homeScore}</td>
                  <td className="text-center py-3 bg-green-50">{totalHits.home}</td>
                  <td className="text-center py-3 bg-red-50">{totalErrors.home}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'plays' && (
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Play by Play</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {playByPlay.length > 0 ? (
              playByPlay.map((play, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold">
                      {play.half === 'top' ? 'Top' : 'Bottom'} {play.inning}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(play.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">{play.batter}</span> - {play.play}
                  </div>
                  <div className="text-xs text-gray-600">{play.description}</div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                No play-by-play data available
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'stats' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Home Team Stats */}
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">{homeTeamName} - Batting</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Player</th>
                    <th className="text-center py-2">Pos</th>
                    <th className="text-center py-2">AB</th>
                    <th className="text-center py-2">H</th>
                    <th className="text-center py-2">R</th>
                    <th className="text-center py-2">RBI</th>
                    <th className="text-center py-2">AVG</th>
                  </tr>
                </thead>
                <tbody>
                  {playerStats.home.length > 0 ? (
                    playerStats.home.map((player, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 font-medium">{player.playerName}</td>
                        <td className="text-center py-2">{player.position}</td>
                        <td className="text-center py-2">{player.atBats}</td>
                        <td className="text-center py-2">{player.hits}</td>
                        <td className="text-center py-2">{player.runs}</td>
                        <td className="text-center py-2">{player.rbis}</td>
                        <td className="text-center py-2">{player.avg.toFixed(3)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-gray-500">
                        No player statistics available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Away Team Stats */}
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">{awayTeamName} - Batting</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Player</th>
                    <th className="text-center py-2">Pos</th>
                    <th className="text-center py-2">AB</th>
                    <th className="text-center py-2">H</th>
                    <th className="text-center py-2">R</th>
                    <th className="text-center py-2">RBI</th>
                    <th className="text-center py-2">AVG</th>
                  </tr>
                </thead>
                <tbody>
                  {playerStats.away.length > 0 ? (
                    playerStats.away.map((player, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 font-medium">{player.playerName}</td>
                        <td className="text-center py-2">{player.position}</td>
                        <td className="text-center py-2">{player.atBats}</td>
                        <td className="text-center py-2">{player.hits}</td>
                        <td className="text-center py-2">{player.runs}</td>
                        <td className="text-center py-2">{player.rbis}</td>
                        <td className="text-center py-2">{player.avg.toFixed(3)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-gray-500">
                        No player statistics available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Export Options */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Export Options</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button 
            onClick={() => exportGameData('json')} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            JSON
          </Button>
          <Button 
            onClick={() => exportGameData('csv')} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button 
            onClick={() => exportGameData('pdf')} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            PDF Report
          </Button>
          <Button 
            onClick={shareGame} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share Link
          </Button>
        </div>
      </Card>
    </div>
  );
};