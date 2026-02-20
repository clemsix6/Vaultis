"use client";

import { useState, useEffect, useCallback } from "react";
import { INDEXER_URL } from "@/lib/contracts";

interface KYCRequest {
  wallet: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: number;
  reviewedAt?: number;
}

export function useKYCStatus(wallet: string | undefined) {
  const [request, setRequest] = useState<KYCRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    if (!wallet) { setIsLoading(false); return; }
    try {
      const res = await fetch(`${INDEXER_URL}/api/kyc/status?wallet=${wallet}`);
      const data = await res.json();
      setRequest(data.request ?? null);
    } catch {
      // Indexer may not be running
    } finally {
      setIsLoading(false);
    }
  }, [wallet]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return { request, isLoading, refetch: fetchStatus };
}

export function useKYCSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  async function submit(wallet: string, email: string) {
    setIsSubmitting(true);
    setError(null);
    setIsSuccess(false);
    try {
      const res = await fetch(`${INDEXER_URL}/api/kyc/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur inconnue");
      } else {
        setIsSuccess(true);
      }
    } catch {
      setError("Impossible de contacter le serveur");
    } finally {
      setIsSubmitting(false);
    }
  }

  return { submit, isSubmitting, error, isSuccess };
}

export function useKYCRequests(statusFilter?: string) {
  const [requests, setRequests] = useState<KYCRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    try {
      const params = statusFilter ? `?status=${statusFilter}` : "";
      const res = await fetch(`${INDEXER_URL}/api/kyc/requests${params}`);
      const data = await res.json();
      setRequests(data.requests ?? []);
    } catch {
      // Indexer may not be running
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  return { requests, isLoading, refetch: fetchRequests };
}

export function useKYCReview() {
  const [isReviewing, setIsReviewing] = useState(false);

  async function review(wallet: string, action: "approved" | "rejected") {
    setIsReviewing(true);
    try {
      await fetch(`${INDEXER_URL}/api/kyc/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet, action }),
      });
    } catch {
      // ignore
    } finally {
      setIsReviewing(false);
    }
  }

  return { review, isReviewing };
}
