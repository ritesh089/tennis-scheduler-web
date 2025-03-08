// app/login/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser } from '../../lib/api';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [userId, setUserId] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const response = await loginUser({ email, password });
    console.log(response);
    
    if (response.user_id) {
      localStorage.setItem('userId', response.user_id);
      setUserId(response.user_id);
      setLoginSuccess(true);
      // Delay redirect to show success message
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } else {
      console.error('Login failed: No user ID received');
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-white mb-6">Login</h1>
        {loginSuccess ? (
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-green-400 mb-2">Login Successful!</p>
            <p className="text-gray-300">User ID: {userId}</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4 text-center text-white">Login</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-300">Email:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring focus:border-blue-300 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-300">Password:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring focus:border-blue-300 text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-800 text-white py-2 rounded hover:bg-blue-900 transition-colors"
              >
                Login
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
