"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { useVerifyToken } from "@/hooks/useEmailKYC";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { verify, isPending, error, result } = useVerifyToken();

  useEffect(() => {
    if (token) {
      verify(token);
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 text-center">
        {!token ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Token manquant</h1>
            <p className="text-gray-400 mb-6">
              Aucun token de vérification fourni. Vérifiez le lien dans votre email.
            </p>
            <Link href="/">
              <Button>Retour à l&apos;accueil</Button>
            </Link>
          </motion.div>
        ) : isPending ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Loader2 className="w-16 h-16 text-gold mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-white mb-2">Vérification en cours...</h1>
            <p className="text-gray-400">
              Nous vérifions votre email et whitelistons votre wallet sur la blockchain.
            </p>
          </motion.div>
        ) : error ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Erreur</h1>
            <p className="text-gray-400 mb-6">{error}</p>
            <Link href="/">
              <Button>Retour à l&apos;accueil</Button>
            </Link>
          </motion.div>
        ) : result ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">{result.message}</h1>
            <p className="text-gray-400 mb-2">
              Wallet: <span className="font-mono text-gold">{result.walletAddress}</span>
            </p>
            {result.txHash && (
              <p className="text-gray-500 text-sm font-mono mb-6 truncate">
                Tx: {result.txHash}
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <Link href="/inventory">
                <Button>Mon Inventaire</Button>
              </Link>
              <Link href="/marketplace">
                <Button variant="outline">Marketplace</Button>
              </Link>
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
