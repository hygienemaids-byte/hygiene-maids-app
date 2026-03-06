"use client";
/*
 * Careers — Hygiene Maids
 * Join Our Team page with polished application form for cleaners
 */
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { BRAND, IMAGES } from "@/lib/constants";
import {
  Users, Heart, DollarSign, Clock, Shield, Star,
  MapPin, CheckCircle, ArrowRight, Sparkles, Phone,
  Calendar, Car, Award, Briefcase, ChevronDown,
  Upload, User, Mail, FileText,
} from "lucide-react";
import Breadcrumbs from "@/components/website/Breadcrumbs";
import CTASection from "@/components/website/CTASection";
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

const BENEFITS = [
  { icon: DollarSign, title: "Competitive Pay", desc: "Earn $15–$25/hour with tips. Weekly direct deposit. Top earners make $1,000+/week." },
  { icon: Clock, title: "Flexible Schedule", desc: "Choose your own hours. Work mornings, afternoons, or weekends — whatever fits your life." },
  { icon: Car, title: "Paid Mileage", desc: "We reimburse mileage between jobs. Your commute costs are covered." },
  { icon: Shield, title: "Full Insurance", desc: "Workers' comp, liability insurance, and bonding — all provided at no cost to you." },
  { icon: Award, title: "Growth Opportunities", desc: "Advance from cleaner to team lead to area manager. We promote from within." },
  { icon: Heart, title: "Supportive Team", desc: "Join a team that values respect, communication, and work-life balance." },
  { icon: Calendar, title: "Paid Time Off", desc: "Earn PTO after 90 days. We believe in rest and recovery." },
  { icon: Sparkles, title: "Equipment Provided", desc: "All cleaning supplies and professional equipment provided. Just bring your great attitude." },
];

const REQUIREMENTS = [
  "Must be 18 years or older",
  "Valid driver's license and reliable transportation",
  "Able to pass a background check",
  "Physically able to perform cleaning tasks (lifting up to 25 lbs)",
  "Excellent attention to detail",
  "Reliable and punctual",
  "Professional demeanor and positive attitude",
  "Legal authorization to work in the United States",
];

const OPEN_POSITIONS = [
  {
    title: "Residential House Cleaner",
    type: "Full-Time / Part-Time",
    pay: "$15–$22/hr + tips",
    desc: "Clean residential homes across the DFW metroplex. No experience required — we provide full training.",
  },
  {
    title: "Deep Cleaning Specialist",
    type: "Full-Time",
    pay: "$18–$25/hr + tips",
    desc: "Perform thorough deep cleaning services. 1+ year cleaning experience preferred.",
  },
  {
    title: "Team Lead",
    type: "Full-Time",
    pay: "$20–$28/hr + bonuses",
    desc: "Lead a team of 2-3 cleaners. 2+ years cleaning experience and leadership skills required.",
  },
];

const FAQ_ITEMS = [
  { q: "Do I need prior cleaning experience?", a: "No! We provide comprehensive paid training for all new team members. We look for people with a great attitude, attention to detail, and reliability." },
  { q: "What does the interview process look like?", a: "After you submit your application, we'll review it within 48 hours. If selected, you'll have a brief phone interview followed by an in-person meeting. The entire process typically takes less than a week." },
  { q: "Do I need my own car?", a: "Yes, reliable transportation is required as you'll travel between client homes. We reimburse mileage between jobs." },
  { q: "What are the working hours?", a: "Most cleaning shifts are between 8 AM and 5 PM, Monday through Saturday. You can choose the days and hours that work best for you." },
  { q: "How soon can I start?", a: "After completing the hiring process and training (usually 3-5 days), you can start taking jobs immediately." },
  { q: "Do you provide cleaning supplies?", a: "Yes! All professional cleaning supplies, equipment, and uniforms are provided at no cost to you." },
];

