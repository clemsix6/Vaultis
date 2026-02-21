"use client";

import { useState, useEffect, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

export type KYCStatus = "unknown" | "pending" | "verified" | "loading" | "error";

interface StatusResponse {
  status: "unknown" | "pending" | "verified";
  registered: boolean;
  verified: boolean;
  email?: string;
  whitelistedOnChain: boolean;
}

export function useKYCStatus(walletAddress: `0x${string}` | undefined) {
  const [status, setStatus] = useState<KYCStatus>("loading");
  const [data, setData] = useState<StatusResponse | null>(null);

  const refetch = useCallback(async () => {
    if (!walletAddress) {
      setStatus("unknown");
      return;
    }
    try {
      setStatus("loading");
      const res = await fetch(`${API_URL}/api/auth/status/${walletAddress}`);
      if (!res.ok) throw new Error("Failed to fetch status");
      const json: StatusResponse = await res.json();
      setData(json);
      setStatus(json.status);
    } catch {
      setStatus("error");
    }
  }, [walletAddress]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { status, data, refetch };
}

export function useRegisterEmail() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  async function register(walletAddress: string, email: string) {
    setIsPending(true);
    setError(null);
    setIsSuccess(false);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, email }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erreur lors de l'inscription.");
        return;
      }
      setIsSuccess(true);
    } catch {
      setError("Erreur réseau. Le backend est-il lancé ?");
    } finally {
      setIsPending(false);
    }
  }

  return { register, isPending, error, isSuccess };
}

export function useResendVerification() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  async function resend(walletAddress: string) {
    setIsPending(true);
    setError(null);
    setIsSuccess(false);
    try {
      const res = await fetch(`${API_URL}/api/auth/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erreur lors du renvoi.");
        return;
      }
      setIsSuccess(true);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setIsPending(false);
    }
  }

  return { resend, isPending, error, isSuccess };
}

export function useVerifyToken() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ message: string; walletAddress: string; txHash?: string } | null>(null);

  async function verify(token: string) {
    setIsPending(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/verify?token=${token}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erreur de vérification.");
        return;
      }
      setResult(json);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setIsPending(false);
    }
  }

  return { verify, isPending, error, result };
}
