"use client";
/*
 * ServiceDetail — Individual Service SEO Landing Page
 * Dedicated page per service for aggressive SEO: unique content, schema markup, local keywords
 */
import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { motion } from "framer-motion";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { BRAND, IMAGES, SERVICES, SERVICE_AREAS, REVIEWS } from "@/lib/constants";
import {
  Phone, Star, CheckCircle, ArrowRight, Shield, Clock, Leaf,
  Sparkles, Award, MapPin,
} from "lucide-react";
import AnimatedIcon from "@/components/website/AnimatedIcon";
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

// Extended content per service for SEO
const SERVICE_DETAILS: Record<string, {
  longDescription: string;
  benefits: string[];
  process: { step: string; desc: string }[];
  idealFor: string[];
  pricing: string;
}> = {
  standard: {
    longDescription: "Our standard house cleaning service is the foundation of a consistently clean and healthy home. Designed for busy Dallas-Fort Worth families, this service covers all essential cleaning tasks to maintain a fresh, inviting living space week after week. Our trained professionals follow a detailed checklist to ensure nothing is missed.",
    benefits: [
      "Consistent clean every visit with our detailed checklist",
      "Eco-friendly, non-toxic products safe for kids and pets",
      "Background-checked, bonded, and insured team members",
      "Flexible scheduling — weekly, biweekly, or monthly",
      "Same cleaning team for consistency and trust",
      "100% satisfaction guarantee on every clean",
    ],
    process: [
      { step: "Walk-Through", desc: "We assess your home and note any special requests or focus areas." },
      { step: "Systematic Clean", desc: "Room-by-room cleaning following our proven checklist — dusting, vacuuming, mopping, and sanitizing." },
      { step: "Kitchen & Bath Focus", desc: "Extra attention to high-use areas — counters, sinks, toilets, and appliance exteriors." },
      { step: "Final Inspection", desc: "Quality check before we leave to ensure everything meets our 5-star standard." },
    ],
    idealFor: ["Busy professionals", "Families with children", "Pet owners", "Anyone wanting a consistently clean home"],
    pricing: "Starting from competitive rates with up to 20% off for weekly recurring service. Exact pricing depends on home size and specific requirements.",
  },
  deep: {
    longDescription: "Our deep cleaning service goes far beyond surface-level tidying. This comprehensive, top-to-bottom clean reaches every hidden corner, sanitizes overlooked areas, and restores your home to a like-new condition. Perfect as a first-time service or seasonal refresh for Dallas-Fort Worth homes.",
    benefits: [
      "Inside appliance cleaning (oven, refrigerator, microwave)",
      "Baseboard, crown molding, and light fixture detailing",
      "Grout scrubbing and tile restoration",
      "Window sill and track cleaning",
      "Behind and under furniture cleaning",
      "Cabinet exterior wiping and sanitization",
    ],
    process: [
      { step: "Assessment", desc: "Thorough walk-through to identify problem areas and set priorities." },
      { step: "Top-Down Approach", desc: "Starting from ceiling fixtures down to baseboards — gravity works in our favor." },
      { step: "Detail Work", desc: "Inside appliances, grout scrubbing, light fixture detailing, and behind furniture." },
      { step: "Sanitize & Polish", desc: "Final sanitization of all surfaces and polish of fixtures for a sparkling finish." },
    ],
    idealFor: ["First-time clients", "Seasonal deep cleans", "Post-renovation cleanup", "Allergy sufferers needing thorough dust removal"],
    pricing: "Deep cleaning is priced based on home size and current condition. Most 3-bedroom homes range from competitive pricing. Get your free quote today.",
  },
  moveinout: {
    longDescription: "Moving is stressful enough without worrying about cleaning. Our move-in/move-out cleaning service ensures every surface, cabinet, and fixture is spotless — helping you secure your full deposit back or welcoming you into a pristine new home. Trusted by property managers and real estate agents across DFW.",
    benefits: [
      "Complete cabinet and closet interior cleaning",
      "All appliances cleaned inside and out",
      "Wall spot cleaning and baseboard detailing",
      "Full bathroom deep clean including grout",
      "Window cleaning (interior) and track cleaning",
      "Garage sweeping and utility area cleaning",
    ],
    process: [
      { step: "Empty Home Assessment", desc: "We evaluate the entire property to create a comprehensive cleaning plan." },
      { step: "Kitchen Deep Clean", desc: "Inside all cabinets, appliances, countertops, backsplash, and sink." },
      { step: "Bathroom Restoration", desc: "Scrub tub, shower, toilet, vanity, mirrors, and all fixtures to like-new condition." },
      { step: "Final Walk-Through", desc: "Room-by-room inspection to ensure landlord/buyer satisfaction." },
    ],
    idealFor: ["Renters moving out (deposit recovery)", "New homeowners moving in", "Property managers between tenants", "Real estate agents preparing listings"],
    pricing: "Move-in/move-out cleaning is priced based on property size and condition. Our service typically costs less than the deposit you'd lose. Free quotes available.",
  },
  commercial: {
    longDescription: "A clean business environment reflects your professionalism and commitment to employee and customer well-being. Hygiene Maids provides reliable commercial cleaning for offices, medical facilities, schools, churches, and retail spaces across the Dallas-Fort Worth metroplex. Flexible scheduling to minimize business disruption.",
    benefits: [
      "Flexible scheduling — before/after hours, weekends available",
      "OSHA-compliant cleaning protocols",
      "Specialized medical facility cleaning available",
      "Consistent team assigned to your location",
      "Green cleaning products for healthier workspaces",
      "Detailed reporting and quality assurance",
    ],
    process: [
      { step: "Site Evaluation", desc: "We assess your facility, understand your needs, and create a custom cleaning plan." },
      { step: "Scheduled Service", desc: "Regular cleaning on your preferred schedule — daily, weekly, or custom." },
      { step: "Quality Assurance", desc: "Regular inspections and feedback loops to maintain our high standards." },
      { step: "Ongoing Communication", desc: "Dedicated account manager for seamless coordination and adjustments." },
    ],
    idealFor: ["Office buildings and coworking spaces", "Medical and dental offices", "Schools and churches", "Retail stores and restaurants"],
    pricing: "Commercial cleaning is custom-quoted based on facility size, cleaning frequency, and specific requirements. Contact us for a free on-site evaluation.",
  },
  airbnb: {
    longDescription: "Cleanliness is the #1 factor in Airbnb guest reviews. Our turnover cleaning service ensures your short-term rental is guest-ready with hotel-quality results, every single time. Quick turnaround, consistent quality, and attention to the details that earn 5-star reviews in the competitive Dallas rental market.",
    benefits: [
      "Quick 2-3 hour turnaround between guests",
      "Hotel-quality linen change and bed making",
      "Full kitchen reset with organized staging",
      "Bathroom hotel-style towel folding and presentation",
      "Welcome staging for a premium guest experience",
      "Inventory check and damage reporting available",
    ],
    process: [
      { step: "Guest Checkout", desc: "We coordinate with your checkout schedule for seamless turnaround." },
      { step: "Deep Turnover Clean", desc: "Full property clean following our Airbnb-specific checklist." },
      { step: "Linen & Staging", desc: "Fresh linens, towel folding, welcome staging, and amenity restocking." },
      { step: "Photo-Ready Check", desc: "Final inspection ensuring the property matches your listing photos." },
    ],
    idealFor: ["Airbnb and VRBO hosts", "Property management companies", "Corporate housing providers", "Vacation rental owners"],
    pricing: "Turnover cleaning is priced per visit based on property size. Volume discounts available for hosts with multiple properties. Get your custom quote.",
  },
};

