"use client";
/*
 * Services — Hygiene Maids Luxury Premium
 * Full-bleed hero, service cards with unique images, before/after showcase,
 * animated checklists, pricing teaser, trust indicators, dual CTAs
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { BRAND, IMAGES } from "@/lib/constants";
import {
  CheckCircle, ArrowRight, Phone, Sparkles, Shield, Star,
  Clock, Leaf, Award, ChevronDown, ChevronUp,
} from "lucide-react";
import AnimatedIcon from "@/components/website/AnimatedIcon";
import Breadcrumbs from "@/components/website/Breadcrumbs";
import CTASection from "@/components/website/CTASection";

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

function SlideIn({ children, direction = "left", delay = 0, className = "" }: { children: React.ReactNode; direction?: "left" | "right"; delay?: number; className?: string }) {
  const { ref, isVisible } = useScrollAnimation(0.1);
  const x = direction === "left" ? -50 : 50;
  return (
    <div ref={ref} className={className}>
      <motion.div
        initial={{ opacity: 0, x }}
        animate={isVisible ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.7, delay, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </div>
  );
}

const allServices = [
  {
    id: "standard",
    slug: "standard-house-cleaning",
    title: "Standard House Cleaning",
    description: "Our signature cleaning covers every essential to keep your home fresh and inviting. Ideal for regular maintenance on a weekly, biweekly, or monthly basis — so you always come home to spotless spaces.",
    image: IMAGES.luxuryHero,
    checklist: ["Dust all surfaces & furniture", "Vacuum & mop all floors", "Clean kitchen counters & appliances", "Sanitize bathrooms (tub, toilet, sink)", "Make beds & tidy rooms", "Empty trash cans", "Wipe mirrors & glass surfaces"],
    frequencies: ["Weekly (20% off)", "Biweekly (15% off)", "Monthly (10% off)", "One-Time"],
    tag: "Most Popular",
    tagColor: "bg-[#0D9488]",
    iconName: "sparkles",
  },
  {
    id: "deep",
    slug: "deep-cleaning",
    title: "Deep Cleaning",
    description: "A thorough top-to-bottom clean that reaches every hidden corner. Perfect for first-time clients, seasonal refreshes, or when your home needs extra attention and care.",
    image: IMAGES.luxuryKitchen,
    checklist: ["Everything in Standard Cleaning", "Clean inside oven & microwave", "Clean inside refrigerator", "Scrub tile grout & baseboards", "Clean light fixtures & ceiling fans", "Wipe cabinet fronts inside & out", "Detail clean window sills & tracks"],
    frequencies: ["One-Time", "Quarterly", "As Needed"],
    tag: "Recommended",
    tagColor: "bg-[#C9A84C]",
    iconName: "shield",
  },
  {
    id: "moveinout",
    slug: "move-in-move-out-cleaning",
    title: "Move-In / Move-Out Cleaning",
    description: "Ensure your old place is spotless for the next tenant or your new home is fresh and ready. Our move cleaning helps you get your full security deposit back.",
    image: IMAGES.luxuryBedroom,
    checklist: ["Complete deep cleaning of all rooms", "Clean inside all cabinets & closets", "Clean inside all appliances", "Remove scuff marks from walls", "Clean garage (if applicable)", "Sanitize all surfaces", "Final walkthrough inspection"],
    frequencies: ["One-Time"],
    tag: "Moving?",
    tagColor: "bg-[#0C1829]",
    iconName: "home",
  },
  {
    id: "commercial",
    slug: "commercial-cleaning",
    title: "Commercial Cleaning",
    description: "Professional cleaning for offices, medical facilities, schools, churches, and retail spaces. We keep your business environment clean, safe, and welcoming.",
    image: IMAGES.commercialModern,
    checklist: ["Vacuum & mop all floor areas", "Sanitize desks, phones & keyboards", "Clean & restock restrooms", "Empty all trash & recycling", "Wipe glass doors & partitions", "Dust vents & light fixtures", "Break room / kitchen cleaning"],
    frequencies: ["Daily", "Twice Weekly", "Weekly", "Biweekly", "Monthly"],
    tag: "Business",
    tagColor: "bg-[#0D9488]",
    iconName: "building",
  },
  {
    id: "airbnb",
    slug: "airbnb-rental-turnover-cleaning",
    title: "Airbnb & Rental Turnover",
    description: "Fast, reliable turnover cleaning that ensures 5-star guest reviews. We handle everything between check-out and check-in so you don't have to.",
    image: IMAGES.luxuryBathroom,
    checklist: ["Full property cleaning & sanitizing", "Fresh linen & bed making", "Restock essentials & amenities", "Kitchen deep clean", "Bathroom sanitization", "Vacuum & mop all floors", "Final quality inspection"],
    frequencies: ["Per Turnover", "Regular Schedule"],
    tag: "Hosts",
    tagColor: "bg-[#C9A84C]",
    iconName: "star",
  },
];

function ServiceChecklist({ items }: { items: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, 4);
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {visible.map((item) => (
          <div key={item} className="flex items-start gap-2.5">
            <CheckCircle size={16} className="text-[#0D9488] mt-0.5 flex-shrink-0" />
            <span className="text-sm text-[#0C1829]/80">{item}</span>
          </div>
        ))}
      </div>
      {items.length > 4 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#0D9488] hover:text-[#0B8278] transition-colors"
        >
          {expanded ? <>Show Less <ChevronUp size={14} /></> : <>Show All {items.length} Items <ChevronDown size={14} /></>}
        </button>
      )}
    </div>
  );
}

export default function Services() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
{/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden min-h-[520px] flex items-center">
        <div className="absolute inset-0">
          <img src={IMAGES.luxuryKitchen} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0C1829] via-[#0C1829]/95 to-[#0C1829]/60" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 w-full">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#0D9488]/20 rounded-full mb-6">
              <Sparkles size={14} className="text-[#0D9488]" />
              <span className="text-xs font-semibold text-[#0D9488] tracking-wider uppercase">Professional Cleaning Services</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Premium Cleaning<br /><span className="text-[#0D9488]">Tailored to You</span>
            </h1>
            <p className="mt-6 text-lg text-white/60 leading-relaxed max-w-2xl">
              From regular home maintenance to deep commercial cleans, our vetted professionals deliver exceptional results across the entire Dallas-Fort Worth metroplex.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link href="/book" className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold text-white bg-[#0D9488] rounded-xl hover:bg-[#0B8278] transition-all shadow-lg shadow-[#0D9488]/25">
                Book Now <ArrowRight size={16} />
              </Link>
              <Link href="/quote" className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold text-white border-2 border-white/30 rounded-xl hover:bg-white/10 transition-all">
                Get Free Quote
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-white/40 text-sm">
              <div className="flex items-center gap-1.5">
                {[1,2,3,4,5].map(i => <Star key={i} size={14} className="fill-[#C9A84C] text-[#C9A84C]" />)}
                <span className="ml-1">5.0 Rating</span>
              </div>
              <span className="w-px h-4 bg-white/20" />
              <span>Licensed & Insured</span>
              <span className="w-px h-4 bg-white/20 hidden sm:block" />
              <span className="hidden sm:inline">Same-Day Available</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ BREADCRUMBS ═══ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Breadcrumbs items={[{ label: "Services" }]} />
      </div>

      {/* ═══ SERVICE QUICK NAV ═══ */}
      <section className="py-4 bg-white border-b border-gray-100 sticky top-20 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {allServices.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="flex-shrink-0 px-4 py-2 text-sm font-medium text-[#0C1829]/70 hover:text-[#0D9488] hover:bg-[#0D9488]/5 rounded-lg transition-all whitespace-nowrap">
                {s.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SERVICES DETAIL ═══ */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-32">
            {allServices.map((service, i) => (
              <div key={service.id} id={service.id} className="scroll-mt-40">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                  <SlideIn direction={i % 2 === 0 ? "left" : "right"} className={i % 2 === 1 ? "lg:order-2" : ""}>
                    <div className="relative group">
                      <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                        <img
                          src={service.image}
                          alt={`${service.title} service in Dallas-Fort Worth`}
                          className="w-full h-[350px] lg:h-[460px] object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0C1829]/40 to-transparent" />
                        <div className="absolute top-4 left-4">
                          <span className={`px-3 py-1.5 ${service.tagColor} text-white text-xs font-bold rounded-full uppercase tracking-wider`}>
                            {service.tag}
                          </span>
                        </div>
                      </div>
                      <div className="absolute -bottom-3 -right-3 w-24 h-24 bg-[#0D9488]/10 rounded-2xl -z-10" />
                      <div className="absolute -top-3 -left-3 w-16 h-16 bg-[#C9A84C]/10 rounded-2xl -z-10" />
                    </div>
                  </SlideIn>

                  <SlideIn direction={i % 2 === 0 ? "right" : "left"} delay={0.15} className={i % 2 === 1 ? "lg:order-1" : ""}>
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-[#0D9488]/10 flex items-center justify-center">
                          <AnimatedIcon name={service.iconName} size={20} color="#0D9488" />
                        </div>
                        <span className="text-xs font-bold text-[#0D9488] tracking-wider uppercase">{service.tag}</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0C1829] leading-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        {service.title}
                      </h2>
                      <p className="mt-4 text-gray-600 leading-relaxed text-lg">{service.description}</p>

                      <div className="mt-8">
                        <h4 className="text-xs font-bold text-[#0C1829] tracking-wider uppercase mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>What's Included</h4>
                        <ServiceChecklist items={service.checklist} />
                      </div>

                      <div className="mt-6">
                        <h4 className="text-xs font-bold text-[#0C1829] tracking-wider uppercase mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>Available Frequencies</h4>
                        <div className="flex flex-wrap gap-2">
                          {service.frequencies.map(freq => (
                            <span key={freq} className="text-xs font-medium bg-[#0D9488]/10 text-[#0D9488] px-3 py-1.5 rounded-full border border-[#0D9488]/15">
                              {freq}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-8 flex flex-col sm:flex-row gap-3">
                        <Link href="/book" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-[#0D9488] rounded-xl hover:bg-[#0B8278] transition-all shadow-lg shadow-[#0D9488]/25">
                          Book This Service <ArrowRight size={16} />
                        </Link>
                        <Link href="/quote" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-[#0D9488] border-2 border-[#0D9488] rounded-xl hover:bg-[#0D9488]/5 transition-all">
                          Get a Quote
                        </Link>
                        <Link href={`/services/${service.slug}`} className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-gray-500 hover:text-[#0D9488] transition-all">
                          Learn More →
                        </Link>
                      </div>
                    </div>
                  </SlideIn>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BEFORE / AFTER ═══ */}
      <section className="py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#C9A84C]/10 rounded-full mb-4">
                <Award size={14} className="text-[#C9A84C]" />
                <span className="text-xs font-semibold text-[#C9A84C] tracking-wider uppercase">Real Results</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#0C1829]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                See the <span className="text-[#0D9488]">Hygiene Maids Difference</span>
              </h2>
              <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
                Our professional team transforms spaces from cluttered to pristine. Here's what our clients experience after every cleaning.
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={0.15}>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl max-w-5xl mx-auto">
              <img src={IMAGES.beforeAfterKitchen} alt="Before and after professional kitchen cleaning by Hygiene Maids" className="w-full h-auto object-cover" />
            </div>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div className="text-center mt-10">
              <Link href="/quote" className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold text-white bg-[#0D9488] rounded-xl hover:bg-[#0B8278] transition-all shadow-lg shadow-[#0D9488]/25">
                Get Your Free Quote <ArrowRight size={16} />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══ TRUST BAR ═══ */}
      <section className="py-20 bg-[#0C1829]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Why DFW Families <span className="text-[#0D9488]">Trust Us</span>
              </h2>
            </div>
          </FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {[
              { icon: Shield, title: "Licensed & Insured", desc: "Every team member is background-checked, bonded, and fully insured for your peace of mind." },
              { icon: Star, title: "5-Star Rated", desc: "Consistently rated 5 stars by DFW families. We earn your trust with every clean." },
              { icon: Clock, title: "Same-Day Available", desc: "Need it today? We offer same-day and next-day availability across the metroplex." },
              { icon: Leaf, title: "Eco-Friendly", desc: "Professional-grade, non-toxic products safe for your family, pets, and the environment." },
            ].map((item, idx) => (
              <FadeIn key={item.title} delay={idx * 0.1}>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-[#0D9488]/15 flex items-center justify-center mb-5">
                    <item.icon size={28} className="text-[#0D9488]" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>{item.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING TEASER ═══ */}
      <section className="py-20 lg:py-24 bg-[#FAFAF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#0C1829]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Save More with <span className="text-[#0D9488]">Recurring Cleaning</span>
              </h2>
              <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
                The more you clean, the more you save. Lock in exclusive discounts with our recurring service plans.
              </p>
            </div>
          </FadeIn>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { freq: "Weekly", discount: "20%", desc: "Best value for busy families", highlight: true },
              { freq: "Biweekly", discount: "15%", desc: "Most popular choice", highlight: false },
              { freq: "Monthly", discount: "10%", desc: "Great for light maintenance", highlight: false },
            ].map((plan, idx) => (
              <FadeIn key={plan.freq} delay={idx * 0.1}>
                <div className={`relative p-8 rounded-2xl text-center transition-all ${
                  plan.highlight
                    ? "bg-[#0D9488] text-white shadow-xl shadow-[#0D9488]/20"
                    : "bg-white border border-gray-100 hover:border-[#0D9488]/30 hover:shadow-lg"
                }`}>
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#C9A84C] text-white text-xs font-bold rounded-full uppercase tracking-wider">
                      Best Value
                    </div>
                  )}
                  <div className={`text-4xl font-bold mb-1 ${plan.highlight ? "text-white" : "text-[#0D9488]"}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {plan.discount}
                  </div>
                  <div className={`text-sm font-semibold mb-2 ${plan.highlight ? "text-white/90" : "text-[#0C1829]"}`}>
                    OFF {plan.freq}
                  </div>
                  <p className={`text-sm ${plan.highlight ? "text-white/70" : "text-gray-500"}`}>{plan.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.3}>
            <p className="text-center text-sm text-gray-500 mt-8">
              Pricing varies based on home size and service type. Get your personalized quote today.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <CTASection
        title="Ready to Experience the Difference?"
        subtitle="Book your professional cleaning today or get a free personalized quote. 100% satisfaction guaranteed."
      />
</div>
  );
}
