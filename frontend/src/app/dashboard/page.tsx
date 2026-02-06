"use client";

import { motion } from "framer-motion";
import { Clock, Shield, ShieldCheck, Wallet } from "lucide-react";
import { useAccount } from "wagmi";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { useWatchBalance, useIsAuthorized, useIsWhitelisted, useIsBlacklisted } from "@/hooks";
import { UserHoldings } from "@/components/dashboard/UserHoldings";
import { ConnectButton } from "@/components/auth";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();

  const { data: balance } = useWatchBalance(address);
  const { data: isAuthorized } = useIsAuthorized(address);
  const { data: isWhitelisted } = useIsWhitelisted(address);
  const { data: isBlacklisted } = useIsBlacklisted(address);

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
              Pour accéder à votre dashboard, connectez votre wallet MetaMask.
            </p>
            <ConnectButton />
          </motion.div>
        </div>
      </div>
    );
  }

  const nftCount = balance !== undefined ? Number(balance) : 0;

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
            Mon <span className="text-gradient-gold">Dashboard</span>
          </h1>
          <p className="text-gray-400">
            Aperçu de votre portefeuille Vaultis.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card glow>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>NFTs possédés</CardTitle>
                <Clock className="w-5 h-5 text-gold" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{nftCount}</p>
              <p className="text-sm text-gray-400 mt-1">montres tokenisées</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statut KYC</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {isAuthorized ? (
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                ) : (
                  <Shield className="w-5 h-5 text-gray-500" />
                )}
                <p className="text-lg font-medium text-white">
                  {isAuthorized ? "Autorisé" : "Non autorisé"}
                </p>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {isWhitelisted ? "Whitelisté" : "Non whitelisté"}
                {isBlacklisted ? " · Blacklisté" : ""}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Wallet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-gold" />
                <p className="text-lg font-medium text-white">Connecté</p>
              </div>
              <p className="text-sm text-gray-400 mt-1 font-mono truncate">
                {address}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Holdings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-bold text-white mb-6">Mes Investissements</h2>
          {address && balance !== undefined ? (
            <UserHoldings address={address} balance={balance} />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">Chargement...</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
