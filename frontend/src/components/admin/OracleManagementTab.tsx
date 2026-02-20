"use client";

import { useState } from "react";
import { parseEther, formatEther } from "viem";
import { Input, Button, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { TxFeedback } from "./TxFeedback";
import { useSetOraclePrice, useWatchPrice, useWatchTotalSupply } from "@/hooks";
import { ORACLE_ADDRESS } from "@/lib/contracts";

export function OracleManagementTab() {
  const [tokenId, setTokenId] = useState("");
  const [priceETH, setPriceETH] = useState("");
  const [lookupId, setLookupId] = useState("");

  const { setPrice, hash, isPending, isConfirming, isSuccess, error } = useSetOraclePrice();
  const { data: totalSupply } = useWatchTotalSupply();
  const { data: priceData } = useWatchPrice(lookupId !== "" ? BigInt(lookupId) : undefined);

  function handleSetPrice() {
    if (!tokenId || !priceETH) return;
    setPrice(BigInt(tokenId), parseEther(priceETH));
  }

  return (
    <div className="space-y-6">
      {/* Oracle info */}
      <Card>
        <CardHeader>
          <CardTitle>Informations Oracle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Adresse Oracle</p>
              <p className="text-white font-mono text-sm break-all">
                {ORACLE_ADDRESS ?? "Non configure"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Total NFTs</p>
              <p className="text-white font-semibold">
                {totalSupply !== undefined ? String(totalSupply) : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Set price */}
      <Card>
        <CardHeader>
          <CardTitle>Definir un prix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              label="Token ID"
              type="number"
              placeholder="0"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
            />
            <Input
              label="Prix (en ETH)"
              type="number"
              placeholder="5.0"
              value={priceETH}
              onChange={(e) => setPriceETH(e.target.value)}
            />
            <Button
              onClick={handleSetPrice}
              isLoading={isPending || isConfirming}
              disabled={!tokenId || !priceETH}
            >
              Mettre a jour le prix
            </Button>
            {isSuccess && <p className="text-green-400 text-sm">Prix mis a jour !</p>}
            <TxFeedback hash={hash} error={error as Error | null} />
          </div>
        </CardContent>
      </Card>

      {/* Lookup price */}
      <Card>
        <CardHeader>
          <CardTitle>Consulter un prix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              label="Token ID"
              type="number"
              placeholder="0"
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
            />
            {priceData && (
              <div className="bg-dark-border rounded-lg p-4">
                <p className="text-gray-400 text-sm">Prix actuel</p>
                <p className="text-gold text-2xl font-bold">
                  {Number(formatEther(priceData[0])).toFixed(4)} ETH
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Mis a jour: {new Date(Number(priceData[1]) * 1000).toLocaleString("fr-FR")}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
