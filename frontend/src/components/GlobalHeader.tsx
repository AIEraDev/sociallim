import { useState } from "react";

import { Download, Plus, Save, Search } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "./ui/switch";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { usePlatformStore } from "@/stores/platformStore";

export default function GlobalHeader() {
  const { selectedPlatform, isLiveMode, setSelectedPlatform, setLiveMode } = usePlatformStore();
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
            <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 transition-colors duration-300 rounded-full ${isLiveMode ? "bg-green-500" : "bg-red-500"}`} />
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
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300">Live Mode</span>
              <Switch checked={isLiveMode} onCheckedChange={setLiveMode} />
            </div>
            <Separator orientation="vertical" className="h-6 bg-white/10" />
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Analysis
            </Button>
            <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10">
              <Download className="w-4 h-4 mr-2" />
              Import Post
            </Button>
          </div>
        </div>

        {/* Cache Status & Last Fetch */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 px-4">
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>Last fetch: 2 minutes ago</span>
            <Badge variant="outline" className="border-green-500/20 bg-green-500/10 text-green-400">
              Cache Active
            </Badge>
          </div>
          <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
            <Save className="w-4 h-4 mr-2" />
            Save Transcript
          </Button>
        </div>
      </div>
    </div>
  );
}
