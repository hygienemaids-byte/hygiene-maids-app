"use client";
/**
 * Checklist — Interactive Cleaning Checklists
 * Printable, interactive checklists for each cleaning type
 * SEO-optimized for "cleaning checklist Dallas" keywords
 */
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { BRAND, IMAGES } from "@/lib/constants";
import {
  CheckCircle, Circle, Sparkles, Shield, Home, Building, Star,
  Printer, Download, ArrowRight, Phone, ChevronDown,
} from "lucide-react";
import CTASection from "@/components/website/CTASection";
import Breadcrumbs from "@/components/website/Breadcrumbs";

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, isVisible } = useScrollAnimation(0.1);
  return (
    <div ref={ref} className={className}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={isVisible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay }}>
        {children}
      </motion.div>
    </div>
  );
}

interface ChecklistItem {
  task: string;
  details?: string;
}

interface ChecklistCategory {
  room: string;
  items: ChecklistItem[];
}

const CHECKLISTS: Record<string, { title: string; icon: React.ReactNode; description: string; categories: ChecklistCategory[] }> = {
  standard: {
    title: "Standard House Cleaning",
    icon: <Sparkles size={20} />,
    description: "Weekly or biweekly maintenance cleaning to keep your home fresh and tidy. This checklist covers all the essentials our team addresses during every standard cleaning visit.",
    categories: [
      {
        room: "Kitchen",
        items: [
          { task: "Wipe down all countertops and backsplash" },
          { task: "Clean exterior of all appliances (fridge, oven, microwave, dishwasher)" },
          { task: "Clean stovetop and drip pans" },
          { task: "Scrub and sanitize sink and faucet" },
          { task: "Wipe down cabinet fronts (spot clean)" },
          { task: "Clean microwave interior" },
          { task: "Empty trash and replace liner" },
          { task: "Sweep and mop floors" },
          { task: "Wipe down light switches and outlets" },
        ],
      },
      {
        room: "Bathrooms",
        items: [
          { task: "Scrub and sanitize toilet (inside and out)" },
          { task: "Clean and shine sink, faucet, and vanity" },
          { task: "Clean mirror (streak-free)" },
          { task: "Scrub shower/tub surfaces" },
          { task: "Clean glass shower door or curtain" },
          { task: "Wipe down all fixtures and towel bars" },
          { task: "Empty trash and replace liner" },
          { task: "Sweep and mop floors" },
          { task: "Restock toilet paper (if available)" },
        ],
      },
      {
        room: "Bedrooms",
        items: [
          { task: "Make beds and fluff pillows" },
          { task: "Dust all surfaces (nightstands, dressers, shelves)" },
          { task: "Dust ceiling fan blades" },
          { task: "Vacuum carpets or mop hard floors" },
          { task: "Vacuum under bed (accessible areas)" },
          { task: "Empty trash cans" },
          { task: "Wipe down light switches" },
        ],
      },
      {
        room: "Living Areas",
        items: [
          { task: "Dust all surfaces and shelves" },
          { task: "Dust TV screen and electronics (dry cloth)" },
          { task: "Vacuum carpets, rugs, and upholstery" },
          { task: "Mop hard floors" },
          { task: "Wipe down coffee tables and end tables" },
          { task: "Dust ceiling fan and light fixtures" },
          { task: "Clean glass surfaces and mirrors" },
          { task: "Straighten pillows and throws" },
        ],
      },
    ],
  },
  deep: {
    title: "Deep Cleaning",
    icon: <Shield size={20} />,
    description: "A thorough top-to-bottom cleaning that goes beyond the surface. Recommended every 3-6 months or as a first-time service. Includes everything in standard cleaning plus these additional tasks.",
    categories: [
      {
        room: "Kitchen (Deep)",
        items: [
          { task: "Clean inside oven and oven racks" },
          { task: "Clean inside refrigerator (shelves, drawers, walls)" },
          { task: "Degrease range hood and exhaust fan filter" },
          { task: "Clean inside dishwasher" },
          { task: "Scrub grout between backsplash tiles" },
          { task: "Clean behind and under appliances (pull out)" },
          { task: "Wipe inside cabinets and drawers" },
          { task: "Descale faucet and sink" },
          { task: "Clean garbage disposal" },
          { task: "Polish stainless steel surfaces" },
          { task: "Wipe down baseboards" },
          { task: "Clean light fixtures and switch plates" },
        ],
      },
      {
        room: "Bathrooms (Deep)",
        items: [
          { task: "Descale shower heads and faucets" },
          { task: "Scrub tile grout with professional cleaner" },
          { task: "Clean behind and around toilet base" },
          { task: "Clean inside medicine cabinet" },
          { task: "Sanitize toothbrush holders and soap dishes" },
          { task: "Clean exhaust fan cover" },
          { task: "Wash shower curtain or treat glass doors" },
          { task: "Scrub bathtub jets (if applicable)" },
          { task: "Wipe down baseboards and door frames" },
          { task: "Clean light fixtures" },
        ],
      },
      {
        room: "Bedrooms & Living Areas (Deep)",
        items: [
          { task: "Vacuum mattress surface" },
          { task: "Dust and wipe all baseboards" },
          { task: "Clean door frames and tops of doors" },
          { task: "Wipe down window sills and tracks" },
          { task: "Clean inside window frames" },
          { task: "Dust crown molding and ceiling corners" },
          { task: "Vacuum under all furniture" },
          { task: "Clean air vents and returns" },
          { task: "Wipe down all door handles and hinges" },
          { task: "Dust blinds or wash curtains" },
          { task: "Clean light fixtures and lampshades" },
        ],
      },
    ],
  },
  moveinout: {
    title: "Move-In / Move-Out Cleaning",
    icon: <Home size={20} />,
    description: "The most comprehensive cleaning service we offer. Designed to return a rental to move-in condition or prepare a new home for occupancy. Covers every surface, cabinet, and fixture.",
    categories: [
      {
        room: "Kitchen (Move)",
        items: [
          { task: "Clean inside ALL cabinets and drawers" },
          { task: "Clean inside oven, racks, and broiler" },
          { task: "Clean inside refrigerator and freezer" },
          { task: "Clean inside dishwasher and filter" },
          { task: "Degrease range hood, filter, and exhaust fan" },
          { task: "Scrub sink, faucet, and disposal" },
          { task: "Clean countertops and backsplash" },
          { task: "Wipe down all appliance exteriors" },
          { task: "Clean behind and under all appliances" },
          { task: "Wipe down baseboards and trim" },
          { task: "Clean light fixtures and switch plates" },
          { task: "Sweep and mop floors (including corners)" },
        ],
      },
      {
        room: "Bathrooms (Move)",
        items: [
          { task: "Scrub tub, shower, and all tile" },
          { task: "Descale all fixtures and shower head" },
          { task: "Clean toilet inside, outside, and base" },
          { task: "Clean inside medicine cabinet and vanity" },
          { task: "Scrub tile grout thoroughly" },
          { task: "Clean exhaust fan" },
          { task: "Polish all mirrors and glass" },
          { task: "Clean baseboards and trim" },
          { task: "Sweep and mop floors" },
        ],
      },
      {
        room: "All Rooms (Move)",
        items: [
          { task: "Clean inside all closets (shelves, rods, floors)" },
          { task: "Wipe down all baseboards and trim" },
          { task: "Clean all light fixtures and ceiling fans" },
          { task: "Clean all door frames and tops of doors" },
          { task: "Wipe down all door handles and hinges" },
          { task: "Clean window sills and tracks" },
          { task: "Clean inside windows" },
          { task: "Clean air vents and returns" },
          { task: "Spot clean walls (scuffs and marks)" },
          { task: "Vacuum all carpets and closets" },
          { task: "Mop all hard floors" },
          { task: "Clean garage floor (sweep)" },
        ],
      },
    ],
  },
  airbnb: {
    title: "Airbnb & Rental Turnover",
    icon: <Star size={20} />,
    description: "Quick-turnaround cleaning between guests that ensures 5-star reviews. Covers cleaning, staging, and guest-readiness checks.",
    categories: [
      {
        room: "Guest Preparation",
        items: [
          { task: "Walkthrough for damage and left-behind items" },
          { task: "Strip all bed linens and towels" },
          { task: "Start laundry or bag for service" },
          { task: "Check all electronics and appliances work" },
          { task: "Report any maintenance issues" },
        ],
      },
      {
        room: "Kitchen & Living",
        items: [
          { task: "Wash all dishes (even clean-looking ones in cabinets)" },
          { task: "Clean all countertops and appliance exteriors" },
          { task: "Clean inside microwave" },
          { task: "Wipe down refrigerator (inside and out)" },
          { task: "Empty all trash and replace liners" },
          { task: "Vacuum and mop all floors" },
          { task: "Dust all surfaces" },
          { task: "Wipe down remotes, switches, and handles" },
        ],
      },
      {
        room: "Bedrooms & Bathrooms",
        items: [
          { task: "Make beds with fresh, crisp linens" },
          { task: "Hotel-style towel folding and placement" },
          { task: "Scrub and sanitize all bathroom surfaces" },
          { task: "Clean mirrors (streak-free)" },
          { task: "Restock toiletries and supplies" },
          { task: "Vacuum under beds and furniture" },
          { task: "Check for hair (drains, floors, surfaces)" },
        ],
      },
      {
        room: "Final Staging",
        items: [
          { task: "Set thermostat to comfortable temperature" },
          { task: "Place welcome materials and Wi-Fi info" },
          { task: "Set out bottled water and snacks" },
          { task: "Turn on one welcoming light" },
          { task: "Final walkthrough from guest perspective" },
          { task: "Lock up and confirm ready status" },
        ],
      },
    ],
  },
  commercial: {
    title: "Commercial Office Cleaning",
    icon: <Building size={20} />,
    description: "Professional cleaning standards for offices, medical facilities, and retail spaces. Customizable based on your facility's specific needs.",
    categories: [
      {
        room: "Common Areas",
        items: [
          { task: "Vacuum all carpeted areas" },
          { task: "Mop hard floors" },
          { task: "Dust all surfaces and shelves" },
          { task: "Clean glass doors and partitions" },
          { task: "Wipe down reception desk and counters" },
          { task: "Empty all trash and recycling" },
          { task: "Sanitize door handles and light switches" },
          { task: "Clean elevator buttons and handrails" },
        ],
      },
      {
        room: "Restrooms",
        items: [
          { task: "Sanitize all toilets and urinals" },
          { task: "Clean and disinfect sinks and counters" },
          { task: "Clean mirrors" },
          { task: "Restock soap, paper towels, and toilet paper" },
          { task: "Empty trash and sanitary bins" },
          { task: "Mop and disinfect floors" },
          { task: "Wipe down partitions and door handles" },
        ],
      },
      {
        room: "Break Room & Kitchen",
        items: [
          { task: "Wipe down countertops and tables" },
          { task: "Clean sink and faucet" },
          { task: "Clean microwave interior and exterior" },
          { task: "Wipe down refrigerator exterior" },
          { task: "Clean coffee maker area" },
          { task: "Empty trash and replace liners" },
          { task: "Sweep and mop floors" },
        ],
      },
      {
        room: "Workspaces",
        items: [
          { task: "Dust desks and work surfaces" },
          { task: "Sanitize shared equipment (printers, copiers)" },
          { task: "Vacuum individual office areas" },
          { task: "Empty desk-side trash cans" },
          { task: "Wipe down phone handsets" },
          { task: "Clean computer monitors (dry cloth)" },
        ],
      },
    ],
  },
};

