"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowDownUp, TrendingUp, Droplets } from "lucide-react";
import { useAccount } from "wagmi";
import { parseEther, formatEther } from "viem";
import { Input, Button, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import {
  useDEXReserves,
  useGetAmountOut,
  useSwap,
  useApproveShareToken,
  useApproveWETH,
  useShareTokenBalance,
  useWETHBalance,
  useIndexerSwaps,
  useIsAuthorized,
} from "@/hooks";
import { SHARE_TOKEN_ADDRESS, WETH_ADDRESS } from "@/lib/contracts";

export default function TradePage() {
  const { address } = useAccount();
  const { data: isAuthorized } = useIsAuthorized(address);

  const [inputAmount, setInputAmount] = useState("");
  const [isShareToWeth, setIsShareToWeth] = useState(true);
  const [approvalStep, setApprovalStep] = useState(false);

  const tokenIn = isShareToWeth ? SHARE_TOKEN_ADDRESS : WETH_ADDRESS;
  const amountIn = inputAmount ? parseEther(inputAmount) : undefined;

  const { reserveA, reserveB, isLoading: reservesLoading } = useDEXReserves();
  const { data: amountOut } = useGetAmountOut(tokenIn, amountIn);
  const { data: shareBalance } = useShareTokenBalance(address);
  const { data: wethBalance } = useWETHBalance(address);
  const { swaps } = useIndexerSwaps(10);

  const { swap, isPending: swapPending, isConfirming: swapConfirming, isSuccess: swapSuccess, error: swapError } = useSwap();
  const { approve: approveShares, isPending: approvingShares, isSuccess: approvedShares } = useApproveShareToken();
  const { approve: approveWeth, isPending: approvingWeth, isSuccess: approvedWeth } = useApproveWETH();

  useEffect(() => {
    if (approvedShares || approvedWeth) {
      setApprovalStep(false);
    }
  }, [approvedShares, approvedWeth]);

  useEffect(() => {
    if (swapSuccess) {
      setInputAmount("");
    }
  }, [swapSuccess]);

  function handleApprove() {
    if (!amountIn) return;
    setApprovalStep(true);
    if (isShareToWeth) {
      approveShares(amountIn);
    } else {
      approveWeth(amountIn);
    }
  }

  function handleSwap() {
    if (!tokenIn || !amountIn) return;
    swap(tokenIn, amountIn, 0n);
  }

  const price = reserveA && reserveB && reserveA > 0n
    ? Number(formatEther(reserveB)) / Number(formatEther(reserveA))
    : null;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <span className="text-gradient-gold">Trade</span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Achetez et vendez des parts de montres de luxe via le pool de liquidite AMM.
          </p>
        </motion.div>

        {/* Pool stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          <div className="bg-surface-card border border-border rounded-xl p-4 text-center">
            <Droplets className="w-5 h-5 text-gold mx-auto mb-1" />
            <p className="text-lg font-bold text-white">
              {reserveA ? Number(formatEther(reserveA)).toFixed(0) : "—"}
            </p>
            <p className="text-xs text-gray-400">RSX Reserve</p>
          </div>
          <div className="bg-surface-card border border-border rounded-xl p-4 text-center">
            <Droplets className="w-5 h-5 text-gold mx-auto mb-1" />
            <p className="text-lg font-bold text-white">
              {reserveB ? Number(formatEther(reserveB)).toFixed(2) : "—"}
            </p>
            <p className="text-xs text-gray-400">WETH Reserve</p>
          </div>
          <div className="bg-surface-card border border-border rounded-xl p-4 text-center">
            <TrendingUp className="w-5 h-5 text-gold mx-auto mb-1" />
            <p className="text-lg font-bold text-white">
              {price ? price.toFixed(4) : "—"}
            </p>
            <p className="text-xs text-gray-400">ETH/Share</p>
          </div>
        </motion.div>

        {/* Swap card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card glow>
            <CardHeader>
              <CardTitle>Swap</CardTitle>
            </CardHeader>
            <CardContent>
              {!address ? (
                <p className="text-center py-8 text-gray-400">Connectez votre wallet pour trader.</p>
              ) : !isAuthorized ? (
                <p className="text-center py-8 text-gray-400">
                  Votre adresse n&apos;est pas autorisee (KYC requis).
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm text-gray-400">Vous envoyez</label>
                      <span className="text-xs text-gray-500">
                        Solde: {isShareToWeth
                          ? (shareBalance ? Number(formatEther(shareBalance)).toFixed(2) : "0")
                          : (wethBalance ? Number(formatEther(wethBalance)).toFixed(4) : "0")
                        } {isShareToWeth ? "RSX" : "WETH"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={inputAmount}
                        onChange={(e) => setInputAmount(e.target.value)}
                      />
                      <span className="text-gold font-semibold whitespace-nowrap">
                        {isShareToWeth ? "RSX" : "WETH"}
                      </span>
                    </div>
                  </div>

                  {/* Flip button */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => { setIsShareToWeth(!isShareToWeth); setInputAmount(""); }}
                      className="p-2 rounded-full bg-dark-border hover:bg-gold/20 transition-colors"
                    >
                      <ArrowDownUp className="w-5 h-5 text-gold" />
                    </button>
                  </div>

                  {/* Output */}
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Vous recevez (estime)</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-dark-border rounded-lg px-4 py-3 text-white">
                        {amountOut ? Number(formatEther(amountOut)).toFixed(6) : "0.0"}
                      </div>
                      <span className="text-gold font-semibold whitespace-nowrap">
                        {isShareToWeth ? "WETH" : "RSX"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleApprove}
                      isLoading={approvingShares || approvingWeth}
                      disabled={!inputAmount || approvalStep}
                    >
                      1. Approve
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleSwap}
                      isLoading={swapPending || swapConfirming}
                      disabled={!inputAmount}
                    >
                      2. Swap
                    </Button>
                  </div>

                  {swapSuccess && (
                    <p className="text-green-400 text-sm text-center">Swap effectue avec succes !</p>
                  )}
                  {swapError && (
                    <p className="text-red-400 text-sm text-center">
                      Erreur: {(swapError as Error).message?.slice(0, 100)}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent swaps from indexer */}
        {swaps.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Historique des swaps (indexer)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {swaps.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-dark-border last:border-0">
                      <span className="text-gray-400">
                        {String(s.args.user).slice(0, 6)}...{String(s.args.user).slice(-4)}
                      </span>
                      <span className="text-white">
                        {Number(s.args.amountIn as string) > 0
                          ? `${(Number(s.args.amountIn as string) / 1e18).toFixed(2)}`
                          : "—"
                        } → {Number(s.args.amountOut as string) > 0
                          ? `${(Number(s.args.amountOut as string) / 1e18).toFixed(4)}`
                          : "—"
                        }
                      </span>
                      <span className="text-gray-500 text-xs">
                        Block #{s.blockNumber}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
