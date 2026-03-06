"use client";
/*
 * Contact — Hygiene Maids Luxury Premium
 * Contact-friendly hero, contact info cards, contact form, FAQ, dual CTAs
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { BRAND, IMAGES, FAQ_ITEMS } from "@/lib/constants";
import {
  Phone, Mail, MapPin, Clock, ArrowRight, Sparkles,
  ChevronDown, ChevronUp, MessageCircle, Send,
} from "lucide-react";
import CTASection from "@/components/website/CTASection";
import Breadcrumbs from "@/components/website/Breadcrumbs";
import { toast } from "sonner";

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

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-base font-semibold text-[#0C1829] group-hover:text-[#0D9488] transition-colors pr-4">
          {question}
        </span>
        {open ? (
          <ChevronUp size={18} className="text-[#0D9488] flex-shrink-0" />
        ) : (
          <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
        )}
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <p className="pb-5 text-sm text-gray-600 leading-relaxed">{answer}</p>
      </motion.div>
    </div>
  );
}

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", service: "", message: "" });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Thank you! We'll get back to you within 1 hour during business hours.");
    setForm({ name: "", email: "", phone: "", service: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
{/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden min-h-[420px] flex items-center">
        <div className="absolute inset-0">
          <img src={IMAGES.contactFriendly} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0C1829] via-[#0C1829]/95 to-[#0C1829]/60" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-28 w-full">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#0D9488]/20 rounded-full mb-6">
              <MessageCircle size={14} className="text-[#0D9488]" />
              <span className="text-xs font-semibold text-[#0D9488] tracking-wider uppercase">Get In Touch</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              We'd Love to<br /><span className="text-[#0D9488]">Hear From You</span>
            </h1>
            <p className="mt-6 text-lg text-white/60 leading-relaxed max-w-2xl">
              Have a question, need a quote, or ready to book? Our friendly team is here to help. Reach out anytime — we typically respond within 1 hour.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══ BREADCRUMBS ═══ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Breadcrumbs items={[{ label: "Contact" }]} />
      </div>

      {/* ═══ CONTACT INFO CARDS ═══ */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 -mt-24 relative z-10">
            {[
              { icon: Phone, title: "Call Us", value: BRAND.phone, href: `tel:${BRAND.phoneRaw}`, sub: "Tap to call" },
              { icon: Mail, title: "Email Us", value: BRAND.email, href: `mailto:${BRAND.email}`, sub: "We reply within 1 hour" },
              { icon: Clock, title: "Business Hours", value: "Mon – Sat", href: "#", sub: "7:00 AM – 7:00 PM" },
              { icon: MapPin, title: "Service Area", value: "Dallas-Fort Worth", href: "/locations", sub: "28+ cities served" },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.1}>
                <a href={item.href} className="block bg-white rounded-2xl p-6 border border-gray-100 hover:border-[#0D9488]/30 hover:shadow-xl transition-all text-center group">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-[#0D9488]/10 flex items-center justify-center mb-4 group-hover:bg-[#0D9488]/20 transition-colors">
                    <item.icon size={24} className="text-[#0D9488]" />
                  </div>
                  <h3 className="text-xs font-bold text-[#0D9488] tracking-wider uppercase mb-1">{item.title}</h3>
                  <div className="text-lg font-bold text-[#0C1829]" style={{ fontFamily: "'DM Sans', sans-serif" }}>{item.value}</div>
                  <p className="text-xs text-gray-500 mt-1">{item.sub}</p>
                </a>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CONTACT FORM + SIDEBAR ═══ */}
      <section className="py-20 lg:py-24 bg-[#FAFAF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
            {/* Form */}
            <SlideIn direction="left" className="lg:col-span-3">
              <div className="bg-white rounded-2xl p-8 lg:p-10 border border-gray-100 shadow-sm">
                <h2 className="text-2xl font-bold text-[#0C1829] mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Send Us a Message
                </h2>
                <p className="text-sm text-gray-500 mb-8">
                  Fill out the form below and we'll get back to you promptly.
                </p>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-[#0C1829] mb-1.5 uppercase tracking-wider">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-4 py-3 bg-[#FAFAF8] border border-gray-200 rounded-xl text-sm text-[#0C1829] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#0C1829] mb-1.5 uppercase tracking-wider">Phone *</label>
                      <input
                        type="tel"
                        required
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-[#FAFAF8] border border-gray-200 rounded-xl text-sm text-[#0C1829] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all"
                        placeholder="(469) 555-0123"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0C1829] mb-1.5 uppercase tracking-wider">Email *</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-3 bg-[#FAFAF8] border border-gray-200 rounded-xl text-sm text-[#0C1829] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all"
                      placeholder="you@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0C1829] mb-1.5 uppercase tracking-wider">Service Interested In</label>
                    <select
                      value={form.service}
                      onChange={(e) => setForm({ ...form, service: e.target.value })}
                      className="w-full px-4 py-3 bg-[#FAFAF8] border border-gray-200 rounded-xl text-sm text-[#0C1829] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="standard">Standard House Cleaning</option>
                      <option value="deep">Deep Cleaning</option>
                      <option value="moveinout">Move-In / Move-Out</option>
                      <option value="commercial">Commercial Cleaning</option>
                      <option value="airbnb">Airbnb & Rental Turnover</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0C1829] mb-1.5 uppercase tracking-wider">Message</label>
                    <textarea
                      rows={4}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full px-4 py-3 bg-[#FAFAF8] border border-gray-200 rounded-xl text-sm text-[#0C1829] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all resize-none"
                      placeholder="Tell us about your cleaning needs..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold text-white bg-[#0D9488] rounded-xl hover:bg-[#0B8278] transition-all shadow-lg shadow-[#0D9488]/25"
                  >
                    <Send size={16} /> Send Message
                  </button>
                </form>
              </div>
            </SlideIn>

            {/* Sidebar */}
            <SlideIn direction="right" delay={0.15} className="lg:col-span-2">
              <div className="space-y-6">
                <div className="bg-[#0C1829] rounded-2xl p-8">
                  <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <Link href="/book" className="flex items-center justify-between w-full px-5 py-3.5 bg-[#0D9488] text-white rounded-xl hover:bg-[#0B8278] transition-all text-sm font-semibold">
                      Book Now <ArrowRight size={16} />
                    </Link>
                    <Link href="/quote" className="flex items-center justify-between w-full px-5 py-3.5 border-2 border-white/20 text-white rounded-xl hover:bg-white/5 transition-all text-sm font-semibold">
                      Get Free Quote <ArrowRight size={16} />
                    </Link>
                    <a href={`tel:${BRAND.phoneRaw}`} className="flex items-center justify-between w-full px-5 py-3.5 border-2 border-[#C9A84C]/30 text-[#C9A84C] rounded-xl hover:bg-[#C9A84C]/5 transition-all text-sm font-semibold">
                      <span className="flex items-center gap-2"><Phone size={16} /> Call Now</span>
                      <span className="text-xs text-white/50">{BRAND.phone}</span>
                    </a>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0D9488]/10 flex items-center justify-center">
                      <Clock size={20} className="text-[#0D9488]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#0C1829]">Fast Response</h4>
                      <p className="text-xs text-gray-500">We respond within 1 hour</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    During business hours (Mon–Sat, 7AM–7PM), we typically respond to all inquiries within 1 hour. For urgent needs, please call us directly.
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center">
                      <Sparkles size={20} className="text-[#C9A84C]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#0C1829]">100% Satisfaction</h4>
                      <p className="text-xs text-gray-500">Guaranteed or re-clean free</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Not happy with your cleaning? We'll come back and re-clean at no additional cost within 24 hours. Your satisfaction is our top priority.
                  </p>
                </div>
              </div>
            </SlideIn>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="py-20 lg:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#0C1829]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Frequently Asked <span className="text-[#0D9488]">Questions</span>
              </h2>
              <p className="mt-4 text-gray-600">
                Quick answers to common questions about our cleaning services.
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="bg-[#FAFAF8] rounded-2xl p-6 lg:p-8 border border-gray-100">
              {FAQ_ITEMS.map((faq) => (
                <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <CTASection
        title="Ready for a Spotless Home?"
        subtitle="Book your professional cleaning today or get a free personalized quote."
      />
</div>
  );
}
