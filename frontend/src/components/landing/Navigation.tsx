"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Menu, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 glass-card border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Brain className="w-5 h-5 darK:text-white" />
            </div>
            <span className="text-xl font-bold text-gradient-primary">EchoMind</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Product
            </a>
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Features
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Pricing
            </a>
            <a href="#docs" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Docs
            </a>
            <a href="#integrations" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Integrations
            </a>
            <a href="#blog" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Blog
            </a>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/auth/">
              <Button variant="secondary" className="text-muted-foreground hover:text-foreground">
                Login
              </Button>
            </Link>
            <Link href="/auth/?screen=sign-up">
              <Button variant="secondary" className="text-muted-foreground hover:text-foreground font-medium">
                Get started — free
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="md:hidden border-t border-border/50 py-4">
            <div className="flex flex-col space-y-4">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Product
              </a>
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Features
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Pricing
              </a>
              <a href="#docs" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Docs
              </a>
              <a href="#integrations" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Integrations
              </a>
              <a href="#blog" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Blog
              </a>
              <div className="flex flex-col space-y-2 pt-4 border-t border-border/50">
                <Link href="/auth/">
                  <Button variant="outline" className="w-full">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/?screen=sign-up">
                  <Button className="w-full btn-gradient-primary">Get started — free</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
}
