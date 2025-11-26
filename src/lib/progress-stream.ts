export interface ProgressEvent {
  type: 'step' | 'progress' | 'complete' | 'error';
  step?: {
    id: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    data?: any;
    timestamp: string;
    duration?: number;
    error?: string;
  };
  progress?: number;
  estimatedTime?: number;
  result?: any;
  error?: string;
}

export class ProgressStream {
  private eventSource: EventSource | null = null;
  private operationId: string;
  private baseUrl: string;
  
  private onProgressCallback?: (event: ProgressEvent) => void;
  private onCompleteCallback?: (result: any) => void;
  private onErrorCallback?: (error: string) => void;
  
  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
    this.operationId = '';
  }
  
  connect(
    operationType: 'prediction' | 'training' | 'backtest' | 'backfill',
    params: any
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // Generate operation ID
      this.operationId = `${operationType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create query params
      const queryParams = new URLSearchParams({
        operation_id: this.operationId,
        ...params,
      });
      
      // Connect to SSE endpoint
      const url = `${this.baseUrl}/api/stream/${operationType}?${queryParams}`;
      this.eventSource = new EventSource(url);
      
      this.eventSource.onopen = () => {
        resolve(this.operationId);
      };
      
      this.eventSource.addEventListener('step', (e) => {
        const data = JSON.parse(e.data);
        if (this.onProgressCallback) {
          this.onProgressCallback({ type: 'step', step: data });
        }
      });
      
      this.eventSource.addEventListener('progress', (e) => {
        const data = JSON.parse(e.data);
        if (this.onProgressCallback) {
          this.onProgressCallback({
            type: 'progress',
            progress: data.progress,
            estimatedTime: data.estimated_time,
          });
        }
      });
      
      this.eventSource.addEventListener('complete', (e) => {
        const data = JSON.parse(e.data);
        if (this.onCompleteCallback) {
          this.onCompleteCallback(data.result);
        }
        if (this.onProgressCallback) {
          this.onProgressCallback({ type: 'complete', result: data.result });
        }
        this.disconnect();
      });
      
      this.eventSource.addEventListener('error', (e: any) => {
        const data = e.data ? JSON.parse(e.data) : { error: 'Connection failed' };
        if (this.onErrorCallback) {
          this.onErrorCallback(data.error || 'Unknown error');
        }
        if (this.onProgressCallback) {
          this.onProgressCallback({ type: 'error', error: data.error });
        }
        this.disconnect();
      });
      
      this.eventSource.onerror = (e) => {
        reject(new Error('Failed to establish SSE connection'));
        this.disconnect();
      };
    });
  }
  
  onProgress(callback: (event: ProgressEvent) => void) {
    this.onProgressCallback = callback;
  }
  
  onComplete(callback: (result: any) => void) {
    this.onCompleteCallback = callback;
  }
  
  onError(callback: (error: string) => void) {
    this.onErrorCallback = callback;
  }
  
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

