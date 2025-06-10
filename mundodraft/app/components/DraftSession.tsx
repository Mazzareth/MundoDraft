'use client';

import { useState, useEffect } from 'react';
import {
  apiClient,
  type Champion,
  type DraftSession as Draft,
  type DraftStatus
} from '../lib/api';

interface DraftSessionProps {
  draft: Draft;
  onBack: () => void;
}

export function DraftSession({ draft, onBack }: DraftSessionProps) {
  const [draftStatus, setDraftStatus] = useState<DraftStatus | null>(null);
  const [champions, setChampions] = useState<Champion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const roles = ['ALL', 'TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];

  useEffect(() => {
    fetchDraftStatus();
    fetchChampions();
    
    // Set up polling for draft updates every 2 seconds
    const interval = setInterval(fetchDraftStatus, 2000);
    
    return () => clearInterval(interval);
  }, [draft.id]);

  useEffect(() => {
    // Update timer countdown
    if (draftStatus?.timerEnd) {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const end = new Date(draftStatus.timerEnd!).getTime();
        const remaining = Math.max(0, Math.floor((end - now) / 1000));
        setTimeRemaining(remaining);
        
        if (remaining === 0) {
          clearInterval(timer);
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [draftStatus?.timerEnd]);

  const fetchDraftStatus = async () => {
    try {
      const response = await apiClient.getDraftStatus(draft.unique_id);
      setDraftStatus(response.data);
    } catch (_err) {
      console.error('Failed to fetch draft status:', _err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChampions = async () => {
    try {
      const params: {
        role?: string;
        search?: string;
        limit?: number;
      } = { limit: 50 };
      
      if (selectedRole && selectedRole !== 'ALL') {
        params.role = selectedRole;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const response = await apiClient.getChampions(params);
      setChampions(response.data.champions || []);
    } catch (_err) {
      console.error('Failed to fetch champions:', _err);
      setError('Failed to load champions');
    }
  };

  useEffect(() => {
    fetchChampions();
  }, [searchTerm, selectedRole]);

  const selectChampion = async (championId: string) => {
    if (!draftStatus || draftStatus.status !== 'DRAFTING') return;
    
    try {
      await apiClient.selectChampion(
        draft.unique_id,
        championId,
        getCurrentAction()
      );
      
      // Refresh draft status immediately
      fetchDraftStatus();
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error('Failed to select champion:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to select champion';
      setError(errorMessage);
    }
  };

  const getCurrentAction = (): 'BAN' | 'PICK' => {
    if (!draftStatus) return 'BAN';
    return draftStatus.currentPhase.includes('BAN') ? 'BAN' : 'PICK';
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTeamSelections = (teamSide: 'BLUE' | 'RED') => {
    if (!draftStatus) return { bans: [], picks: [] };
    
    const teamSelections = draftStatus.selections.filter(s => s.team === teamSide);
    return {
      bans: teamSelections.filter(s => s.action === 'BAN'),
      picks: teamSelections.filter(s => s.action === 'PICK')
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading draft...</div>
      </div>
    );
  }

  if (!draftStatus) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-xl text-red-500">Failed to load draft</div>
        <button onClick={onBack} className="draft-button">
          Back to Home
        </button>
      </div>
    );
  }

  const blueTeam = getTeamSelections('BLUE');
  const redTeam = getTeamSelections('RED');
  const currentAction = getCurrentAction();
  const isCurrentTurn = draftStatus.status === 'DRAFTING';

  return (
    <div className="min-h-screen p-4 bg-gray-900 text-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="text-blue-400 hover:underline">
          ← Back to Home
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Draft Session</h1>
          <div className="text-sm opacity-70">ID: {draft.unique_id}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold">
            Status: <span className={draftStatus.status === 'DRAFTING' ? 'text-green-400' : 'text-yellow-400'}>
              {draftStatus.status}
            </span>
          </div>
          {timeRemaining > 0 && (
            <div className="text-sm">Time: {formatTime(timeRemaining)}</div>
          )}
        </div>
      </div>

      {/* Current Turn Info */}
      {isCurrentTurn && (
        <div className="text-center mb-6 p-4 bg-gray-800 rounded-lg">
          <div className="text-lg font-bold">
            {draftStatus.currentTeam} Team - {currentAction} Phase
          </div>
          <div className="text-sm opacity-70">
            Turn {draftStatus.currentTurn}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-600 text-white rounded-lg text-center">
          {error}
          <button 
            onClick={() => setError('')}
            className="ml-2 text-red-200 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Teams Section */}
        <div className="lg:col-span-2">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Blue Team */}
            <div className="bg-blue-900 p-4 rounded-lg">
              <h2 className="text-xl font-bold mb-4 text-center">Blue Team</h2>
              
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Bans ({blueTeam.bans.length})</h3>
                <div className="grid grid-cols-3 gap-2">
                  {blueTeam.bans.map((ban, index) => (
                    <div key={index} className="aspect-square bg-gray-700 rounded flex items-center justify-center text-xs text-center p-1">
                      {ban.champion.name}
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 5 - blueTeam.bans.length) }).map((_, index) => (
                    <div key={`empty-ban-${index}`} className="aspect-square bg-gray-600 rounded flex items-center justify-center text-xs">
                      -
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Picks ({blueTeam.picks.length})</h3>
                <div className="space-y-2">
                  {['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'].map((role) => {
                    const pick = blueTeam.picks.find(p => p.role === role);
                    return (
                      <div key={role} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                        <span className="text-sm font-medium">{role}</span>
                        <span className="text-sm">
                          {pick ? pick.champion.name : 'Not selected'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Red Team */}
            <div className="bg-red-900 p-4 rounded-lg">
              <h2 className="text-xl font-bold mb-4 text-center">Red Team</h2>
              
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Bans ({redTeam.bans.length})</h3>
                <div className="grid grid-cols-3 gap-2">
                  {redTeam.bans.map((ban, index) => (
                    <div key={index} className="aspect-square bg-gray-700 rounded flex items-center justify-center text-xs text-center p-1">
                      {ban.champion.name}
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 5 - redTeam.bans.length) }).map((_, index) => (
                    <div key={`empty-ban-${index}`} className="aspect-square bg-gray-600 rounded flex items-center justify-center text-xs">
                      -
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Picks ({redTeam.picks.length})</h3>
                <div className="space-y-2">
                  {['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'].map((role) => {
                    const pick = redTeam.picks.find(p => p.role === role);
                    return (
                      <div key={role} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                        <span className="text-sm font-medium">{role}</span>
                        <span className="text-sm">
                          {pick ? pick.champion.name : 'Not selected'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Champion Selection */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Champions</h2>
          
          {/* Search and Filter */}
          <div className="mb-4 space-y-2">
            <input
              type="text"
              placeholder="Search champions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
            />
            
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

          {/* Champion Grid */}
          <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
            {champions.map((champion) => {
              const isSelected = [...blueTeam.bans, ...blueTeam.picks, ...redTeam.bans, ...redTeam.picks]
                .some(selection => selection.champion.id === champion.id);
              
              return (
                <button
                  key={champion.id}
                  onClick={() => selectChampion(champion.id)}
                  disabled={!isCurrentTurn || isSelected}
                  className={`p-2 rounded text-xs text-center transition-colors ${
                    isSelected 
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                      : isCurrentTurn 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white cursor-pointer' 
                        : 'bg-gray-700 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <div className="font-medium">{champion.name}</div>
                  <div className="opacity-70">{champion.title}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}