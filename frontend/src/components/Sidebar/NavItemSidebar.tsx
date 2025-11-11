import React from "react";

import { motion, AnimatePresence } from "framer-motion";

import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface NavItemType {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  active?: boolean;
}

export default function NavItemSidebar({ item, collapsed, onNavigate }: { item: NavItemType; collapsed: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;

  return (
    <>
      {collapsed ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.a href={item.href} onClick={onNavigate} className={cn("relative flex items-center px-3 py-2.5 rounded-md transition-all duration-200", "hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-(--vr-accent-1) focus:ring-offset-2 focus:ring-offset-(--vr-bg)", item.active && "bg-white/5")}>
                <Icon className={cn("w-5 h-5 shrink-0 text-(--vr-accent-1)", item.active ? "text-(--vr-accent-1)" : "text-(--vr-muted)")} />

                <AnimatePresence>
                  {!collapsed && (
                    <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} className={cn("ml-3 text-sm font-medium whitespace-nowrap", item.active ? "text-white" : "text-(--vr-muted)")}>
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.a>
            </TooltipTrigger>

            <TooltipContent side="right" align="center" sideOffset={8}>
              <p>{item.label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <motion.a href={item.href} onClick={onNavigate} className={cn("relative flex items-center px-3 py-2.5 rounded-md transition-all duration-200", "hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-(--vr-accent-1) focus:ring-offset-2 focus:ring-offset-(--vr-bg)", item.active && "bg-white/5")}>
          <Icon className={cn("w-5 h-5 shrink-0 text-(--vr-accent-1)", item.active ? "text-(--vr-accent-1)" : "text-(--vr-muted)")} />

          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} className={cn("ml-3 text-sm font-medium whitespace-nowrap", item.active ? "text-white" : "text-(--vr-muted)")}>
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.a>
      )}
    </>
  );
}
