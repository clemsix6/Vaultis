"use client";

import { useState, useEffect, useCallback } from "react";
import { INDEXER_URL } from "@/lib/contracts";

interface IndexedEvent {
  type: string;
  blockNumber: string;
  transactionHash: string;
  args: Record<string, unknown>;
  timestamp: number;
}

interface IndexerStatus {
  lastBlock: string;
  totalEvents: number;
  totalSwaps: number;
  totalPrices: number;
  uptime: number;
}

export function useIndexerEvents(type?: string, limit = 50) {
  const [events, setEvents] = useState<IndexedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: String(limit) });
      if (type) params.set("type", type);
      const res = await fetch(`${INDEXER_URL}/api/events?${params}`);
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch {
      // Indexer may not be running
    } finally {
      setIsLoading(false);
    }
  }, [type, limit]);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 15000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  return { events, isLoading, refetch: fetchEvents };
}

export function useIndexerSwaps(limit = 20) {
  const [swaps, setSwaps] = useState<IndexedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSwaps = useCallback(async () => {
    try {
      const res = await fetch(`${INDEXER_URL}/api/swaps?limit=${limit}`);
      const data = await res.json();
      setSwaps(data.swaps ?? []);
    } catch {
      // Indexer may not be running
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchSwaps();
    const interval = setInterval(fetchSwaps, 15000);
    return () => clearInterval(interval);
  }, [fetchSwaps]);

  return { swaps, isLoading, refetch: fetchSwaps };
}

export function useIndexerStatus() {
  const [status, setStatus] = useState<IndexerStatus | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${INDEXER_URL}/api/status`);
      setStatus(await res.json());
    } catch {
      // Indexer may not be running
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return status;
}
