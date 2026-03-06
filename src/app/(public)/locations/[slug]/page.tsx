"use client";
/*
 * LocationCity — Individual City SEO Landing Page
 * Aggressive local SEO: unique content per city, schema markup, local keywords
 * Luxury premium design consistent with other pages
 */
import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import { motion } from "framer-motion";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { BRAND, IMAGES, SERVICES, SERVICE_AREAS, REVIEWS } from "@/lib/constants";
import {
  Phone, Star, MapPin, CheckCircle, ArrowRight,
  Shield, Clock, Leaf, Sparkles,
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

export default function LocationCity() {
  const params = useParams();
  const slug = params.slug as string;
  const area = SERVICE_AREAS.find(a => a.slug === slug);

  if (!area) { notFound(); }

  // Get 2-3 reviews that mention this city or nearby
  const localReviews = REVIEWS.filter(r => r.location.includes(area.city) || r.location.includes(area.state)).slice(0, 3);
  const displayReviews = localReviews.length >= 2 ? localReviews : REVIEWS.slice(0, 3);

  // Nearby cities for internal linking
  const nearbyCities = SERVICE_AREAS.filter(a => a.slug !== slug).slice(0, 6);

  const citySchema = [
    {
      "@context": "https://schema.org",
      "@type": ["LocalBusiness", "HomeAndConstructionBusiness"],
      "@id": `https://hygienemaids.com/locations/${area.slug}#localbusiness`,
      name: `Hygiene Maids - ${area.city} House Cleaning`,
      description: `Professional house cleaning services in ${area.city}, TX. Standard, deep, move-in/out, commercial, and Airbnb cleaning. Licensed, bonded, insured. Serving ${area.neighborhoods}.`,
      telephone: BRAND.phoneRaw,
      email: BRAND.email,
      url: `https://hygienemaids.com/locations/${area.slug}`,
      image: IMAGES.dfwSkyline,
      priceRange: "$$",
      address: {
        "@type": "PostalAddress",
        addressLocality: area.city,
        addressRegion: "TX",
        addressCountry: "US"
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 32.7767,
        longitude: -96.7970
      },
      areaServed: {
        "@type": "City",
        name: area.city,
        containedInPlace: { "@type": "State", name: "Texas", "@id": "https://en.wikipedia.org/wiki/Texas" }
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "5.0",
        reviewCount: String(BRAND.reviewCount),
        bestRating: "5",
        worstRating: "1"
      },
      openingHoursSpecification: [
        { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday"], opens: "07:00", closes: "19:00" },
        { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "08:00", closes: "17:00" }
      ],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: `Cleaning Services in ${area.city}`,
        itemListElement: SERVICES.map(s => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: `${s.title} in ${area.city}`,
            description: s.shortDesc,
            url: `https://hygienemaids.com/services/${s.slug}`
          }
        }))
      },
      parentOrganization: { "@id": "https://hygienemaids.com/#organization" }
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `https://hygienemaids.com/locations/${area.slug}#webpage`,
      url: `https://hygienemaids.com/locations/${area.slug}`,
      name: `House Cleaning in ${area.city}, TX | Hygiene Maids`,
      description: `Professional house cleaning services in ${area.city}, TX. Serving ${area.neighborhoods}.`,
      isPartOf: { "@id": "https://hygienemaids.com/#website" },
      about: { "@id": `https://hygienemaids.com/locations/${area.slug}#localbusiness` },
      inLanguage: "en-US"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
{/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden min-h-[460px] flex items-center">
        <div className="absolute inset-0">
          <img src={IMAGES.dfwSkyline} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0C1829] via-[#0C1829]/95 to-[#0C1829]/60" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-28 w-full">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#0D9488]/20 rounded-full mb-6">
              <MapPin size={14} className="text-[#0D9488]" />
              <span className="text-xs font-semibold text-[#0D9488] tracking-wider uppercase">
                Serving {area.city}, {area.state}
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Professional House Cleaning<br />
              <span className="text-[#0D9488]">in {area.city}, Texas</span>
            </h1>
            <p className="mt-6 text-lg text-white/60 leading-relaxed max-w-2xl">
              Hygiene Maids provides premium residential and commercial cleaning services throughout {area.city} and surrounding neighborhoods including {area.neighborhoods}. Licensed, bonded, and insured with a 100% satisfaction guarantee.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link href="/book" className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold text-white bg-[#0D9488] rounded-xl hover:bg-[#0B8278] transition-all shadow-lg shadow-[#0D9488]/25">
                Book {area.city} Cleaning <ArrowRight size={16} />
              </Link>
              <Link href="/quote" className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold text-white border-2 border-white/30 rounded-xl hover:bg-white/10 transition-all">
                Get Free Quote
              </Link>
              <a href={`tel:${BRAND.phoneRaw}`} className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold text-[#C9A84C] border-2 border-[#C9A84C]/30 rounded-xl hover:bg-[#C9A84C]/10 transition-all">
                <Phone size={16} /> {BRAND.phone}
              </a>
            </div>
            <div className="mt-6 flex items-center gap-4 text-white/40 text-sm">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(i => <Star key={i} size={14} className="fill-[#C9A84C] text-[#C9A84C]" />)}
                <span className="ml-1">5.0 Rating</span>
              </div>
              <span>|</span>
              <span>Licensed & Insured</span>
              <span>|</span>
              <span>Same-Day Available</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Breadcrumbs items={[{ label: "Service Areas", href: "/locations" }, { label: `${area.city}, TX` }]} />
      </div>

      {/* ═══ SERVICES IN THIS CITY ═══ */}
      <section className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#0C1829]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Cleaning Services in {area.city}
              </h2>
              <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
                From regular maintenance to deep cleans, we offer a full range of professional cleaning services for {area.city} homes and businesses.
              </p>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((service, i) => (
              <FadeIn key={service.id} delay={i * 0.08}>
                <Link href={`/services#${service.slug}`}>
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-[#0D9488]/30 hover:shadow-xl transition-all group h-full">
                    <div className="w-12 h-12 rounded-xl bg-[#0D9488]/10 flex items-center justify-center mb-4 group-hover:bg-[#0D9488]/20 transition-colors">
                      <Sparkles size={22} className="text-[#0D9488]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#0C1829] mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {service.title} in {area.city}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">{service.shortDesc}</p>
                    <ul className="space-y-1.5">
                      {service.features.slice(0, 3).map(f => (
                        <li key={f} className="flex items-center gap-2 text-xs text-gray-500">
                          <CheckCircle size={12} className="text-[#0D9488] flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHY CHOOSE US ═══ */}
      <section className="py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#0C1829]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Why {area.city} Homeowners Choose <span className="text-[#0D9488]">Hygiene Maids</span>
              </h2>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Shield, title: "Licensed & Insured", desc: `Every team member serving ${area.city} is background-checked, bonded, and fully insured for your peace of mind.` },
              { icon: Star, title: "5-Star Rated", desc: `Consistently rated 5 stars by ${area.city} families. We earn your trust with every clean.` },
              { icon: Clock, title: "Same-Day Available", desc: `Need a last-minute cleaning in ${area.city}? We offer same-day and next-day availability.` },
              { icon: Leaf, title: "Eco-Friendly Products", desc: `We use professional-grade, eco-friendly products that are safe for ${area.city} families and pets.` },
            ].map((item, idx) => (
              <FadeIn key={item.title} delay={idx * 0.1}>
                <div className="text-center">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-[#0D9488]/10 flex items-center justify-center mb-5">
                    <item.icon size={24} className="text-[#0D9488]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0C1829] mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ NEIGHBORHOODS ═══ */}
      <section className="py-16 bg-[#FAFAF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <h2 className="text-2xl font-bold text-[#0C1829] mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Neighborhoods We Serve in {area.city}
            </h2>
            <div className="flex flex-wrap gap-3">
              {area.neighborhoods.split(", ").map(n => (
                <span key={n} className="px-4 py-2 bg-white rounded-xl text-sm text-gray-700 border border-gray-200">
                  {n}
                </span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══ LOCAL REVIEWS ═══ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <h2 className="text-3xl font-bold text-[#0C1829] text-center mb-12" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              What {area.city} Residents Say
            </h2>
          </FadeIn>
          <div className="grid sm:grid-cols-3 gap-6">
            {displayReviews.map((review, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="bg-[#FAFAF8] rounded-2xl p-6 border border-gray-100">
                  <div className="flex items-center gap-1 mb-3">
                    {[1,2,3,4,5].map(s => <Star key={s} size={14} className="fill-[#C9A84C] text-[#C9A84C]" />)}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed mb-4">"{review.text}"</p>
                  <div className="text-sm font-semibold text-[#0C1829]">{review.name}</div>
                  <div className="text-xs text-gray-500">{review.location}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ NEARBY CITIES ═══ */}
      <section className="py-16 bg-[#FAFAF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <h2 className="text-2xl font-bold text-[#0C1829] mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Also Serving Nearby Cities
            </h2>
            <p className="text-gray-500 mb-6">Professional cleaning services throughout the Dallas-Fort Worth metroplex</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {nearbyCities.map(c => (
                <Link key={c.slug} href={`/locations/${c.slug}`}>
                  <div className="p-3 bg-white rounded-xl border border-gray-100 hover:border-[#0D9488]/30 hover:shadow-sm transition-all group cursor-pointer text-center">
                    <MapPin size={14} className="mx-auto text-[#0D9488] mb-1" />
                    <span className="text-sm font-medium text-[#0C1829] group-hover:text-[#0D9488] transition-colors">{c.city}</span>
                  </div>
                </Link>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══ RELATED RESOURCES ═══ */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <h2 className="text-2xl font-bold text-[#0C1829] mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Explore Our Services & Resources
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: "Standard Cleaning", href: "/services/standard-cleaning", desc: "Weekly & biweekly home cleaning" },
                { title: "Deep Cleaning", href: "/services/deep-cleaning", desc: "Thorough top-to-bottom clean" },
                { title: "Move-In/Out Cleaning", href: "/services/move-in-out-cleaning", desc: "Get your full deposit back" },
                { title: "Cleaning Checklist", href: "/checklist", desc: "Free printable checklists" },
                { title: "Cleaning Blog", href: "/blog", desc: "Tips, guides & expert advice" },
                { title: "FAQ", href: "/faq", desc: "Common questions answered" },
                { title: "Free Quote", href: "/quote", desc: "Custom pricing for your home" },
                { title: "Book Now", href: "/book", desc: "Schedule your cleaning today" },
              ].map((link, i) => (
                <Link key={i} href={link.href}>
                  <div className="p-4 rounded-xl border border-gray-100 hover:border-[#0D9488]/30 hover:shadow-sm transition-all group cursor-pointer">
                    <h3 className="font-semibold text-[#0C1829] group-hover:text-[#0D9488] transition-colors text-sm">{link.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{link.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <CTASection
        title={`Ready for a Spotless Home in ${area.city}?`}
        subtitle="Book your professional cleaning today and experience the Hygiene Maids difference."
      />
</div>
  );
}
