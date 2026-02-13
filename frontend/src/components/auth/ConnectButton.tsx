"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Shield, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui";
import { useKYCStatus } from "@/hooks/useEmailKYC";
import { EmailVerificationModal } from "./EmailVerificationModal";

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { status: kycStatus, data: kycData, refetch } = useKYCStatus(address);
  const [showModal, setShowModal] = useState(false);

  if (isConnected && address) {
    const isVerified = kycStatus === "verified" || kycData?.whitelistedOnChain;

    return (
      <>
        <div className="flex items-center gap-2">
          {/* KYC status indicator */}
          <button
            onClick={() => !isVerified && setShowModal(true)}
            className="flex items-center gap-1.5 text-sm"
            title={isVerified ? "KYC vérifié" : "Cliquez pour vérifier votre email"}
          >
            {isVerified ? (
              <ShieldCheck className="w-4 h-4 text-green-400" />
            ) : (
              <Shield className="w-4 h-4 text-yellow-400 animate-pulse" />
            )}
            <span className="text-gray-400 hidden sm:inline">
              {formatAddress(address)}
            </span>
          </button>
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
