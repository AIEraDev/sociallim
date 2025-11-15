import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Platform = "youtube" | "instagram" | "twitter" | "tiktok";

interface PlatformState {
  selectedPlatform: Platform;
  isConnectModalOpen: boolean;
  setSelectedPlatform: (platform: Platform) => void;
  setIsConnectModalOpen: (open: boolean) => void;
}

export const usePlatformStore = create<PlatformState>()(
  persist(
    (set) => ({
      selectedPlatform: "tiktok",
      isConnectModalOpen: false,
      setSelectedPlatform: (platform) => set({ selectedPlatform: platform }),
      setIsConnectModalOpen: (open) => set({ isConnectModalOpen: open }),
    }),
    {
      name: "platform-store", // localStorage key
      partialize: (state) => ({
        selectedPlatform: state.selectedPlatform,
      }),
    }
  )
);
