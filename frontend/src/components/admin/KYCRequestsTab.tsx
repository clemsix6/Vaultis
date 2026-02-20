"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Clock, Users } from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { TxFeedback } from "./TxFeedback";
import { useKYCRequests, useKYCReview, useWhitelistAddress } from "@/hooks";

export function KYCRequestsTab() {
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const { requests, isLoading, refetch } = useKYCRequests(filter);
  const { review, isReviewing } = useKYCReview();
  const { whitelist, hash, isPending, isConfirming, error } = useWhitelistAddress();

  async function handleApprove(wallet: string) {
    await review(wallet, "approved");
    // Also whitelist on-chain
    whitelist(wallet as `0x${string}`);
    setTimeout(refetch, 2000);
  }

  async function handleReject(wallet: string) {
    await review(wallet, "rejected");
    setTimeout(refetch, 1000);
  }

  const filterButtons = [
    { label: "Toutes", value: undefined },
    { label: "En attente", value: "pending" },
    { label: "Approuvees", value: "approved" },
    { label: "Rejetees", value: "rejected" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gold" />
              <CardTitle>Demandes KYC</CardTitle>
            </div>
            <span className="text-sm text-gray-400">{requests.length} demande(s)</span>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-2 mb-6">
            {filterButtons.map((f) => (
              <button
                key={f.label}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === f.value
                    ? "bg-gold text-dark"
                    : "bg-dark-border text-gray-400 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <p className="text-gray-400 text-center py-8">Chargement...</p>
          ) : requests.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Aucune demande KYC.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req.wallet}
                  className="flex items-center justify-between p-4 bg-dark-border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {req.status === "pending" && <Clock className="w-4 h-4 text-yellow-500 shrink-0" />}
                      {req.status === "approved" && <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />}
                      {req.status === "rejected" && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                      <span className="text-white font-mono text-sm truncate">{req.wallet}</span>
                    </div>
                    <p className="text-gray-400 text-sm">{req.email}</p>
                    <p className="text-gray-500 text-xs">
                      Soumis le {new Date(req.submittedAt).toLocaleString("fr-FR")}
                    </p>
                  </div>

                  {req.status === "pending" && (
                    <div className="flex gap-2 ml-4 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(req.wallet)}
                        isLoading={isReviewing || isPending || isConfirming}
                      >
                        Approuver
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleReject(req.wallet)}
                        isLoading={isReviewing}
                      >
                        Rejeter
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <TxFeedback hash={hash} error={error as Error | null} />
        </CardContent>
      </Card>
    </div>
  );
}
