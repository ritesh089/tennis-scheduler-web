// app/dashboard/page.js
'use client';

import { useEffect, useState } from 'react';
import { getPlayerCalendar } from '../../lib/api';

export default function Dashboard() {
  const [calendar, setCalendar] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Check if user ID exists in localStorage
    const storedUserId = localStorage.getItem('userId');
    setUserId(storedUserId);

    async function fetchCalendar() {
      if (storedUserId) {
        const data = await getPlayerCalendar(storedUserId);
        setCalendar(data);
      }
    }
    fetchCalendar();
  }, []);

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="max-w-4xl w-full bg-gray-800 p-8 shadow rounded">
          <p className="text-center text-white">Please log in to view your calendar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="max-w-4xl w-full bg-gray-800 p-8 shadow rounded">
        <h2 className="text-2xl font-bold mb-4 text-center text-white">Your Calendar (User ID: {userId})</h2>
        {calendar ? (
          <pre className="bg-gray-700 p-4 rounded whitespace-pre-wrap break-words text-white">
            {JSON.stringify(calendar, null, 2)}
          </pre>
        ) : (
          <p className="text-center text-white">Loading calendar...</p>
        )}
      </div>
    </div>
  );
}
