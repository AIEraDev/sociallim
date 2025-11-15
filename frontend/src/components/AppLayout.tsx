"use client";

import React from "react";
import { Sidebar } from "./dashboard/Sidebar";
import { ConnectSocialModal } from "./modals/ConnectSocialModal";
import { usePlatformStore } from "@/stores/platformStore";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isConnectModalOpen, setIsConnectModalOpen } = usePlatformStore();

  return (
    <>
      <div className="h-screen bg-gradient-dark overflow-hidden flex">
        {/* Left Navigation */}
        <Sidebar />
        <div style={{ scrollbarWidth: "none" }} className="h-screen overflow-auto flex-1">
          {children}
        </div>
      </div>

      {/* Connect Social Modal */}
      <ConnectSocialModal open={isConnectModalOpen} onOpenChange={setIsConnectModalOpen} />
    </>
  );
}
