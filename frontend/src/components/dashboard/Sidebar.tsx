"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageSquare, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import FooterSidebar from "../Sidebar/FooterSidebar";
import NavItemSidebar, { NavItemType } from "../Sidebar/NavItemSidebar";

const navItems: NavItemType[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", active: true },
  { icon: MessageSquare, label: "Analyses", href: "/analyses" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  return (
    <>
      {/* Mobile Menu Button */}
      <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-lg glass-card border border-white/10 flex items-center justify-center" aria-label="Toggle menu">
        <div className="w-5 h-5 flex flex-col justify-center gap-1.5">
          <span className={cn("h-0.5 w-full bg-white transition-all", mobileOpen && "rotate-45 translate-y-2")} />
          <span className={cn("h-0.5 w-full bg-white transition-all", mobileOpen && "opacity-0")} />
          <span className={cn("h-0.5 w-full bg-white transition-all", mobileOpen && "-rotate-45 -translate-y-2")} />
        </div>
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />}

      <motion.nav
        initial={false}
        animate={{
          width: isDesktop ? (collapsed ? 64 : 240) : 240,
          x: isDesktop ? 0 : mobileOpen ? 0 : -240,
        }}
        className={cn("border-r border-white/10 z-40", "flex flex-col transition-all duration-300", "lg:translate-x-0")}
      >
        {/* Collapse Toggle - Desktop only */}
        <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex absolute -right-3 top-6 w-6 h-6 rounded-full glass border border-white/10 items-center justify-center hover:bg-white/5 transition-colors" aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}>
          {collapsed ? <ChevronRight className="w-4 h-4 text-white" /> : <ChevronLeft className="w-4 h-4 text-white" />}
        </button>

        {/* Logo/Brand */}
        <div className="p-3 border-b border-white/10">
          <AnimatePresence mode="wait">
            {!collapsed ? (
              <motion.div key="expanded" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center space-x-2">
                <span className="text-lg font-bold text-white">Sociallim</span>
              </motion.div>
            ) : (
              <motion.div key="collapsed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center">
                <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">S</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav Items */}
        <div className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavItemSidebar key={item.href} item={{ ...item, active: pathname === item.href }} collapsed={collapsed} onNavigate={() => setMobileOpen(false)} />
          ))}
        </div>

        {/* Footer / User Section */}
        <FooterSidebar collapsed={collapsed} />
      </motion.nav>
    </>
  );
}
