"use client";

import { useState } from "react";
import { isAddress } from "viem";
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from "@/components/ui";
import {
  useWatchTotalSupply,
  useWatchNFTOwner,
  useKYCRegistryAddress,
  useMintWatch,
  useSetKYCRegistry,
} from "@/hooks";
import { TxFeedback } from "./TxFeedback";

export function NFTManagementTab() {
  const [mintTo, setMintTo] = useState("");
  const [tokenURI, setTokenURI] = useState("");
  const [newRegistry, setNewRegistry] = useState("");

  const { data: totalSupply } = useWatchTotalSupply();
  const { data: nftOwner } = useWatchNFTOwner();
  const { data: kycRegistryAddr } = useKYCRegistryAddress();

  const mintHook = useMintWatch();
  const setRegistryHook = useSetKYCRegistry();

  const typedMintTo = isAddress(mintTo) ? mintTo as `0x${string}` : undefined;
  const typedRegistry = isAddress(newRegistry) ? newRegistry as `0x${string}` : undefined;

  return (
    <div className="space-y-6">
      {/* Section 1 - Contract stats */}
      <Card hover={false}>
        <CardHeader>
          <CardTitle>Statistiques du contrat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-400">Total Supply</p>
              <p className="text-2xl font-bold text-white">
                {totalSupply !== undefined ? Number(totalSupply).toString() : "..."}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">KYC Registry</p>
              <p className="text-sm font-mono text-white truncate">
                {(kycRegistryAddr as string) ?? "..."}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Owner</p>
              <p className="text-sm font-mono text-white truncate">
                {(nftOwner as string) ?? "..."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2 - Mint an NFT */}
      <Card hover={false}>
        <CardHeader>
          <CardTitle>Mint un NFT</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              label="Adresse destinataire"
              placeholder="0x..."
              value={mintTo}
              onChange={(e) => setMintTo(e.target.value)}
            />
            <Input
              label="Token URI"
              placeholder="https://..."
              value={tokenURI}
              onChange={(e) => setTokenURI(e.target.value)}
            />
            <Button
              disabled={!typedMintTo || !tokenURI}
              isLoading={mintHook.isPending || mintHook.isConfirming}
              onClick={() => typedMintTo && mintHook.mint(typedMintTo, tokenURI)}
            >
              Mint
            </Button>
            <TxFeedback hash={mintHook.hash} error={mintHook.error} />
          </div>
        </CardContent>
      </Card>

      {/* Section 3 - Update KYC Registry */}
      <Card hover={false}>
        <CardHeader>
          <CardTitle>Mettre à jour KYC Registry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              label="Nouvelle adresse registry"
              placeholder="0x..."
              value={newRegistry}
              onChange={(e) => setNewRegistry(e.target.value)}
            />
            <Button
              disabled={!typedRegistry}
              isLoading={setRegistryHook.isPending || setRegistryHook.isConfirming}
              onClick={() => typedRegistry && setRegistryHook.setKYCRegistry(typedRegistry)}
            >
              Mettre à jour
            </Button>
            <TxFeedback hash={setRegistryHook.hash} error={setRegistryHook.error} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
