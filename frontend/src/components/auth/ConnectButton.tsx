"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui";

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400 hidden sm:inline">
          {formatAddress(address)}
        </span>
        <Button variant="outline" size="sm" onClick={() => disconnect()}>
          Déconnecter
        </Button>
      </div>
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
