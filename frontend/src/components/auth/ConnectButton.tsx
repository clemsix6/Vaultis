"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { Shield, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui";
import { useKYCStatus } from "@/hooks/useEmailKYC";
import { useIsAuthorized } from "@/hooks";
import { EmailVerificationModal } from "./EmailVerificationModal";

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { status: kycStatus, data: kycData, refetch } = useKYCStatus(address);
  const { data: onChainAuthorized } = useIsAuthorized(address);
  const { data: balanceData } = useBalance({ address });
  const [showModal, setShowModal] = useState(false);

  if (isConnected && address) {
    const isVerified = kycStatus === "verified" || kycData?.whitelistedOnChain || onChainAuthorized;
    const parsedBalance = balanceData ? parseFloat(balanceData.formatted) : NaN;
    const ethBalance = !isNaN(parsedBalance)
      ? `${parsedBalance.toFixed(2)} ${balanceData!.symbol}`
      : null;

    return (
      <>
        <div className="flex items-center gap-2">
          {/* ETH balance */}
          {ethBalance && (
            <span className="text-sm text-gold font-medium hidden sm:inline">
              {ethBalance}
            </span>
          )}
          {ethBalance && (
            <span className="text-gray-600 hidden sm:inline">|</span>
          )}
          {/* Address */}
          <span className="text-gray-400 text-sm hidden sm:inline">
            {formatAddress(address)}
          </span>
          {/* KYC status — prominent button when not verified */}
          {isVerified ? (
            <span className="flex items-center gap-1 text-green-400 text-xs font-medium" title="KYC vérifié">
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden sm:inline">KYC</span>
            </span>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-medium hover:bg-yellow-500/20 transition-colors animate-pulse"
              title="Cliquez pour vérifier votre email"
            >
              <Shield className="w-3.5 h-3.5" />
              Vérifier KYC
            </button>
          )}
          <Button variant="outline" size="sm" onClick={() => disconnect()}>
            Déconnecter
          </Button>
        </div>

        <EmailVerificationModal
          walletAddress={address}
          kycStatus={kycStatus}
          registeredEmail={kycData?.email}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            refetch();
          }}
        />
      </>
    );
  }

  return (
    <Button
      variant="gold"
      size="sm"
      disabled={connectors.length === 0}
      onClick={() => connectors[0] && connect({ connector: connectors[0] })}
    >
      Connecter
    </Button>
  );
}
