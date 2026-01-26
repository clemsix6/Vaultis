"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui";
import { Watch } from "@/types";
import { formatPrice, formatPercent } from "@/lib/utils";
import { ETH_EUR_RATE } from "@/constants";

interface WatchCardProps {
  watch: Watch;
  index?: number;
}

export function WatchCard({ watch, index = 0 }: WatchCardProps) {
  const percentAvailable = (watch.availableShares / watch.totalShares) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link href={`/watch/${watch.id}`}>
        <Card className="group cursor-pointer overflow-hidden">
          {/* Image */}
          <div className="relative aspect-square mb-4 rounded-lg overflow-hidden bg-surface">
            <Image
              src={watch.imageUrl || "/assets/watch-main.png"}
              alt={`${watch.brand} ${watch.model}`}
              fill
              className="object-contain p-4 transition-transform duration-500 group-hover:scale-110"
            />

            {/* Badge disponibilité */}
            <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-[#030303]/80 backdrop-blur-sm border border-border">
              <span className="text-sm text-gold font-medium">
                {formatPercent(percentAvailable)} dispo
              </span>
            </div>
          </div>

          {/* Info */}
          <div>
            <p className="text-sm text-gold font-medium mb-1">{watch.brand}</p>
            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-gold transition-colors">
              {watch.model}
            </h3>

            {/* Progress bar */}
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Parts vendues</span>
                <span className="text-white">
                  {watch.totalShares - watch.availableShares}/{watch.totalShares}
                </span>
              </div>
              <div className="h-2 bg-surface rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${100 - percentAvailable}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-gold-gradient rounded-full"
                />
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div>
                <p className="text-xs text-gray-500">Prix par part</p>
                <p className="text-lg font-bold text-white">
                  {formatPrice(Number(watch.pricePerShare) / 1e18 * ETH_EUR_RATE)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Valeur estimée</p>
                <p className="text-lg font-bold text-gold">
                  {watch.estimatedValue ? formatPrice(watch.estimatedValue) : "-"}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
