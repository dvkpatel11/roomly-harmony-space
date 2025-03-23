import { useEffect, useRef, useState } from 'react';

interface UseRefreshDataOptions {
  fetchFn: () => Promise<any>;
  interval?: number;
  enabled?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (data: any) => void;
  retryCount?: number;
  retryDelay?: number;
}

/**
 * A hook to periodically refresh data in the background
 * with minimal UI updates and optimized performance.
 */
export function useRefreshData({
  fetchFn,
  interval = 30000, // Default 30 seconds
  enabled = true,
  onError,
  onSuccess,
  retryCount = 3,
  retryDelay = 5000
}: UseRefreshDataOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retriesRef = useRef(0);
  const unmountedRef = useRef(false);
  
  // Function to refresh data
  const refreshData = async () => {
    if (loading || !enabled || unmountedRef.current) return;
    
    setLoading(true);
    try {
      const data = await fetchFn();
      
      if (unmountedRef.current) return;
      
      // Reset retry counter on success
      retriesRef.current = 0;
      
      // Update last refresh time
      setLastRefreshTime(new Date());
      setError(null);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(data);
      }
    } catch (err) {
      if (unmountedRef.current) return;
      
      console.error('Error refreshing data:', err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      
      // Call error callback if provided
      if (onError) {
        onError(error);
      }
      
      // Implement retry logic
      if (retriesRef.current < retryCount) {
        retriesRef.current += 1;
        setTimeout(() => {
          if (!unmountedRef.current) {
            refreshData();
          }
        }, retryDelay);
      }
    } finally {
      if (!unmountedRef.current) {
        setLoading(false);
      }
    }
  };
  
  // Set up the refresh interval
  useEffect(() => {
    unmountedRef.current = false;
    
    // Initial fetch
    if (enabled) {
      refreshData();
    }
    
    // Set up interval
    if (enabled && interval > 0) {
      intervalRef.current = setInterval(refreshData, interval);
    }
    
    // Clean up
    return () => {
      unmountedRef.current = true;
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval]);
  
  // Public API to trigger a manual refresh
  const triggerRefresh = () => {
    if (!loading && enabled) {
      refreshData();
    }
  };
  
  return {
    loading,
    error,
    lastRefreshTime,
    triggerRefresh
  };
}

export default useRefreshData; 