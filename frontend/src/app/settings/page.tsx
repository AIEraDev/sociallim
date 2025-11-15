"use client";

import { useState } from "react";

import { useTheme } from "next-themes";
import { Save, User, Bell, Shield, CreditCard, Globe, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

import GlobalHeader from "@/components/GlobalHeader";
import AppLayout from "@/components/AppLayout";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState({ email: true, push: false, sms: false });

  return (
    <AppLayout>
      <GlobalHeader />
      <main className="w-full lg:max-w-[calc(100vw-240px)] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-[var(--vr-muted)]">Manage your account settings and preferences</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <Card className="glass-card border-border">
              <CardContent className="p-4 space-y-2">
                {[
                  { id: "profile", label: "Profile", icon: User },
                  { id: "notifications", label: "Notifications", icon: Bell },
                  { id: "security", label: "Security", icon: Shield },
                  { id: "billing", label: "Billing", icon: CreditCard },
                  { id: "preferences", label: "Preferences", icon: Globe },
                ].map((item) => (
                  <button key={item.id} className="w-full text-left px-4 py-2 rounded-lg hover:bg-secondary transition-colors flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-[var(--vr-muted)]" />
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Settings */}
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Settings
                </CardTitle>
                <CardDescription className="text-[var(--vr-muted)]">Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">
                    Full Name
                  </Label>
                  <Input id="name" placeholder="John Doe" className="bg-background border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">
                    Email
                  </Label>
                  <Input id="email" type="email" placeholder="john@example.com" className="bg-background border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-foreground">
                    Company
                  </Label>
                  <Input id="company" placeholder="Your Company" className="bg-background border-border" />
                </div>
                <Button className="btn-gradient-primary">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription className="text-[var(--vr-muted)]">Choose how you want to be notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">Email Notifications</Label>
                    <p className="text-sm text-[var(--vr-muted)]">Receive updates via email</p>
                  </div>
                  <Switch checked={notifications.email} onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">Push Notifications</Label>
                    <p className="text-sm text-[var(--vr-muted)]">Receive browser push notifications</p>
                  </div>
                  <Switch checked={notifications.push} onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">SMS Notifications</Label>
                    <p className="text-sm text-[var(--vr-muted)]">Receive text message alerts</p>
                  </div>
                  <Switch checked={notifications.sms} onCheckedChange={(checked) => setNotifications({ ...notifications, sms: checked })} />
                </div>
              </CardContent>
            </Card>

            {/* Theme Settings */}
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  {theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  Appearance
                </CardTitle>
                <CardDescription className="text-[var(--vr-muted)]">Customize the look and feel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">Theme</Label>
                    <p className="text-sm text-[var(--vr-muted)]">Switch between light and dark mode</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant={theme === "light" ? "default" : "outline"} size="sm" onClick={() => setTheme("light")} className={theme === "light" ? "btn-gradient-primary" : "border-border bg-secondary"}>
                      <Sun className="w-4 h-4 mr-2" />
                      Light
                    </Button>
                    <Button variant={theme === "dark" ? "default" : "outline"} size="sm" onClick={() => setTheme("dark")} className={theme === "dark" ? "btn-gradient-primary" : "border-border bg-secondary"}>
                      <Moon className="w-4 h-4 mr-2" />
                      Dark
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security
                </CardTitle>
                <CardDescription className="text-[var(--vr-muted)]">Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password" className="text-foreground">
                    Current Password
                  </Label>
                  <Input id="current-password" type="password" className="bg-background border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-foreground">
                    New Password
                  </Label>
                  <Input id="new-password" type="password" className="bg-background border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-foreground">
                    Confirm New Password
                  </Label>
                  <Input id="confirm-password" type="password" className="bg-background border-border" />
                </div>
                <Button className="btn-gradient-primary">
                  <Save className="w-4 h-4 mr-2" />
                  Update Password
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
