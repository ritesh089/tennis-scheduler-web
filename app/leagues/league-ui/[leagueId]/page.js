'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';

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
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('12:00');
  const [matchLocation, setMatchLocation] = useState('');
  const [matchNotes, setMatchNotes] = useState('');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [playerMatches, setPlayerMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [isDoubles, setIsDoubles] = useState(false);
  const [isPractice, setIsPractice] = useState(false);
  const [isPlayerMember, setIsPlayerMember] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeagueData();
    checkAdminStatus();
    checkMembershipStatus();
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

  async function checkMembershipStatus() {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      // Check if player is already a member
      // Check if player is already a member by looking through leagueData.players
      const isMember = leagueData?.players?.some(player => player.name === userId);
      setIsPlayerMember(isMember);
   

      // Check if player has a pending request
      // Check if player has a pending request by looking through pendingRequests
      const hasPending = pendingRequests.some(request => 
        request.name === userId && request.status === 'Pending'
      );
      setHasPendingRequest(hasPending);
     
    } catch (error) {
      console.error('Error checking membership status:', error);
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
        setHasPendingRequest(true);
        // You might want to show a success message here
      }
    } catch (error) {
      console.error('Error sending join request:', error);
    } finally {
      setIsRequesting(false);
    }
  }

  async function fetchPlayerSchedule(playerId) {
    setLoadingMatches(true);
    try {
      // Comment out the actual API call for demonstration
      // const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/players/${playerId}/matches`);
      // const data = await response.json();
      
      // Use mock data instead
      const data = getMockPlayerSchedule();
      setPlayerMatches(data);
    } catch (error) {
      console.error('Error fetching player schedule:', error);
    } finally {
      setLoadingMatches(false);
    }
  }

  function handleScheduleClick(player) {
    setSelectedPlayer(player);
    setSelectedDate(new Date());
    setSelectedTime('12:00');
    setMatchLocation('');
    setMatchNotes('');
    setIsDoubles(false);
    setIsPractice(false);
    setShowScheduleModal(true);
    fetchPlayerSchedule(player.user_id);
  }

  function getMatchesForDay(date) {
    return playerMatches.filter(match => 
      isSameDay(new Date(match.match_date), date)
    );
  }

  function isTimeSlotAvailable(date, time) {
    const [hours, minutes] = time.split(':').map(Number);
    const matchesOnDay = getMatchesForDay(date);
    
    return !matchesOnDay.some(match => {
      const matchDate = new Date(match.match_date);
      const matchHours = matchDate.getHours();
      const matchMinutes = matchDate.getMinutes();
      
      // Consider a match to block a 2-hour window
      const startHour = matchHours - 1;
      const endHour = matchHours + 1;
      
      if (hours > startHour && hours < endHour) return true;
      if (hours === startHour && minutes >= matchMinutes) return true;
      if (hours === endHour && minutes <= matchMinutes) return true;
      
      return false;
    });
  }

  // Add a function to convert local date and time to UTC datetime string
  function formatDateTimeUTC(date, timeString) {
    // Create a new date object from the selected date
    const dateObj = new Date(date);
    
    // Parse the time string (format: "HH:MM")
    const [hours, minutes] = timeString.split(':').map(Number);
    
    // Set the hours and minutes
    dateObj.setHours(hours, minutes, 0, 0);
    
    // Convert to UTC ISO string and remove the milliseconds and 'Z'
    // Format: "2023-05-15T14:00:00"
    return dateObj.toISOString().slice(0, 19);
  }

  // Update handleScheduleSubmit with the correct payload structure
  async function handleScheduleSubmit(e) {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const userId = localStorage.getItem('userId');
      
      // Format the datetime in UTC
      const datetimeUTC = formatDateTimeUTC(selectedDate, selectedTime);
      
      // Determine match type based on isDoubles toggle
      const matchType = isDoubles ? 'Doubles' : 'Singles';
      
      // Create the correct payload
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          match_type: matchType,
          player1_id: userId,
          player2_id: selectedPlayer.name,
          league_id: leagueId,
          datetime: datetimeUTC,
          location: matchLocation,
          status: 'Pending',
          notes: matchNotes || "Match request",
          is_practice: isPractice // Keep this additional field if your API supports it
        }),
      });

      if (response.ok) {
        setShowScheduleModal(false);
        // Maybe show a success message or refresh data
      }
    } catch (error) {
      console.error('Error scheduling match:', error);
    } finally {
      setIsProcessing(false);
    }
  }

  function getWeekDays() {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 });
    return [...Array(7)].map((_, i) => addDays(start, i));
  }

  function PlayersTab() {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white mb-4">Players</h3>
        <div className="grid gap-4">
          {leagueData?.players?.map((player, index) => (
            <div key={`${player.user_id}-${index}`} className="bg-gray-700 p-4 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-white font-medium">{player.name}</div>
                <div className="text-gray-400 text-sm">Matches played: {player.matches_played}</div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-blue-400">Rank: #{player.rank}</div>
                <button
                  onClick={() => handleScheduleClick(player)}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  Schedule Match
                </button>
              </div>
            </div>
          ))}
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
    const [upcomingMatches, setUpcomingMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      fetchUpcomingMatches();
    }, []);

    async function fetchUpcomingMatches() {
      try {
        setLoading(true);
        
        // Use POST method with status in the JSON payload
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/matches/league/${leagueId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: ['Scheduled', 'Pending', 'Accepted', 'Confirmed'] // Include all relevant statuses
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
         let matches = data.matches;           // Filter to only include upcoming matches (in the future)
          const upcoming = matches.filter(match => {
            const matchDate = new Date(match.datetime || match.match_date);
            return matchDate > new Date(); // Only include matches that are in the future
          });
          
          // Sort by date (closest first)
          upcoming.sort((a, b) => {
            const dateA = new Date(a.datetime || a.match_date);
            const dateB = new Date(b.datetime || b.match_date);
            return dateA - dateB;
          });
          
          setUpcomingMatches(upcoming);
          console.log('Fetched upcoming matches:', upcoming);
        } else {
          setError('Failed to fetch upcoming matches');
        }
      } catch (error) {
        console.error('Error fetching upcoming matches:', error);
        setError('An error occurred while fetching matches');
      } finally {
        setLoading(false);
      }
    }

    if (loading) {
      return <div className="text-center py-8 text-gray-400">Loading upcoming matches...</div>;
    }

    if (error) {
      return <div className="text-center py-8 text-red-400">{error}</div>;
    }

    if (upcomingMatches.length === 0) {
      return <div className="text-center py-8 text-gray-400">No upcoming matches scheduled</div>;
    }

    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white mb-4">Upcoming Matches</h3>
        <div className="grid gap-4">
          {/* Add key prop to each child in the list */}
          {upcomingMatches.map((match, index) => {
            const matchDate = new Date(match.datetime || match.match_date);
            
            return (
              <div key={match.match_id || index} className="bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-white font-medium">
                    {match.match_type || 'Singles'} Match: {match.player1_id} vs {match.player2_id}
                  </div>
                  <div className="bg-green-600 text-white text-sm px-2 py-1 rounded">
                    Scheduled
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <div className="text-gray-400 text-sm">Date & Time:</div>
                    <div className="text-white">
                      {matchDate.toLocaleDateString()} at {matchDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-gray-400 text-sm">Location:</div>
                    <div className="text-white">{match.location}</div>
                  </div>
                </div>
                
                {match.is_practice !== undefined && (
                  <div className="mt-2">
                    <span className="text-gray-400 text-sm mr-2">Format:</span>
                    <span className="text-white">{match.is_practice ? 'Practice' : 'Set Match'}</span>
                  </div>
                )}
                
                {match.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <div className="text-gray-400 text-sm">Notes:</div>
                    <div className="text-gray-300 mt-1">{match.notes}</div>
                  </div>
                )}
              </div>
            );
          })}
          
         
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

  // Add this mock data function for demonstration purposes
  function getMockPlayerSchedule() {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    
    return [
      {
        match_id: "mock-match-1",
        match_date: new Date(today.setHours(16, 0, 0, 0)).toISOString(),
        opponent_name: "John Smith",
        location: "Downtown Tennis Court"
      },
      {
        match_id: "mock-match-2",
        match_date: new Date(tomorrow.setHours(10, 30, 0, 0)).toISOString(),
        opponent_name: "Sarah Johnson",
        location: "Central Park Courts"
      }
    ];
  }

  // Add a function to check if all required fields are filled
  function isFormValid() {
    // Check if date is selected (should always be true since we default to today)
    const isDateSelected = !!selectedDate;
    
    // Check if time is selected (should always be true since we default to 12:00)
    const isTimeSelected = !!selectedTime;
    
    // Check if location is entered and not just whitespace
    const isLocationEntered = !!matchLocation && matchLocation.trim() !== '';
    
    // All fields must be valid
    return isDateSelected && isTimeSelected && isLocationEntered;
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
          disabled={isPlayerMember || hasPendingRequest}
          className={`px-6 py-3 rounded-lg transition-colors ${
            isPlayerMember || hasPendingRequest
              ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isPlayerMember 
            ? 'Member' 
            : hasPendingRequest 
              ? 'Request Pending' 
              : 'Request to Join'}
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

      {/* Schedule Match Modal */}
      {showScheduleModal && selectedPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">
                Schedule Match with {selectedPlayer.name}
              </h2>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {loadingMatches ? (
              <div className="text-center py-4 text-gray-400">Loading player's schedule...</div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium text-white">Select Date & Time</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentWeek(date => addDays(date, -7))}
                        className="px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                      >
                        ◀ Previous
                      </button>
                      <button
                        onClick={() => setCurrentWeek(new Date())}
                        className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Today
                      </button>
                      <button
                        onClick={() => setCurrentWeek(date => addDays(date, 7))}
                        className="px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                      >
                        Next ▶
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                      <div key={day} className="text-center text-gray-400 text-sm">
                        {day}
                      </div>
                    ))}
                    
                    {getWeekDays().map((date) => {
                      const matchesOnDay = getMatchesForDay(date);
                      const hasMatches = matchesOnDay.length > 0;
                      
                      return (
                        <button
                          key={date.toString()}
                          onClick={() => setSelectedDate(date)}
                          className={`p-2 rounded text-center relative ${
                            format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                              ? 'bg-blue-600 text-white'
                              : hasMatches 
                                ? 'bg-amber-800 text-white hover:bg-amber-700' 
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          <div className="text-sm">{format(date, 'MMM d')}</div>
                          {hasMatches && (
                            <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Player's existing schedule for selected day */}
                  <div className="mb-4">
                    <h4 className="text-white font-medium mb-2">
                      {selectedPlayer.name}'s Schedule on {format(selectedDate, 'MMMM d, yyyy')}:
                    </h4>
                    <div className="bg-gray-700 rounded-lg p-3">
                      {getMatchesForDay(selectedDate).length > 0 ? (
                        <ul className="space-y-2">
                          {getMatchesForDay(selectedDate).map(match => (
                            <li key={match.match_id} className="flex items-start">
                              <div className="bg-red-900 px-2 py-1 rounded text-sm text-white mr-2">
                                {format(new Date(match.match_date), 'h:mm a')}
                              </div>
                              <div>
                                <div className="text-white">vs {match.opponent_name}</div>
                                <div className="text-gray-400 text-sm">{match.location}</div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-400">No matches scheduled for this day</p>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-300 mb-2">Time:</label>
                    <select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring focus:border-blue-300"
                    >
                      {[...Array(24)].map((_, hour) => [
                        <option 
                          key={`${hour}-00`} 
                          value={`${hour.toString().padStart(2, '0')}:00`}
                          disabled={!isTimeSlotAvailable(selectedDate, `${hour}:00`)}
                          className={!isTimeSlotAvailable(selectedDate, `${hour}:00`) ? 'bg-red-900' : ''}
                        >
                          {hour.toString().padStart(2, '0')}:00
                          {!isTimeSlotAvailable(selectedDate, `${hour}:00`) ? ' (Unavailable)' : ''}
                        </option>,
                        <option 
                          key={`${hour}-30`} 
                          value={`${hour.toString().padStart(2, '0')}:30`}
                          disabled={!isTimeSlotAvailable(selectedDate, `${hour}:30`)}
                          className={!isTimeSlotAvailable(selectedDate, `${hour}:30`) ? 'bg-red-900' : ''}
                        >
                          {hour.toString().padStart(2, '0')}:30
                          {!isTimeSlotAvailable(selectedDate, `${hour}:30`) ? ' (Unavailable)' : ''}
                        </option>
                      ]).flat()}
                    </select>
                  </div>
                </div>

                <form onSubmit={handleScheduleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-gray-300 mb-2">Location:</label>
                    <input
                      type="text"
                      value={matchLocation}
                      onChange={(e) => setMatchLocation(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring focus:border-blue-300"
                      placeholder="Enter match location"
                    />
                  </div>
                  
                  <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-6 sm:justify-between">
                    {/* Singles/Doubles Toggle */}
                    <div className="flex items-center">
                      <label className="flex items-center cursor-pointer">
                        <div className="mr-3 text-gray-300">Match Type:</div>
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            className="sr-only" 
                            checked={isDoubles}
                            onChange={() => setIsDoubles(!isDoubles)}
                          />
                          <div className={`block w-14 h-8 rounded-full transition-colors ${
                            isDoubles ? 'bg-blue-600' : 'bg-gray-600'
                          }`}></div>
                          <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                            isDoubles ? 'transform translate-x-6' : ''
                          }`}></div>
                        </div>
                        <div className="ml-3 text-gray-300">
                          {isDoubles ? 'Doubles' : 'Singles'}
                        </div>
                      </label>
                    </div>
                    
                    {/* Practice/Set Toggle */}
                    <div className="flex items-center">
                      <label className="flex items-center cursor-pointer">
                        <div className="mr-3 text-gray-300">Format:</div>
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            className="sr-only" 
                            checked={isPractice}
                            onChange={() => setIsPractice(!isPractice)}
                          />
                          <div className={`block w-14 h-8 rounded-full transition-colors ${
                            isPractice ? 'bg-blue-600' : 'bg-gray-600'
                          }`}></div>
                          <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                            isPractice ? 'transform translate-x-6' : ''
                          }`}></div>
                        </div>
                        <div className="ml-3 text-gray-300">
                          {isPractice ? 'Practice' : 'Set Match'}
                        </div>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 mb-2">Notes (Optional):</label>
                    <textarea
                      value={matchNotes}
                      onChange={(e) => setMatchNotes(e.target.value)}
                      rows="3"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring focus:border-blue-300"
                      placeholder="Any additional details about the match"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowScheduleModal(false)}
                      className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessing || !isFormValid()}
                      className={`px-4 py-2 rounded text-white transition-colors ${
                        isProcessing || !isFormValid()
                          ? 'bg-gray-600 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {isProcessing ? 'Scheduling...' : 'Schedule Match'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
