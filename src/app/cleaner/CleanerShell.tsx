// @ts-nocheck
"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  DollarSign,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
  Menu,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const navItems = [
  { href: "/cleaner/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cleaner/jobs", label: "My Jobs", icon: ClipboardList },
  { href: "/cleaner/schedule", label: "Schedule", icon: Calendar },
  { href: "/cleaner/earnings", label: "Earnings", icon: DollarSign },
  { href: "/cleaner/profile", label: "My Profile", icon: User },
];

function SidebarNav({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  return (
    <div
      className={`flex flex-col h-full bg-slate-900 text-white transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-[240px]"
      }`}
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-700">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-teal-500 text-white font-bold text-sm shrink-0">
          HM
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-semibold text-white">Hygiene Maids</h1>
            <p className="text-[11px] text-slate-400">Cleaner Portal</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/cleaner/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                isActive
                  ? "bg-teal-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              } ${collapsed ? "justify-center px-0" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 pb-2">
        <Link
          href="/"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors ${
            collapsed ? "justify-center px-0" : ""
          }`}
        >
          <Home className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span>Back to Website</span>}
        </Link>
      </div>

      <div className="border-t border-slate-700 p-2">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function TopBar() {
  const router = useRouter();
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    router.push("/");
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6">
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
      <div className="hidden lg:block">
        <h2 className="text-lg font-semibold text-slate-900">Cleaner Portal</h2>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-[18px] h-[18px]" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-slate-800 text-white text-xs font-semibold">
                  CL
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/cleaner/profile">
                <User className="w-4 h-4 mr-2" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
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
    <div className="flex flex-col h-full bg-slate-900 text-white">
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-700">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-teal-500 text-white font-bold text-sm">
          HM
        </div>
        <div>
          <h1 className="text-sm font-semibold">Hygiene Maids</h1>
          <p className="text-[11px] text-slate-400">Cleaner Portal</p>
        </div>
      </div>
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/cleaner/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                isActive ? "bg-teal-600 text-white" : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function CleanerShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <div className="hidden lg:block">
        <SidebarNav collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
