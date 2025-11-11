import React from "react";
import { Sidebar } from "./dashboard/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen bg-gradient-dark overflow-hidden flex">
      {/* Left Navigation */}
      <Sidebar />
      <div style={{ scrollbarWidth: "none" }} className="h-screen overflow-auto flex-1">
        {children}
      </div>
    </div>
  );
}
