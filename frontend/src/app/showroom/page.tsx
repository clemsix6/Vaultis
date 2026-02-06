"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input, Button } from "@/components/ui";
import { WatchGrid } from "@/components/watch";
import { useWatchTotalSupply, useAllWatches } from "@/hooks";
import { parseTokenURI, getAttributeValue } from "@/lib/metadata";
import type { Watch } from "@/types";

function nftToWatch(
  tokenId: number,
  uri: string | undefined,
  owner: `0x${string}` | undefined,
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
    owner: owner ?? undefined,
  };
}

export default function ShowroomPage() {
  const [search, setSearch] = useState("");

  const { data: totalSupply } = useWatchTotalSupply();
  const { tokenIds, uris, owners, isLoading: isLoadingNFTs } = useAllWatches(totalSupply);

  const count = totalSupply !== undefined ? Number(totalSupply) : 0;

  const watches = useMemo(() => {
    if (tokenIds.length > 0 && uris && owners) {
      return tokenIds.map((id, i) =>
        nftToWatch(Number(id), uris[i], owners[i], i)
      );
    }
    return [];
  }, [tokenIds, uris, owners]);

  const filteredWatches = useMemo(
    () =>
      watches.filter(
        (watch) =>
          watch.brand.toLowerCase().includes(search.toLowerCase()) ||
          watch.model.toLowerCase().includes(search.toLowerCase())
      ),
    [watches, search]
  );

  const stats = [
    { label: "Montres", value: count },
    { label: "Source", value: "On-chain" },
    { label: "Réseau", value: "Hardhat" },
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
            Le <span className="text-gradient-gold">Showroom</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Découvrez notre collection de montres de luxe tokenisées.
            Chaque pièce est authentifiée et certifiée.
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
        {!isLoadingNFTs && count === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-gray-400 text-lg">Aucune montre mintée pour le moment.</p>
          </motion.div>
        ) : (
          <WatchGrid watches={filteredWatches} isLoading={isLoadingNFTs} />
        )}
      </div>
    </div>
  );
}
