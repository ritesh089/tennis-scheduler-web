// app/register/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    // Check if all required fields are filled
    setIsFormValid(
      name.trim() !== '' && 
      email.trim() !== '' && 
      password.trim() !== '' &&
      email.includes('@') // Basic email validation
    );
  }, [name, email, password]);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          phone: phone || null,
        }),
      });

      if (response.ok) {
        router.push('/login');
      } else {
        console.error('Registration failed');
      }
    } catch (error) {
      console.error('Error during registration:', error);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-white mb-6">Register</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">
              Phone Number: <span className="text-gray-500 text-sm">(Optional)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g., +1 234 567 8900"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>
          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full py-2 rounded transition-colors ${
              isFormValid 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-600 text-gray-300 cursor-not-allowed'
            }`}
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
