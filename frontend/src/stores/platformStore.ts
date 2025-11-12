import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Platform = "youtube" | "instagram" | "twitter" | "tiktok";

interface PlatformState {
  selectedPlatform: Platform;
  isLiveMode: boolean;
  isConnectModalOpen: boolean;
  setSelectedPlatform: (platform: Platform) => void;
  setLiveMode: (isLive: boolean) => void;
  toggleLiveMode: () => void;
  setIsConnectModalOpen: (open: boolean) => void;
}

export const usePlatformStore = create<PlatformState>()(
  persist(
    (set) => ({
      selectedPlatform: "tiktok",
      isLiveMode: false,
      isConnectModalOpen: false,
      setSelectedPlatform: (platform) => set({ selectedPlatform: platform }),
      setLiveMode: (isLive) => set({ isLiveMode: isLive }),
      toggleLiveMode: () => set((state) => ({ isLiveMode: !state.isLiveMode })),
      setIsConnectModalOpen: (open) => set({ isConnectModalOpen: open }),
    }),
    {
      name: "platform-store", // localStorage key
      partialize: (state) => ({
        selectedPlatform: state.selectedPlatform,
        isLiveMode: state.isLiveMode,
      }),
    }
  )
);
