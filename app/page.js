// app/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [pendingMatches, setPendingMatches] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if running in browser environment
    if (typeof window !== 'undefined') {
      const userId = localStorage.getItem('userId');
      setIsLoggedIn(!!userId);
      
      if (userId) {
        fetchMatches(userId);
      } else {
        setPendingMatches([]);
        setLoading(false);
      }
    }
  }, []);

  async function fetchMatches(userId) {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/matches/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        // Filter to only include pending matches
        const pending = data.filter(match => match.status?.toLowerCase() === 'pending');
        setPendingMatches(pending);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Welcome to Match Scheduler</h1>
          <p className="text-xl text-gray-300">Schedule and manage your matches with ease</p>
        </div>

        {isLoggedIn && (
          <div className="flex justify-center mb-12">
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Quick Actions</h2>
                
                {!loading && pendingMatches.length > 0 && (
                  <Link 
                    href="/dashboard?view=pending"
                    className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Pending Matches ({pendingMatches.length})</span>
                  </Link>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Link 
                  href="/dashboard" 
                  className="bg-blue-600 text-white p-4 rounded-lg text-center hover:bg-blue-700 transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/leagues" 
                  className="bg-purple-600 text-white p-4 rounded-lg text-center hover:bg-purple-700 transition-colors"
                >
                  Leagues
                </Link>
              </div>
            </div>
          </div>
        )}

        {!isLoggedIn && (
          <div className="flex justify-center mb-12">
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold text-white mb-4">Get Started</h2>
              <div className="grid grid-cols-2 gap-4">
                <Link 
                  href="/login" 
                  className="bg-blue-600 text-white p-4 rounded-lg text-center hover:bg-blue-700 transition-colors"
                >
                  Login
                </Link>
                <Link 
                  href="/register" 
                  className="bg-green-600 text-white p-4 rounded-lg text-center hover:bg-green-700 transition-colors"
                >
                  Register
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-white mb-3">Schedule Matches</h2>
            <p className="text-gray-300 mb-4">Easily schedule matches with other players in your league.</p>
          </div>
          
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-white mb-3">Track Progress</h2>
            <p className="text-gray-300 mb-4">Keep track of your matches, wins, and ranking in the league.</p>
          </div>
          
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-white mb-3">Join Leagues</h2>
            <p className="text-gray-300 mb-4">Find and join leagues that match your skill level and interests.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
