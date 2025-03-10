'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function LeaguePage() {
  const { leagueId } = useParams();
  const [activeTab, setActiveTab] = useState('players');
  const [leagueData, setLeagueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [joinComment, setJoinComment] = useState('');
  const [isLeagueAdmin, setIsLeagueAdmin] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [acceptNote, setAcceptNote] = useState('');

  useEffect(() => {
    fetchLeagueData();
    checkAdminStatus();
    if (isLeagueAdmin) {
      fetchPendingRequests();
    }
  }, [leagueId, isLeagueAdmin]);

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

  async function checkAdminStatus() {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/leagues/${leagueId}/players/${userId}/role`);
      const data = await response.json();
      setIsLeagueAdmin(data.role === 'admin');
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  }

  async function fetchPendingRequests() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/leagues/${leagueId}/join-requests`);
      const data = await response.json();
      setPendingRequests(data);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  }

  async function handleAcceptRequest(requestId) {
    setIsProcessing(true);
    try {
      // First, approve the request
      const approveResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/leagues/${leagueId}/join-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (approveResponse.ok) {
        // Then, add the user to the league
        const request = pendingRequests.find(req => req.request_id === requestId);
        const addUserResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/leagues/${leagueId}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            player_id: request.player_id,
          }),
        });

        if (addUserResponse.ok) {
          // Refresh the pending requests list
          fetchPendingRequests();
        }
      }
    } catch (error) {
      console.error('Error accepting request:', error);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleRejectRequest(requestId) {
    setSelectedRequestId(requestId);
    setShowRejectDialog(true);
  }

  async function submitReject(requestId, note) {
    setIsProcessing(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/leagues/${leagueId}/join-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'rejected',
          notes: note || null
        }),
      });

      if (response.ok) {
        setShowRejectDialog(false);
        setSelectedRequestId(null);
        fetchPendingRequests();
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleJoinRequest(e) {
    e.preventDefault();
    setIsRequesting(true);
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/leagues/${leagueId}/join-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_id: userId,
          description: joinComment
        }),
      });

      if (response.ok) {
        setShowJoinDialog(false);
        setJoinComment('');
        // Refresh league data to update UI
        fetchLeagueData();
      } else {
        console.error('Failed to join league');
      }
    } catch (error) {
      console.error('Error sending join request:', error);
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
            <div key={player.name} className="bg-gray-700 p-4 rounded-lg flex items-center justify-between">
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

  function PendingRequestsTab() {
    const [dialogRejectNote, setDialogRejectNote] = useState('');
    
    const handleRejectNoteChange = (e) => {
      e.stopPropagation();
      setDialogRejectNote(e.target.value);
    };
    
    const handleSubmitReject = (e) => {
      e.preventDefault();
      submitReject(selectedRequestId, dialogRejectNote);
    };
    
    const handleCloseRejectDialog = () => {
      setShowRejectDialog(false);
      setSelectedRequestId(null);
    };

    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white mb-4">Pending Join Requests</h3>
        {pendingRequests.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No pending requests</p>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div key={request.request_id} className="bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-white font-bold">{request.player_id}</h4>
                    <p className="text-gray-300 mt-2">{request.comment}</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Requested: {new Date(request.request_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAcceptRequest(request.request_id)}
                      disabled={isProcessing}
                      className={`px-4 py-2 text-white rounded transition-colors ${
                        isProcessing 
                          ? 'bg-gray-600 cursor-not-allowed' 
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.request_id)}
                      disabled={isProcessing}
                      className={`px-4 py-2 text-white rounded transition-colors ${
                        isProcessing 
                          ? 'bg-gray-600 cursor-not-allowed' 
                          : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reject Dialog */}
        {showRejectDialog && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-white mb-4">Reject Request</h2>
              <form onSubmit={handleSubmitReject} className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">
                    Notes (Optional):
                  </label>
                  <textarea
                    value={dialogRejectNote}
                    onChange={handleRejectNoteChange}
                    rows="4"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring focus:border-blue-300"
                    placeholder="Add any notes about the rejection..."
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCloseRejectDialog}
                    className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className={`px-4 py-2 rounded text-white transition-colors ${
                      isProcessing
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {isProcessing ? 'Rejecting...' : 'Reject Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
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
          onClick={() => setShowJoinDialog(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Request to Join
        </button>
      </div>

      {/* Join Request Dialog */}
      {showJoinDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-white mb-4">Join Request</h2>
            <form onSubmit={handleJoinRequest} className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">
                  Why do you want to join this league?
                </label>
                <textarea
                  value={joinComment}
                  onChange={(e) => setJoinComment(e.target.value)}
                  required
                  rows="4"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring focus:border-blue-300"
                  placeholder="Share your interest in joining..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowJoinDialog(false)}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRequesting || !joinComment.trim()}
                  className={`px-4 py-2 rounded text-white transition-colors ${
                    isRequesting || !joinComment.trim()
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isRequesting ? 'Sending Request...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
          {isLeagueAdmin && (
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'requests'
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Pending Requests
              {pendingRequests.length > 0 && (
                <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          )}
        </div>

        <div className="p-6">
          {activeTab === 'players' && <PlayersTab />}
          {activeTab === 'leaderboard' && <LeaderboardTab />}
          {activeTab === 'upcoming' && <UpcomingMatchesTab />}
          {activeTab === 'requests' && isLeagueAdmin && <PendingRequestsTab />}
        </div>
      </div>
    </div>
  );
}
