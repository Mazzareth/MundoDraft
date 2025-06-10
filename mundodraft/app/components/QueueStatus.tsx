'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/api';

interface QueueStatusProps {
  guildId?: string;
  className?: string;
}

export function QueueStatus({ guildId = "123456789012345678", className = "" }: QueueStatusProps) {
  const [queueData, setQueueData] = useState<{
    queues: Record<string, unknown[]>;
    stats: {
      totalPlayers: number;
      progress: number;
      isReady: boolean;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchQueueStatus = useCallback(async () => {
    try {
      const response = await apiClient.getGuildQueue(guildId, 'RANKED_DRAFT');
      setQueueData(response.data);
      setError('');
    } catch (error) {
      console.error('Failed to load queue status:', error);
      setError('Failed to load queue status');
    } finally {
      setLoading(false);
    }
  }, [guildId]);

  useEffect(() => {
    fetchQueueStatus();
    
    // Poll queue status every 5 seconds
    const interval = setInterval(fetchQueueStatus, 5000);
    
    return () => clearInterval(interval);
  }, [fetchQueueStatus]);


  if (loading) {
    return (
      <div className={`p-4 bg-gray-800 rounded-lg ${className}`}>
        <div className="text-center">Loading queue status...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-900 rounded-lg ${className}`}>
        <div className="text-center text-red-300">{error}</div>
      </div>
    );
  }

  if (!queueData) {
    return null;
  }

  const { queues, stats } = queueData;
  const roles = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];

  return (
    <div className={`p-4 bg-gray-800 rounded-lg ${className}`}>
      <h3 className="text-lg font-bold mb-4 text-center">Current Queue Status</h3>
      
      <div className="grid grid-cols-5 gap-2 mb-4">
        {roles.map((role) => {
          const roleQueue = queues[role] || [];
          const isFilled = roleQueue.length >= 2;
          
          return (
            <div
              key={role}
              className={`p-3 rounded text-center text-sm ${
                isFilled 
                  ? 'bg-green-700 text-green-100' 
                  : roleQueue.length > 0 
                    ? 'bg-yellow-700 text-yellow-100' 
                    : 'bg-gray-700 text-gray-300'
              }`}
            >
              <div className="font-semibold">{role}</div>
              <div className="text-xs">{roleQueue.length}/2</div>
            </div>
          );
        })}
      </div>

      <div className="text-center text-sm text-gray-300">
        <div>Total Players: {stats.totalPlayers}/10</div>
        <div>Progress: {Math.round(stats.progress * 100)}%</div>
        {stats.isReady && (
          <div className="text-green-400 font-bold mt-2">Ready to start!</div>
        )}
      </div>
    </div>
  );
}