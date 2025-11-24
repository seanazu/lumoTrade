"use client";

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/design-system/atoms/Card';
import { Button } from '@/components/design-system/atoms/Button';
import { CheckCircle, XCircle, Clock, Play, Loader2 } from 'lucide-react';

interface ModelStatus {
  exists: boolean;
  size_mb: number;
  last_modified: string | null;
  path: string;
}

interface TrainingJob {
  job_id: string;
  status: 'starting' | 'running' | 'completed' | 'failed';
  index: string;
  start_date: string;
  end_date: string;
  horizons: string[];
  progress: number;
  started_at: string;
  estimated_remaining_seconds?: number;
  error?: string;
}

export function TrainingPanel() {
  const [selectedIndex, setSelectedIndex] = useState('SPX');
  const [lookbackDays, setLookbackDays] = useState(730);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  // Fetch training status
  const { data: statusData, refetch: refetchStatus } = useQuery({
    queryKey: ['training-status'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8000/api/training/status');
      if (!response.ok) throw new Error('Failed to fetch training status');
      return response.json();
    },
    refetchInterval: activeJobId ? 3000 : false // Poll every 3s if job is active
  });

  // Fetch active job progress
  const { data: progressData } = useQuery({
    queryKey: ['training-progress', activeJobId],
    queryFn: async () => {
      if (!activeJobId) return null;
      const response = await fetch(`http://localhost:8000/api/training/progress/${activeJobId}`);
      if (!response.ok) throw new Error('Failed to fetch training progress');
      return response.json();
    },
    enabled: !!activeJobId,
    refetchInterval: 2000 // Poll every 2s
  });

  const modelStatus = statusData?.data?.model_status || {};
  const trainingHistory = statusData?.data?.training_history;
  const horizons = ['1h', '4h', '10h', '1d', '3d', '5d'];

  const activeJob: TrainingJob | null = progressData?.data || null;

  // Clear active job when completed or failed
  useEffect(() => {
    if (activeJob && (activeJob.status === 'completed' || activeJob.status === 'failed')) {
      setTimeout(() => {
        setActiveJobId(null);
        refetchStatus();
      }, 3000);
    }
  }, [activeJob, refetchStatus]);

  const handleStartTraining = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/training/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          index: selectedIndex,
          lookback_days: lookbackDays
        })
      });

      if (!response.ok) throw new Error('Failed to start training');
      
      const result = await response.json();
      setActiveJobId(result.data.job_id);
    } catch (error) {
      console.error('Training trigger error:', error);
    }
  };

  const ModelStatusCard = ({ horizon, status }: { horizon: string; status: ModelStatus }) => {
    const statusIcon = status.exists ? (
      <CheckCircle className="w-5 h-5 text-green-400" />
    ) : (
      <XCircle className="w-5 h-5 text-red-400" />
    );

    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-white">{horizon}</h4>
          {statusIcon}
        </div>
        
        {status.exists ? (
          <div className="space-y-1 text-xs">
            <p className="text-gray-400">
              Size: <span className="text-white">{status.size_mb.toFixed(2)} MB</span>
            </p>
            <p className="text-gray-400">
              Updated: <span className="text-white">
                {status.last_modified ? new Date(status.last_modified).toLocaleDateString() : 'N/A'}
              </span>
            </p>
          </div>
        ) : (
          <p className="text-xs text-gray-500">Not trained</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Model Status Overview */}
      <Card className="p-6 bg-gray-900/50 border-gray-800">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          Model Status
          <span className="text-sm font-normal text-gray-400">
            ({statusData?.data?.total_models || 0} / {statusData?.data?.expected_models || 6} trained)
          </span>
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {horizons.map((horizon) => (
            <ModelStatusCard
              key={horizon}
              horizon={horizon}
              status={modelStatus[horizon] || { exists: false, size_mb: 0, last_modified: null, path: '' }}
            />
          ))}
        </div>
      </Card>

      {/* Training Control */}
      <Card className="p-6 bg-gray-900/50 border-gray-800">
        <h3 className="text-lg font-bold text-white mb-4">Train New Models</h3>
        
        {activeJob ? (
          // Show training progress
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold">Training {activeJob.index} Models</p>
                <p className="text-sm text-gray-400">
                  {activeJob.status === 'starting' && 'Initializing...'}
                  {activeJob.status === 'running' && 'Training in progress...'}
                  {activeJob.status === 'completed' && '✓ Training completed!'}
                  {activeJob.status === 'failed' && '✗ Training failed'}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {activeJob.status === 'running' && <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />}
                {activeJob.status === 'completed' && <CheckCircle className="w-6 h-6 text-green-400" />}
                {activeJob.status === 'failed' && <XCircle className="w-6 h-6 text-red-400" />}
                <span className="text-2xl font-bold text-white">{activeJob.progress}%</span>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  activeJob.status === 'completed' ? 'bg-green-500' :
                  activeJob.status === 'failed' ? 'bg-red-500' :
                  'bg-blue-500'
                }`}
                style={{ width: `${activeJob.progress}%` }}
              />
            </div>
            
            {activeJob.estimated_remaining_seconds && activeJob.status === 'running' && (
              <p className="text-sm text-gray-400 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Estimated time remaining: {Math.floor(activeJob.estimated_remaining_seconds / 60)} min {activeJob.estimated_remaining_seconds % 60} sec
              </p>
            )}
            
            {activeJob.error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{activeJob.error}</p>
              </div>
            )}
            
            <div className="pt-2 border-t border-gray-700">
              <p className="text-xs text-gray-500">
                Job ID: {activeJob.job_id}
              </p>
              <p className="text-xs text-gray-500">
                Period: {new Date(activeJob.start_date).toLocaleDateString()} - {new Date(activeJob.end_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        ) : (
          // Show training controls
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Index to Train</label>
                <select
                  value={selectedIndex}
                  onChange={(e) => setSelectedIndex(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                >
                  <option value="SPX">S&P 500 (SPX)</option>
                  <option value="NDX">Nasdaq 100 (NDX)</option>
                  <option value="DJI">Dow Jones (DJI)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Lookback Period: {lookbackDays} days ({(lookbackDays / 365).toFixed(1)} years)
                </label>
                <input
                  type="range"
                  min="30"
                  max="1825"
                  step="30"
                  value={lookbackDays}
                  onChange={(e) => setLookbackDays(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>30 days</span>
                  <span>5 years</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400 mb-2">This will train models for all 6 horizons:</p>
              <div className="flex flex-wrap gap-2">
                {horizons.map((h) => (
                  <span key={h} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                    {h}
                  </span>
                ))}
              </div>
            </div>
            
            <Button
              onClick={handleStartTraining}
              className="w-full gap-2"
              size="lg"
            >
              <Play className="w-4 h-4" />
              Start Training
            </Button>
          </div>
        )}
      </Card>

      {/* Training History */}
      {trainingHistory && (
        <Card className="p-6 bg-gray-900/50 border-gray-800">
          <h3 className="text-lg font-bold text-white mb-4">Training History</h3>
          
          <div className="space-y-3">
            {Object.entries(trainingHistory).slice(0, 5).map(([timestamp, data]: [string, any]) => (
              <div key={timestamp} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div>
                  <p className="text-white text-sm font-medium">{data.index || 'Unknown'}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">
                    {data.horizons?.length || 0} horizons trained
                  </p>
                  {data.duration && (
                    <p className="text-xs text-gray-500">
                      {Math.floor(data.duration / 60)}m {data.duration % 60}s
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