export default function Careers() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Form state
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", city: "",
    position: "residential", experience: "none", availability: "full-time",
    startDate: "immediately", hasCar: "yes", hasLicense: "yes",
    about: "", referral: "",
  });

  const updateForm = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success("Application submitted! We'll be in touch within 48 hours.");
  };

  const goToStep = (s: number) => {
    setStep(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const canAdvance = () => {
    if (step === 1) return form.firstName && form.lastName && form.email && form.phone;
    if (step === 2) return form.position && form.city;
    return true;
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
{/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden bg-[#0C1829]">
        <div className="absolute inset-0 opacity-15">
          <img src={IMAGES.teamCulture} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0C1829] via-[#0C1829]/95 to-[#0C1829]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#0D9488]/20 rounded-full mb-6">
                <Users size={14} className="text-[#0D9488]" />
                <span className="text-xs font-semibold text-[#0D9488] tracking-wider uppercase">Now Hiring</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Join the <span className="text-[#0D9488]">Hygiene Maids</span> Team
              </h1>
              <p className="mt-6 text-lg text-white/60 leading-relaxed max-w-2xl">
                Build a rewarding career in professional cleaning. Competitive pay, flexible hours, and a team that genuinely cares about your success.
              </p>
              <div className="flex flex-wrap gap-4 mt-8">
                <a href="#apply" className="inline-flex items-center gap-2 px-8 py-4 text-sm font-bold text-white bg-[#0D9488] rounded-xl hover:bg-[#0B8278] transition-all shadow-lg shadow-[#0D9488]/25">
                  Apply Now <ArrowRight size={16} />
                </a>
                <a href="#positions" className="inline-flex items-center gap-2 px-8 py-4 text-sm font-bold text-white border border-white/20 rounded-xl hover:bg-white/5 transition-all">
                  View Open Positions
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-6 mt-8 text-sm text-white/40">
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-[#C9A84C]" />
                  <span>$15–$25/hr + tips</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-[#0D9488]" />
                  <span>Flexible Hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-[#0D9488]" />
                  <span>28+ DFW Cities</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Breadcrumbs items={[{ label: "Careers" }]} />
      </div>

      {/* ═══ WHY JOIN US ═══ */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#0C1829]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Why Cleaners <span className="text-[#0D9488]">Love Working</span> With Us
              </h2>
              <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
                We're not just another cleaning company. We invest in our team because great people deliver great results.
              </p>
            </div>
          </FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {BENEFITS.map((benefit, i) => (
              <FadeIn key={benefit.title} delay={i * 0.05}>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-[#0D9488]/20 hover:shadow-lg transition-all h-full">
                  <div className="w-12 h-12 rounded-xl bg-[#0D9488]/10 flex items-center justify-center mb-4">
                    <benefit.icon size={22} className="text-[#0D9488]" />
                  </div>
                  <h3 className="text-base font-bold text-[#0C1829] mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{benefit.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ OPEN POSITIONS ═══ */}
      <section id="positions" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#0C1829]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Open <span className="text-[#0D9488]">Positions</span>
              </h2>
              <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
                We're actively hiring across the DFW metroplex. Find the role that fits you.
              </p>
            </div>
          </FadeIn>
          <div className="space-y-4">
            {OPEN_POSITIONS.map((pos, i) => (
              <FadeIn key={pos.title} delay={i * 0.1}>
                <div className="bg-[#FAFAF8] rounded-2xl p-6 lg:p-8 border border-gray-100 hover:border-[#0D9488]/20 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-[#0C1829]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                          {pos.title}
                        </h3>
                        <span className="px-3 py-1 text-xs font-semibold text-[#0D9488] bg-[#0D9488]/10 rounded-full">
                          {pos.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{pos.desc}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign size={14} className="text-[#C9A84C]" />
                        <span className="font-semibold text-[#0C1829]">{pos.pay}</span>
                      </div>
                    </div>
                    <a
                      href="#apply"
                      className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-[#0D9488] rounded-xl hover:bg-[#0B8278] transition-all shadow-lg shadow-[#0D9488]/25 whitespace-nowrap"
                    >
                      Apply Now <ArrowRight size={14} />
                    </a>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ REQUIREMENTS ═══ */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeIn>
              <div>
                <h2 className="text-3xl font-bold text-[#0C1829] mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  What We're <span className="text-[#0D9488]">Looking For</span>
                </h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  We welcome applicants of all experience levels. What matters most is your attitude, reliability, and willingness to learn. Here are the basic requirements:
                </p>
                <div className="space-y-3">
                  {REQUIREMENTS.map((req) => (
                    <div key={req} className="flex items-start gap-3">
                      <CheckCircle size={18} className="text-[#0D9488] flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-[#0C1829]">{req}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={0.15}>
              <div className="bg-[#0C1829] rounded-2xl p-8 lg:p-10">
                <h3 className="text-xl font-bold text-white mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  What You'll Get
                </h3>
                <div className="space-y-4">
                  {[
                    { label: "Paid Training", desc: "Comprehensive training program — earn while you learn" },
                    { label: "Weekly Pay", desc: "Direct deposit every Friday, no waiting" },
                    { label: "Bonus Program", desc: "Earn bonuses for 5-star reviews and referrals" },
                    { label: "Career Path", desc: "Clear advancement from cleaner to team lead to manager" },
                    { label: "Uniforms Provided", desc: "Professional branded uniforms at no cost" },
                    { label: "Supportive Culture", desc: "A team that respects and supports each other" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <Star size={16} className="text-[#C9A84C] flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-sm font-semibold text-white">{item.label}</span>
                        <p className="text-xs text-white/50 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ═══ APPLICATION FORM ═══ */}
      <section id="apply" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#0C1829]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Apply <span className="text-[#0D9488]">Today</span>
              </h2>
              <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
                Complete the application below and we'll be in touch within 48 hours. The process is quick and straightforward.
              </p>
            </div>
          </FadeIn>

          {submitted ? (
            <FadeIn>
              <div className="bg-[#FAFAF8] rounded-2xl p-12 text-center border border-gray-100">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-[#0D9488]/10 flex items-center justify-center mb-6">
                  <CheckCircle size={40} className="text-[#0D9488]" />
                </div>
                <h3 className="text-2xl font-bold text-[#0C1829] mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Application Submitted!
                </h3>
                <p className="text-gray-600 mb-2 max-w-md mx-auto">
                  Thank you for your interest in joining Hygiene Maids, {form.firstName}!
                </p>
                <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
                  Our hiring team will review your application and contact you within 48 hours. Check your email and phone for updates.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-[#0D9488] border border-[#0D9488]/20 rounded-xl hover:bg-[#0D9488]/5 transition-all">
                    Back to Home
                  </Link>
                  <button
                    onClick={() => { setSubmitted(false); goToStep(1); setForm({ firstName: "", lastName: "", email: "", phone: "", city: "", position: "residential", experience: "none", availability: "full-time", startDate: "immediately", hasCar: "yes", hasLicense: "yes", about: "", referral: "" }); }}
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-[#0D9488] rounded-xl hover:bg-[#0B8278] transition-all"
                  >
                    Submit Another Application
                  </button>
                </div>
              </div>
            </FadeIn>
          ) : (
            <FadeIn>
              <div className="bg-[#FAFAF8] rounded-2xl border border-gray-100 overflow-hidden">
                {/* Progress Bar */}
                <div className="px-8 pt-8">
                  <div className="flex items-center justify-between mb-2">
                    {[
                      { num: 1, label: "Personal Info" },
                      { num: 2, label: "Position & Details" },
                      { num: 3, label: "About You" },
                    ].map((s) => (
                      <div key={s.num} className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          step >= s.num ? "bg-[#0D9488] text-white" : "bg-gray-200 text-gray-500"
                        }`}>
                          {step > s.num ? <CheckCircle size={16} /> : s.num}
                        </div>
                        <span className={`text-xs font-semibold hidden sm:inline ${step >= s.num ? "text-[#0D9488]" : "text-gray-400"}`}>
                          {s.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-4">
                    <div
                      className="bg-[#0D9488] h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${(step / 3) * 100}%` }}
                    />
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-5"
                      >
                        <h3 className="text-lg font-bold text-[#0C1829] mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                          Personal Information
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">Tell us a bit about yourself.</p>

                        <div className="grid sm:grid-cols-2 gap-5">
                          <div>
                            <label className="flex items-center gap-2 text-xs font-semibold text-[#0C1829] mb-1.5 uppercase tracking-wider">
                              <User size={12} className="text-[#0D9488]" /> First Name *
                            </label>
                            <input
                              type="text" required value={form.firstName}
                              onChange={(e) => updateForm("firstName", e.target.value)}
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-[#0C1829] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all"
                              placeholder="Jane"
                            />
                          </div>
                          <div>
                            <label className="flex items-center gap-2 text-xs font-semibold text-[#0C1829] mb-1.5 uppercase tracking-wider">
                              <User size={12} className="text-[#0D9488]" /> Last Name *
                            </label>
                            <input
                              type="text" required value={form.lastName}
                              onChange={(e) => updateForm("lastName", e.target.value)}
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-[#0C1829] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all"
                              placeholder="Smith"
                            />
                          </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-5">
                          <div>
                            <label className="flex items-center gap-2 text-xs font-semibold text-[#0C1829] mb-1.5 uppercase tracking-wider">
                              <Mail size={12} className="text-[#0D9488]" /> Email Address *
                            </label>
                            <input
                              type="email" required value={form.email}
                              onChange={(e) => updateForm("email", e.target.value)}
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-[#0C1829] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all"
                              placeholder="jane@email.com"
                            />
                          </div>
                          <div>
                            <label className="flex items-center gap-2 text-xs font-semibold text-[#0C1829] mb-1.5 uppercase tracking-wider">
                              <Phone size={12} className="text-[#0D9488]" /> Phone Number *
                            </label>
                            <input
                              type="tel" required value={form.phone}
                              onChange={(e) => updateForm("phone", e.target.value)}
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-[#0C1829] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all"
                              placeholder="(469) 000-0000"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-5"
                      >
                        <h3 className="text-lg font-bold text-[#0C1829] mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                          Position & Availability
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">Tell us what role interests you and when you can start.</p>

                        <div>
                          <label className="flex items-center gap-2 text-xs font-semibold text-[#0C1829] mb-1.5 uppercase tracking-wider">
                            <Briefcase size={12} className="text-[#0D9488]" /> Position *
                          </label>
                          <select
                            value={form.position}
                            onChange={(e) => updateForm("position", e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-[#0C1829] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all"
                          >
                            <option value="residential">Residential House Cleaner</option>
                            <option value="deep-clean">Deep Cleaning Specialist</option>
                            <option value="team-lead">Team Lead</option>
                          </select>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-5">
                          <div>
                            <label className="flex items-center gap-2 text-xs font-semibold text-[#0C1829] mb-1.5 uppercase tracking-wider">
                              <MapPin size={12} className="text-[#0D9488]" /> City / Area *
                            </label>
                            <input
                              type="text" required value={form.city}
                              onChange={(e) => updateForm("city", e.target.value)}
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-[#0C1829] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all"
                              placeholder="e.g., Dallas, Plano, Frisco"
                            />
                          </div>
                          <div>
                            <label className="flex items-center gap-2 text-xs font-semibold text-[#0C1829] mb-1.5 uppercase tracking-wider">
                              <Star size={12} className="text-[#0D9488]" /> Experience
                            </label>
                            <select
                              value={form.experience}
                              onChange={(e) => updateForm("experience", e.target.value)}
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-[#0C1829] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all"
                            >
                              <option value="none">No prior experience</option>
                              <option value="less-1">Less than 1 year</option>
                              <option value="1-3">1–3 years</option>
                              <option value="3-plus">3+ years</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-5">
                          <div>
                            <label className="flex items-center gap-2 text-xs font-semibold text-[#0C1829] mb-1.5 uppercase tracking-wider">
                              <Clock size={12} className="text-[#0D9488]" /> Availability
                            </label>
                            <select
                              value={form.availability}
                              onChange={(e) => updateForm("availability", e.target.value)}
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-[#0C1829] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all"
                            >
                              <option value="full-time">Full-Time (5+ days/week)</option>
                              <option value="part-time">Part-Time (2-4 days/week)</option>
                              <option value="weekends">Weekends Only</option>
                              <option value="flexible">Flexible</option>
                            </select>
                          </div>
                          <div>
                            <label className="flex items-center gap-2 text-xs font-semibold text-[#0C1829] mb-1.5 uppercase tracking-wider">
                              <Calendar size={12} className="text-[#0D9488]" /> Start Date
                            </label>
                            <select
                              value={form.startDate}
                              onChange={(e) => updateForm("startDate", e.target.value)}
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-[#0C1829] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all"
                            >
                              <option value="immediately">Immediately</option>
                              <option value="1-week">Within 1 week</option>
                              <option value="2-weeks">Within 2 weeks</option>
                              <option value="1-month">Within 1 month</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-5">
                          <div>
                            <label className="flex items-center gap-2 text-xs font-semibold text-[#0C1829] mb-1.5 uppercase tracking-wider">
                              <Car size={12} className="text-[#0D9488]" /> Reliable Transportation?
                            </label>
                            <select
                              value={form.hasCar}
                              onChange={(e) => updateForm("hasCar", e.target.value)}
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-[#0C1829] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all"
                            >
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                            </select>
                          </div>
                          <div>
                            <label className="flex items-center gap-2 text-xs font-semibold text-[#0C1829] mb-1.5 uppercase tracking-wider">
                              <FileText size={12} className="text-[#0D9488]" /> Valid Driver's License?
                            </label>
                            <select
                              value={form.hasLicense}
                              onChange={(e) => updateForm("hasLicense", e.target.value)}
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-[#0C1829] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all"
                            >
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                            </select>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-5"
                      >
                        <h3 className="text-lg font-bold text-[#0C1829] mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                          Tell Us About Yourself
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">Almost done! Share a bit about why you'd be a great fit.</p>

                        <div>
                          <label className="flex items-center gap-2 text-xs font-semibold text-[#0C1829] mb-1.5 uppercase tracking-wider">
                            <Heart size={12} className="text-[#0D9488]" /> Why do you want to join Hygiene Maids?
                          </label>
                          <textarea
                            rows={4}
                            value={form.about}
                            onChange={(e) => updateForm("about", e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-[#0C1829] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all resize-none"
                            placeholder="Tell us about yourself, your work ethic, and what makes you a great cleaner..."
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-2 text-xs font-semibold text-[#0C1829] mb-1.5 uppercase tracking-wider">
                            <Users size={12} className="text-[#0D9488]" /> How did you hear about us?
                          </label>
                          <select
                            value={form.referral}
                            onChange={(e) => updateForm("referral", e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-[#0C1829] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all"
                          >
                            <option value="">Select one</option>
                            <option value="google">Google Search</option>
                            <option value="indeed">Indeed</option>
                            <option value="facebook">Facebook</option>
                            <option value="friend">Friend or Family</option>
                            <option value="current-employee">Current Employee</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        {/* Summary */}
                        <div className="bg-white rounded-xl p-5 border border-gray-100">
                          <h4 className="text-sm font-bold text-[#0C1829] mb-3">Application Summary</h4>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div><span className="text-gray-500">Name:</span> <span className="font-medium text-[#0C1829]">{form.firstName} {form.lastName}</span></div>
                            <div><span className="text-gray-500">Email:</span> <span className="font-medium text-[#0C1829]">{form.email}</span></div>
                            <div><span className="text-gray-500">Phone:</span> <span className="font-medium text-[#0C1829]">{form.phone}</span></div>
                            <div><span className="text-gray-500">City:</span> <span className="font-medium text-[#0C1829]">{form.city}</span></div>
                            <div><span className="text-gray-500">Position:</span> <span className="font-medium text-[#0C1829]">{form.position === "residential" ? "House Cleaner" : form.position === "deep-clean" ? "Deep Clean Specialist" : "Team Lead"}</span></div>
                            <div><span className="text-gray-500">Availability:</span> <span className="font-medium text-[#0C1829]">{form.availability}</span></div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                    {step > 1 ? (
                      <button
                        type="button"
                        onClick={() => goToStep(step - 1)}
                        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-gray-600 hover:text-[#0C1829] transition-colors"
                      >
                        ← Back
                      </button>
                    ) : (
                      <div />
                    )}
                    {step < 3 ? (
                      <button
                        type="button"
                        onClick={() => canAdvance() && goToStep(step + 1)}
                        disabled={!canAdvance()}
                        className="inline-flex items-center gap-2 px-8 py-3 text-sm font-bold text-white bg-[#0D9488] rounded-xl hover:bg-[#0B8278] transition-all shadow-lg shadow-[#0D9488]/25 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Continue <ArrowRight size={14} />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 px-8 py-3 text-sm font-bold text-white bg-[#0D9488] rounded-xl hover:bg-[#0B8278] transition-all shadow-lg shadow-[#0D9488]/25"
                      >
                        Submit Application <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </FadeIn>
          )}
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#0C1829]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Applicant <span className="text-[#0D9488]">FAQ</span>
              </h2>
              <p className="mt-4 text-gray-600">Common questions from prospective team members.</p>
            </div>
          </FadeIn>
          <div className="space-y-3">
            {FAQ_ITEMS.map((faq, i) => (
              <FadeIn key={i} delay={i * 0.05}>
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left"
                  >
                    <span className="font-semibold text-[#0C1829] text-sm pr-4">{faq.q}</span>
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
                        <div className="px-6 pb-4 text-sm text-gray-600 leading-relaxed">{faq.a}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <CTASection
        title="Ready to Start Your Cleaning Career?"
        subtitle="Join 50+ professional cleaners across Dallas-Fort Worth. Apply today and start earning within a week."
      />
</div>
  );
}
