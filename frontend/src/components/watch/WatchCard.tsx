"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Wallet } from "lucide-react";
import { Card } from "@/components/ui";
import { Watch } from "@/types";
import { formatPrice } from "@/lib/utils";

interface WatchCardProps {
  watch: Watch;
  index?: number;
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WatchCard({ watch, index = 0 }: WatchCardProps) {
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

            {/* Token badge */}
            <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-[#030303]/80 backdrop-blur-sm border border-gold/30">
              <span className="text-sm text-gold font-medium">
                Token #{watch.id}
              </span>
            </div>
          </div>

          {/* Info */}
          <div>
            <p className="text-sm text-gold font-medium mb-1">{watch.brand}</p>
            <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-gold transition-colors">
              {watch.model}
            </h3>

            {/* Owner */}
            {watch.owner && (
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-sm text-gray-400 font-mono">
                  {truncateAddress(watch.owner)}
                </span>
              </div>
            )}

            {/* Year + Value */}
            {(watch.year || watch.estimatedValue) && (
              <div className="flex items-center justify-between pt-3 border-t border-border">
                {watch.year ? (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-sm text-gray-300">{watch.year}</span>
                  </div>
                ) : null}
                {watch.estimatedValue ? (
                  <p className="text-lg font-bold text-gold ml-auto">
                    {formatPrice(watch.estimatedValue)}
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
