'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function LeagueDetail() {
  // Access the dynamic parameter from the URL
  const { leagueId } = useParams();
  const [league, setLeague] = useState(null);

  useEffect(() => {
    async function fetchLeague() {
      // Fetch league details from your backend
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/leagues/${leagueId}`);
      const data = await res.json();
      setLeague(data);
    }
    if (leagueId) {
      fetchLeague();
    }
  }, [leagueId]);

  if (!league) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-white">Loading league details...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <div className="max-w-3xl w-full bg-gray-800 p-8 shadow rounded text-white">
        <h1 className="text-3xl font-bold mb-4 text-center">{league.league_name}</h1>
        <p className="mb-4">{league.description}</p>
        {/* You can add additional info here (e.g., members list, admin controls, etc.) */}
      </div>
    </div>
  );
}
