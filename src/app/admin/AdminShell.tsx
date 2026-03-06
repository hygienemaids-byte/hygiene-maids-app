// @ts-nocheck
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  UserCheck,
  Target,
  UserPlus,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
  Search,
  Sparkles,
  Menu,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarDays, badge: "3" },
  { href: "/admin/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/providers", label: "Cleaners", icon: UserCheck },
  { href: "/admin/leads", label: "AI CRM / Leads", icon: Target, badge: "5" },
  { href: "/admin/hiring", label: "Hiring", icon: UserPlus },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function SidebarNav({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();

  return (
    <div
      className={`flex flex-col h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-[260px]"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm shrink-0">
          HM
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-semibold text-sidebar-foreground truncate">Hygiene Maids</h1>
            <p className="text-[11px] text-sidebar-foreground/50">Admin Panel</p>
          </div>
        )}
      </div>

      {/* Book New CTA */}
      <div className={`px-2 pt-3 pb-1 ${collapsed ? "px-1.5" : ""}`}>
        <Link href="/admin/book">
          <Button
            className={`w-full bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground shadow-sm ${
              collapsed ? "px-0 justify-center" : ""
            }`}
            size={collapsed ? "icon" : "default"}
          >
            <Plus className="w-4 h-4" />
            {!collapsed && <span className="ml-2">Book New</span>}
          </Button>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        <TooltipProvider delayDuration={0}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/admin" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors group relative ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-sidebar-primary rounded-r-full" />
                    )}
                    <Icon className="w-[18px] h-[18px] shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <Badge
                            variant="secondary"
                            className="ml-auto text-[10px] h-5 px-1.5 bg-sidebar-primary/20 text-sidebar-primary border-0"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </Link>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right" className="text-xs">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </nav>

      {/* AI Assistant teaser */}
      {!collapsed && (
        <div className="mx-3 mb-3 p-3 rounded-lg bg-sidebar-primary/10 border border-sidebar-primary/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-sidebar-primary" />
            <span className="text-xs font-semibold text-sidebar-primary">AI Assistant</span>
          </div>
          <p className="text-[11px] text-sidebar-foreground/60 leading-relaxed">
            Smart scheduling, lead scoring, and insights powered by AI.
          </p>
        </div>
      )}

      {/* Collapse toggle */}
      <div className="px-2 pb-3">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full py-2 rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[260px]">
          <MobileNav />
        </SheetContent>
      </Sheet>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search bookings, customers, providers..."
            className="pl-9 h-9 text-sm bg-muted/50 border-0 focus-visible:ring-1"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  AD
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium leading-none">Admin</p>
                <p className="text-[11px] text-muted-foreground">hygienemaids@gmail.com</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              window.location.href = "/";
            }}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm">
          HM
        </div>
        <div>
          <h1 className="text-sm font-semibold">Hygiene Maids</h1>
          <p className="text-[11px] text-sidebar-foreground/50">Admin Panel</p>
        </div>
      </div>
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/admin" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              <span>{item.label}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-auto text-[10px] h-5 px-1.5 bg-sidebar-primary/20 text-sidebar-primary border-0">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <SidebarNav collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
