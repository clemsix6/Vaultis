"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { useReadContracts } from "wagmi";
import { Input, Button } from "@/components/ui";
import { WatchGrid } from "@/components/watch";
import { useActiveListingCount, useActiveListingIds } from "@/hooks";
import { watchNFTConfig, marketplaceConfig } from "@/lib/contracts";
import { parseTokenURI, getAttributeValue } from "@/lib/metadata";
import type { Watch } from "@/types";

function nftToWatch(
  tokenId: number,
  uri: string | undefined,
  listing: { seller: string; price: bigint } | undefined,
  index: number
): Watch {
  const images = ["/assets/watch-1.png", "/assets/watch-2.png", "/assets/watch-3.png"];
  const metadata = uri ? parseTokenURI(uri) : null;

  const brand = metadata
    ? String(getAttributeValue(metadata, "Brand") ?? "Inconnu")
    : "Inconnu";
  const model = metadata
    ? String(getAttributeValue(metadata, "Model") ?? metadata.name ?? `Watch #${tokenId}`)
    : `NFT #${tokenId}`;
  const year = metadata
    ? (getAttributeValue(metadata, "Year") as number | undefined)
    : undefined;
  const estimatedValue = metadata
    ? (getAttributeValue(metadata, "Estimated Value") as number | undefined)
    : undefined;
  const serial = metadata
    ? String(getAttributeValue(metadata, "Serial") ?? `TOKEN-${tokenId}`)
    : `TOKEN-${tokenId}`;

  return {
    id: tokenId,
    brand,
    model,
    serialNumber: serial,
    certificateURI: uri ?? "",
    imageUrl: metadata?.image ?? images[index % images.length],
    description: metadata?.description,
    year,
    estimatedValue,
    isListed: true,
    listingPrice: listing?.price,
    seller: listing?.seller as `0x${string}` | undefined,
  };
}

export default function MarketplacePage() {
  const [search, setSearch] = useState("");

  const { data: listingCount, isLoading: countLoading } = useActiveListingCount();
  const count = listingCount !== undefined ? Number(listingCount) : 0;

  const { data: tokenIds } = useActiveListingIds(0n, BigInt(Math.max(count, 1)));

  const safeTokenIds = tokenIds ?? [];

  // Batch fetch tokenURIs for listed watches
  const uriContracts = safeTokenIds.map((id) => ({
    ...watchNFTConfig,
    functionName: "tokenURI" as const,
    args: [id] as const,
  }));

  const { data: uriResults } = useReadContracts({
    contracts: uriContracts,
    query: { enabled: safeTokenIds.length > 0 && !!watchNFTConfig.address },
  });

  // Batch fetch listing details
  const listingContracts = safeTokenIds.map((id) => ({
    ...marketplaceConfig,
    functionName: "listings" as const,
    args: [id] as const,
  }));

  const { data: listingResults } = useReadContracts({
    contracts: listingContracts,
    query: { enabled: safeTokenIds.length > 0 && !!marketplaceConfig.address },
  });

  const watches = useMemo(() => {
    if (safeTokenIds.length === 0) return [];
    return safeTokenIds.map((id, i) => {
      const uri = uriResults?.[i]?.result as string | undefined;
      const listingData = listingResults?.[i]?.result as
        | [string, bigint, boolean]
        | undefined;
      const listing = listingData
        ? { seller: listingData[0], price: listingData[1] }
        : undefined;
      return nftToWatch(Number(id), uri, listing, i);
    });
  }, [safeTokenIds, uriResults, listingResults]);

  const filteredWatches = useMemo(
    () =>
      watches.filter(
        (watch) =>
          watch.brand.toLowerCase().includes(search.toLowerCase()) ||
          watch.model.toLowerCase().includes(search.toLowerCase())
      ),
    [watches, search]
  );

  const isLoading = countLoading || (count > 0 && (!uriResults || !listingResults));

  const stats = [
    { label: "En vente", value: count },
    { label: "Source", value: "On-chain" },
    { label: "Réseau", value: Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "31337") === 84532 ? "Base Sepolia" : "Hardhat" },
    { label: "Standard", value: "ERC-721" },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Le <span className="text-gradient-gold">Marketplace</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Achetez des montres de luxe tokenisées. Chaque pièce est authentifiée,
            certifiée et échangeable on-chain.
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          <div className="flex-1">
            <Input
              placeholder="Rechercher une montre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-5 h-5" />}
            />
          </div>
          <Button variant="outline">
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filtres
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-surface-card border border-border rounded-xl p-4 text-center"
            >
              <p className="text-2xl font-bold text-gold">{stat.value}</p>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Grid or empty state */}
        {!isLoading && count === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-gray-400 text-lg">Aucune montre en vente pour le moment.</p>
          </motion.div>
        ) : (
          <WatchGrid watches={filteredWatches} isLoading={isLoading} />
        )}
      </div>
    </div>
  );
}
