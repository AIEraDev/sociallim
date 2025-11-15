"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, LogOut, Facebook, Twitter } from "lucide-react";

export function AuthStatus() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Card className="bg-black/95 border-white/10">
        <CardContent className="p-4">
          <div className="animate-pulse flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-600 rounded-full"></div>
            <div className="h-4 bg-gray-600 rounded w-32"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card className="bg-black/95 border-white/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-gray-400">
            <User className="w-5 h-5" />
            <span>Not connected to any social accounts</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "facebook":
        return <Facebook className="w-4 h-4" />;
      case "twitter":
        return <Twitter className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case "facebook":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "twitter":
        return "bg-blue-400/10 text-blue-300 border-blue-400/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  return (
    <Card className="bg-black/95 border-white/10">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {getProviderIcon(session.provider || "")}
              <span className="text-white font-medium">{session.user?.name || session.user?.email}</span>
            </div>
            <Badge variant="outline" className={getProviderColor(session.provider || "")}>
              {session.provider}
            </Badge>
          </div>

          <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/dashboard" })} className="text-gray-400 hover:text-white">
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
