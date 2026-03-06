"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  CreditCard,
  User,
  Gift,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
  Menu,
  Home,
  Plus,
  Calendar,
  Star,
  Search,
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
  { href: "/customer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customer/bookings", label: "My Bookings", icon: CalendarDays },
  { href: "/customer/schedule", label: "Schedule", icon: Calendar },
  { href: "/customer/payments", label: "Payments", icon: CreditCard },
  { href: "/customer/reviews", label: "My Reviews", icon: Star },
  { href: "/customer/profile", label: "My Profile", icon: User },
  { href: "/customer/referrals", label: "Refer & Earn", icon: Gift },
];

function SidebarNav({ collapsed, onToggle, initials }: { collapsed: boolean; onToggle: () => void; initials: string }) {
  const pathname = usePathname();
  return (
    <div
      className={`flex flex-col h-full bg-white border-r border-slate-200 transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-[240px]"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-100">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-teal-600 text-white font-bold text-sm shrink-0">
          HM
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-semibold text-slate-900">Hygiene Maids</h1>
            <p className="text-[11px] text-slate-400">My Account</p>
          </div>
        )}
      </div>

      {/* Book Now CTA */}
      <div className={`px-3 pt-4 pb-2 ${collapsed ? "px-2" : ""}`}>
        <Link href="/book">
          <Button
            className={`w-full bg-teal-600 hover:bg-teal-700 text-white shadow-sm ${
              collapsed ? "px-0 justify-center" : ""
            }`}
            size={collapsed ? "icon" : "default"}
          >
            <Plus className="w-4 h-4" />
            {!collapsed && <span className="ml-2">Book a Cleaning</span>}
          </Button>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/customer/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                isActive
                  ? "bg-teal-50 text-teal-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              } ${collapsed ? "justify-center px-0" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? "text-teal-600" : ""}`} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Back to website */}
      <div className="px-2 pb-2">
        <Link
          href="/"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors ${
            collapsed ? "justify-center px-0" : ""
          }`}
        >
          <Home className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span>Back to Website</span>}
        </Link>
      </div>

      {/* Collapse toggle */}
      <div className="border-t border-slate-100 p-2">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center py-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function TopBar({ initials, name }: { initials: string; name: string }) {
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
        <h2 className="text-lg font-semibold text-slate-900">
          {name ? `Welcome back, ${name}!` : "Welcome back!"}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-[18px] h-[18px]" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-teal-600 text-white text-xs font-semibold">
                  {initials || "CU"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium leading-none text-slate-900">{name || "My Account"}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/customer/profile">
                <User className="w-4 h-4 mr-2" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/customer/bookings">
                <CalendarDays className="w-4 h-4 mr-2" />
                My Bookings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/customer/payments">
                <CreditCard className="w-4 h-4 mr-2" />
                Payments
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
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-100">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-teal-600 text-white font-bold text-sm">
          HM
        </div>
        <div>
          <h1 className="text-sm font-semibold text-slate-900">Hygiene Maids</h1>
          <p className="text-[11px] text-slate-400">My Account</p>
        </div>
      </div>
      <div className="px-3 pt-4 pb-2">
        <Link href="/book">
          <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Book a Cleaning
          </Button>
        </Link>
      </div>
      <nav className="flex-1 py-2 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/customer/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                isActive ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-2 pb-4">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-slate-500 hover:bg-slate-50"
        >
          <Home className="w-[18px] h-[18px]" />
          <span>Back to Website</span>
        </Link>
      </div>
    </div>
  );
}

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [initials, setInitials] = useState("CU");
  const [name, setName] = useState("");

  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: customer } = await supabase
          .from("customers")
          .select("first_name, last_name")
          .or(`profile_id.eq.${user.id},email.eq.${user.email}`)
          .single();

        if (customer) {
          const fn = customer.first_name || "";
          const ln = customer.last_name || "";
          setInitials(`${fn[0] || ""}${ln[0] || ""}`.toUpperCase() || "CU");
          setName(fn);
        }
      } catch {
        // Silently fail — layout still works
      }
    }
    loadUser();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <div className="hidden lg:block">
        <SidebarNav collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} initials={initials} />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar initials={initials} name={name} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
