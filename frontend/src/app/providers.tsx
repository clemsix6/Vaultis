"use client";

import { type ReactNode, useState } from "react";
import { HeroUIProvider } from "@heroui/react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "@/lib/wagmi";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <HeroUIProvider>
          {children}
        </HeroUIProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
