"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Coins, PieChart, Send, Wallet, ArrowRight } from "lucide-react";
import { useAccount } from "wagmi";
import { isAddress, formatUnits } from "viem";
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from "@/components/ui";
import { ConnectButton } from "@/components/auth";
import { TxFeedback } from "@/components/admin/TxFeedback";
import {
  useSharesTotalSupply,
  useSharesBalance,
  useSharesDecimals,
  useSharesName,
  useSharesSymbol,
  useSharesPricePerShare,
  useSharesWatchTokenId,
  useIsAuthorized,
  useTransferShares,
} from "@/hooks";
import { WATCH_SHARES_ADDRESS } from "@/lib/contracts";

export default function SharesPage() {
  const { address, isConnected } = useAccount();
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  const { data: name } = useSharesName();
  const { data: symbol } = useSharesSymbol();
  const { data: totalSupply } = useSharesTotalSupply();
  const { data: decimals } = useSharesDecimals();
  const { data: balance } = useSharesBalance(address);
  const { data: pricePerShare } = useSharesPricePerShare();
  const { data: watchTokenId } = useSharesWatchTokenId();
  const { data: isAuthorized } = useIsAuthorized(address);
  const transferHook = useTransferShares();

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
              Pour voir vos parts fractionnées, connectez votre wallet MetaMask.
            </p>
            <ConnectButton />
          </motion.div>
        </div>
      </div>
    );
  }

  const dec = decimals ?? 18;
  const formattedBalance = balance !== undefined ? formatUnits(balance, dec) : "...";
  const formattedSupply = totalSupply !== undefined ? formatUnits(totalSupply, dec) : "...";
  const priceDisplay = pricePerShare !== undefined
    ? `${(Number(pricePerShare) / 100).toFixed(2)} $`
    : "...";
  const portfolioValue = balance !== undefined && pricePerShare !== undefined
    ? `${(Number(formatUnits(balance, dec)) * Number(pricePerShare) / 100).toFixed(2)} $`
    : "...";

  const typedTo = isAddress(transferTo) ? (transferTo as `0x${string}`) : undefined;

  function handleTransfer() {
    if (!typedTo || !transferAmount || !decimals) return;
    const amount = BigInt(Math.floor(Number(transferAmount) * 10 ** dec));
    transferHook.transfer(typedTo, amount);
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
            Parts <span className="text-gradient-gold">Fractionnées</span>
          </h1>
          <p className="text-gray-400">
            Tokens ERC-20 représentant des parts de montres de luxe.
          </p>
        </motion.div>

        {/* Token info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card glow>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Mon Solde</CardTitle>
                <Coins className="w-5 h-5 text-gold" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{formattedBalance}</p>
              <p className="text-sm text-gray-400 mt-1">{symbol ?? "..."}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Valeur Portfolio</CardTitle>
                <PieChart className="w-5 h-5 text-gold" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{portfolioValue}</p>
              <p className="text-sm text-gray-400 mt-1">valeur estimée</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prix par Part</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{priceDisplay}</p>
              <p className="text-sm text-gray-400 mt-1">par {symbol ?? "token"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supply Totale</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{formattedSupply}</p>
              <p className="text-sm text-gray-400 mt-1">
                Montre #{watchTokenId !== undefined ? Number(watchTokenId) : "..."}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Token details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <Card hover={false}>
            <CardHeader>
              <CardTitle>Informations du Token</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Nom</p>
                  <p className="text-white font-medium">{name ?? "..."}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Symbole</p>
                  <p className="text-white font-medium">{symbol ?? "..."}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Standard</p>
                  <p className="text-white font-medium">ERC-20</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Contrat</p>
                  <p className="text-white font-mono text-sm truncate">
                    {WATCH_SHARES_ADDRESS ?? "Non configuré"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Statut KYC</p>
                  <p className={`font-medium ${isAuthorized ? "text-green-400" : "text-red-400"}`}>
                    {isAuthorized ? "Autorisé" : "Non autorisé"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Montre liée (NFT ID)</p>
                  <p className="text-white font-medium">
                    #{watchTokenId !== undefined ? Number(watchTokenId) : "..."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transfer shares */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card hover={false}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-gold" />
                <CardTitle>Transférer des Parts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {!isAuthorized ? (
                <p className="text-gray-400">
                  Vous devez être autorisé (KYC) pour transférer des parts.
                </p>
              ) : (
                <div className="space-y-4">
                  <Input
                    label="Adresse destinataire"
                    placeholder="0x..."
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                  />
                  <Input
                    label={`Montant (${symbol ?? "tokens"})`}
                    placeholder="100"
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                  />
                  {balance !== undefined && (
                    <p className="text-sm text-gray-400">
                      Solde disponible : {formattedBalance} {symbol}
                    </p>
                  )}
                  <Button
                    disabled={!typedTo || !transferAmount || Number(transferAmount) <= 0}
                    isLoading={transferHook.isPending || transferHook.isConfirming}
                    onClick={handleTransfer}
                  >
                    <span className="flex items-center gap-2">
                      Transférer <ArrowRight className="w-4 h-4" />
                    </span>
                  </Button>
                  <TxFeedback hash={transferHook.hash} error={transferHook.error} />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
