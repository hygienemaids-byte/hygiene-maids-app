"use client";
/*
 * Home — Hygiene Maids Luxury
 * Premium hero, scroll animations, animated stats, luxury sections
 */
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useScrollAnimation, useCountUp } from "@/hooks/useScrollAnimation";
import { BRAND, IMAGES, SERVICES, SERVICE_AREAS, REVIEWS, FAQ_ITEMS } from "@/lib/constants";
import { Phone, Star, ChevronDown, ChevronRight, Shield, Clock, Leaf, Award, MapPin, Sparkles, ArrowRight, Users, DollarSign, Heart } from "lucide-react";
import CTASection from "@/components/website/CTASection";
import { useState } from "react";

const HOME_SCHEMA = [
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://hygienemaids.com",
    name: "Hygiene Maids",
    description: "Dallas-Fort Worth's premier professional house cleaning service. Licensed, bonded, insured. Serving 28+ DFW cities with standard, deep, move-in/out, commercial, and Airbnb cleaning.",
    url: "https://hygienemaids.com",
    telephone: "(469) 935-7031",
    email: "booking@hygienemaids.com",
    priceRange: "$$",
    image: IMAGES.luxuryHero,
    address: { "@type": "PostalAddress", addressLocality: "Dallas", addressRegion: "TX", addressCountry: "US" },
    geo: { "@type": "GeoCoordinates", latitude: 32.7767, longitude: -96.7970 },
    openingHoursSpecification: { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"], opens: "07:00", closes: "19:00" },
    aggregateRating: { "@type": "AggregateRating", ratingValue: "5.0", reviewCount: "150", bestRating: "5" },
    areaServed: SERVICE_AREAS.map(a => ({ "@type": "City", name: `${a.city}, TX` })),
    hasOfferCatalog: { "@type": "OfferCatalog", name: "Cleaning Services", itemListElement: SERVICES.map(s => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: s.title, description: s.shortDesc } })) },
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Hygiene Maids",
    url: "https://hygienemaids.com",
    potentialAction: { "@type": "SearchAction", target: "https://hygienemaids.com/blog?q={search_term_string}", "query-input": "required name=search_term_string" },
  },
];

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
      <div className="text-sm text-gray-500 mt-1 tracking-wide uppercase">{label}</div>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: rating }).map((_, i) => (
        <Star key={i} size={16} className="fill-[#C9A84C] text-[#C9A84C]" />
      ))}
    </div>
  );
}

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
{/* ═══════════════ HERO ═══════════════ */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 lg:pt-16 lg:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Copy */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#0D9488]/10 rounded-full mb-6">
                <Sparkles size={14} className="text-[#0D9488]" />
                <span className="text-xs font-semibold text-[#0D9488] tracking-wider uppercase">Dallas-Fort Worth's #1 Rated</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0C1829] leading-[1.1] tracking-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                A Cleaner Home,{" "}
                <span className="text-[#0D9488]">A Happier Life</span>
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-lg">
                Experience the luxury of coming home to spotless spaces. Trusted by 500+ DFW families with 5-star rated professional cleaning services.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Link
                  href="/book"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-[#0D9488] rounded-xl hover:bg-[#0B8278] transition-all duration-300 shadow-xl shadow-[#0D9488]/25"
                >
                  Book Your Cleaning <ArrowRight size={18} />
                </Link>
                <Link
                  href="/quote"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-[#0D9488] border-2 border-[#0D9488] rounded-xl hover:bg-[#0D9488]/5 transition-all duration-300"
                >
                  Get a Free Quote
                </Link>
              </div>
              <div className="flex items-center gap-6 mt-8 pt-8 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0D9488] to-[#0B8278] border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm">
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(i => <Star key={i} size={12} className="fill-[#C9A84C] text-[#C9A84C]" />)}
                    </div>
                    <span className="text-gray-500">{BRAND.reviewCount}+ reviews</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right — Hero Image */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={IMAGES.luxuryHero}
                  alt="Luxury clean living room in Dallas-Fort Worth"
                  className="w-full h-[400px] lg:h-[520px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0C1829]/20 to-transparent" />
              </div>
              {/* Floating badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-xl p-4 flex items-center gap-3"
              >
                <div className="w-12 h-12 bg-[#0D9488]/10 rounded-full flex items-center justify-center">
                  <Shield size={24} className="text-[#0D9488]" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#0C1829]">100% Guaranteed</div>
                  <div className="text-xs text-gray-500">Satisfaction or re-clean free</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════ TRUST BAR ═══════════════ */}
      <section className="bg-[#0C1829] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCounter end={500} suffix="+" label="Happy Clients" />
            <StatCounter end={5} suffix=".0" label="Google Rating" />
            <StatCounter end={28} suffix="+" label="Cities Served" />
            <StatCounter end={100} suffix="%" label="Satisfaction Rate" />
          </div>
        </div>
      </section>

      {/* ═══════════════ SERVICES ═══════════════ */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-semibold text-[#0D9488] tracking-wider uppercase">Our Services</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-[#0C1829]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Premium Cleaning Services Tailored to You
            </h2>
            <p className="mt-4 text-gray-600 leading-relaxed">
              From regular maintenance to deep cleans, we offer comprehensive cleaning solutions for homes and businesses across the Dallas-Fort Worth metroplex.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.slice(0, 3).map((service, i) => (
              <FadeIn key={service.id} delay={i * 0.1}>
                <Link href={`/services#${service.id}`}>
                  <div className="group relative overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer h-full">
                    <div className="h-52 overflow-hidden">
                      <img
                        src={IMAGES[service.image as keyof typeof IMAGES]}
                        alt={`${service.title} in Dallas-Fort Worth`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-[#0C1829] group-hover:text-[#0D9488] transition-colors" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        {service.title}
                      </h3>
                      <p className="mt-2 text-sm text-gray-600 leading-relaxed">{service.shortDesc}</p>
                      <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-[#0D9488]">
                        Learn more <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>

          {/* Second row */}
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            {SERVICES.slice(3).map((service, i) => (
              <FadeIn key={service.id} delay={i * 0.1}>
                <Link href={`/services#${service.id}`}>
                  <div className="group relative overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer h-full">
                    <div className="flex flex-col sm:flex-row h-full">
                      <div className="sm:w-48 h-48 sm:h-auto overflow-hidden flex-shrink-0">
                        <img
                          src={IMAGES[service.image as keyof typeof IMAGES]}
                          alt={`${service.title} in Dallas-Fort Worth`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      </div>
                      <div className="p-6 flex flex-col justify-center">
                        <h3 className="text-xl font-bold text-[#0C1829] group-hover:text-[#0D9488] transition-colors" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                          {service.title}
                        </h3>
                        <p className="mt-2 text-sm text-gray-600 leading-relaxed">{service.shortDesc}</p>
                        <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-[#0D9488]">
                          Learn more <ChevronRight size={16} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ WHY CHOOSE US ═══════════════ */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <div className="relative">
                <img
                  src={IMAGES.clientHandshake}
                  alt="Hygiene Maids professional greeting a client at their Dallas home"
                  className="rounded-2xl shadow-xl w-full h-[420px] object-cover"
                />
                <div className="absolute -bottom-6 -right-6 bg-[#0D9488] text-white rounded-xl p-5 shadow-xl">
                  <div className="text-3xl font-bold" style={{ fontFamily: "'DM Sans', sans-serif" }}>5.0</div>
                  <div className="flex gap-0.5 mt-1">
                    {[1,2,3,4,5].map(i => <Star key={i} size={14} className="fill-[#C9A84C] text-[#C9A84C]" />)}
                  </div>
                  <div className="text-xs mt-1 opacity-80">Google Rating</div>
                </div>
              </div>
            </FadeIn>

            <div>
              <FadeIn>
                <span className="text-xs font-semibold text-[#0D9488] tracking-wider uppercase">Why Hygiene Maids</span>
                <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-[#0C1829]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  The DFW Cleaning Service You Can Trust
                </h2>
              </FadeIn>

              <div className="mt-8 space-y-6">
                {[
                  { icon: Shield, title: "Vetted & Insured Professionals", desc: "Every team member is background-checked, bonded, and fully insured for your complete peace of mind." },
                  { icon: Clock, title: "Same-Day Availability", desc: "Need a last-minute clean? We offer same-day and next-day booking across the entire DFW metroplex." },
                  { icon: Leaf, title: "Eco-Friendly Products", desc: "We use professional-grade, eco-friendly cleaning products that are safe for your family, pets, and the environment." },
                  { icon: Award, title: "100% Satisfaction Guarantee", desc: "Not happy with our service? We'll re-clean your space at no extra cost within 24 hours. No questions asked." },
                ].map((item, i) => (
                  <FadeIn key={item.title} delay={i * 0.1}>
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#0D9488]/10 flex items-center justify-center flex-shrink-0">
                        <item.icon size={22} className="text-[#0D9488]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#0C1829]">{item.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section className="py-20 lg:py-28 bg-[#FAFAF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-semibold text-[#0D9488] tracking-wider uppercase">How It Works</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-[#0C1829]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Book Your Cleaning in 3 Simple Steps
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Choose Your Service", desc: "Select from standard, deep, move-in/out, commercial, or Airbnb cleaning. Customize to your needs.", icon: Sparkles },
              { step: "02", title: "Pick Your Schedule", desc: "Choose a date and time that works for you. Same-day and next-day availability across the DFW metroplex.", icon: Clock },
              { step: "03", title: "Enjoy Your Clean Home", desc: "Our vetted professionals arrive on time and leave your space spotless. 100% satisfaction guaranteed.", icon: Award },
            ].map((item, i) => (
              <FadeIn key={item.step} delay={i * 0.15}>
                <div className="relative text-center p-8">
                  <div className="text-7xl font-bold text-[#0D9488]/10 absolute top-0 left-1/2 -translate-x-1/2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {item.step}
                  </div>
                  <div className="relative pt-10">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-[#0D9488] flex items-center justify-center shadow-lg shadow-[#0D9488]/25">
                      <item.icon size={28} className="text-white" />
                    </div>
                    <h3 className="mt-6 text-xl font-bold text-[#0C1829]" style={{ fontFamily: "'DM Sans', sans-serif" }}>{item.title}</h3>
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn className="text-center mt-12">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/book"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-[#0D9488] rounded-xl hover:bg-[#0B8278] transition-all shadow-xl shadow-[#0D9488]/25"
              >
                Book Your Cleaning <ArrowRight size={18} />
              </Link>
              <Link
                href="/quote"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-[#0D9488] border-2 border-[#0D9488] rounded-xl hover:bg-[#0D9488]/5 transition-all"
              >
                Get a Free Quote
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════ ECO SECTION ═══════════════ */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <FadeIn>
                <span className="text-xs font-semibold text-[#0D9488] tracking-wider uppercase">Eco-Friendly</span>
                <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-[#0C1829]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Safe for Your Family, Kind to the Planet
                </h2>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  We use professional-grade, eco-friendly cleaning products that deliver exceptional results without harsh chemicals. Safe for children, pets, and allergy sufferers.
                </p>
              </FadeIn>
              <FadeIn delay={0.1}>
                <div className="mt-8 grid grid-cols-2 gap-4">
                  {["Non-Toxic Formulas", "Pet & Child Safe", "Allergy-Friendly", "Biodegradable"].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#0D9488]/10 flex items-center justify-center">
                        <Leaf size={14} className="text-[#0D9488]" />
                      </div>
                      <span className="text-sm font-medium text-[#0C1829]">{item}</span>
                    </div>
                  ))}
                </div>
              </FadeIn>
            </div>
            <FadeIn>
              <img
                src={IMAGES.ecoProducts}
                alt="Eco-friendly cleaning products used by Hygiene Maids"
                className="rounded-2xl shadow-xl w-full h-[400px] object-cover"
              />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ═══════════════ REVIEWS ═══════════════ */}
      <section className="py-20 lg:py-28 bg-[#0C1829]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-semibold text-[#C9A84C] tracking-wider uppercase">Testimonials</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Loved by DFW Families
            </h2>
            <p className="mt-4 text-gray-400 leading-relaxed">
              Don't just take our word for it. Here's what our clients across the Dallas-Fort Worth area have to say.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            {REVIEWS.slice(0, 6).map((review, i) => (
              <FadeIn key={review.name} delay={i * 0.08}>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 h-full">
                  <StarRating rating={review.rating} />
                  <p className="mt-4 text-gray-300 text-sm leading-relaxed">"{review.text}"</p>
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="font-semibold text-white text-sm">{review.name}</div>
                    <div className="text-xs text-gray-500">{review.location}</div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ SERVICE AREAS ═══════════════ */}
      <section className="py-20 lg:py-28 bg-[#FAFAF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-semibold text-[#0D9488] tracking-wider uppercase">Service Areas</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-[#0C1829]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Serving 28+ Cities Across DFW
            </h2>
            <p className="mt-4 text-gray-600 leading-relaxed">
              From Dallas to Fort Worth, Plano to Arlington — we proudly serve the entire Dallas-Fort Worth metroplex with professional cleaning services.
            </p>
          </FadeIn>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {SERVICE_AREAS.map((area, i) => (
              <FadeIn key={area.slug} delay={i * 0.03}>
                <Link href={`/locations/${area.slug}`}>
                  <div className="group flex items-center gap-2 px-4 py-3 bg-white rounded-xl hover:bg-[#0D9488] transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg">
                    <MapPin size={14} className="text-[#0D9488] group-hover:text-white transition-colors flex-shrink-0" />
                    <span className="text-sm font-medium text-[#0C1829] group-hover:text-white transition-colors">{area.city}</span>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>

          <FadeIn className="text-center mt-10">
            <Link href="/locations" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0D9488] hover:text-[#0B8278] transition-colors">
              View all service areas <ArrowRight size={16} />
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════ FAQ ═══════════════ */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-16">
            <span className="text-xs font-semibold text-[#0D9488] tracking-wider uppercase">FAQ</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-[#0C1829]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Frequently Asked Questions
            </h2>
          </FadeIn>

          <div className="space-y-3">
            {FAQ_ITEMS.map((faq, i) => (
              <FadeIn key={i} delay={i * 0.05}>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left"
                  >
                    <span className="font-semibold text-[#0C1829] text-sm pr-4">{faq.question}</span>
                    <ChevronDown
                      size={18}
                      className={`text-[#0D9488] flex-shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`}
                    />
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-4 text-sm text-gray-600 leading-relaxed">{faq.answer}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ JOIN OUR TEAM ═══════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeIn>
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#0D9488]/10 rounded-full mb-6">
                  <Users size={14} className="text-[#0D9488]" />
                  <span className="text-xs font-semibold text-[#0D9488] tracking-wider uppercase">Now Hiring</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-[#0C1829] leading-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Join the <span className="text-[#0D9488]">Hygiene Maids</span> Team
                </h2>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  We're growing fast and looking for dedicated, detail-oriented cleaners to join our team across the Dallas-Fort Worth metroplex. Enjoy competitive pay, flexible schedules, and a supportive work environment.
                </p>
                <div className="grid grid-cols-2 gap-4 mt-8">
                  {[
                    { icon: DollarSign, label: "$15–$25/hr + tips" },
                    { icon: Clock, label: "Flexible hours" },
                    { icon: Shield, label: "Full insurance" },
                    { icon: Heart, label: "Paid training" },
                  ].map((perk) => (
                    <div key={perk.label} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#0D9488]/10 flex items-center justify-center flex-shrink-0">
                        <perk.icon size={16} className="text-[#0D9488]" />
                      </div>
                      <span className="text-sm font-medium text-[#0C1829]">{perk.label}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-4 mt-8">
                  <Link href="/careers" className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-bold text-white bg-[#0D9488] rounded-xl hover:bg-[#0B8278] transition-all shadow-lg shadow-[#0D9488]/25">
                    View Open Positions <ArrowRight size={14} />
                  </Link>
                  <Link href="/careers#apply" className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-bold text-[#0C1829] border border-gray-200 rounded-xl hover:border-[#0D9488]/30 hover:bg-[#0D9488]/5 transition-all">
                    Apply Now
                  </Link>
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={0.15}>
              <div className="bg-[#0C1829] rounded-2xl p-8 lg:p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#0D9488]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#C9A84C]/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="relative">
                  <h3 className="text-xl font-bold text-white mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    Why Cleaners Love Working With Us
                  </h3>
                  <div className="space-y-4">
                    {[
                      { title: "Competitive Pay", desc: "Earn $15–$25/hr plus tips with weekly direct deposit" },
                      { title: "Choose Your Hours", desc: "Work mornings, afternoons, or weekends — your choice" },
                      { title: "Growth Opportunities", desc: "Advance from cleaner to team lead to area manager" },
                      { title: "Equipment Provided", desc: "All supplies and professional equipment included" },
                      { title: "Supportive Team", desc: "Join a team that values respect and work-life balance" },
                    ].map((item) => (
                      <div key={item.title} className="flex items-start gap-3">
                        <Star size={16} className="text-[#C9A84C] flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-sm font-semibold text-white">{item.title}</span>
                          <p className="text-xs text-white/50 mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-3">
                    <MapPin size={16} className="text-[#0D9488]" />
                    <span className="text-sm text-white/60">Hiring across 28+ DFW cities</span>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ═══════════════ EXPLORE MORE ═══════════════ */}
      <section className="py-16 bg-[#FAFAF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <h2 className="text-2xl font-bold text-[#0C1829] mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Explore Hygiene Maids
            </h2>
            <p className="text-gray-500 mb-8">Everything you need for a spotless home in Dallas-Fort Worth</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { title: "All Services", href: "/services", desc: "View our full service menu" },
                { title: "Deep Cleaning", href: "/services/deep-cleaning", desc: "Thorough top-to-bottom clean" },
                { title: "Standard Cleaning", href: "/services/standard-cleaning", desc: "Weekly & biweekly maintenance" },
                { title: "Move-In/Out", href: "/services/move-in-out-cleaning", desc: "Get your full deposit back" },
                { title: "Commercial Cleaning", href: "/services/commercial-cleaning", desc: "Office & business spaces" },
                { title: "Airbnb Cleaning", href: "/services/airbnb-cleaning", desc: "Rental turnover service" },
                { title: "Service Areas", href: "/locations", desc: "28+ DFW cities" },
                { title: "Cleaning Blog", href: "/blog", desc: "Tips & expert advice" },
                { title: "Cleaning Checklist", href: "/checklist", desc: "Free printable guides" },
                { title: "FAQ", href: "/faq", desc: "Common questions answered" },
                { title: "About Us", href: "/about", desc: "Our story & values" },
                { title: "Contact", href: "/contact", desc: "Get in touch" },
                { title: "Join Our Team", href: "/careers", desc: "We're hiring cleaners" },
              ].map((link, i) => (
                <Link key={i} href={link.href}>
                  <div className="p-4 rounded-xl border border-gray-100 bg-white hover:border-[#0D9488]/30 hover:shadow-sm transition-all group cursor-pointer">
                    <h3 className="font-semibold text-[#0C1829] group-hover:text-[#0D9488] transition-colors text-sm">{link.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{link.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <CTASection
        title="Ready for a Spotless Home?"
        subtitle="Join 500+ satisfied DFW families. Book your first cleaning today and experience the Hygiene Maids difference."
      />
</div>
  );
}
