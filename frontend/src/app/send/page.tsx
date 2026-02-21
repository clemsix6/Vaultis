"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Wallet, CheckCircle } from "lucide-react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, isAddress } from "viem";
import { Card, Button, Input } from "@/components/ui";
import { ConnectButton } from "@/components/auth";
import { useShareTokenBalance } from "@/hooks";
import { shareTokenConfig, SHARE_TOKEN_ADDRESS } from "@/lib/contracts";

export default function SendPage() {
  const { address, isConnected } = useAccount();
  const { data: shareBalance } = useShareTokenBalance(address);
  const rsxBal = shareBalance !== undefined ? Number(shareBalance) / 1e18 : 0;

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleSend = () => {
    const parsedAmount = parseFloat(amount);
    if (!recipient || !isAddress(recipient) || isNaN(parsedAmount) || parsedAmount <= 0) return;
    if (!SHARE_TOKEN_ADDRESS) return;

    writeContract({
      address: SHARE_TOKEN_ADDRESS,
      abi: shareTokenConfig.abi,
      functionName: "transfer",
      args: [recipient as `0x${string}`, parseEther(amount)],
    });
  };

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
              Pour envoyer des RSX, connectez votre wallet.
            </p>
            <ConnectButton />
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            Envoyer des <span className="text-gradient-gold">RSX</span>
          </h1>
          <p className="text-gray-400">
            Transférez des tokens RSX à un autre wallet vérifié KYC.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card glow>
            <div className="p-6 space-y-6">
              {/* Balance */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-surface">
                <span className="text-sm text-gray-400">Votre solde</span>
                <span className="text-lg font-bold text-gold">
                  {rsxBal.toFixed(2)} RSX
                </span>
              </div>

              {/* Recipient */}
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Adresse du destinataire</label>
                <Input
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
                {recipient && !isAddress(recipient) && (
                  <p className="text-xs text-red-400">Adresse invalide</p>
                )}
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Montant</label>
                <div className="relative">
                  <Input
                    placeholder="0.00"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gold hover:text-gold-light transition-colors"
                    onClick={() => setAmount(rsxBal.toString())}
                  >
                    MAX
                  </button>
                </div>
                {parseFloat(amount) > rsxBal && (
                  <p className="text-xs text-red-400">Solde insuffisant</p>
                )}
              </div>

              {/* Send button */}
              <Button
                className="w-full"
                onClick={handleSend}
                isLoading={isPending || isConfirming}
                disabled={
                  !recipient ||
                  !isAddress(recipient) ||
                  !amount ||
                  parseFloat(amount) <= 0 ||
                  parseFloat(amount) > rsxBal
                }
              >
                <Send className="w-4 h-4 mr-2" />
                Envoyer {amount ? `${amount} RSX` : ""}
              </Button>

              {/* Success */}
              {isSuccess && hash && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20"
                >
                  <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                  <div>
                    <p className="text-sm text-green-400 font-medium">Envoi réussi !</p>
                    <p className="text-xs text-gray-400 font-mono truncate">
                      Tx: {hash}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Error */}
              {error && (
                <p className="text-sm text-red-400 text-center">
                  {error.message.includes("NotAuthorized") || error.message.includes("ReceiverNotAuthorized")
                    ? "Le destinataire n'est pas vérifié KYC."
                    : error.message.includes("SenderNotAuthorized")
                    ? "Votre wallet n'est pas vérifié KYC."
                    : "Erreur lors de l'envoi."}
                </p>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
