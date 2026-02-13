"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowDownUp, Droplets, TrendingUp, Wallet, Info } from "lucide-react";
import { useAccount, useBalance } from "wagmi";
import { formatEther, formatUnits, parseEther, parseUnits } from "viem";
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from "@/components/ui";
import { ConnectButton } from "@/components/auth";
import { TxFeedback } from "@/components/admin/TxFeedback";
import {
  usePoolReserveShares,
  usePoolReserveETH,
  usePoolTotalLP,
  usePoolLPBalance,
  useSharePriceInETH,
  useGetAmountOut,
  useSwapETHForShares,
  useSwapSharesForETH,
  useApproveSharesForPool,
  useSharesBalance,
  useSharesDecimals,
  useSharesSymbol,
  useIsAuthorized,
} from "@/hooks";
import { SWAP_POOL_ADDRESS } from "@/lib/contracts";

type Direction = "ethToShares" | "sharesToETH";

export default function TradePage() {
  const { address, isConnected } = useAccount();
  const [direction, setDirection] = useState<Direction>("ethToShares");
  const [inputAmount, setInputAmount] = useState("");
  const [needsApproval, setNeedsApproval] = useState(false);

  // Pool data
  const { data: reserveShares } = usePoolReserveShares();
  const { data: reserveETH } = usePoolReserveETH();
  const { data: totalLP } = usePoolTotalLP();
  const { data: lpBalance } = usePoolLPBalance(address);
  const { data: sharePrice } = useSharePriceInETH();

  // User data
  const { data: sharesBalance } = useSharesBalance(address);
  const { data: sharesDecimals } = useSharesDecimals();
  const { data: sharesSymbol } = useSharesSymbol();
  const { data: ethBalance } = useBalance({ address });
  const { data: isAuthorized } = useIsAuthorized(address);

  const dec = sharesDecimals ?? 18;
  const sym = sharesSymbol ?? "WSUB";

  // Calculate expected output
  const parsedInput = (() => {
    if (!inputAmount || Number(inputAmount) <= 0) return undefined;
    try {
      return direction === "ethToShares"
        ? parseEther(inputAmount)
        : parseUnits(inputAmount, dec);
    } catch {
      return undefined;
    }
  })();

  const resIn = direction === "ethToShares" ? reserveETH : reserveShares;
  const resOut = direction === "ethToShares" ? reserveShares : reserveETH;
  const { data: expectedOutput } = useGetAmountOut(parsedInput, resIn, resOut);

  // Swap hooks
  const swapETH = useSwapETHForShares();
  const swapShares = useSwapSharesForETH();
  const approveHook = useApproveSharesForPool();

  const isSwapping =
    swapETH.isPending || swapETH.isConfirming ||
    swapShares.isPending || swapShares.isConfirming;
  const isApproving = approveHook.isPending || approveHook.isConfirming;

  const swapHash = direction === "ethToShares" ? swapETH.hash : swapShares.hash;
  const swapError = direction === "ethToShares" ? swapETH.error : swapShares.error;

  // Check if approval needed for sharesToETH
  useEffect(() => {
    setNeedsApproval(direction === "sharesToETH");
  }, [direction]);

  // Clear input on direction change
  const toggleDirection = useCallback(() => {
    setDirection((d) => (d === "ethToShares" ? "sharesToETH" : "ethToShares"));
    setInputAmount("");
  }, []);

  function handleSwap() {
    if (!parsedInput || parsedInput === 0n) return;
    // Use 1% slippage tolerance
    const minOut = expectedOutput ? (expectedOutput * 99n) / 100n : 0n;

    if (direction === "ethToShares") {
      swapETH.swap(minOut, parsedInput);
    } else {
      swapShares.swap(parsedInput, minOut);
    }
  }

  function handleApprove() {
    if (!parsedInput) return;
    approveHook.approve(parsedInput);
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <Wallet className="w-16 h-16 text-gold mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white mb-4">
              Connectez votre wallet
            </h1>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Pour trader des WatchShares, connectez votre wallet MetaMask.
            </p>
            <ConnectButton />
          </motion.div>
        </div>
      </div>
    );
  }

  const formattedSharePrice = sharePrice
    ? `${Number(formatEther(sharePrice)).toFixed(6)} ETH`
    : "...";

  const formattedReserveETH = reserveETH ? formatEther(reserveETH) : "0";
  const formattedReserveShares = reserveShares ? formatUnits(reserveShares, dec) : "0";

  const outputDisplay = expectedOutput
    ? direction === "ethToShares"
      ? `${Number(formatUnits(expectedOutput, dec)).toFixed(4)} ${sym}`
      : `${Number(formatEther(expectedOutput)).toFixed(6)} ETH`
    : "—";

  const priceImpact = (() => {
    if (!parsedInput || !expectedOutput || !reserveETH || !reserveShares || reserveShares === 0n || reserveETH === 0n) return null;
    const spotPrice = direction === "ethToShares"
      ? (reserveETH * BigInt(1e18)) / reserveShares
      : (reserveShares * BigInt(1e18)) / reserveETH;
    if (spotPrice === 0n) return null;
    const executionPrice = direction === "ethToShares"
      ? (parsedInput * BigInt(1e18)) / expectedOutput
      : (parsedInput * BigInt(1e18)) / expectedOutput;
    const impact = Number(((executionPrice - spotPrice) * 10000n) / spotPrice) / 100;
    return impact;
  })();

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
            <span className="text-gradient-gold">Trade</span>
          </h1>
          <p className="text-gray-400">
            Echangez vos WatchShares sur la pool AMM (x * y = k).
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Swap Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card hover={false}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Swap</CardTitle>
                  <span className="text-sm text-gray-400">Fee: 0.3%</span>
                </div>
              </CardHeader>
              <CardContent>
                {!isAuthorized ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-2">
                      Vous devez etre autorisé (KYC) pour trader.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Input */}
                    <div className="bg-surface rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Vous payez</span>
                        <span className="text-sm text-gray-400">
                          Solde:{" "}
                          {direction === "ethToShares"
                            ? `${ethBalance ? Number(formatEther(ethBalance.value)).toFixed(4) : "..."} ETH`
                            : `${sharesBalance ? Number(formatUnits(sharesBalance, dec)).toFixed(2) : "..."} ${sym}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          placeholder="0.0"
                          value={inputAmount}
                          onChange={(e) => setInputAmount(e.target.value)}
                          className="flex-1 bg-transparent text-2xl font-bold text-white outline-none placeholder-gray-600"
                        />
                        <span className="text-lg font-semibold text-gold">
                          {direction === "ethToShares" ? "ETH" : sym}
                        </span>
                      </div>
                    </div>

                    {/* Direction toggle */}
                    <div className="flex justify-center -my-1">
                      <button
                        onClick={toggleDirection}
                        className="p-2 rounded-xl bg-surface-card hover:bg-surface-elevated border border-border-subtle transition-all duration-200 hover:scale-105"
                      >
                        <ArrowDownUp className="w-5 h-5 text-gold" />
                      </button>
                    </div>

                    {/* Output */}
                    <div className="bg-surface rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Vous recevez (estimé)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex-1 text-2xl font-bold text-white">
                          {outputDisplay}
                        </span>
                        <span className="text-lg font-semibold text-gold">
                          {direction === "ethToShares" ? sym : "ETH"}
                        </span>
                      </div>
                    </div>

                    {/* Price info */}
                    {priceImpact !== null && (
                      <div className="flex items-center gap-2 text-sm px-1">
                        <Info className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400">
                          Impact prix:{" "}
                          <span className={priceImpact > 5 ? "text-red-400" : priceImpact > 2 ? "text-yellow-400" : "text-green-400"}>
                            {priceImpact.toFixed(2)}%
                          </span>
                        </span>
                        <span className="text-gray-500 ml-auto">
                          Slippage max: 1%
                        </span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-3">
                      {direction === "sharesToETH" && needsApproval && (
                        <Button
                          variant="outline"
                          isLoading={isApproving}
                          disabled={!parsedInput}
                          onClick={handleApprove}
                          className="flex-1"
                        >
                          Approve {sym}
                        </Button>
                      )}
                      <Button
                        isLoading={isSwapping}
                        disabled={!parsedInput || !expectedOutput}
                        onClick={handleSwap}
                        className="flex-1"
                      >
                        {direction === "ethToShares"
                          ? `Acheter ${sym}`
                          : `Vendre ${sym}`}
                      </Button>
                    </div>

                    <TxFeedback
                      hash={approveHook.hash || swapHash}
                      error={approveHook.error || swapError}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Pool Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-gold" />
                  <CardTitle>Prix</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">{formattedSharePrice}</p>
                <p className="text-sm text-gray-400 mt-1">par {sym}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-gold" />
                  <CardTitle>Liquidité</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">ETH</span>
                    <span className="text-white font-medium">
                      {Number(formattedReserveETH).toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{sym}</span>
                    <span className="text-white font-medium">
                      {Number(formattedReserveShares).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-border-subtle pt-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total LP</span>
                      <span className="text-white font-medium">
                        {totalLP ? Number(formatUnits(totalLP, 0)).toLocaleString() : "0"}
                      </span>
                    </div>
                    {lpBalance && lpBalance > 0n && (
                      <div className="flex justify-between mt-1">
                        <span className="text-gray-400">Votre LP</span>
                        <span className="text-gold font-medium">
                          {Number(formatUnits(lpBalance, 0)).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pool Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type</span>
                    <span className="text-white">AMM (x * y = k)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Fee</span>
                    <span className="text-white">0.3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">KYC</span>
                    <span className={isAuthorized ? "text-green-400" : "text-red-400"}>
                      {isAuthorized ? "Autorisé" : "Non autorisé"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Contrat</span>
                    <p className="text-white font-mono text-xs truncate mt-1">
                      {SWAP_POOL_ADDRESS ?? "Non configuré"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
