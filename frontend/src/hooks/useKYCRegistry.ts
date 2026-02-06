"use client";

import { useReadContract } from "wagmi";
import { kycRegistryConfig } from "@/lib/contracts";

export function useIsAuthorized(account: `0x${string}` | undefined) {
  return useReadContract({
    ...kycRegistryConfig,
    functionName: "isAuthorized",
    args: account ? [account] : undefined,
    query: { enabled: !!kycRegistryConfig.address && !!account },
  });
}

export function useIsWhitelisted(account: `0x${string}` | undefined) {
  return useReadContract({
    ...kycRegistryConfig,
    functionName: "whitelisted",
    args: account ? [account] : undefined,
    query: { enabled: !!kycRegistryConfig.address && !!account },
  });
}

export function useIsBlacklisted(account: `0x${string}` | undefined) {
  return useReadContract({
    ...kycRegistryConfig,
    functionName: "blacklisted",
    args: account ? [account] : undefined,
    query: { enabled: !!kycRegistryConfig.address && !!account },
  });
}

export function useKYCOwner() {
  return useReadContract({
    ...kycRegistryConfig,
    functionName: "owner",
    query: { enabled: !!kycRegistryConfig.address },
  });
}
