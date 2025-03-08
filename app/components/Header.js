// app/components/Header.js
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Header() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('userId'));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
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
              <>
                <Link href="/login" className="text-gray-300 hover:text-white">
                  Login
                </Link>
                <Link href="/register" className="text-gray-300 hover:text-white">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
