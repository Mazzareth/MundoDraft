'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { apiClient, type Champion } from '../lib/api';
import { QueueStatus } from '../components/QueueStatus';

export default function StatsPage() {
  const [champions, setChampions] = useState<Champion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const roles = ['ALL', 'TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];

  const fetchChampions = useCallback(async () => {
    try {
      const params: {
        role?: string;
        search?: string;
        limit?: number;
      } = { limit: 20 };
      
      if (selectedRole && selectedRole !== 'ALL') {
        params.role = selectedRole;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const response = await apiClient.getChampions(params);
      setChampions(response.data.champions || []);
    } catch (error) {
      console.error('Failed to fetch champions:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedRole, searchTerm]);

  useEffect(() => {
    fetchChampions();
  }, [fetchChampions]);

  return (
    <div className="min-h-screen p-4 bg-gray-900 text-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Link href="/" className="text-blue-400 hover:underline">
          ← Back to Home
        </Link>
        <h1 className="text-3xl font-bold">MundoDraft Stats</h1>
        <div></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Queue Status */}
        <div className="lg:col-span-1">
          <QueueStatus className="mb-6" />
          
          {/* Champion Filters */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-4">Champion Filters</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Search champions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
                >
                  {roles.map(role => (
                    <option key={role} value={role === 'ALL' ? '' : role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Champions List */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-4">Champions</h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="loading-spinner mx-auto mb-2"></div>
                <div>Loading champions...</div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {champions.map((champion) => (
                  <div
                    key={champion.id}
                    className="bg-gray-700 p-4 rounded-lg border border-gray-600"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {champion.image?.url && (
                        <Image
                          src={champion.image.url}
                          alt={champion.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded"
                        />
                      )}
                      <div>
                        <h4 className="font-bold">{champion.name}</h4>
                        <p className="text-sm text-gray-300">{champion.title}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {champion.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-600 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    {(champion.pick_rate || champion.ban_rate || champion.win_rate) && (
                      <div className="text-xs text-gray-400 space-y-1">
                        {champion.pick_rate && (
                          <div>Pick Rate: {(champion.pick_rate * 100).toFixed(1)}%</div>
                        )}
                        {champion.ban_rate && (
                          <div>Ban Rate: {(champion.ban_rate * 100).toFixed(1)}%</div>
                        )}
                        {champion.win_rate && (
                          <div>Win Rate: {(champion.win_rate * 100).toFixed(1)}%</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                
                {champions.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-400">
                    No champions found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}