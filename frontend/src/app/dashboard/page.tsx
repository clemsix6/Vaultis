"use client";

import { motion } from "framer-motion";
import { Clock, TrendingUp, Wallet } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { formatPrice } from "@/lib/utils";

export default function DashboardPage() {
  // Données de démonstration
  const portfolioValue = 5250;
  const totalShares = 15;
  const watchesOwned = 3;

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
                <CardTitle>Valeur du Portfolio</CardTitle>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">
                {formatPrice(portfolioValue)}
              </p>
              <p className="text-sm text-green-500 mt-1">+12.5% ce mois</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Parts possédées</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{totalShares}</p>
              <p className="text-sm text-gray-400 mt-1">sur {watchesOwned} montres</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statut</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-gold" />
                <p className="text-lg font-medium text-white">Demo</p>
              </div>
              <p className="text-sm text-gray-400 mt-1">Wallet non connecté</p>
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

          <div className="space-y-4">
            {[
              {
                brand: "Rolex",
                model: "Submariner Date Blue",
                shares: 5,
                value: 750,
                change: "+8.2%",
              },
              {
                brand: "Rolex",
                model: "Daytona Green Dial",
                shares: 3,
                value: 4500,
                change: "+15.3%",
              },
            ].map((holding, index) => (
              <Card key={index} className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-surface flex items-center justify-center">
                  <Clock className="w-8 h-8 text-gold" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gold">{holding.brand}</p>
                  <p className="font-semibold text-white">{holding.model}</p>
                  <p className="text-sm text-gray-400">{holding.shares} parts</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">
                    {formatPrice(holding.value)}
                  </p>
                  <p className="text-sm text-green-500">{holding.change}</p>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
