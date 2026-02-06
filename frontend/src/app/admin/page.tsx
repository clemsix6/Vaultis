"use client";

import { motion } from "framer-motion";
import { ShieldAlert, Wallet } from "lucide-react";
import { useAccount } from "wagmi";
import { Tabs, Tab } from "@heroui/react";
import { useKYCOwner } from "@/hooks";
import { ConnectButton } from "@/components/auth";
import { KYCManagementTab, NFTManagementTab } from "@/components/admin";

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const { data: kycOwner } = useKYCOwner();

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
              Pour accéder au panneau d&apos;administration, connectez votre wallet.
            </p>
            <ConnectButton />
          </motion.div>
        </div>
      </div>
    );
  }

  if (kycOwner === undefined) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-24">
            <p className="text-gray-400">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  const isOwner =
    !!address &&
    address.toLowerCase() === (kycOwner as string).toLowerCase();

  if (!isOwner) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white mb-4">
              Accès restreint
            </h1>
            <p className="text-gray-400 max-w-md mx-auto">
              Seul le propriétaire des contrats peut accéder à cette page.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            Panneau <span className="text-gradient-gold">Admin</span>
          </h1>
          <p className="text-gray-400">
            Gérez les autorisations KYC et les NFTs.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs
            aria-label="Administration"
            variant="underlined"
            classNames={{
              tabList: "border-b border-dark-border",
              cursor: "bg-gold",
              tab: "text-gray-400 data-[selected=true]:text-white",
            }}
          >
            <Tab key="kyc" title="Gestion KYC">
              <div className="pt-6">
                <KYCManagementTab />
              </div>
            </Tab>
            <Tab key="nft" title="Gestion NFT">
              <div className="pt-6">
                <NFTManagementTab />
              </div>
            </Tab>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
