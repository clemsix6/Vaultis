"use client";

import { use } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowLeft, Shield, Tag, Hash, Calendar, User, TrendingUp } from "lucide-react";
import Link from "next/link";
import { formatEther } from "viem";
import { Button, Card, CardContent } from "@/components/ui";
import { useWatchTokenURI, useWatchOwner, useWatchPrice } from "@/hooks";
import { parseTokenURI, getAttributeValue } from "@/lib/metadata";

export default function WatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const tokenId = BigInt(id);

  const { data: uri, isLoading: uriLoading } = useWatchTokenURI(tokenId);
  const { data: owner } = useWatchOwner(tokenId);
  const { data: priceData } = useWatchPrice(tokenId);

  const metadata = uri ? parseTokenURI(uri) : null;
  const brand = metadata ? String(getAttributeValue(metadata, "Brand") ?? "Inconnu") : "Inconnu";
  const model = metadata ? String(getAttributeValue(metadata, "Model") ?? metadata.name ?? `Watch #${id}`) : `NFT #${id}`;
  const year = metadata ? (getAttributeValue(metadata, "Year") as number | undefined) : undefined;
  const serial = metadata ? String(getAttributeValue(metadata, "Serial") ?? `TOKEN-${id}`) : `TOKEN-${id}`;
  const estimatedValue = metadata ? (getAttributeValue(metadata, "Estimated Value") as number | undefined) : undefined;

  const images = ["/assets/watch-1.png", "/assets/watch-2.png", "/assets/watch-3.png"];
  const imageUrl = metadata?.image ?? images[Number(id) % images.length];

  const oraclePrice = priceData ? priceData[0] : undefined;
  const oracleUpdatedAt = priceData ? priceData[1] : undefined;

  if (uriLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="animate-pulse text-gold text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link href="/showroom" className="inline-flex items-center text-gold hover:text-gold-light mb-8 group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Retour au Showroom
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image */}
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-surface-card border border-border">
              <Image src={imageUrl} alt={model} fill className="object-cover" />
            </div>
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div>
              <p className="text-gold font-medium text-sm uppercase tracking-wider">{brand}</p>
              <h1 className="text-3xl md:text-4xl font-bold text-white mt-1">{model}</h1>
              {metadata?.description && (
                <p className="text-gray-400 mt-3">{metadata.description}</p>
              )}
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4">
              <Card hover={false} className="p-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                  <Hash className="w-4 h-4" />
                  Token ID
                </div>
                <p className="text-white font-semibold">#{id}</p>
              </Card>

              <Card hover={false} className="p-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                  <Shield className="w-4 h-4" />
                  Serie
                </div>
                <p className="text-white font-semibold">{serial}</p>
              </Card>

              {year && (
                <Card hover={false} className="p-4">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <Calendar className="w-4 h-4" />
                    Annee
                  </div>
                  <p className="text-white font-semibold">{year}</p>
                </Card>
              )}

              {owner && (
                <Card hover={false} className="p-4">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <User className="w-4 h-4" />
                    Proprietaire
                  </div>
                  <p className="text-white font-semibold text-sm">
                    {owner.slice(0, 6)}...{owner.slice(-4)}
                  </p>
                </Card>
              )}
            </div>

            {/* Prices */}
            <Card glow className="p-6">
              <CardContent>
                <h3 className="text-lg font-semibold text-white mb-4">Estimation</h3>
                <div className="space-y-3">
                  {estimatedValue && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 flex items-center gap-2">
                        <Tag className="w-4 h-4" /> Valeur metadata
                      </span>
                      <span className="text-white font-bold">
                        {estimatedValue.toLocaleString("fr-FR")} EUR
                      </span>
                    </div>
                  )}
                  {oraclePrice !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Prix Oracle (on-chain)
                      </span>
                      <span className="text-gold font-bold">
                        {Number(formatEther(oraclePrice)).toFixed(2)} ETH
                      </span>
                    </div>
                  )}
                  {oracleUpdatedAt !== undefined && oracleUpdatedAt > 0n && (
                    <p className="text-xs text-gray-500 text-right">
                      Mis a jour: {new Date(Number(oracleUpdatedAt) * 1000).toLocaleString("fr-FR")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Link href="/trade" className="flex-1">
                <Button className="w-full">Trader les parts</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

