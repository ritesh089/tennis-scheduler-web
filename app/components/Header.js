// app/components/Header.js
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Header() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pendingMatches, setPendingMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLoginStatus = () => {
      const playerId = localStorage.getItem('userId');
      setIsLoggedIn(!!playerId);
      
      if (playerId) {
        fetchPendingMatches(playerId);
      } else {
        setPendingMatches([]);
        setLoading(false);
      }
    };

    checkLoginStatus();
    window.addEventListener('storage', checkLoginStatus);

    return () => {
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, []);

  async function fetchPendingMatches(playerId) {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/matches/pending/${playerId}`);
      if (response.ok) {
        const data = await response.json();
        let matches = data.matches;
        // Filter to only include pending matches
        const pending = matches.filter(match => match.status?.toLowerCase() === 'pending');
        setPendingMatches(pending);
      }
    } catch (error) {
      console.error('Error fetching pending matches:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    router.push('/login');
  };

  return (
    <header className="bg-gray-800 shadow-lg">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-white text-xl font-bold">
              Home
            </Link>
            {isLoggedIn && (
              <>
                <Link href="/dashboard" className="text-gray-300 hover:text-white">
                  Dashboard
                </Link>
                <Link href="/leagues" className="text-gray-300 hover:text-white">
                  Leagues
                </Link>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                {!loading && pendingMatches.length > 0 && (
                  <Link 
                    href="/dashboard?view=pending"
                    className="relative p-1 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
                    aria-label={`${pendingMatches.length} pending matches`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {pendingMatches.length}
                    </span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/login" 
                  className="text-gray-300 hover:text-white px-3 py-2 rounded hover:bg-gray-700"
                >
                  Login
                </Link>
                <Link 
                  href="/register" 
                  className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
