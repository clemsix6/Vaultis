"use client";

import { type ReactNode } from "react";
import { HeroUIProvider } from "@heroui/react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <HeroUIProvider>
      {children}
    </HeroUIProvider>
  );
}
