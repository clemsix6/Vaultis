"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Wallet, Package, Tag } from "lucide-react";
import { useAccount, useReadContracts, useBalance } from "wagmi";
import { parseEther, formatEther } from "viem";
import { Card, Button, Input } from "@/components/ui";
import { ConnectButton } from "@/components/auth";
import {
  useWatchBalance,
  useShareTokenBalance,
  useApproveMarketplace,
  useListWatch,
  useCancelListing,
} from "@/hooks";
import { watchNFTConfig, marketplaceConfig } from "@/lib/contracts";
import { parseTokenURI, getAttributeValue } from "@/lib/metadata";
import Image from "next/image";

interface InventoryItem {
  tokenId: number;
  brand: string;
  model: string;
  imageUrl: string;
  year?: number;
  estimatedValue?: number;
  isListed: boolean;
  listingPrice?: bigint;
}

export default function InventoryPage() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useWatchBalance(address);
  const { data: ethBalanceData } = useBalance({ address });
  const { data: shareBalance } = useShareTokenBalance(address);

  const count = balance !== undefined ? Number(balance) : 0;
  const ethBal = ethBalanceData ? parseFloat(formatEther(ethBalanceData.value)) : NaN;
  const rsxBal = shareBalance !== undefined ? Number(shareBalance) / 1e18 : NaN;

  // Fetch token IDs owned by user
  const tokenIdContracts = Array.from({ length: count }, (_, i) => ({
    ...watchNFTConfig,
    functionName: "tokenOfOwnerByIndex" as const,
    args: [address!, BigInt(i)] as const,
  }));

  const { data: tokenIdResults } = useReadContracts({
    contracts: tokenIdContracts,
    query: { enabled: count > 0 && !!address && !!watchNFTConfig.address },
  });

  const tokenIds = useMemo(
    () => (tokenIdResults?.map((r) => r.result as bigint | undefined).filter((id): id is bigint => id !== undefined)) ?? [],
    [tokenIdResults]
  );

  // Fetch tokenURIs
  const uriContracts = tokenIds.map((id) => ({
    ...watchNFTConfig,
    functionName: "tokenURI" as const,
    args: [id] as const,
  }));

  const { data: uriResults } = useReadContracts({
    contracts: uriContracts,
    query: { enabled: tokenIds.length > 0 && !!watchNFTConfig.address },
  });

  // Fetch listing status for each token
  const listingContracts = tokenIds.map((id) => ({
    ...marketplaceConfig,
    functionName: "listings" as const,
    args: [id] as const,
  }));

  const { data: listingResults } = useReadContracts({
    contracts: listingContracts,
    query: { enabled: tokenIds.length > 0 && !!marketplaceConfig.address },
  });

  const items: InventoryItem[] = useMemo(() => {
    return tokenIds.map((id, i) => {
      const uri = uriResults?.[i]?.result as string | undefined;
      const metadata = uri ? parseTokenURI(uri) : null;
      const images = ["/assets/watch-1.png", "/assets/watch-2.png", "/assets/watch-3.png"];

      const listingData = listingResults?.[i]?.result as [string, bigint, boolean] | undefined;
      const isListed = listingData?.[2] === true;

      return {
        tokenId: Number(id),
        brand: metadata ? String(getAttributeValue(metadata, "Brand") ?? "Inconnu") : "Inconnu",
        model: metadata ? String(getAttributeValue(metadata, "Model") ?? metadata.name ?? `Watch #${id}`) : `NFT #${id}`,
        imageUrl: metadata?.image ?? images[Number(id) % images.length],
        year: metadata ? (getAttributeValue(metadata, "Year") as number | undefined) : undefined,
        estimatedValue: metadata ? (getAttributeValue(metadata, "Estimated Value") as number | undefined) : undefined,
        isListed,
        listingPrice: isListed ? listingData?.[1] : undefined,
      };
    });
  }, [tokenIds, uriResults, listingResults]);

  if (!isConnected) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <Wallet className="w-16 h-16 text-gold mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white mb-4">
              Connectez votre wallet
            </h1>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Pour accéder à votre inventaire, connectez votre wallet MetaMask.
            </p>
            <ConnectButton />
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            Mon <span className="text-gradient-gold">Inventaire</span>
          </h1>
          <p className="text-gray-400">
            Gérez vos montres NFT et mettez-les en vente sur le marketplace.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card glow>
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">NFTs possédés</p>
                <Package className="w-5 h-5 text-gold" />
              </div>
              <p className="text-3xl font-bold text-white">{count}</p>
            </div>
          </Card>
          <Card>
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">En vente</p>
                <Tag className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-3xl font-bold text-white">
                {items.filter((i) => i.isListed).length}
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">Balances</p>
                <Wallet className="w-5 h-5 text-gold" />
              </div>
              <p className="text-lg font-bold text-white">
                {!isNaN(ethBal) ? `${ethBal.toFixed(4)} ETH` : "—"}
              </p>
              <p className="text-sm text-gold mt-1">
                {!isNaN(rsxBal) ? `${rsxBal.toFixed(2)} RSX` : "—"}
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">Wallet</p>
                <Wallet className="w-5 h-5 text-gray-500" />
              </div>
              <p className="text-sm font-mono text-white truncate">{address}</p>
            </div>
          </Card>
        </motion.div>

        {/* Items grid */}
        {count === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Vous ne possédez aucune montre NFT.</p>
            <p className="text-gray-500 text-sm mt-2">
              Rendez-vous sur le Marketplace pour en acheter.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, i) => (
              <motion.div
                key={item.tokenId}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <InventoryCard item={item} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InventoryCard({ item }: { item: InventoryItem }) {
  const [showListForm, setShowListForm] = useState(false);
  const [priceInput, setPriceInput] = useState("");

  const { approve, isPending: approvePending, isConfirming: approveConfirming, isSuccess: approveSuccess } = useApproveMarketplace();
  const { listWatch, isPending: listPending, isConfirming: listConfirming, isSuccess: listSuccess } = useListWatch();
  const { cancelListing, isPending: cancelPending, isConfirming: cancelConfirming } = useCancelListing();

  const handleList = () => {
    const price = parseFloat(priceInput);
    if (isNaN(price) || price <= 0) return;
    listWatch(BigInt(item.tokenId), parseEther(priceInput));
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-square rounded-lg overflow-hidden bg-surface mb-4">
        <Image
          src={item.imageUrl || "/assets/watch-main.png"}
          alt={`${item.brand} ${item.model}`}
          fill
          className="object-contain p-4"
        />
        {/* Token badge */}
        <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-[#030303]/80 backdrop-blur-sm border border-gold/30">
          <span className="text-sm text-gold font-medium">
            Token #{item.tokenId}
          </span>
        </div>
        {item.isListed && (
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-green-500/80 backdrop-blur-sm">
            <span className="text-sm text-white font-medium">En vente</span>
          </div>
        )}
      </div>

      <div>
        <p className="text-sm text-gold font-medium mb-1">{item.brand}</p>
        <h3 className="text-lg font-semibold text-white mb-3">{item.model}</h3>

        {item.isListed && item.listingPrice ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-sm text-gray-400">Prix de vente</span>
              <span className="text-lg font-bold text-green-400">
                {Number(formatEther(item.listingPrice)).toFixed(2)} ETH
              </span>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => cancelListing(BigInt(item.tokenId))}
              isLoading={cancelPending || cancelConfirming}
            >
              Retirer de la vente
            </Button>
          </div>
        ) : (
          <div className="pt-3 border-t border-border">
            {!showListForm ? (
              <Button
                className="w-full"
                onClick={() => setShowListForm(true)}
              >
                Mettre en vente
              </Button>
            ) : (
              <div className="space-y-3">
                <Input
                  placeholder="Prix en ETH"
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
                  className="w-full text-gray-500"
                  onClick={() => setShowListForm(false)}
                >
                  Annuler
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
