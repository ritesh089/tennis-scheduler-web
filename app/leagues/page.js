// app/leagues/page.js
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function LeaguesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [leagues, setLeagues] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState('');
  const [newLeagueDescription, setNewLeagueDescription] = useState('');
  const [loading, setLoading] = useState(true);

  async function fetchLeagues() {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/leagues?search=${searchTerm}`);
      const data = await res.json();
      setLeagues(data);
    } catch (error) {
      console.error('Error fetching leagues:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeagues();
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    fetchLeagues();
  }

  async function handleCreateLeague(e) {
    e.preventDefault();
    try {
      // Get the current user's ID from localStorage
      const userId = localStorage.getItem('userId');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/leagues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          league_name: newLeagueName,
          description: newLeagueDescription,
          created_by: userId
        }),
      });

      if (response.ok) {
        // Reset form and refresh leagues list
        setNewLeagueName('');
        setNewLeagueDescription('');
        setShowCreateForm(false);
        fetchLeagues();
      } else {
        console.error('Failed to create league');
      }
    } catch (error) {
      console.error('Error creating league:', error);
    }
  }

  // Determine if search bar should be shown (5 or more leagues)
  const showSearchBar = leagues.length >= 5;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <div className="max-w-3xl w-full bg-gray-800 p-8 shadow rounded">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Leagues</h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-grey-600 text-white rounded hover:bg-black-700 transition-colors"
          >
            {showCreateForm ? 'Cancel' : 'Create New League'}
          </button>
        </div>

        {/* Only show search bar if there are 5 or more leagues */}
        {showSearchBar && (
          <form onSubmit={handleSearch} className="mb-8 flex justify-center">
            <input
              type="text"
              placeholder="Search leagues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-3 w-2/3 rounded-l bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-800 text-white rounded-r hover:bg-blue-900 transition-colors"
            >
              Search
            </button>
          </form>
        )}

        {showCreateForm && (
          <form onSubmit={handleCreateLeague} className="mb-8 bg-gray-750 p-6 rounded-lg shadow-lg">
            <div className="mb-6">
              <label className="block text-white mb-3">League Name</label>
              <input
                type="text"
                value={newLeagueName}
                onChange={(e) => setNewLeagueName(e.target.value)}
                className="px-4 py-3 w-full rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-white mb-3">Description</label>
              <textarea
                value={newLeagueDescription}
                onChange={(e) => setNewLeagueDescription(e.target.value)}
                className="px-4 py-3 w-full rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
                rows="4"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Create League
            </button>
          </form>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading leagues...</div>
        ) : leagues.length > 0 ? (
          <ul className="space-y-4">
            {leagues.map((league) => (
              <li key={league.league_id} className="p-4 bg-gray-700 rounded text-white">
                <h2 className="text-xl font-bold">{league.league_name}</h2>
                <p>{league.description}</p>
              
                <Link href={`/leagues/league-ui/${league.league_name}`} className="text-blue-400 hover:underline">
                  View Details
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8 text-gray-400">No leagues found</div>
        )}
      </div>
    </div>
  );
}
