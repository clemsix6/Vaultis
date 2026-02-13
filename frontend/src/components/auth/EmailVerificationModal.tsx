"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, CheckCircle, Clock, X, RefreshCw } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { useRegisterEmail, useResendVerification, type KYCStatus } from "@/hooks/useEmailKYC";

interface EmailVerificationModalProps {
  walletAddress: string;
  kycStatus: KYCStatus;
  registeredEmail?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EmailVerificationModal({
  walletAddress,
  kycStatus,
  registeredEmail,
  isOpen,
  onClose,
  onSuccess,
}: EmailVerificationModalProps) {
  const [email, setEmail] = useState("");
  const registerHook = useRegisterEmail();
  const resendHook = useResendVerification();

  function handleRegister() {
    if (!email) return;
    registerHook.register(walletAddress, email);
  }

  function handleResend() {
    resendHook.resend(walletAddress);
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-surface-card border border-border rounded-2xl p-6 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Vérification KYC</h2>
                <p className="text-sm text-gray-400">Vérifiez votre email</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content based on status */}
          {kycStatus === "verified" ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-white font-medium">Email vérifié !</p>
              <p className="text-gray-400 text-sm mt-1">
                Votre wallet est whitelisté sur la blockchain.
              </p>
              <Button onClick={onClose} className="mt-4">
                Fermer
              </Button>
            </div>
          ) : kycStatus === "pending" ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-surface rounded-xl p-4">
                <Clock className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-white text-sm font-medium">
                    Email envoyé a {registeredEmail ?? "votre adresse"}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    Vérifiez votre boite mail et cliquez sur le lien de vérification.
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleResend}
                isLoading={resendHook.isPending}
                className="w-full"
              >
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Renvoyer l&apos;email
                </span>
              </Button>

              {resendHook.isSuccess && (
                <p className="text-green-400 text-sm text-center">Email renvoyé !</p>
              )}
              {resendHook.error && (
                <p className="text-red-400 text-sm text-center">{resendHook.error}</p>
              )}

              <Button variant="ghost" onClick={onSuccess} className="w-full text-sm">
                J&apos;ai déjà vérifié
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">
                Pour interagir avec la plateforme, vous devez vérifier votre identité.
                Entrez votre email pour recevoir un lien de vérification.
              </p>

              <div className="bg-surface rounded-xl p-3">
                <p className="text-xs text-gray-400">Wallet</p>
                <p className="text-white font-mono text-sm truncate">{walletAddress}</p>
              </div>

              <Input
                label="Adresse email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {registerHook.isSuccess ? (
                <div className="text-center py-2">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-green-400 text-sm font-medium">
                    Email de vérification envoyé !
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Vérifiez votre boite mail.
                  </p>
                </div>
              ) : (
                <Button
                  onClick={handleRegister}
                  isLoading={registerHook.isPending}
                  disabled={!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
                  className="w-full"
                >
                  Envoyer le lien de vérification
                </Button>
              )}

              {registerHook.error && (
                <p className="text-red-400 text-sm text-center">{registerHook.error}</p>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
