"use client";

import { Watch } from "@/types";
import { WatchCard } from "./WatchCard";

interface WatchGridProps {
  watches: Watch[];
  isLoading?: boolean;
}

export function WatchGrid({ watches, isLoading }: WatchGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-surface-card border border-border rounded-xl p-6 animate-pulse"
          >
            <div className="aspect-square bg-surface rounded-lg mb-4" />
            <div className="h-4 bg-surface rounded w-1/3 mb-2" />
            <div className="h-6 bg-surface rounded w-2/3 mb-4" />
            <div className="h-2 bg-surface rounded w-full mb-3" />
            <div className="flex justify-between pt-3 border-t border-border">
              <div className="h-8 bg-surface rounded w-1/3" />
              <div className="h-8 bg-surface rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (watches.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 text-lg">Aucune montre disponible pour le moment.</p>
        <p className="text-gray-500 mt-2">Revenez bientôt pour découvrir notre collection.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {watches.map((watch, index) => (
        <WatchCard key={watch.id} watch={watch} index={index} />
      ))}
    </div>
  );
}
