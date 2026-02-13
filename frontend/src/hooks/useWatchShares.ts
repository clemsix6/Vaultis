"use client";

import { useReadContract } from "wagmi";
import { watchSharesConfig } from "@/lib/contracts";

export function useSharesTotalSupply() {
  return useReadContract({
    ...watchSharesConfig,
    functionName: "totalSupply",
    query: { enabled: !!watchSharesConfig.address },
  });
}

export function useSharesBalance(owner: `0x${string}` | undefined) {
  return useReadContract({
    ...watchSharesConfig,
    functionName: "balanceOf",
    args: owner ? [owner] : undefined,
    query: { enabled: !!watchSharesConfig.address && !!owner },
  });
}

export function useSharesDecimals() {
  return useReadContract({
    ...watchSharesConfig,
    functionName: "decimals",
    query: { enabled: !!watchSharesConfig.address },
  });
}

export function useSharesName() {
  return useReadContract({
    ...watchSharesConfig,
    functionName: "name",
    query: { enabled: !!watchSharesConfig.address },
  });
}

export function useSharesSymbol() {
  return useReadContract({
    ...watchSharesConfig,
    functionName: "symbol",
    query: { enabled: !!watchSharesConfig.address },
  });
}

export function useSharesWatchTokenId() {
  return useReadContract({
    ...watchSharesConfig,
    functionName: "watchTokenId",
    query: { enabled: !!watchSharesConfig.address },
  });
}

export function useSharesPricePerShare() {
  return useReadContract({
    ...watchSharesConfig,
    functionName: "pricePerShare",
    query: { enabled: !!watchSharesConfig.address },
  });
}

export function useSharesAllowance(
  owner: `0x${string}` | undefined,
  spender: `0x${string}` | undefined
) {
  return useReadContract({
    ...watchSharesConfig,
    functionName: "allowance",
    args: owner && spender ? [owner, spender] : undefined,
    query: { enabled: !!watchSharesConfig.address && !!owner && !!spender },
  });
}
