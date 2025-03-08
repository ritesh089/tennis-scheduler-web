'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/players`);
      const data = await response.json();
      setUsers(data);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch users');
      setLoading(false);
    }
  }

  async function handleRoleChange(userId, newRole) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/players/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        // Refresh the users list
        fetchUsers();
      } else {
        setError('Failed to update user role');
      }
    } catch (error) {
      setError('Error updating user role');
    }
  }

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-white text-center mt-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-8">{error}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">User Management</h1>
      
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/3 px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring focus:border-blue-300"
        />
      </div>

      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-gray-300">Name</th>
              <th className="px-6 py-3 text-left text-gray-300">Email</th>
              <th className="px-6 py-3 text-left text-gray-300">Current Role</th>
              <th className="px-6 py-3 text-left text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredUsers.map((user) => (
              <tr key={user.user_id} className="hover:bg-gray-700">
                <td className="px-6 py-4 text-white">{user.name}</td>
                <td className="px-6 py-4 text-gray-300">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-sm ${
                    user.role === 'admin' ? 'bg-purple-900 text-purple-200' : 'bg-gray-600 text-gray-200'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleRoleChange(user.name, user.role === 'admin' ? 'user' : 'admin')}
                    className={`px-4 py-2 rounded text-sm ${
                      user.role === 'admin'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white transition-colors`}
                  >
                    {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 