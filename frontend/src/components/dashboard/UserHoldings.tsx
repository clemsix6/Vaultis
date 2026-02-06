"use client";

import { useReadContracts } from "wagmi";
import { Clock } from "lucide-react";
import { Card } from "@/components/ui";
import { watchNFTConfig } from "@/lib/contracts";

interface UserHoldingsProps {
  address: `0x${string}`;
  balance: bigint;
}

export function UserHoldings({ address, balance }: UserHoldingsProps) {
  const count = Number(balance);

  const tokenIdContracts = Array.from({ length: count }, (_, i) => ({
    ...watchNFTConfig,
    functionName: "tokenOfOwnerByIndex" as const,
    args: [address, BigInt(i)] as const,
  }));

  const { data: tokenIdResults } = useReadContracts({
    contracts: tokenIdContracts,
    query: { enabled: count > 0 && !!watchNFTConfig.address },
  });

  const tokenIds = tokenIdResults?.map((r) => r.result as bigint | undefined) ?? [];

  const tokenURIContracts = tokenIds
    .filter((id): id is bigint => id !== undefined)
    .map((id) => ({
      ...watchNFTConfig,
      functionName: "tokenURI" as const,
      args: [id] as const,
    }));

  const { data: uriResults } = useReadContracts({
    contracts: tokenURIContracts,
    query: { enabled: tokenURIContracts.length > 0 && !!watchNFTConfig.address },
  });

  if (count === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Vous ne possédez aucun NFT pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tokenIds.map((tokenId, index) => {
        if (tokenId === undefined) return null;
        const uri = uriResults?.[index]?.result as string | undefined;

        return (
          <Card key={Number(tokenId)} className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-surface flex items-center justify-center">
              <Clock className="w-8 h-8 text-gold" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gold">LuxWatch NFT</p>
              <p className="font-semibold text-white">Watch #{Number(tokenId)}</p>
              <p className="text-sm text-gray-400 truncate max-w-xs">
                {uri ?? "Chargement..."}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Token ID</p>
              <p className="font-semibold text-white">#{Number(tokenId)}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
