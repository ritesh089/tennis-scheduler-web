// app/dashboard/page.js
'use client';

import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';

export default function Dashboard() {
  const [matches, setMatches] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    fetchMatches();
  }, [currentWeek]);

  async function fetchMatches() {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/matches/user/${userId}`);
      const data = await response.json();
      setMatches(data);
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  }

  function getWeekDays() {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 });
    return [...Array(7)].map((_, i) => addDays(start, i));
  }

  function getMatchesForDay(date) {
    return matches.filter(match => {
      const matchDate = new Date(match.match_date);
      return format(matchDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });
  }

  function DayDetailView({ date, onClose }) {
    const dayMatches = getMatchesForDay(date);
    
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

          {dayMatches.length > 0 ? (
            <div className="space-y-4">
              {dayMatches.map((match) => (
                <div
                  key={match.match_id}
                  className="bg-gray-700 rounded-lg p-4 text-white"
                >
                  <div className="text-xl font-semibold">
                    {format(new Date(match.match_date), 'h:mm a')}
                  </div>
                  <div className="text-gray-300 mt-2">
                    Opponent: {match.opponent_name}
                  </div>
                  <div className="text-gray-400 mt-1">
                    Location: {match.location}
                  </div>
                  {match.notes && (
                    <div className="text-gray-400 mt-2 text-sm">
                      Notes: {match.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center">No matches scheduled for this day</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">My Dashboard</h1>
      
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-7 gap-4 mb-4">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="text-center text-gray-300 font-semibold">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-4">
          {getWeekDays().map((date) => (
            <div
              key={date.toString()}
              className="min-h-[150px] bg-gray-700 rounded-lg p-3 cursor-pointer hover:bg-gray-600 transition-colors"
              onClick={() => setSelectedDate(date)}
            >
              <div className="text-gray-300 mb-2 text-sm">
                {format(date, 'MMM d')}
              </div>
              <div className="space-y-2">
                {getMatchesForDay(date).map((match) => (
                  <div
                    key={match.match_id}
                    className="bg-blue-900 rounded p-2 text-sm text-white"
                  >
                    <div className="font-semibold">
                      {format(new Date(match.match_date), 'h:mm a')}
                    </div>
                    <div className="text-gray-300">
                      vs {match.opponent_name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {match.location}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
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

      {selectedDate && (
        <DayDetailView
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}
