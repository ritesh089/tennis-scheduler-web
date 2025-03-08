// app/components/Header.js
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Header() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check login status whenever localStorage changes
    const checkLoginStatus = () => {
      setIsLoggedIn(!!localStorage.getItem('userId'));
    };

    checkLoginStatus();
    window.addEventListener('storage', checkLoginStatus);

    return () => {
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, []);

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
              <button
                onClick={handleLogout}
                className="text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded"
              >
                Logout
              </button>
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
