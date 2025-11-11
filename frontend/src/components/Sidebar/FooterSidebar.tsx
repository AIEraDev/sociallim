import Link from "next/link";

import { Settings, User as UserIcon, LogOut } from "lucide-react";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getInitials } from "@/helpers/utils";
import { cn } from "@/lib/utils";

export default function FooterSidebar({ collapsed }: { collapsed: boolean }) {
  const user = { name: "Alex Johnson", email: "alex@example.com" };

  return (
    <div className="p-1 border-t border-white/10">
      {collapsed ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-10 h-10 rounded-full bg-gradient-primary text-white font-semibold flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-(--vr-accent-1) focus:ring-offset-2 focus:ring-offset-(--vr-bg)">{getInitials(user.name)}</button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start" sideOffset={8} className="bg-(--vr-bg) w-52 -translate-y-2">
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center gap-2 hover:bg-white/10 transition-colors">
                        <UserIcon className="w-4 h-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center gap-2 hover:bg-white/10 transition-colors">
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-50/10" />
                    <DropdownMenuItem asChild>
                      <button className="flex items-center gap-2 text-red-400 hover:bg-red-400 hover:text-white transition-colors w-full">
                        <LogOut className="w-4 h-4" />
                        Log out
                      </button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" align="center" sideOffset={8}>
              <div className="text-sm">{user.name}</div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200", "hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-(--vr-accent-1) focus:ring-offset-2 focus:ring-offset-(--vr-bg)")}>
              <div className="w-9 h-9 rounded-full bg-gradient-primary text-white font-semibold flex items-center justify-center shrink-0">{getInitials(user.name)}</div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm font-medium text-white truncate">{user.name}</div>
                <div className="text-xs text-(--vr-muted) truncate">{user.email}</div>
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="top" align="start" sideOffset={20} className="translate-x-3 bg-(--vr-bg) w-52">
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center gap-2 hover:bg-white/10 transition-colors">
                <UserIcon className="w-4 h-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2 hover:bg-white/10 transition-colors">
                <Settings className="w-4 h-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-50/10" />
            <DropdownMenuItem asChild>
              <button className="flex items-center gap-2 text-red-400 hover:bg-red-400 hover:text-white transition-colors w-full">
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
