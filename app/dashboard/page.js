// app/dashboard/page.js
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import Link from 'next/link';

export default function Dashboard() {
  const searchParams = useSearchParams();
  const showPendingOnly = searchParams.get('view') === 'pending';
  const showRejected = searchParams.get('showRejected') === 'true';
  
  const [matches, setMatches] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filteredMatches, setFilteredMatches] = useState([]);

  useEffect(() => {
    fetchMatches();
  }, [currentWeek, showPendingOnly]);

  useEffect(() => {
    // Filter matches based on showRejected flag
    if (matches.length > 0) {
      let filtered;
      
      if (showPendingOnly) {
        // When viewing pending only, show only pending matches
        filtered = matches.filter(match => 
          match.status?.toLowerCase() === 'pending'
        );
      } else if (!showRejected) {
        // Explicitly filter out any matches with 'rejected' status
        filtered = matches.filter(match => {
          const status = match.status?.toLowerCase();
          return status !== 'rejected' && status !== 'cancelled';
        });
      } else {
        // Show all matches when showRejected is true
        filtered = [...matches];
      }
      
      setFilteredMatches(filtered);
      console.log('Filtered matches:', filtered); // Debug log
    }
  }, [matches, showRejected, showPendingOnly]);

  async function fetchMatches() {
    try {
      setLoading(true);
      const playerId = localStorage.getItem('userId');
      let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/matches/player/${playerId}`;
      
      if (showPendingOnly) {
        url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/matches/pending/${playerId}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setMatches(data.matches.filter(match => match.status !== 'Rejected'));
        setLoading(false);
      } else {
        console.error('Error fetching matches:', data);
        setLoading(false);
      } 

    } catch (error) {
      console.error('Error fetching matches:', error);
      setLoading(false);
    }
  }

  function getWeekDays() {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Start from Monday
    return [...Array(7)].map((_, i) => addDays(start, i));
  }

  function getMatchesForDay(date) {
    return matches.filter(match => {
      
      const matchDate = new Date(match.datetime || match.match_date);
      return isSameDay(matchDate, date);
    });
  }

  function getMatchStatusColor(status) {
    switch((status || '').toLowerCase()) {
      case 'pending':
        return 'bg-yellow-600';
      case 'confirmed':
      case 'accepted':
      case 'scheduled':
        return 'bg-green-600';
      case 'completed':
        return 'bg-blue-600';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">
          {showPendingOnly ? 'Pending Matches' : 'My Dashboard'}
        </h1>
        
        {showPendingOnly && (
          <Link href="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
            View All Matches
          </Link>
        )}
      </div>
      
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-7 gap-4 mb-4">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
            <div key={`day-header-${index}`} className="text-center text-gray-300 font-semibold">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-4">
          {getWeekDays().map((date) => {
            const dayMatches = getMatchesForDay(date);
            const hasPendingMatches = dayMatches.some(match => 
              match.status?.toLowerCase() === 'pending'
            );
            
            return (
              <div
                key={date.toString()}
                className={`min-h-[150px] rounded-lg p-3 cursor-pointer hover:bg-gray-600 transition-colors ${
                  hasPendingMatches ? 'bg-yellow-900/30' : 'bg-gray-700'
                }`}
                onClick={() => setSelectedDate(date)}
              >
                <div className="text-gray-300 mb-2 text-sm">
                  {format(date, 'MMM d')}
                </div>
                
                <div className="space-y-2">
                  
                  {/* Add key prop to each child in the list */}
                  {dayMatches.length === 0 && (
                    <div key="no-matches" className="text-gray-500 text-sm">
                      No matches
                    </div>
                  )}
                  {dayMatches.map((match) => {
                    const matchDate = new Date(match.datetime || match.match_date);
                    const statusColor = getMatchStatusColor(match.status);
                    
                    return (
                      <div
                        key={match.match_id || `match-${match.player1_id}-${match.player2_id}-${matchDate.getTime()}`}
                        className={`rounded p-2 text-sm text-white ${statusColor}`}
                      >
                        <div className="font-semibold">
                          {format(matchDate, 'h:mm a')}
                        </div>
                        <div className="text-gray-300">
                          vs {match.opponent_name || match.player2_name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {match.location}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-center space-x-4">
          <button
            onClick={() => setCurrentWeek(date => addDays(date, -7))}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Previous Week
          </button>
          <button
            onClick={() => setCurrentWeek(new Date())}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentWeek(date => addDays(date, 7))}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Next Week
          </button>
        </div>
      </div>

      {/* Day Detail View */}
      {selectedDate && (
        <DayDetailView
          date={selectedDate}
          matches={getMatchesForDay(selectedDate)}
          onClose={() => setSelectedDate(null)}
          getMatchStatusColor={getMatchStatusColor}
        />
      )}
    </div>
  );
}

function DayDetailView({ date, matches, onClose, getMatchStatusColor }) {
  const [processingMatchId, setProcessingMatchId] = useState(null);
  const [error, setError] = useState(null);

  async function handleAcceptMatch(matchId) {
    setProcessingMatchId(matchId);
    setError(null);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/matches/${matchId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          match_id: matchId,
          player_id: localStorage.getItem('userId'),
          reason: 'Accepted'
        }),
      });
      
      if (response.ok) {
        // Refresh the dashboard to show updated match status
        window.location.reload();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to accept match');
      }
    } catch (error) {
      console.error('Error accepting match:', error);
      setError('An error occurred while accepting the match');
    } finally {
      setProcessingMatchId(null);
    }
  }

  async function handleRejectMatch(matchId) {
    setProcessingMatchId(matchId);
    setError(null);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/matches/${matchId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          match_id: matchId,
          player_id: localStorage.getItem('userId'),
          reason: 'Rejected'
        }),
      });
      
      if (response.ok) {
        // Refresh the dashboard to show updated match status
        window.location.reload();
      } else {
        console.log('Failed to reject match:', response);
        const errorData = await response.json();
        setError(errorData.message || 'Failed to reject match');
      }
    } catch (error) {
      console.error('Error rejecting match:', error);
      setError('An error occurred while rejecting the match');
    } finally {
      setProcessingMatchId(null);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {format(date, 'MMMM d, yyyy')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-900 text-white p-3 rounded mb-4">
            {error}
          </div>
        )}

        {matches.length > 0 ? (
          <div className="space-y-4">
            {matches.map((match) => {
              const matchDate = new Date(match.datetime || match.match_date);
              const statusColor = getMatchStatusColor(match.status);
              const isPending = match.status?.toLowerCase() === 'pending';
              const isProcessing = processingMatchId === match.match_id;
              
              return (
                <div
                  key={match.id || `match-${match.player1_id}-${match.player2_id}-${matchDate.getTime()}`}
                  className={`${statusColor} rounded-lg p-4 text-white`}
                >
                  <div className="text-xl font-semibold">
                    {format(matchDate, 'h:mm a')}
                  </div>
                  <div className="text-gray-200 mt-2">
                    {match.match_type || 'Singles'} Match vs {match.opponent_name || match.player2_name}
                  </div>
                  <div className="text-gray-300 mt-1">
                    Location: {match.location}
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-sm text-gray-300">
                      Status: {match.status || 'Pending'}
                    </div>
                    {isPending && (
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleAcceptMatch(match.id)}
                          disabled={isProcessing}
                          className={`px-3 py-1 text-white text-sm rounded transition-colors ${
                            isProcessing 
                              ? 'bg-gray-600 cursor-not-allowed' 
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {isProcessing && processingMatchId === match.id ? 'Processing...' : 'Accept'}
                        </button>
                        <button 
                          onClick={() => handleRejectMatch(match.id)}
                          disabled={isProcessing}
                          className={`px-3 py-1 text-white text-sm rounded transition-colors ${
                            isProcessing 
                              ? 'bg-gray-600 cursor-not-allowed' 
                              : 'bg-red-600 hover:bg-red-700'
                          }`}
                        >
                          {isProcessing && processingMatchId === match.match_id ? 'Processing...' : 'Decline'}
                        </button>
                      </div>
                    )}
                  </div>
                  {match.notes && (
                    <div className="text-gray-300 mt-2 text-sm">
                      Notes: {match.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400 text-center">No matches scheduled for this day</p>
        )}
      </div>
    </div>
  );
}
