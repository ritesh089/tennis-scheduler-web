// app/components/Header.js
'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pendingMatches, setPendingMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Run this effect only once on component mount
  useEffect(() => {
    // Check if we're in the browser environment
    if (typeof window !== 'undefined') {
      const userId = localStorage.getItem('userId');
      console.log('Initial userId from localStorage:', userId);
      
      setIsLoggedIn(!!userId);
      
      if (userId) {
        fetchPendingMatches(userId);
      } else {
        setPendingMatches([]);
        setLoading(false);
      }
      
      setInitialized(true);
      
      // Set up storage event listener for changes
      const handleStorageChange = () => {
        const currentUserId = localStorage.getItem('userId');
        console.log('Storage changed, userId:', currentUserId);
        setIsLoggedIn(!!currentUserId);
        
        if (currentUserId) {
          fetchPendingMatches(currentUserId);
        } else {
          setPendingMatches([]);
        }
      };
      
      window.addEventListener('storage', handleStorageChange);
      
      // Custom event for login/logout within the same tab
      window.addEventListener('auth-change', handleStorageChange);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('auth-change', handleStorageChange);
      };
    }
  }, []);

  // Add a second effect to monitor pathname changes
  useEffect(() => {
    if (initialized && pathname) {
      const userId = localStorage.getItem('userId');
      setIsLoggedIn(!!userId);
      
      if (userId && isLoggedIn) {
        fetchPendingMatches(userId);
      }
    }
  }, [pathname, initialized]);

  async function fetchPendingMatches(userId) {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/matches/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        // Filter to only include pending matches
        const pending = data.filter(match => match.status?.toLowerCase() === 'pending');
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
    setPendingMatches([]);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('auth-change'));
    
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
