'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DraftSession } from '../../components/DraftSession';
import { apiClient, type DraftSession as Draft } from '../../lib/api';

interface PageProps {
  params: {
    code: string;
  };
}

export default function DraftPage({ params }: PageProps) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadDraft();
  }, [params.code]);

  const loadDraft = async () => {
    try {
      const response = await apiClient.getDraft(params.code.toUpperCase());
      setDraft(response.data);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('404') || err.message.includes('not found')) {
          setError('Draft not found. Please check your code.');
        } else {
          setError('Failed to load draft. Please try again.');
        }
      } else {
        setError('An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="loading-spinner"></div>
          <div className="text-xl">Loading draft {params.code.toUpperCase()}...</div>
        </div>
      </div>
    );
  }

  if (error || !draft) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-6 w-full max-w-md">
          <h1 className="text-3xl font-bold">MundoDraft</h1>
          
          <div className="error-message text-center p-4 rounded-lg w-full">
            {error || 'Draft not found'}
          </div>
          
          <button onClick={handleBack} className="draft-button px-8 py-3">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return <DraftSession draft={draft} onBack={handleBack} />;
}