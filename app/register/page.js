// app/register/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerUser } from '../../lib/api';

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [skillLevel, setSkillLevel] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const response = await registerUser({
      name,
      email,
      password,
      skill_level: skillLevel,
    });
    console.log(response);
    router.push('/login');
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="max-w-md w-full bg-gray-800 p-8 shadow rounded">
        <h2 className="text-2xl font-bold mb-4 text-center text-white">Register</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300">Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring focus:border-gray-500 text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring focus:border-gray-500 text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300">Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring focus:border-gray-500 text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300">Skill Level:</label>
            <input
              type="text"
              value={skillLevel}
              onChange={(e) => setSkillLevel(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring focus:border-gray-500 text-white"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-800 text-white py-2 rounded hover:bg-blue-900 transition-colors"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
}
