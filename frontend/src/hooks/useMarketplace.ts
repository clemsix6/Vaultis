"use client";

import { useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { marketplaceConfig, MARKETPLACE_ADDRESS, watchNFTConfig, WATCH_NFT_ADDRESS } from "@/lib/contracts";

// --- Read hooks ---

export function useActiveListingCount() {
  return useReadContract({
    ...marketplaceConfig,
    functionName: "getActiveListingCount",
    query: { enabled: !!marketplaceConfig.address },
  });
}

export function useActiveListingIds(offset: bigint, limit: bigint) {
  return useReadContract({
    ...marketplaceConfig,
    functionName: "getActiveListings",
    args: [offset, limit],
    query: { enabled: !!marketplaceConfig.address && limit > 0n },
  });
}

export function useListing(tokenId: bigint | undefined) {
  return useReadContract({
    ...marketplaceConfig,
    functionName: "listings",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: !!marketplaceConfig.address && tokenId !== undefined },
  });
}

export function useListingsBatch(tokenIds: bigint[]) {
  const contracts = tokenIds.map((id) => ({
    ...marketplaceConfig,
    functionName: "listings" as const,
    args: [id] as const,
  }));

  return useReadContracts({
    contracts,
    query: { enabled: tokenIds.length > 0 && !!marketplaceConfig.address },
  });
}

// --- Write hooks ---

export function useApproveMarketplace() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function approve() {
    if (!WATCH_NFT_ADDRESS || !MARKETPLACE_ADDRESS) return;
    writeContract({
      address: WATCH_NFT_ADDRESS,
      abi: watchNFTConfig.abi,
      functionName: "setApprovalForAll",
      args: [MARKETPLACE_ADDRESS, true],
    });
  }

  return { approve, hash, isPending, isConfirming, isSuccess, error };
}

export function useListWatch() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function listWatch(tokenId: bigint, priceInWei: bigint) {
    if (!MARKETPLACE_ADDRESS) return;
    writeContract({
      address: MARKETPLACE_ADDRESS,
      abi: marketplaceConfig.abi,
      functionName: "listWatch",
      args: [tokenId, priceInWei],
    });
  }

  return { listWatch, hash, isPending, isConfirming, isSuccess, error };
}

export function useCancelListing() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function cancelListing(tokenId: bigint) {
    if (!MARKETPLACE_ADDRESS) return;
    writeContract({
      address: MARKETPLACE_ADDRESS,
      abi: marketplaceConfig.abi,
      functionName: "cancelListing",
      args: [tokenId],
    });
  }

  return { cancelListing, hash, isPending, isConfirming, isSuccess, error };
}

export function useBuyWatch() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function buyWatch(tokenId: bigint, priceInWei: bigint) {
    if (!MARKETPLACE_ADDRESS) return;
    writeContract({
      address: MARKETPLACE_ADDRESS,
      abi: marketplaceConfig.abi,
      functionName: "buyWatch",
      args: [tokenId],
      value: priceInWei,
    });
  }

  return { buyWatch, hash, isPending, isConfirming, isSuccess, error };
}
