"use client";
/*
 * About — Hygiene Maids Luxury Premium
 * Full-bleed hero, story with unique images, animated values, team section,
 * stat counters, trust badges, dual CTAs
 */
import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useScrollAnimation, useCountUp } from "@/hooks/useScrollAnimation";
import { BRAND, IMAGES } from "@/lib/constants";
import {
  Shield, Heart, Users, Award, CheckCircle, ArrowRight,
  Phone, Sparkles, Star, Leaf, Clock,
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

export default function About() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
{/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden min-h-[480px] flex items-center">
        <div className="absolute inset-0">
          <img src={IMAGES.teamCulture} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0C1829] via-[#0C1829]/95 to-[#0C1829]/60" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 w-full">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#C9A84C]/20 rounded-full mb-6">
              <Heart size={14} className="text-[#C9A84C]" />
              <span className="text-xs font-semibold text-[#C9A84C] tracking-wider uppercase">About Hygiene Maids</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              More Than Cleaning —<br /><span className="text-[#0D9488]">We Care</span>
            </h1>
            <p className="mt-6 text-lg text-white/60 leading-relaxed max-w-2xl">
              Hygiene Maids was founded with a simple mission: to give families and businesses across Dallas-Fort Worth the gift of a clean, healthy space — without the stress.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══ BREADCRUMBS ═══ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Breadcrumbs items={[{ label: "About Us" }]} />
      </div>

      {/* ═══ OUR STORY ═══ */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <SlideIn direction="left">
              <div className="relative">
                <div className="rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src={IMAGES.clientElderly}
                    alt="Hygiene Maids team member caring for client"
                    className="w-full h-[420px] lg:h-[500px] object-cover"
                  />
                </div>
                {/* Decorative accents */}
                <div className="absolute -bottom-4 -right-4 w-28 h-28 bg-[#0D9488]/10 rounded-2xl -z-10" />
                <div className="absolute -top-4 -left-4 w-20 h-20 bg-[#C9A84C]/10 rounded-2xl -z-10" />
                {/* Floating stat card */}
                <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#0D9488]/10 flex items-center justify-center">
                      <Star size={20} className="text-[#C9A84C] fill-[#C9A84C]" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-[#0C1829]" style={{ fontFamily: "'DM Sans', sans-serif" }}>5.0 Rating</div>
                      <div className="text-xs text-gray-500">150+ Reviews</div>
                    </div>
                  </div>
                </div>
              </div>
            </SlideIn>

            <SlideIn direction="right" delay={0.15}>
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#0D9488]/10 rounded-full mb-4">
                  <Sparkles size={14} className="text-[#0D9488]" />
                  <span className="text-xs font-semibold text-[#0D9488] tracking-wider uppercase">Our Story</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-[#0C1829] leading-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Built on Trust,<br /><span className="text-[#0D9488]">Driven by Excellence</span>
                </h2>
                <p className="mt-6 text-gray-600 leading-relaxed text-lg">
                  Hygiene Maids started with a vision to raise the bar for cleaning services in the Dallas-Fort Worth area. We saw too many families struggling with unreliable cleaners, inconsistent quality, and poor communication.
                </p>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  We built Hygiene Maids to be different. Every team member is carefully vetted, thoroughly trained, and committed to delivering the kind of clean that makes you say "wow" when you walk through the door.
                </p>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  Today, we proudly serve hundreds of homes and businesses across the DFW metroplex with a perfect 5-star rating and a 100% satisfaction guarantee. Our clients aren't just customers — they're family.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Link href="/book" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-[#0D9488] rounded-xl hover:bg-[#0B8278] transition-all shadow-lg shadow-[#0D9488]/25">
                    Book Your Cleaning <ArrowRight size={16} />
                  </Link>
                  <Link href="/quote" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-[#0D9488] border-2 border-[#0D9488] rounded-xl hover:bg-[#0D9488]/5 transition-all">
                    Get Free Quote
                  </Link>
                </div>
              </div>
            </SlideIn>
          </div>
        </div>
      </section>

      {/* ═══ STATS BAR ═══ */}
      <section className="py-16 bg-[#0C1829]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <StatCounter end={500} suffix="+" label="Happy Clients" />
            <StatCounter end={25} suffix="+" label="Cities Served" />
            <StatCounter end={5} suffix=".0" label="Google Rating" />
            <StatCounter end={100} suffix="%" label="Satisfaction" />
          </div>
        </div>
      </section>

      {/* ═══ VALUES ═══ */}
      <section className="py-20 lg:py-28 bg-[#FAFAF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#C9A84C]/10 rounded-full mb-4">
                <Award size={14} className="text-[#C9A84C]" />
                <span className="text-xs font-semibold text-[#C9A84C] tracking-wider uppercase">Our Values</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#0C1829]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                What Sets Us <span className="text-[#0D9488]">Apart</span>
              </h2>
              <p className="mt-4 text-gray-600">
                These core values guide every cleaning, every interaction, and every decision we make.
              </p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Shield, title: "Trust & Safety", desc: "Every team member is background-checked, bonded, and insured. Your home is in safe hands.", color: "bg-[#0D9488]/10 text-[#0D9488]" },
              { icon: Award, title: "Quality Guarantee", desc: "Not satisfied? We'll re-clean at no cost within 24 hours. We stand behind every job.", color: "bg-[#C9A84C]/10 text-[#C9A84C]" },
              { icon: Heart, title: "Genuine Care", desc: "We treat every home like our own. Our team takes pride in the details that matter most.", color: "bg-[#0D9488]/10 text-[#0D9488]" },
              { icon: Users, title: "Professional Team", desc: "Trained, experienced, and friendly staff who communicate clearly and work efficiently.", color: "bg-[#C9A84C]/10 text-[#C9A84C]" },
            ].map((value, i) => (
              <FadeIn key={value.title} delay={i * 0.1}>
                <div className="bg-white rounded-2xl p-8 border border-gray-100 hover:border-[#0D9488]/20 hover:shadow-xl transition-all h-full">
                  <div className={`w-14 h-14 rounded-2xl ${value.color} flex items-center justify-center mb-5`}>
                    <value.icon size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-[#0C1829] mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>{value.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{value.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ MEET THE TEAM ═══ */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <SlideIn direction="right" delay={0.15} className="lg:order-2">
              <div className="relative">
                <div className="rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src={IMAGES.realTeam}
                    alt="Hygiene Maids professional cleaning team"
                    className="w-full h-[420px] lg:h-[500px] object-cover"
                  />
                </div>
                <div className="absolute -top-3 -left-3 w-24 h-24 bg-[#0D9488]/10 rounded-2xl -z-10" />
                <div className="absolute -bottom-3 -right-3 w-20 h-20 bg-[#C9A84C]/10 rounded-2xl -z-10" />
              </div>
            </SlideIn>

            <SlideIn direction="left" className="lg:order-1">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#0D9488]/10 rounded-full mb-4">
                  <Users size={14} className="text-[#0D9488]" />
                  <span className="text-xs font-semibold text-[#0D9488] tracking-wider uppercase">Our Team</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-[#0C1829] leading-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Meet the People Who<br /><span className="text-[#0D9488]">Make It Shine</span>
                </h2>
                <p className="mt-6 text-gray-600 leading-relaxed text-lg">
                  Our cleaning professionals are the heart of Hygiene Maids. Each team member undergoes rigorous training, background checks, and ongoing quality assessments to ensure they deliver the exceptional service our clients expect.
                </p>
                <ul className="mt-8 space-y-3">
                  {[
                    "Thoroughly vetted & background checked",
                    "Professionally trained in cleaning techniques",
                    "Fully bonded and insured",
                    "Friendly, English-speaking staff",
                    "Equipped with professional-grade supplies",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-[#0C1829]">
                      <CheckCircle size={16} className="text-[#0D9488] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link href="/book" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-[#0D9488] rounded-xl hover:bg-[#0B8278] transition-all shadow-lg shadow-[#0D9488]/25">
                    Join Our Happy Clients <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </SlideIn>
          </div>
        </div>
      </section>

      {/* ═══ ECO COMMITMENT ═══ */}
      <section className="py-20 lg:py-24 bg-[#FAFAF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <SlideIn direction="left">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={IMAGES.ecoProducts}
                  alt="Eco-friendly cleaning products used by Hygiene Maids"
                  className="w-full h-[380px] lg:h-[440px] object-cover"
                />
              </div>
            </SlideIn>
            <SlideIn direction="right" delay={0.15}>
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#0D9488]/10 rounded-full mb-4">
                  <Leaf size={14} className="text-[#0D9488]" />
                  <span className="text-xs font-semibold text-[#0D9488] tracking-wider uppercase">Eco-Friendly</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-[#0C1829] leading-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Clean Home,<br /><span className="text-[#0D9488]">Clean Conscience</span>
                </h2>
                <p className="mt-6 text-gray-600 leading-relaxed text-lg">
                  We believe a clean home shouldn't come at the expense of your family's health or the environment. That's why we use professional-grade, eco-friendly cleaning products that are safe for children, pets, and the planet.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  {[
                    "Non-toxic formulas",
                    "Pet & child safe",
                    "Biodegradable products",
                    "Low-VOC solutions",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-[#0C1829]">
                      <CheckCircle size={14} className="text-[#0D9488] flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </SlideIn>
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <CTASection
        title="Experience the Hygiene Maids Difference"
        subtitle="Book your first cleaning today and see why hundreds of DFW families trust us with their homes."
      />
</div>
  );
}
