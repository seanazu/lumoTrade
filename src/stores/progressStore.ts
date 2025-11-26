import { create } from 'zustand';

export interface ProgressStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  data?: any;
  timestamp: string;
  duration?: number;
  error?: string;
}

export interface ProgressOperation {
  id: string;
  type: 'prediction' | 'training' | 'backtest' | 'backfill';
  status: 'running' | 'completed' | 'failed';
  progress: number;
  steps: ProgressStep[];
  startTime: string;
  endTime?: string;
  estimatedTimeRemaining?: number;
  result?: any;
  error?: string;
}

interface ProgressStore {
  operations: ProgressOperation[];
  currentOperation: ProgressOperation | null;
  isOpen: boolean;
  isMinimized: boolean;
  
  // Actions
  startOperation: (type: ProgressOperation['type'], id: string) => void;
  updateStep: (operationId: string, step: ProgressStep) => void;
  updateProgress: (operationId: string, progress: number, estimatedTime?: number) => void;
  completeOperation: (operationId: string, result?: any) => void;
  failOperation: (operationId: string, error: string) => void;
  openPanel: () => void;
  closePanel: () => void;
  toggleMinimize: () => void;
  clearHistory: () => void;
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
  operations: [],
  currentOperation: null,
  isOpen: false,
  isMinimized: false,
  
  startOperation: (type, id) => {
    const operation: ProgressOperation = {
      id,
      type,
      status: 'running',
      progress: 0,
      steps: [],
      startTime: new Date().toISOString(),
    };
    
    set((state) => ({
      operations: [operation, ...state.operations.slice(0, 9)], // Keep last 10
      currentOperation: operation,
      isOpen: true,
      isMinimized: false,
    }));
  },
  
  updateStep: (operationId, step) => {
    set((state) => ({
      operations: state.operations.map((op) =>
        op.id === operationId
          ? { ...op, steps: [...op.steps.filter(s => s.id !== step.id), step] }
          : op
      ),
      currentOperation: state.currentOperation?.id === operationId
        ? { ...state.currentOperation, steps: [...state.currentOperation.steps.filter(s => s.id !== step.id), step] }
        : state.currentOperation,
    }));
  },
  
  updateProgress: (operationId, progress, estimatedTime) => {
    set((state) => ({
      operations: state.operations.map((op) =>
        op.id === operationId
          ? { ...op, progress, estimatedTimeRemaining: estimatedTime }
          : op
      ),
      currentOperation: state.currentOperation?.id === operationId
        ? { ...state.currentOperation, progress, estimatedTimeRemaining: estimatedTime }
        : state.currentOperation,
    }));
  },
  
  completeOperation: (operationId, result) => {
    set((state) => ({
      operations: state.operations.map((op) =>
        op.id === operationId
          ? { ...op, status: 'completed', progress: 100, endTime: new Date().toISOString(), result }
          : op
      ),
      currentOperation: state.currentOperation?.id === operationId
        ? { ...state.currentOperation, status: 'completed', progress: 100, endTime: new Date().toISOString(), result }
        : state.currentOperation,
    }));
    
    // Auto-close after 3 seconds
    setTimeout(() => {
      if (get().currentOperation?.id === operationId) {
        set({ isOpen: false, currentOperation: null });
      }
    }, 3000);
  },
  
  failOperation: (operationId, error) => {
    set((state) => ({
      operations: state.operations.map((op) =>
        op.id === operationId
          ? { ...op, status: 'failed', endTime: new Date().toISOString(), error }
          : op
      ),
      currentOperation: state.currentOperation?.id === operationId
        ? { ...state.currentOperation, status: 'failed', endTime: new Date().toISOString(), error }
        : state.currentOperation,
    }));
  },
  
  openPanel: () => set({ isOpen: true, isMinimized: false }),
  closePanel: () => set({ isOpen: false }),
  toggleMinimize: () => set((state) => ({ isMinimized: !state.isMinimized })),
  clearHistory: () => set({ operations: [] }),
}));

