'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function LeaguePage() {
  const { leagueId } = useParams();
  const [activeTab, setActiveTab] = useState('players');
  const [leagueData, setLeagueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    fetchLeagueData();
  }, [leagueId]);

  async function fetchLeagueData() {
    try {
      const [leagueResponse, playersResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/leagues/${leagueId}`),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/leagues/${leagueId}/players`)
      ]);
      
      const [leagueDetails, playersData] = await Promise.all([
        leagueResponse.json(),
        playersResponse.json()
      ]);

      setLeagueData({
        ...leagueDetails,
        players: playersData
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching league data:', error);
      setLoading(false);
    }
  }

  async function handleJoinRequest() {
    try {
      setIsRequesting(true);
      const userId = localStorage.getItem('userId');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/leagues/${leagueId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      });

      if (response.ok) {
        // Refresh league data to update UI
        fetchLeagueData();
      } else {
        console.error('Failed to join league');
      }
    } catch (error) {
      console.error('Error joining league:', error);
    } finally {
      setIsRequesting(false);
    }
  }

  function PlayersTab() {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white mb-4">Players</h3>
        <div className="grid gap-4">
          {leagueData?.players?.map((player) => (
            <div key={player.user_id} className="bg-gray-700 p-4 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-white font-medium">{player.name}</div>
                <div className="text-gray-400 text-sm">Matches played: {player.matches_played}</div>
              </div>
              <div className="text-blue-400">Rank: #{player.rank}</div>
            </div>
          ))}
          {(!leagueData?.players || leagueData.players.length === 0) && (
            <div className="text-gray-400 text-center py-4">
              No players have joined this league yet.
            </div>
          )}
        </div>
      </div>
    );
  }

  function LeaderboardTab() {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white mb-4">Leaderboard</h3>
        <div className="bg-gray-700 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-800">
              <tr>
                <th className="p-4 text-gray-300">Rank</th>
                <th className="p-4 text-gray-300">Player</th>
                <th className="p-4 text-gray-300">Wins</th>
                <th className="p-4 text-gray-300">Losses</th>
                <th className="p-4 text-gray-300">Points</th>
              </tr>
            </thead>
            <tbody>
              {leagueData?.leaderboard?.map((entry, index) => (
                <tr key={entry.user_id} className="border-t border-gray-600">
                  <td className="p-4 text-white">{index + 1}</td>
                  <td className="p-4 text-white">{entry.name}</td>
                  <td className="p-4 text-green-400">{entry.wins}</td>
                  <td className="p-4 text-red-400">{entry.losses}</td>
                  <td className="p-4 text-blue-400">{entry.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function UpcomingMatchesTab() {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white mb-4">Upcoming Matches</h3>
        <div className="grid gap-4">
          {leagueData?.upcoming_matches?.map((match) => (
            <div key={match.match_id} className="bg-gray-700 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <div className="text-white font-medium">
                  {match.player1} vs {match.player2}
                </div>
                <div className="text-gray-400 text-sm">
                  {new Date(match.match_date).toLocaleDateString()}
                </div>
              </div>
              <div className="text-gray-400 text-sm">{match.location}</div>
              {match.notes && (
                <div className="text-gray-500 text-sm mt-2">{match.notes}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="text-white text-center">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{leagueData?.league_name}</h1>
          <p className="text-gray-400">{leagueData?.description}</p>
        </div>
        <button
          onClick={handleJoinRequest}
          disabled={isRequesting}
          className={`px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors
            ${isRequesting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isRequesting ? 'Requesting...' : 'Request to Join'}
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('players')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'players'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Players
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'leaderboard'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Leaderboard
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'upcoming'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Upcoming Matches
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'players' && <PlayersTab />}
          {activeTab === 'leaderboard' && <LeaderboardTab />}
          {activeTab === 'upcoming' && <UpcomingMatchesTab />}
        </div>
      </div>
    </div>
  );
}
