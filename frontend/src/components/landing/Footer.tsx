"use client";

import Link from "next/link";
import { Brain, Mail, Twitter, Github, Linkedin, BookOpen, FileText, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function Footer() {
  return (
    <footer className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/50 border-t border-border/50">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Logo and Description */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient-primary">EchoMind</span>
            </Link>
            <p className="text-muted-foreground text-sm mb-6">AI-powered sentiment analysis for social media creators and businesses.</p>

            {/* Newsletter Signup */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Get actionable insights weekly</h4>
              <div className="flex space-x-2">
                <input type="email" placeholder="Enter your email" className="flex-1 px-3 py-2 text-sm rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:border-purple-500 focus:outline-none" />
                <Button size="sm" className="btn-gradient-primary">
                  <Mail className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Product</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="#features" className="hover:text-foreground transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#integrations" className="hover:text-foreground transition-colors">
                  Integrations
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-foreground transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="/changelog" className="hover:text-foreground transition-colors">
                  Changelog
                </a>
              </li>
              <li>
                <a href="/roadmap" className="hover:text-foreground transition-colors">
                  Roadmap
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Resources</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="/docs" className="hover:text-foreground transition-colors flex items-center">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Documentation
                </a>
              </li>
              <li>
                <a href="/blog" className="hover:text-foreground transition-colors flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Blog
                </a>
              </li>
              <li>
                <a href="/help" className="hover:text-foreground transition-colors flex items-center">
                  <Headphones className="w-4 h-4 mr-2" />
                  Help Center
                </a>
              </li>
              <li>
                <a href="/api" className="hover:text-foreground transition-colors">
                  API Reference
                </a>
              </li>
              <li>
                <a href="/status" className="hover:text-foreground transition-colors">
                  System Status
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Company</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="/about" className="hover:text-foreground transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="/careers" className="hover:text-foreground transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-foreground transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-border/50">
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 mb-4 md:mb-0">
            <p className="text-sm text-muted-foreground">&copy; 2024 EchoMind. All rights reserved.</p>
            <div className="flex items-center space-x-4">
              <a href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="/cookies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cookies
              </a>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {/* Theme Switcher */}
            <ThemeSwitcher variant="compact" />

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              <a href="https://twitter.com/echomind" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://github.com/echomind" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com/company/echomind" className="text-muted-foreground hover:text-foreground transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
