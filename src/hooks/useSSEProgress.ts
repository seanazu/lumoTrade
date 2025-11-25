import { useState, useEffect, useCallback, useRef } from "react";

export interface ProgressStep {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "error";
  timestamp?: string;
  duration_ms?: number;
  data?: any;
  error?: string;
}

export interface SSEProgress {
  steps: ProgressStep[];
  progress: number;
  estimated_time_ms?: number;
  elapsed_time_ms?: number;
  result?: any;
  error?: string;
  isComplete: boolean;
}

export function useSSEProgress(url: string | null) {
  const [progress, setProgress] = useState<SSEProgress>({
    steps: [],
    progress: 0,
    isComplete: false,
  });
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const urlRef = useRef<string | null>(url);

  // Keep URL ref updated
  useEffect(() => {
    urlRef.current = url;
  }, [url]);

  const connect = useCallback(() => {
    const currentUrl = urlRef.current;

    if (!currentUrl) {
      return;
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const eventSource = new EventSource(currentUrl);
      eventSourceRef.current = eventSource;

      // Set connected immediately
      setIsConnected(true);

      // Initialize progress
      setProgress({
        steps: [],
        progress: 0,
        isComplete: false,
      });

      // Handle step updates
      eventSource.addEventListener("step", (event) => {
        const step = JSON.parse(event.data) as ProgressStep;

        setProgress((prev) => {
          const existingIndex = prev.steps.findIndex((s) => s.id === step.id);

          if (existingIndex >= 0) {
            // Update existing step
            const newSteps = [...prev.steps];
            newSteps[existingIndex] = step;
            return { ...prev, steps: newSteps };
          } else {
            // Add new step
            return { ...prev, steps: [...prev.steps, step] };
          }
        });
      });

      // Handle progress updates
      eventSource.addEventListener("progress", (event) => {
        const progressData = JSON.parse(event.data);
        setProgress((prev) => ({
          ...prev,
          progress: progressData.progress,
          estimated_time_ms: progressData.estimated_time_ms,
          elapsed_time_ms: progressData.elapsed_time_ms,
        }));
      });

      // Handle completion
      eventSource.addEventListener("complete", (event) => {
        const completeData = JSON.parse(event.data);
        setProgress((prev) => ({
          ...prev,
          result: completeData.result,
          progress: 100,
          isComplete: true,
        }));
        eventSource.close();
        setIsConnected(false);
      });

      // Handle errors
      eventSource.addEventListener("error", (event) => {
        try {
          const errorData = JSON.parse((event as any).data || "{}");
          setProgress((prev) => ({
            ...prev,
            error: errorData.error || "Connection error",
            isComplete: true,
          }));
        } catch (e) {
          // Silent error handling
        }
        eventSource.close();
        setIsConnected(false);
      });

      eventSource.onerror = () => {
        setProgress((prev) => ({
          ...prev,
          error: "Connection lost or failed to establish",
          isComplete: true,
        }));
        eventSource.close();
        setIsConnected(false);
      };
    } catch (err) {
      setProgress((prev) => ({
        ...prev,
        error: "Failed to create connection",
        isComplete: true,
      }));
      setIsConnected(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    progress,
    isConnected,
    connect,
    disconnect,
  };
}
