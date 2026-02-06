"use client";

import { useState, useMemo, useEffect } from "react";
import { isAddress } from "viem";
import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from "@/components/ui";
import {
  useIsAuthorized,
  useIsWhitelisted,
  useIsBlacklisted,
  useWhitelistAddress,
  useRemoveFromWhitelist,
  useBlacklistAddress,
  useRemoveFromBlacklist,
  useBatchWhitelist,
  useBatchBlacklist,
} from "@/hooks";
import { TxFeedback } from "./TxFeedback";

export function KYCManagementTab() {
  const [checkAddress, setCheckAddress] = useState("");
  const [actionAddress, setActionAddress] = useState("");
  const [batchText, setBatchText] = useState("");

  const typedCheckAddr = isAddress(checkAddress) ? checkAddress as `0x${string}` : undefined;
  const typedActionAddr = isAddress(actionAddress) ? actionAddress as `0x${string}` : undefined;

  const { data: isAuthorized, refetch: refetchAuthorized } = useIsAuthorized(typedCheckAddr);
  const { data: isWhitelisted, refetch: refetchWhitelisted } = useIsWhitelisted(typedCheckAddr);
  const { data: isBlacklisted, refetch: refetchBlacklisted } = useIsBlacklisted(typedCheckAddr);

  const whitelistHook = useWhitelistAddress();
  const removeWhitelistHook = useRemoveFromWhitelist();
  const blacklistHook = useBlacklistAddress();
  const removeBlacklistHook = useRemoveFromBlacklist();
  const batchWhitelistHook = useBatchWhitelist();
  const batchBlacklistHook = useBatchBlacklist();

  const allHooks = [whitelistHook, removeWhitelistHook, blacklistHook, removeBlacklistHook, batchWhitelistHook, batchBlacklistHook];
  const anySuccess = allHooks.some((h) => h.isSuccess);

  useEffect(() => {
    if (anySuccess && typedCheckAddr) {
      refetchAuthorized();
      refetchWhitelisted();
      refetchBlacklisted();
    }
  }, [anySuccess, typedCheckAddr, refetchAuthorized, refetchWhitelisted, refetchBlacklisted]);

  const batchAddresses = useMemo(
    () =>
      batchText
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => isAddress(l)) as `0x${string}`[],
    [batchText]
  );

  return (
    <div className="space-y-6">
      {/* Section 1 - Verify status */}
      <Card hover={false}>
        <CardHeader>
          <CardTitle>Vérifier un statut</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Input
                label="Adresse à vérifier"
                placeholder="0x..."
                value={checkAddress}
                onChange={(e) => setCheckAddress(e.target.value)}
              />
            </div>
          </div>
          {typedCheckAddr && (
            <div className="mt-4 flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                {isAuthorized ? (
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                ) : (
                  <ShieldX className="w-5 h-5 text-gray-500" />
                )}
                <span className="text-white text-sm">
                  {isAuthorized ? "Autorisé" : "Non autorisé"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isWhitelisted ? (
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                ) : (
                  <ShieldX className="w-5 h-5 text-gray-500" />
                )}
                <span className="text-white text-sm">
                  {isWhitelisted ? "Whitelisté" : "Non whitelisté"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isBlacklisted ? (
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-gray-500" />
                )}
                <span className="text-white text-sm">
                  {isBlacklisted ? "Blacklisté" : "Non blacklisté"}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2 - Individual actions */}
      <Card hover={false}>
        <CardHeader>
          <CardTitle>Actions individuelles</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            label="Adresse cible"
            placeholder="0x..."
            value={actionAddress}
            onChange={(e) => setActionAddress(e.target.value)}
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              size="sm"
              disabled={!typedActionAddr}
              isLoading={whitelistHook.isPending || whitelistHook.isConfirming}
              onClick={() => typedActionAddr && whitelistHook.whitelist(typedActionAddr)}
            >
              Whitelist
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!typedActionAddr}
              isLoading={removeWhitelistHook.isPending || removeWhitelistHook.isConfirming}
              onClick={() => typedActionAddr && removeWhitelistHook.removeFromWhitelist(typedActionAddr)}
            >
              Retirer whitelist
            </Button>
            <Button
              size="sm"
              disabled={!typedActionAddr}
              isLoading={blacklistHook.isPending || blacklistHook.isConfirming}
              onClick={() => typedActionAddr && blacklistHook.blacklist(typedActionAddr)}
            >
              Blacklist
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!typedActionAddr}
              isLoading={removeBlacklistHook.isPending || removeBlacklistHook.isConfirming}
              onClick={() => typedActionAddr && removeBlacklistHook.removeFromBlacklist(typedActionAddr)}
            >
              Retirer blacklist
            </Button>
          </div>
          <TxFeedback hash={whitelistHook.hash} error={whitelistHook.error} />
          <TxFeedback hash={removeWhitelistHook.hash} error={removeWhitelistHook.error} />
          <TxFeedback hash={blacklistHook.hash} error={blacklistHook.error} />
          <TxFeedback hash={removeBlacklistHook.hash} error={removeBlacklistHook.error} />
        </CardContent>
      </Card>

      {/* Section 3 - Batch operations */}
      <Card hover={false}>
        <CardHeader>
          <CardTitle>Opérations batch</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Adresses (une par ligne)
          </label>
          <textarea
            className="w-full bg-dark-lighter border border-dark-border rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all duration-200 min-h-[120px] font-mono text-sm"
            placeholder={"0x...\n0x...\n0x..."}
            value={batchText}
            onChange={(e) => setBatchText(e.target.value)}
          />
          <p className="mt-2 text-sm text-gray-400">
            {batchAddresses.length} adresse{batchAddresses.length > 1 ? "s" : ""} valide{batchAddresses.length > 1 ? "s" : ""}
          </p>
          <div className="mt-4 flex gap-3">
            <Button
              size="sm"
              disabled={batchAddresses.length === 0}
              isLoading={batchWhitelistHook.isPending || batchWhitelistHook.isConfirming}
              onClick={() => batchWhitelistHook.batchWhitelist(batchAddresses)}
            >
              Batch Whitelist
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={batchAddresses.length === 0}
              isLoading={batchBlacklistHook.isPending || batchBlacklistHook.isConfirming}
              onClick={() => batchBlacklistHook.batchBlacklist(batchAddresses)}
            >
              Batch Blacklist
            </Button>
          </div>
          <TxFeedback hash={batchWhitelistHook.hash} error={batchWhitelistHook.error} />
          <TxFeedback hash={batchBlacklistHook.hash} error={batchBlacklistHook.error} />
        </CardContent>
      </Card>
    </div>
  );
}
