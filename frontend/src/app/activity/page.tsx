"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowRightLeft,
  ShieldCheck,
  ShieldOff,
  Gem,
  Coins,
  Droplets,
  RefreshCw,
  ExternalLink,
  Filter,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@/components/ui";
import { useActivity, type ActivityItem } from "@/hooks/useIndexer";

const EVENT_TYPES = [
  { value: "", label: "Tous" },
  { value: "Swap", label: "Swaps" },
  { value: "SharesTransfer", label: "Transferts ERC-20" },
  { value: "WatchMinted", label: "NFT Mints" },
  { value: "NFTTransfer", label: "NFT Transferts" },
  { value: "Whitelisted", label: "Whitelist" },
  { value: "Blacklisted", label: "Blacklist" },
  { value: "LiquidityAdded", label: "Liquidité +" },
  { value: "LiquidityRemoved", label: "Liquidité -" },
];

function getEventIcon(type: string) {
  switch (type) {
    case "Swap":
      return <ArrowRightLeft className="w-4 h-4" />;
    case "Whitelisted":
      return <ShieldCheck className="w-4 h-4" />;
    case "RemovedFromWhitelist":
    case "Blacklisted":
    case "RemovedFromBlacklist":
      return <ShieldOff className="w-4 h-4" />;
    case "WatchMinted":
    case "NFTTransfer":
      return <Gem className="w-4 h-4" />;
    case "SharesMinted":
    case "SharesTransfer":
      return <Coins className="w-4 h-4" />;
    case "LiquidityAdded":
    case "LiquidityRemoved":
      return <Droplets className="w-4 h-4" />;
    default:
      return <Activity className="w-4 h-4" />;
  }
}

function getEventColor(type: string): string {
  switch (type) {
    case "Swap":
      return "text-blue-400 bg-blue-400/10 border-blue-400/20";
    case "Whitelisted":
      return "text-green-400 bg-green-400/10 border-green-400/20";
    case "RemovedFromWhitelist":
    case "Blacklisted":
      return "text-red-400 bg-red-400/10 border-red-400/20";
    case "RemovedFromBlacklist":
      return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
    case "WatchMinted":
    case "NFTTransfer":
      return "text-purple-400 bg-purple-400/10 border-purple-400/20";
    case "SharesMinted":
    case "SharesTransfer":
      return "text-gold bg-gold/10 border-gold/20";
    case "LiquidityAdded":
      return "text-cyan-400 bg-cyan-400/10 border-cyan-400/20";
    case "LiquidityRemoved":
      return "text-orange-400 bg-orange-400/10 border-orange-400/20";
    default:
      return "text-gray-400 bg-gray-400/10 border-gray-400/20";
  }
}

function formatTimestamp(ts: string | null): string {
  if (!ts) return "—";
  const date = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60_000) return "Il y a quelques secondes";
  if (diff < 3_600_000) return `Il y a ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `Il y a ${Math.floor(diff / 3_600_000)}h`;
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EventRow({ item, index }: { item: ActivityItem; index: number }) {
  const colorClass = getEventColor(item.type);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-start gap-4 p-4 rounded-xl bg-surface hover:bg-surface-elevated transition-colors duration-200 border border-transparent hover:border-border-subtle"
    >
      {/* Icon */}
      <div className={`flex-shrink-0 p-2 rounded-lg border ${colorClass}`}>
        {getEventIcon(item.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colorClass}`}>
            {item.type}
          </span>
          <span className="text-xs text-gray-500">{item.contract}</span>
        </div>
        <p className="text-sm text-gray-300 truncate">
          {item.data.description ?? "—"}
        </p>
      </div>

      {/* Metadata */}
      <div className="flex-shrink-0 text-right">
        <p className="text-xs text-gray-500">{formatTimestamp(item.timestamp)}</p>
        <p className="text-xs text-gray-600 font-mono mt-1">
          Block #{item.blockNumber}
        </p>
        {item.txHash && (
          <a
            href={`https://sepolia.basescan.org/tx/${item.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gold transition-colors mt-1"
          >
            <ExternalLink className="w-3 h-3" />
            Tx
          </a>
        )}
      </div>
    </motion.div>
  );
}

export default function ActivityPage() {
  const [filter, setFilter] = useState("");
  const { activity, isLoading, error, refetch } = useActivity({ limit: 50, refreshInterval: 10000 });

  const filteredActivity = filter
    ? activity.filter((item) => item.type === filter)
    : activity;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                <span className="text-gradient-gold">Activité Blockchain</span>
              </h1>
              <p className="text-gray-400">
                Événements indexés en temps réel depuis la blockchain.
                Rafraîchissement automatique toutes les 10 secondes.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Rafraîchir
            </Button>
          </div>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6"
        >
          {[
            { label: "Total événements", value: activity.length, icon: Activity },
            { label: "Swaps", value: activity.filter((e) => e.type === "Swap").length, icon: ArrowRightLeft },
            { label: "Transferts", value: activity.filter((e) => e.type === "SharesTransfer" || e.type === "NFTTransfer").length, icon: Coins },
            { label: "KYC", value: activity.filter((e) => e.type === "Whitelisted" || e.type === "Blacklisted").length, icon: ShieldCheck },
          ].map((stat) => (
            <Card key={stat.label} hover={false} className="!p-4">
              <div className="flex items-center gap-3">
                <stat.icon className="w-5 h-5 text-gold" />
                <div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-gray-400" />
            {EVENT_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setFilter(type.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                  filter === type.value
                    ? "bg-gold/20 text-gold border-gold/30"
                    : "bg-surface text-gray-400 border-border-subtle hover:border-gold/20 hover:text-gray-300"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Events feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card hover={false}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-gold" />
                  <CardTitle>Événements récents</CardTitle>
                </div>
                {/* Live indicator */}
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-xs text-green-400">Live</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 text-gold animate-spin mx-auto mb-4" />
                  <p className="text-gray-400">Chargement des événements...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-400 mb-2">{error}</p>
                  <p className="text-gray-500 text-sm">
                    Assurez-vous que le backend est lancé sur le port 3001.
                  </p>
                </div>
              ) : filteredActivity.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-1">Aucun événement trouvé</p>
                  <p className="text-gray-600 text-sm">
                    {filter
                      ? "Essayez de changer le filtre."
                      : "Les événements apparaîtront ici dès qu'il y aura de l'activité on-chain."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {filteredActivity.map((item, i) => (
                      <EventRow key={item.id} item={item} index={i} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
