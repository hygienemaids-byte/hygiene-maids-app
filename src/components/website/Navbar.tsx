"use client";
/*
 * Navbar — Hygiene Maids Luxury
 * Desktop: Phone | Sign In (colored) | Book Now
 * Mobile: Essential nav items only + 2 bottom buttons
 */
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Phone, User, ChevronRight } from "lucide-react";
import { BRAND, IMAGES, NAV_LINKS } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

/* Mobile menu shows only essential pages — rest live in footer */
const MOBILE_NAV = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Locations", href: "/locations" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
  { label: "Free Quote", href: "/quote" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => { setIsOpen(false); }, [location]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);



  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/95 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
            : "bg-white"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <img src={IMAGES.logoWhite} alt="Hygiene Maids - Professional House Cleaning Dallas Fort Worth" className="h-14 w-auto object-contain" />
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden xl:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3 py-2 text-sm font-medium tracking-wide transition-colors duration-300 ${
                    location === link.href ? "text-[#0D9488]" : "text-[#0C1829] hover:text-[#0D9488]"
                  }`}
                >
                  {link.label}
                  {location === link.href && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#0D9488]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* Desktop Right: Phone | Sign In (colored) | Book Now */}
            <div className="hidden xl:flex items-center gap-3">
              <a
                href={`tel:${BRAND.phoneRaw}`}
                className="flex items-center gap-2 text-sm font-medium text-[#0C1829] hover:text-[#0D9488] transition-colors"
              >
                <Phone size={15} />
                {BRAND.phone}
              </a>
              <Link
                href="/auth/login"
                className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-[#0C1829] rounded-lg hover:bg-[#0C1829]/90 transition-all duration-300"
              >
                <User size={15} />
                Sign In
              </Link>
              <Link
                href="/book"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#0D9488] rounded-lg hover:bg-[#0B8278] transition-all duration-300 shadow-lg shadow-[#0D9488]/25"
              >
                Book Now
              </Link>
            </div>

            {/* Mobile Toggle */}
            <button onClick={() => setIsOpen(!isOpen)} className="xl:hidden p-2 text-[#0C1829]" aria-label="Toggle menu">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu — Slide in from right */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[80%] max-w-xs bg-white shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 h-20 border-b border-gray-100 flex-shrink-0">
                <img src={IMAGES.logoWhite} alt="Hygiene Maids" className="h-10 w-auto object-contain" />
                <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-[#0C1829] transition-colors rounded-full hover:bg-gray-50" aria-label="Close menu">
                  <X size={20} />
                </button>
              </div>

              {/* Navigation — essential items only */}
              <div className="flex-1 overflow-y-auto px-3 py-4">
                <nav className="space-y-0.5">
                  {MOBILE_NAV.map((link, i) => (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 + 0.1 }}
                    >
                      <Link
                        href={link.href}
                        className={`flex items-center justify-between py-3.5 px-4 rounded-xl text-[15px] font-medium transition-all ${
                          location === link.href
                            ? "text-[#0D9488] bg-[#0D9488]/5"
                            : "text-[#0C1829] hover:bg-gray-50"
                        }`}
                      >
                        <span>{link.label}</span>
                        <ChevronRight size={16} className={location === link.href ? "text-[#0D9488]" : "text-gray-300"} />
                      </Link>
                    </motion.div>
                  ))}
                </nav>

                {/* Phone card */}
                <div className="mt-5 mx-1">
                  <a
                    href={`tel:${BRAND.phoneRaw}`}
                    className="flex items-center gap-3 py-3 px-4 rounded-xl bg-gray-50 text-[#0C1829]"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#0D9488]/10 flex items-center justify-center flex-shrink-0">
                      <Phone size={16} className="text-[#0D9488]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{BRAND.phone}</p>
                      <p className="text-[11px] text-gray-400">{BRAND.hours}</p>
                    </div>
                  </a>
                </div>
              </div>

              {/* Bottom: Sign In (colored) + Book Now */}
              <div className="flex-shrink-0 border-t border-gray-100 p-4 space-y-2.5">
                <Link
                  href="/auth/login"
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white bg-[#0C1829] hover:bg-[#0C1829]/90 transition-all"
                >
                  <User size={16} />
                  Sign In
                </Link>
                <Link
                  href="/book"
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white bg-[#0D9488] hover:bg-[#0B8278] transition-all shadow-lg shadow-[#0D9488]/25"
                >
                  Book Now
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer */}
      <div className="h-20" />
    </>
  );
}