export default function ServiceDetail() {
  const params = useParams();
  const slug = params.slug as string;
  const service = SERVICES.find((s) => s.slug === slug);



  if (!service) { notFound(); }

  const details = SERVICE_DETAILS[service.id];
  const serviceImage = IMAGES[service.image as keyof typeof IMAGES];

  // Schema markup
  const serviceSchema = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `https://hygienemaids.com/services/${service.slug}`,
      name: `${service.title} in Dallas-Fort Worth`,
      description: details.longDescription,
      url: `https://hygienemaids.com/services/${service.slug}`,
      image: serviceImage,
      provider: {
        "@id": "https://hygienemaids.com/#localbusiness"
      },
      areaServed: SERVICE_AREAS.map((a) => ({ "@type": "City", name: a.city })),
      serviceType: service.title,
      termsOfService: "https://hygienemaids.com/terms-of-service",
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: service.title,
        itemListElement: [{
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: service.title,
            description: service.shortDesc
          },
          priceSpecification: {
            "@type": "PriceSpecification",
            priceCurrency: "USD"
          }
        }]
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "5.0",
        reviewCount: "150",
        bestRating: "5"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `https://hygienemaids.com/services/${service.slug}#webpage`,
      url: `https://hygienemaids.com/services/${service.slug}`,
      name: `${service.title} in Dallas-Fort Worth | Hygiene Maids`,
      description: `Professional ${service.title.toLowerCase()} services in Dallas-Fort Worth. Licensed, bonded, insured.`,
      isPartOf: { "@id": "https://hygienemaids.com/#website" },
      about: { "@id": `https://hygienemaids.com/services/${service.slug}` },
      inLanguage: "en-US"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
{/* Hero */}
      <section className="relative min-h-[60vh] flex items-center">
        <div className="absolute inset-0">
          <img src={serviceImage} alt={service.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0C1829]/90 via-[#0C1829]/70 to-[#0C1829]/40" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <Link href="/services" className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-[#0D9488] transition-colors mb-6">
              <ArrowRight size={14} className="rotate-180" /> All Services
            </Link>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0D9488]/20 text-[#5EEAD4] text-sm font-medium mb-4 ml-4">
              <AnimatedIcon name={service.icon} size={14} /> PROFESSIONAL SERVICE
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {service.title}
              <br />
              <span className="text-[#0D9488]">in Dallas-Fort Worth</span>
            </h1>
            <p className="mt-4 text-lg text-gray-300 max-w-2xl">{service.description}</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link href="/book" className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-[#0D9488] rounded-xl hover:bg-[#0B8278] transition-all shadow-xl shadow-[#0D9488]/25">
                Book This Service <ArrowRight size={18} />
              </Link>
              <Link href="/quote" className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white border-2 border-white/40 rounded-xl hover:bg-white/10 transition-all">
                Get Free Quote
              </Link>
              <a href={`tel:${BRAND.phoneRaw}`} className="inline-flex items-center justify-center gap-2 px-6 py-4 text-base font-medium text-white/80 hover:text-white transition-colors">
                <Phone size={16} /> {BRAND.phone}
              </a>
            </div>
            <div className="mt-6 flex items-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-1"><Star size={14} className="text-amber-400 fill-amber-400" /> 5.0 Rating</span>
              <span className="flex items-center gap-1"><Shield size={14} className="text-[#0D9488]" /> Licensed & Insured</span>
              <span className="flex items-center gap-1"><Clock size={14} className="text-[#0D9488]" /> Same-Day Available</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Breadcrumbs */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Breadcrumbs items={[{ label: "Services", href: "/services" }, { label: service.title }]} />
      </div>

      {/* What's Included */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <FadeIn>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D9488]/10 text-[#0D9488] text-xs font-semibold mb-4">
                  <Sparkles size={12} /> WHAT'S INCLUDED
                </div>
                <h2 className="text-3xl font-bold text-[#0C1829]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {service.title} Checklist
                </h2>
                <p className="mt-4 text-gray-600 leading-relaxed">{details.longDescription}</p>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="grid grid-cols-1 gap-3">
                {service.features.map((feature, i) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-4 bg-[#FAFAF8] rounded-xl border border-gray-100"
                  >
                    <CheckCircle size={18} className="text-[#0D9488] flex-shrink-0" />
                    <span className="text-sm font-medium text-[#0C1829]">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 lg:py-20 bg-[#FAFAF8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#0C1829]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Why Choose Our {service.title}
              </h2>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {details.benefits.map((benefit, i) => (
              <FadeIn key={benefit} delay={i * 0.05}>
                <div className="flex items-start gap-3 p-5 bg-white rounded-xl border border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-[#0D9488]/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={16} className="text-[#0D9488]" />
                  </div>
                  <span className="text-sm text-gray-700 leading-relaxed">{benefit}</span>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Our Process */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#0C1829]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Our {service.title} Process
              </h2>
              <p className="mt-3 text-gray-600">Simple, transparent, and thorough — every time.</p>
            </div>
          </FadeIn>
          <div className="space-y-6">
            {details.process.map((step, i) => (
              <FadeIn key={step.step} delay={i * 0.1}>
                <div className="flex gap-6 items-start">
                  <div className="w-12 h-12 rounded-full bg-[#0D9488] text-white flex items-center justify-center text-lg font-bold flex-shrink-0 shadow-lg shadow-[#0D9488]/25">
                    {i + 1}
                  </div>
                  <div className="flex-1 pb-6 border-b border-gray-100 last:border-0">
                    <h3 className="text-lg font-bold text-[#0C1829]" style={{ fontFamily: "'DM Sans', sans-serif" }}>{step.step}</h3>
                    <p className="mt-1 text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Ideal For */}
      <section className="py-16 bg-[#FAFAF8]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <FadeIn>
              <div>
                <h2 className="text-2xl font-bold text-[#0C1829] mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Ideal For
                </h2>
                <div className="space-y-3">
                  {details.idealFor.map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <CheckCircle size={16} className="text-[#0D9488] flex-shrink-0" />
                      <span className="text-sm text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div>
                <h2 className="text-2xl font-bold text-[#0C1829] mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Pricing
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{details.pricing}</p>
                <div className="bg-white rounded-xl p-5 border border-gray-100">
                  <h3 className="text-sm font-semibold text-[#0C1829] mb-3">Save with Recurring Service</h3>
                  <div className="space-y-2">
                    {[
                      { freq: "Weekly", discount: "20% off" },
                      { freq: "Biweekly", discount: "15% off" },
                      { freq: "Monthly", discount: "10% off" },
                    ].map((d) => (
                      <div key={d.freq} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{d.freq}</span>
                        <span className="font-semibold text-[#0D9488]">{d.discount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-[#0C1829]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                What Our Clients Say
              </h2>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-6">
            {REVIEWS.slice(0, 3).map((review, i) => (
              <FadeIn key={review.name} delay={i * 0.1}>
                <div className="p-6 bg-[#FAFAF8] rounded-xl border border-gray-100">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} size={14} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed italic">"{review.text}"</p>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#0D9488]/10 flex items-center justify-center text-xs font-bold text-[#0D9488]">
                      {review.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0C1829]">{review.name}</p>
                      <p className="text-xs text-gray-500">{review.location}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Service Areas */}
      <section className="py-12 bg-[#FAFAF8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <h2 className="text-2xl font-bold text-[#0C1829] mb-6 text-center" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {service.title} Available In
            </h2>
            <div className="flex flex-wrap justify-center gap-2">
              {SERVICE_AREAS.map((area) => (
                <Link
                  key={area.slug}
                  href={`/locations/${area.slug}`}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-100 rounded-full hover:border-[#0D9488]/30 hover:text-[#0D9488] transition-colors"
                >
                  <MapPin size={10} className="inline mr-1" />{area.city}, TX
                </Link>
              ))}
              <Link href="/locations" className="px-3 py-1.5 text-xs font-medium text-[#0D9488] bg-[#0D9488]/10 rounded-full hover:bg-[#0D9488]/20 transition-colors">
                View all 28+ cities →
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Related Services & Resources */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <h2 className="text-2xl font-bold text-[#0C1829] mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Explore More Services & Resources
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {SERVICES.filter(s => s.slug !== service.slug).map(s => (
                <Link key={s.slug} href={`/services/${s.slug}`}>
                  <div className="p-4 rounded-xl border border-gray-100 hover:border-[#0D9488]/30 hover:shadow-sm transition-all group cursor-pointer">
                    <h3 className="font-semibold text-[#0C1829] group-hover:text-[#0D9488] transition-colors text-sm">{s.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{s.shortDesc}</p>
                  </div>
                </Link>
              ))}
              <Link href="/checklist">
                <div className="p-4 rounded-xl border border-gray-100 hover:border-[#0D9488]/30 hover:shadow-sm transition-all group cursor-pointer">
                  <h3 className="font-semibold text-[#0C1829] group-hover:text-[#0D9488] transition-colors text-sm">Cleaning Checklist</h3>
                  <p className="text-xs text-gray-500 mt-1">Free printable cleaning guides</p>
                </div>
              </Link>
              <Link href="/blog">
                <div className="p-4 rounded-xl border border-gray-100 hover:border-[#0D9488]/30 hover:shadow-sm transition-all group cursor-pointer">
                  <h3 className="font-semibold text-[#0C1829] group-hover:text-[#0D9488] transition-colors text-sm">Cleaning Blog</h3>
                  <p className="text-xs text-gray-500 mt-1">Tips & expert advice</p>
                </div>
              </Link>
              <Link href="/faq">
                <div className="p-4 rounded-xl border border-gray-100 hover:border-[#0D9488]/30 hover:shadow-sm transition-all group cursor-pointer">
                  <h3 className="font-semibold text-[#0C1829] group-hover:text-[#0D9488] transition-colors text-sm">FAQ</h3>
                  <p className="text-xs text-gray-500 mt-1">Common questions answered</p>
                </div>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <CTASection
        title={`Book Your ${service.title} Today`}
        subtitle={`Experience the Hygiene Maids difference. Professional ${service.title.toLowerCase()} across the entire DFW metroplex.`}
      />
</div>
  );
}
