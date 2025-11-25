"use client";

import { useProgressStore } from '@/stores/progressStore';
import { X, Minimize2, Maximize2, CheckCircle, XCircle, Loader2, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export function ProgressSidePanel() {
  const {
    currentOperation,
    isOpen,
    isMinimized,
    closePanel,
    toggleMinimize,
  } = useProgressStore();
  
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  
  if (!isOpen || !currentOperation) return null;
  
  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };
  
  const getOperationTitle = () => {
    switch (currentOperation.type) {
      case 'prediction':
        return 'Generating Prediction';
      case 'training':
        return 'Training Models';
      case 'backtest':
        return 'Running Backtest';
      case 'backfill':
        return 'Backfilling Historical Data';
      default:
        return 'Processing';
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'failed':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'running':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };
  
  const formatDuration = (ms?: number) => {
    if (!ms) return '0s';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };
  
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 500 }}
        animate={{ x: 0 }}
        exit={{ x: 500 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 bottom-0 z-50 w-[500px] bg-gray-900 border-l border-gray-800 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
            <h3 className="text-lg font-semibold text-white">{getOperationTitle()}</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMinimize}
              className="p-1.5 hover:bg-gray-800 rounded transition-colors"
              aria-label={isMinimized ? "Maximize" : "Minimize"}
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4 text-gray-400" />
              ) : (
                <Minimize2 className="w-4 h-4 text-gray-400" />
              )}
            </button>
            <button
              onClick={closePanel}
              className="p-1.5 hover:bg-gray-800 rounded transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        
        {!isMinimized && (
          <>
            {/* Progress Bar */}
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Overall Progress</span>
                <span className="text-sm font-semibold text-white">
                  {currentOperation.progress}%
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${
                    currentOperation.status === 'completed'
                      ? 'bg-green-500'
                      : currentOperation.status === 'failed'
                      ? 'bg-red-500'
                      : 'bg-blue-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${currentOperation.progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              
              {currentOperation.estimatedTimeRemaining && currentOperation.status === 'running' && (
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>Est. {formatDuration(currentOperation.estimatedTimeRemaining)} remaining</span>
                </div>
              )}
              
              {currentOperation.status === 'completed' && (
                <div className="mt-2 text-sm text-green-400 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Operation completed successfully!</span>
                </div>
              )}
              
              {currentOperation.status === 'failed' && (
                <div className="mt-2 text-sm text-red-400 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  <span>{currentOperation.error || 'Operation failed'}</span>
                </div>
              )}
            </div>
            
            {/* Steps List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {currentOperation.steps.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Initializing...</p>
                </div>
              ) : (
                currentOperation.steps
                  .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                  .map((step) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`border rounded-lg p-3 ${getStatusColor(step.status)}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getStatusIcon(step.status)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="text-sm font-medium text-white truncate">
                              {step.name}
                            </h4>
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              {formatTime(step.timestamp)}
                            </span>
                          </div>
                          
                          {step.duration && (
                            <div className="text-xs text-gray-400 mb-1">
                              Duration: {formatDuration(step.duration)}
                            </div>
                          )}
                          
                          {step.error && (
                            <div className="text-xs text-red-400 mt-1 p-2 bg-red-500/10 rounded">
                              {step.error}
                            </div>
                          )}
                          
                          {step.data && Object.keys(step.data).length > 0 && (
                            <div className="mt-2">
                              <button
                                onClick={() => toggleStep(step.id)}
                                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-300 transition-colors"
                              >
                                {expandedSteps.has(step.id) ? (
                                  <ChevronUp className="w-3 h-3" />
                                ) : (
                                  <ChevronDown className="w-3 h-3" />
                                )}
                                <span>Details</span>
                              </button>
                              
                              <AnimatePresence>
                                {expandedSteps.has(step.id) && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="mt-2 text-xs text-gray-300 bg-gray-900/50 rounded p-2 max-h-40 overflow-auto"
                                  >
                                    <pre className="whitespace-pre-wrap font-mono">
                                      {JSON.stringify(step.data, null, 2)}
                                    </pre>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
              )}
            </div>
            
            {/* Footer with operation info */}
            <div className="p-4 border-t border-gray-800 bg-gray-900/95 backdrop-blur-sm">
              <div className="text-xs text-gray-500">
                <div className="flex items-center justify-between">
                  <span>Started: {formatTime(currentOperation.startTime)}</span>
                  {currentOperation.endTime && (
                    <span>Ended: {formatTime(currentOperation.endTime)}</span>
                  )}
                </div>
                <div className="mt-1">
                  Operation ID: <span className="font-mono">{currentOperation.id}</span>
                </div>
              </div>
            </div>
          </>
        )}
        
        {isMinimized && (
          <div className="p-4 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-400" />
            <p className="text-sm text-gray-400 mt-2">{currentOperation.progress}% complete</p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Floating button when panel is closed
export function ProgressFloatingButton() {
  const { operations, isOpen, openPanel } = useProgressStore();
  
  const runningOperation = operations.find((op) => op.status === 'running');
  
  if (isOpen || !runningOperation) return null;
  
  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      onClick={openPanel}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-blue-500 hover:bg-blue-600 rounded-full shadow-lg flex items-center justify-center transition-colors"
      aria-label="Open progress panel"
    >
      <Loader2 className="w-6 h-6 text-white animate-spin" />
    </motion.button>
  );
}

