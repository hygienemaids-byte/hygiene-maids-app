"use client";
/*
 * Locations — Hygiene Maids Luxury Premium
 * DFW skyline hero, 28-city grid linking to individual SEO pages,
 * interactive search, trust indicators, dual CTAs
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useScrollAnimation, useCountUp } from "@/hooks/useScrollAnimation";
import { BRAND, IMAGES, SERVICE_AREAS } from "@/lib/constants";
import {
  MapPin, ArrowRight, Phone, CheckCircle, Star,
  Search, Shield, Clock, Sparkles,
} from "lucide-react";
import CTASection from "@/components/website/CTASection";
import Breadcrumbs from "@/components/website/Breadcrumbs";

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, isVisible } = useScrollAnimation(0.1);
  return (
    <div ref={ref} className={className}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, delay, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function StatCounter({ end, suffix, label }: { end: number; suffix: string; label: string }) {
  const { count, ref } = useCountUp(end, 2000);
  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-bold text-[#0D9488]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {count}{suffix}
      </div>
      <div className="text-sm text-white/50 mt-1 tracking-wide uppercase">{label}</div>
    </div>
  );
}

export default function Locations() {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? SERVICE_AREAS.filter(
        (a) =>
          a.city.toLowerCase().includes(search.toLowerCase()) ||
          a.neighborhoods.toLowerCase().includes(search.toLowerCase())
      )
    : SERVICE_AREAS;

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
{/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden min-h-[480px] flex items-center">
        <div className="absolute inset-0">
          <img src={IMAGES.dfwSkyline} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0C1829] via-[#0C1829]/95 to-[#0C1829]/60" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 w-full">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#0D9488]/20 rounded-full mb-6">
              <MapPin size={14} className="text-[#0D9488]" />
              <span className="text-xs font-semibold text-[#0D9488] tracking-wider uppercase">DFW Service Areas</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Serving the Entire<br /><span className="text-[#0D9488]">Dallas-Fort Worth</span> Metroplex
            </h1>
            <p className="mt-6 text-lg text-white/60 leading-relaxed max-w-2xl">
              Professional cleaning services across 28+ cities in the DFW metro area. Wherever you are, premium spotless service is just a booking away.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link href="/book" className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold text-white bg-[#0D9488] rounded-xl hover:bg-[#0B8278] transition-all shadow-lg shadow-[#0D9488]/25">
                Book Now <ArrowRight size={16} />
              </Link>
              <Link href="/quote" className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold text-white border-2 border-white/30 rounded-xl hover:bg-white/10 transition-all">
                Get Free Quote
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ BREADCRUMBS ═══ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Breadcrumbs items={[{ label: "Service Areas" }]} />
      </div>

      {/* ═══ STATS BAR ═══ */}
      <section className="py-14 bg-[#0C1829]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <StatCounter end={28} suffix="+" label="Cities Served" />
            <StatCounter end={500} suffix="+" label="Happy Clients" />
            <StatCounter end={5} suffix=".0" label="Google Rating" />
            <StatCounter end={0} suffix="" label="Travel Surcharges" />
          </div>
        </div>
      </section>

      {/* ═══ COVERAGE OVERVIEW ═══ */}
      <section className="py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <FadeIn>
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#0D9488]/10 rounded-full mb-4">
                  <Sparkles size={14} className="text-[#0D9488]" />
                  <span className="text-xs font-semibold text-[#0D9488] tracking-wider uppercase">Coverage Area</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-[#0C1829] leading-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  7.6 Million People.<br /><span className="text-[#0D9488]">One Trusted Cleaner.</span>
                </h2>
                <p className="mt-6 text-gray-600 leading-relaxed text-lg">
                  The Dallas-Fort Worth metroplex is one of the fastest-growing regions in America. Hygiene Maids is proud to serve families and businesses across this vibrant community with professional, reliable, and premium cleaning services.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-4">
                  {[
                    "28+ Cities Served",
                    "Same-Day Availability",
                    "Flexible Scheduling",
                    "No Travel Surcharges",
                    "Licensed & Insured",
                    "100% Satisfaction",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2.5 text-sm text-[#0C1829]">
                      <CheckCircle size={16} className="text-[#0D9488] flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <Link href="/book" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-[#0D9488] rounded-xl hover:bg-[#0B8278] transition-all shadow-lg shadow-[#0D9488]/25">
                    Book Your Cleaning <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={0.15}>
              <div className="relative">
                <div className="rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src={IMAGES.contactFriendly}
                    alt="Hygiene Maids arriving at customer home in DFW"
                    className="w-full h-[420px] lg:h-[480px] object-cover"
                  />
                </div>
                <div className="absolute -bottom-3 -right-3 w-24 h-24 bg-[#0D9488]/10 rounded-2xl -z-10" />
                <div className="absolute -top-3 -left-3 w-16 h-16 bg-[#C9A84C]/10 rounded-2xl -z-10" />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ═══ CITY GRID WITH SEARCH ═══ */}
      <section className="py-20 lg:py-24 bg-[#FAFAF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#0C1829]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Find Your City
              </h2>
              <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
                Click on your city to see our full range of cleaning services and local information.
              </p>
            </div>
          </FadeIn>

          {/* Search */}
          <FadeIn delay={0.1}>
            <div className="max-w-md mx-auto mb-12">
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search city or neighborhood..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm text-[#0C1829] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all"
                />
              </div>
            </div>
          </FadeIn>

          {/* City Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((area, i) => (
              <FadeIn key={area.slug} delay={Math.min(i * 0.03, 0.4)}>
                <Link href={`/locations/${area.slug}`}>
                  <div className="bg-white rounded-xl p-5 border border-gray-100 hover:border-[#0D9488]/40 hover:shadow-lg transition-all group cursor-pointer h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#0D9488]/10 flex items-center justify-center group-hover:bg-[#0D9488]/20 transition-colors">
                          <MapPin size={16} className="text-[#0D9488]" />
                        </div>
                        <h3 className="text-base font-bold text-[#0C1829]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                          {area.city}
                        </h3>
                      </div>
                      <ArrowRight size={14} className="text-gray-300 group-hover:text-[#0D9488] transition-colors mt-2" />
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                      {area.neighborhoods}
                    </p>
                    <div className="mt-3 flex items-center gap-1">
                      {[1,2,3,4,5].map(s => <Star key={s} size={10} className="fill-[#C9A84C] text-[#C9A84C]" />)}
                      <span className="text-[10px] text-gray-400 ml-1">5.0</span>
                    </div>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No cities found matching "{search}". Try a different search term.</p>
              <p className="text-sm text-gray-400 mt-2">
                Don't see your area? <a href={`tel:${BRAND.phoneRaw}`} className="text-[#0D9488] font-semibold hover:underline">Call us</a> — we may still serve your location.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ═══ WHY CHOOSE US ═══ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#0C1829]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Why DFW Chooses <span className="text-[#0D9488]">Hygiene Maids</span>
              </h2>
            </div>
          </FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Shield, title: "Licensed & Insured", desc: "Every team member is background-checked, bonded, and fully insured for your peace of mind." },
              { icon: Star, title: "5-Star Rated", desc: "Consistently rated 5 stars by families across the entire DFW metroplex." },
              { icon: Clock, title: "Same-Day Available", desc: "Need it today? We offer same-day and next-day availability in all service areas." },
              { icon: MapPin, title: "No Travel Fees", desc: "No hidden surcharges or travel fees anywhere in our DFW service area." },
            ].map((item, idx) => (
              <FadeIn key={item.title} delay={idx * 0.1}>
                <div className="text-center">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-[#0D9488]/10 flex items-center justify-center mb-5">
                    <item.icon size={24} className="text-[#0D9488]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0C1829] mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <CTASection
        title="In Your Area? Let's Get Started!"
        subtitle="Book your professional cleaning today. We serve the entire DFW metroplex with no travel surcharges."
      />
</div>
  );
}
