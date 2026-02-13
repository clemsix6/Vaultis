"use client";

import { useState, useEffect, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

export interface IndexedEvent {
  id: number;
  event_type: string;
  contract: string;
  tx_hash: string;
  block_number: number;
  log_index: number;
  timestamp: string | null;
  data: {
    description?: string;
    [key: string]: unknown;
  };
  created_at: string;
}

export interface ActivityItem {
  id: number;
  type: string;
  contract: string;
  txHash: string;
  blockNumber: number;
  timestamp: string | null;
  data: {
    description?: string;
    [key: string]: unknown;
  };
}

interface EventsResponse {
  events: IndexedEvent[];
  total: number;
  limit: number;
  offset: number;
}

interface TradesResponse {
  trades: IndexedEvent[];
  limit: number;
  offset: number;
}

interface ActivityResponse {
  activity: ActivityItem[];
}

/**
 * Fetch blockchain events from the indexer API.
 * Auto-refreshes every `refreshInterval` ms.
 */
export function useEvents(options?: { type?: string; limit?: number; refreshInterval?: number }) {
  const { type, limit = 50, refreshInterval = 10000 } = options ?? {};
  const [data, setData] = useState<EventsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (type) params.set("type", type);
      params.set("limit", String(limit));
      const res = await fetch(`${API_URL}/api/events?${params}`);
      if (!res.ok) throw new Error("Failed to fetch events");
      const json: EventsResponse = await res.json();
      setData(json);
      setError(null);
    } catch {
      setError("Impossible de charger les événements.");
    } finally {
      setIsLoading(false);
    }
  }, [type, limit]);

  useEffect(() => {
    refetch();
    const timer = setInterval(refetch, refreshInterval);
    return () => clearInterval(timer);
  }, [refetch, refreshInterval]);

  return { data, isLoading, error, refetch };
}

/**
 * Fetch swap/trade history from the indexer API.
 */
export function useTrades(options?: { limit?: number; refreshInterval?: number }) {
  const { limit = 50, refreshInterval = 10000 } = options ?? {};
  const [data, setData] = useState<TradesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/trades?limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch trades");
      const json: TradesResponse = await res.json();
      setData(json);
      setError(null);
    } catch {
      setError("Impossible de charger les trades.");
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    refetch();
    const timer = setInterval(refetch, refreshInterval);
    return () => clearInterval(timer);
  }, [refetch, refreshInterval]);

  return { data, isLoading, error, refetch };
}

/**
 * Fetch the latest activity feed.
 */
export function useActivity(options?: { limit?: number; refreshInterval?: number }) {
  const { limit = 20, refreshInterval = 10000 } = options ?? {};
  const [data, setData] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/activity?limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch activity");
      const json: ActivityResponse = await res.json();
      setData(json.activity);
      setError(null);
    } catch {
      setError("Impossible de charger l'activité.");
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    refetch();
    const timer = setInterval(refetch, refreshInterval);
    return () => clearInterval(timer);
  }, [refetch, refreshInterval]);

  return { activity: data, isLoading, error, refetch };
}
