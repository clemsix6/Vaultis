"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { watchNFTConfig } from "@/lib/contracts";

export function useWatchTotalSupply() {
  return useReadContract({
    ...watchNFTConfig,
    functionName: "totalSupply",
    query: { enabled: !!watchNFTConfig.address },
  });
}

export function useWatchOwner(tokenId: bigint | undefined) {
  return useReadContract({
    ...watchNFTConfig,
    functionName: "ownerOf",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: !!watchNFTConfig.address && tokenId !== undefined },
  });
}

export function useWatchTokenURI(tokenId: bigint | undefined) {
  return useReadContract({
    ...watchNFTConfig,
    functionName: "tokenURI",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: !!watchNFTConfig.address && tokenId !== undefined },
  });
}

export function useWatchBalance(owner: `0x${string}` | undefined) {
  return useReadContract({
    ...watchNFTConfig,
    functionName: "balanceOf",
    args: owner ? [owner] : undefined,
    query: { enabled: !!watchNFTConfig.address && !!owner },
  });
}

export function useTokenOfOwnerByIndex(
  owner: `0x${string}` | undefined,
  index: bigint | undefined
) {
  return useReadContract({
    ...watchNFTConfig,
    functionName: "tokenOfOwnerByIndex",
    args: owner && index !== undefined ? [owner, index] : undefined,
    query: {
      enabled: !!watchNFTConfig.address && !!owner && index !== undefined,
    },
  });
}

export function useAllWatches(totalSupply: bigint | undefined) {
  const count = Number(totalSupply ?? BigInt(0));

  // Step 1: resolve real token IDs via tokenByIndex (burn-safe)
  const tokenByIndexContracts = Array.from({ length: count }, (_, i) => ({
    ...watchNFTConfig,
    functionName: "tokenByIndex" as const,
    args: [BigInt(i)] as const,
  }));

  const indexResults = useReadContracts({
    contracts: tokenByIndexContracts,
    query: { enabled: count > 0 && !!watchNFTConfig.address },
  });

  const tokenIds = indexResults.data?.map((r) => r.result as bigint | undefined);

  // Step 2: fetch tokenURI + ownerOf for each resolved token ID
  const resolvedIds = tokenIds?.filter((id): id is bigint => id !== undefined) ?? [];

  const tokenURIContracts = resolvedIds.map((id) => ({
    ...watchNFTConfig,
    functionName: "tokenURI" as const,
    args: [id] as const,
  }));

  const ownerContracts = resolvedIds.map((id) => ({
    ...watchNFTConfig,
    functionName: "ownerOf" as const,
    args: [id] as const,
  }));

  const uriResults = useReadContracts({
    contracts: tokenURIContracts,
    query: { enabled: resolvedIds.length > 0 && !!watchNFTConfig.address },
  });

  const ownerResults = useReadContracts({
    contracts: ownerContracts,
    query: { enabled: resolvedIds.length > 0 && !!watchNFTConfig.address },
  });

  return {
    tokenIds: resolvedIds,
    uris: uriResults.data?.map((r) => r.result as string | undefined),
    owners: ownerResults.data?.map((r) => r.result as `0x${string}` | undefined),
    isLoading: indexResults.isLoading || uriResults.isLoading || ownerResults.isLoading,
    isError: indexResults.isError || uriResults.isError || ownerResults.isError,
  };
}
