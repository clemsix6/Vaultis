"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input, Button } from "@/components/ui";
import { WatchGrid } from "@/components/watch";
import { DEMO_WATCHES, SHOWROOM_STATS } from "@/data/watches";

export default function ShowroomPage() {
  const [search, setSearch] = useState("");
  const [isLoading] = useState(false);

  // Filtrage avec memoization
  const filteredWatches = useMemo(
    () =>
      DEMO_WATCHES.filter(
        (watch) =>
          watch.brand.toLowerCase().includes(search.toLowerCase()) ||
          watch.model.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  );

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
          {SHOWROOM_STATS.map((stat) => (
            <div
              key={stat.label}
              className="bg-surface-card border border-border rounded-xl p-4 text-center"
            >
              <p className="text-2xl font-bold text-gold">{stat.value}</p>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Grid */}
        <WatchGrid watches={filteredWatches} isLoading={isLoading} />
      </div>
    </div>
  );
}
