import { useState } from "react";

import { Plus, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "./ui/button";
import { usePlatformStore } from "@/stores/platformStore";

export default function GlobalHeader() {
  const { selectedPlatform, setSelectedPlatform, setIsConnectModalOpen } = usePlatformStore();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
      <div className="w-full mx-auto py-4">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 px-4">
          {/* Live Indicator & Platform Selector */}
          <div className="flex items-center gap-4 relative">
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="w-32 bg-white/5 border-white/10 cursor-pointer py-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-(--vr-bg)">
                <SelectItem value="tiktok" className="hover:bg-white/5  transition-colors duration-300 cursor-pointer">
                  TikTok
                </SelectItem>
                <SelectItem value="instagram" className="hover:bg-white/5  transition-colors duration-300 cursor-pointer">
                  Instagram
                </SelectItem>
                <SelectItem value="twitter" className="hover:bg-white/5  transition-colors duration-300 cursor-pointer">
                  Twitter
                </SelectItem>
                <SelectItem value="youtube" className="hover:bg-white/5  transition-colors duration-300 cursor-pointer">
                  YouTube
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Post Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Search by title, URL, or ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-400" />
            </div>
          </div>

          {/* Real-time Toggle & Quick Actions */}
          <div className="flex items-center gap-3">
            <Button className="w-full bg-gradient-primary hover:opacity-90" onClick={() => setIsConnectModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Connect Your First Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
