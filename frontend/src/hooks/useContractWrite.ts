"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import {
  watchNFTConfig,
  kycRegistryConfig,
  WATCH_NFT_ADDRESS,
  KYC_REGISTRY_ADDRESS,
} from "@/lib/contracts";

export function useMintWatch() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  function mint(to: `0x${string}`, uri: string) {
    if (!WATCH_NFT_ADDRESS) return;
    writeContract({
      address: WATCH_NFT_ADDRESS,
      abi: watchNFTConfig.abi,
      functionName: "mint",
      args: [to, uri],
    });
  }

  return { mint, hash, isPending, isConfirming, isSuccess, error };
}

export function useTransferWatch() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  function transfer(
    from: `0x${string}`,
    to: `0x${string}`,
    tokenId: bigint
  ) {
    if (!WATCH_NFT_ADDRESS) return;
    writeContract({
      address: WATCH_NFT_ADDRESS,
      abi: watchNFTConfig.abi,
      functionName: "transferFrom",
      args: [from, to, tokenId],
    });
  }

  return { transfer, hash, isPending, isConfirming, isSuccess, error };
}

export function useWhitelistAddress() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  function whitelist(account: `0x${string}`) {
    if (!KYC_REGISTRY_ADDRESS) return;
    writeContract({
      address: KYC_REGISTRY_ADDRESS,
      abi: kycRegistryConfig.abi,
      functionName: "whitelist",
      args: [account],
    });
  }

  return { whitelist, hash, isPending, isConfirming, isSuccess, error };
}

export function useRemoveFromWhitelist() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  function removeFromWhitelist(account: `0x${string}`) {
    if (!KYC_REGISTRY_ADDRESS) return;
    writeContract({
      address: KYC_REGISTRY_ADDRESS,
      abi: kycRegistryConfig.abi,
      functionName: "removeFromWhitelist",
      args: [account],
    });
  }

  return { removeFromWhitelist, hash, isPending, isConfirming, isSuccess, error };
}

export function useBlacklistAddress() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  function blacklist(account: `0x${string}`) {
    if (!KYC_REGISTRY_ADDRESS) return;
    writeContract({
      address: KYC_REGISTRY_ADDRESS,
      abi: kycRegistryConfig.abi,
      functionName: "blacklist",
      args: [account],
    });
  }

  return { blacklist, hash, isPending, isConfirming, isSuccess, error };
}

export function useRemoveFromBlacklist() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  function removeFromBlacklist(account: `0x${string}`) {
    if (!KYC_REGISTRY_ADDRESS) return;
    writeContract({
      address: KYC_REGISTRY_ADDRESS,
      abi: kycRegistryConfig.abi,
      functionName: "removeFromBlacklist",
      args: [account],
    });
  }

  return { removeFromBlacklist, hash, isPending, isConfirming, isSuccess, error };
}

export function useBatchWhitelist() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  function batchWhitelist(accounts: `0x${string}`[]) {
    if (!KYC_REGISTRY_ADDRESS) return;
    writeContract({
      address: KYC_REGISTRY_ADDRESS,
      abi: kycRegistryConfig.abi,
      functionName: "batchWhitelist",
      args: [accounts],
    });
  }

  return { batchWhitelist, hash, isPending, isConfirming, isSuccess, error };
}

export function useBatchBlacklist() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  function batchBlacklist(accounts: `0x${string}`[]) {
    if (!KYC_REGISTRY_ADDRESS) return;
    writeContract({
      address: KYC_REGISTRY_ADDRESS,
      abi: kycRegistryConfig.abi,
      functionName: "batchBlacklist",
      args: [accounts],
    });
  }

  return { batchBlacklist, hash, isPending, isConfirming, isSuccess, error };
}

export function useSetKYCRegistry() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  function setKYCRegistry(registry: `0x${string}`) {
    if (!WATCH_NFT_ADDRESS) return;
    writeContract({
      address: WATCH_NFT_ADDRESS,
      abi: watchNFTConfig.abi,
      functionName: "setKYCRegistry",
      args: [registry],
    });
  }

  return { setKYCRegistry, hash, isPending, isConfirming, isSuccess, error };
}