function InteractiveChecklist({ categories }: { categories: ChecklistCategory[] }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);
  const checkedCount = checked.size;
  const progress = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

  const toggleItem = (key: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            {checkedCount} of {totalItems} tasks completed
          </span>
          <span className="text-sm font-bold text-[#0D9488]">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#0D9488] to-[#0D9488]/70 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Print Button */}
      <div className="flex gap-3 mb-8 print:hidden">
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0C1829] text-white text-sm font-medium rounded-lg hover:bg-[#0C1829]/90 transition-colors"
        >
          <Printer size={16} />
          Print Checklist
        </button>
        <button
          onClick={() => setChecked(new Set())}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Reset All
        </button>
      </div>

      {/* Checklist Categories */}
      <div className="space-y-8">
        {categories.map((category) => (
          <div key={category.room}>
            <h3
              className="text-lg font-bold text-[#0C1829] mb-4 pb-2 border-b border-gray-100"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {category.room}
            </h3>
            <div className="space-y-2">
              {category.items.map((item, idx) => {
                const key = `${category.room}-${idx}`;
                const isChecked = checked.has(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleItem(key)}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all ${
                      isChecked ? "bg-[#0D9488]/5" : "hover:bg-gray-50"
                    }`}
                  >
                    {isChecked ? (
                      <CheckCircle size={20} className="text-[#0D9488] flex-shrink-0 mt-0.5" />
                    ) : (
                      <Circle size={20} className="text-gray-300 flex-shrink-0 mt-0.5" />
                    )}
                    <span
                      className={`text-sm leading-relaxed transition-all ${
                        isChecked ? "text-gray-400 line-through" : "text-gray-700"
                      }`}
                    >
                      {item.task}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Checklist() {
  const [activeChecklist, setActiveChecklist] = useState("standard");
  const current = CHECKLISTS[activeChecklist];

  const checklistSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `${current.title} Checklist - Hygiene Maids`,
    description: current.description,
    step: current.categories.flatMap((cat) =>
      cat.items.map((item, idx) => ({
        "@type": "HowToStep",
        name: item.task,
        position: idx + 1,
      }))
    ),
    provider: {
      "@type": "LocalBusiness",
      name: "Hygiene Maids",
      telephone: BRAND.phone,
      areaServed: "Dallas-Fort Worth, TX",
    },
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
{/* Hero */}
      <section className="relative bg-[#0C1829] py-16 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 right-20 w-40 h-40 rounded-full bg-[#0D9488]/30 blur-3xl" />
          <div className="absolute bottom-10 left-10 w-60 h-60 rounded-full bg-[#0D9488]/20 blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#0D9488]/20 rounded-full mb-4">
            <CheckCircle size={14} className="text-[#0D9488]" />
            <span className="text-[#0D9488] text-xs font-semibold tracking-wider uppercase">Free Cleaning Checklists</span>
          </div>
          <h1
            className="text-3xl md:text-5xl font-extrabold text-white leading-tight"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Professional Cleaning Checklists
          </h1>
          <p className="mt-4 text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
            The same detailed checklists our professional teams use across 28 DFW cities.
            Interactive, printable, and completely free.
          </p>
        </div>
      </section>

      {/* Breadcrumbs */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Breadcrumbs items={[{ label: "Cleaning Checklists" }]} />
      </div>

      {/* Checklist Selector */}
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="flex flex-wrap gap-3 justify-center mb-12">
              {Object.entries(CHECKLISTS).map(([key, checklist]) => (
                <button
                  key={key}
                  onClick={() => setActiveChecklist(key)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    activeChecklist === key
                      ? "bg-[#0D9488] text-white shadow-lg shadow-[#0D9488]/25"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-[#0D9488]/30 hover:text-[#0D9488]"
                  }`}
                >
                  {checklist.icon}
                  <span className="hidden sm:inline">{checklist.title}</span>
                  <span className="sm:hidden">{checklist.title.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </FadeIn>

          {/* Active Checklist */}
          <FadeIn>
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-10 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-[#0D9488]/10 flex items-center justify-center text-[#0D9488]">
                    {current.icon}
                  </div>
                  <h2
                    className="text-2xl font-bold text-[#0C1829]"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {current.title}
                  </h2>
                </div>
                <p className="text-gray-600 leading-relaxed mb-8">{current.description}</p>

                <InteractiveChecklist categories={current.categories} />
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Why Use Our Checklists */}
      <section className="py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12">
              <h2
                className="text-2xl md:text-3xl font-bold text-[#0C1829]"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Why Use Professional Checklists?
              </h2>
              <p className="mt-3 text-gray-600 max-w-xl mx-auto">
                Our checklists are based on years of professional cleaning experience across thousands of DFW homes.
              </p>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Nothing Gets Missed",
                desc: "Systematic room-by-room approach ensures every surface, fixture, and corner is addressed. No more forgetting the baseboards or the exhaust fan.",
              },
              {
                title: "Save Time & Energy",
                desc: "A clear checklist eliminates decision fatigue. You know exactly what to do next, which makes cleaning faster and more efficient.",
              },
              {
                title: "Professional Results",
                desc: "These are the same checklists our trained teams follow. Using them at home brings you closer to professional-quality results.",
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="text-center p-6">
                  <div className="w-12 h-12 rounded-xl bg-[#0D9488]/10 flex items-center justify-center text-[#0D9488] mx-auto mb-4">
                    <CheckCircle size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-[#0C1829] mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Internal Links for SEO */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <h2
              className="text-2xl font-bold text-[#0C1829] mb-8 text-center"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Related Resources
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: "Standard Cleaning", href: "/services/standard-cleaning", desc: "Regular home maintenance" },
                { title: "Deep Cleaning", href: "/services/deep-cleaning", desc: "Top-to-bottom thorough clean" },
                { title: "Move-In/Out Cleaning", href: "/services/move-in-out-cleaning", desc: "Get your full deposit back" },
                { title: "Commercial Cleaning", href: "/services/commercial-cleaning", desc: "Office & business cleaning" },
                { title: "Service Areas", href: "/locations", desc: "28+ DFW cities served" },
                { title: "Cleaning Blog", href: "/blog", desc: "Tips, guides & advice" },
                { title: "Get a Free Quote", href: "/quote", desc: "Custom pricing for your home" },
                { title: "Book Now", href: "/book", desc: "Schedule your cleaning today" },
              ].map((link, i) => (
                <Link key={i} href={link.href}>
                  <div className="p-4 rounded-xl border border-gray-100 hover:border-[#0D9488]/30 hover:shadow-sm transition-all group cursor-pointer">
                    <h3 className="font-semibold text-[#0C1829] group-hover:text-[#0D9488] transition-colors text-sm">
                      {link.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">{link.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <CTASection
        title="Let Us Handle the Checklist"
        subtitle="Our professional teams follow these checklists and more — with commercial-grade equipment and eco-friendly products."
      />
</div>
  );
}
