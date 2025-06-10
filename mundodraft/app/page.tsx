'use client';

import { useState } from 'react';
import { DraftSession } from './components/DraftSession';
import { apiClient, type DraftSession as Draft } from './lib/api';

export default function Home() {
  const [draftCode, setDraftCode] = useState('');
  const [currentDraft, setCurrentDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const joinDraft = async () => {
    if (!draftCode.trim()) {
      setError('Please enter a draft code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiClient.getDraft(draftCode.toUpperCase());
      setCurrentDraft(response.data);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('404') || err.message.includes('not found')) {
          setError('Draft not found. Please check your code.');
        } else {
          setError('Failed to join draft. Please try again.');
        }
      } else {
        setError('An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    setCurrentDraft(null);
    setDraftCode('');
    setError('');
  };

  if (currentDraft) {
    return <DraftSession draft={currentDraft} onBack={handleBackToHome} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-8 w-full max-w-md">
        <h1 className="text-5xl font-bold mb-4">MundoDraft</h1>
        
        <div className="flex flex-col gap-4 w-full">
          <div className="flex gap-3 w-full">
            <input
              type="text"
              placeholder="Enter Draft Code"
              value={draftCode}
              onChange={(e) => setDraftCode(e.target.value.toUpperCase())}
              className="flex-1 draft-input text-lg py-3 px-4"
              maxLength={8}
              onKeyPress={(e) => e.key === 'Enter' && joinDraft()}
            />
            <button
              onClick={joinDraft}
              disabled={loading}
              className="draft-button px-6 text-lg disabled:opacity-50"
            >
              {loading ? 'Joining...' : 'Join Draft'}
            </button>
          </div>
          
          {error && (
            <div className="error-message text-red-500 text-center p-3 rounded">
              {error}
            </div>
          )}
        </div>

        <div className="text-center text-sm opacity-70 mt-8 space-y-2">
          <p>Get your draft code from Discord and enter it above to join a League of Legends draft session.</p>
          <div className="pt-4">
            <a href="/stats" className="text-blue-400 hover:text-blue-300 underline">
              View Champion Stats & Queue Status
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
