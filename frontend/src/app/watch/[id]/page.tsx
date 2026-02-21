"use client";

import { use, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowLeft, Tag, Hash, Calendar, User, TrendingUp, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import { Button, Card, CardContent, Input } from "@/components/ui";
import {
  useWatchTokenURI,
  useWatchOwner,
  useWatchPrice,
  useListing,
  useBuyWatch,
  useApproveMarketplace,
  useApproveRSXForMarketplace,
  useListWatch,
  useCancelListing,
} from "@/hooks";
import { parseTokenURI, getAttributeValue } from "@/lib/metadata";
import { MARKETPLACE_ADDRESS } from "@/lib/contracts";

export default function WatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const tokenId = BigInt(id);
  const { address } = useAccount();

  const { data: uri, isLoading: uriLoading } = useWatchTokenURI(tokenId);
  const { data: owner } = useWatchOwner(tokenId);
  const { data: priceData } = useWatchPrice(tokenId);
  const { data: listingData } = useListing(tokenId);

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

  // Listing state
  const listingSeller = listingData?.[0] as `0x${string}` | undefined;
  const listingPrice = listingData?.[1] as bigint | undefined;
  const isListedOnMarketplace = listingData?.[2] === true;

  const isOwnedByCurrentUser = address && owner
    ? owner.toLowerCase() === address.toLowerCase()
    : false;
  const isSellerCurrentUser = address && listingSeller
    ? listingSeller.toLowerCase() === address.toLowerCase()
    : false;

  // Show the actual owner or the seller for listed items
  const displayOwner = isListedOnMarketplace ? listingSeller : owner;

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
          <Link href="/marketplace" className="inline-flex items-center text-gold hover:text-gold-light mb-8 group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Retour au Marketplace
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image */}
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-surface-card border border-border">
              <Image src={imageUrl} alt={model} fill className="object-cover" />
              {isListedOnMarketplace && (
                <div className="absolute top-4 left-4 px-4 py-2 rounded-full bg-green-500/80 backdrop-blur-sm">
                  <span className="text-sm text-white font-semibold">A vendre</span>
                </div>
              )}
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
                  <Tag className="w-4 h-4" />
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

              {displayOwner && (
                <Card hover={false} className="p-4">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <User className="w-4 h-4" />
                    {isListedOnMarketplace ? "Vendeur" : "Proprietaire"}
                  </div>
                  <p className="text-white font-semibold text-sm">
                    {displayOwner.slice(0, 6)}...{displayOwner.slice(-4)}
                  </p>
                </Card>
              )}
            </div>

            {/* Prices */}
            <Card glow className="p-6">
              <CardContent>
                <h3 className="text-lg font-semibold text-white mb-4">Estimation</h3>
                <div className="space-y-3">
                  {isListedOnMarketplace && listingPrice !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4" /> Prix de vente
                      </span>
                      <span className="text-green-400 font-bold text-lg">
                        {Number(formatEther(listingPrice)).toFixed(0)} RSX
                      </span>
                    </div>
                  )}
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

            {/* Actions */}
            <ActionButtons
              tokenId={tokenId}
              isListedOnMarketplace={isListedOnMarketplace}
              isOwnedByCurrentUser={isOwnedByCurrentUser}
              isSellerCurrentUser={isSellerCurrentUser}
              listingPrice={listingPrice}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function ActionButtons({
  tokenId,
  isListedOnMarketplace,
  isOwnedByCurrentUser,
  isSellerCurrentUser,
  listingPrice,
}: {
  tokenId: bigint;
  isListedOnMarketplace: boolean;
  isOwnedByCurrentUser: boolean;
  isSellerCurrentUser: boolean;
  listingPrice?: bigint;
}) {
  const [showListForm, setShowListForm] = useState(false);
  const [priceInput, setPriceInput] = useState("");

  const { approveRSX, isPending: rsxApprovePending, isConfirming: rsxApproveConfirming, isSuccess: rsxApproveSuccess } = useApproveRSXForMarketplace();
  const { buyWatch, isPending: buyPending, isConfirming: buyConfirming, isSuccess: buySuccess } = useBuyWatch();
  const { cancelListing, isPending: cancelPending, isConfirming: cancelConfirming } = useCancelListing();
  const { approve, isPending: approvePending, isConfirming: approveConfirming, isSuccess: approveSuccess } = useApproveMarketplace();
  const { listWatch, isPending: listPending, isConfirming: listConfirming, isSuccess: listSuccess } = useListWatch();

  const handleList = () => {
    const price = parseFloat(priceInput);
    if (isNaN(price) || price <= 0) return;
    listWatch(tokenId, parseEther(priceInput));
  };

  return (
    <div className="space-y-3">
      {/* Listed + not seller → Buy (2 steps: approve RSX then buy) */}
      {isListedOnMarketplace && !isSellerCurrentUser && listingPrice && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => approveRSX(listingPrice)}
            isLoading={rsxApprovePending || rsxApproveConfirming}
            disabled={rsxApproveSuccess}
          >
            {rsxApproveSuccess ? "Approuvé" : "1. Approve RSX"}
          </Button>
          <Button
            className="flex-1"
            onClick={() => buyWatch(tokenId)}
            isLoading={buyPending || buyConfirming}
            disabled={!rsxApproveSuccess}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {buySuccess
              ? "Acheté !"
              : `2. Acheter (${Number(formatEther(listingPrice)).toFixed(0)} RSX)`}
          </Button>
        </div>
      )}

      {/* Listed + seller → Cancel */}
      {isListedOnMarketplace && isSellerCurrentUser && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => cancelListing(tokenId)}
          isLoading={cancelPending || cancelConfirming}
        >
          Retirer de la vente
        </Button>
      )}

      {/* Not listed + owner → List for sale */}
      {!isListedOnMarketplace && isOwnedByCurrentUser && (
        <>
          {!showListForm ? (
            <Button className="w-full" onClick={() => setShowListForm(true)}>
              Mettre en vente
            </Button>
          ) : (
            <Card className="p-4 space-y-3">
              <Input
                placeholder="Prix en RSX"
                type="number"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => approve()}
                  isLoading={approvePending || approveConfirming}
                  disabled={approveSuccess}
                >
                  {approveSuccess ? "Approuvé" : "1. Approve"}
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleList}
                  isLoading={listPending || listConfirming}
                  disabled={!approveSuccess || !priceInput}
                >
                  2. Vendre
                </Button>
              </div>
              {listSuccess && (
                <p className="text-sm text-green-400 text-center">Mis en vente !</p>
              )}
              <Button
                variant="ghost"
                className="w-full text-gray-500 text-sm"
                onClick={() => setShowListForm(false)}
              >
                Annuler
              </Button>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
