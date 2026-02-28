import { useCallback, useEffect, useState } from 'react';
import type { SubscriptionReport } from '@/core';
import { MessageType } from '@/platforms/extension/types';

export function useSubscriptionReport() {
  const [report, setReport] = useState<SubscriptionReport | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await chrome.runtime.sendMessage({ type: MessageType.GET_SUBSCRIPTION_REPORT });
      if (response?.success && response.data) {
        setReport(response.data as SubscriptionReport);
      }
    } catch (err) {
      console.error('[ClawCancel] Failed to fetch subscription report:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Listen for real-time report updates from the background
  useEffect(() => {
    const handleMessage = (message: { type: string }) => {
      if (message.type === 'NEW_REPORT') {
        refresh();
      }
    };
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [refresh]);

  // Refresh when tab becomes visible
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [refresh]);

  return { report, loading, refresh };
}
