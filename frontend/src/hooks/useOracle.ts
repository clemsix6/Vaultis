"use client";

import { useReadContract } from "wagmi";
import { oracleConfig } from "@/lib/contracts";

export function useWatchPrice(tokenId: bigint | undefined) {
  return useReadContract({
    ...oracleConfig,
    functionName: "getPrice",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: !!oracleConfig.address && tokenId !== undefined },
  });
}

export function useOracleOwner() {
  return useReadContract({
    ...oracleConfig,
    functionName: "owner",
    query: { enabled: !!oracleConfig.address },
  });
}
