"use client";
/*
 * FAQ — Hygiene Maids Luxury Premium
 * Dedicated FAQ page with categories, accordion, and SEO schema
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { BRAND } from "@/lib/constants";
import { ChevronDown, Search, HelpCircle, Sparkles } from "lucide-react";
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

const FAQ_CATEGORIES = [
  {
    name: "General",
    icon: "help",
    faqs: [
      {
        question: "What cleaning services does Hygiene Maids offer in Dallas-Fort Worth?",
        answer: "Hygiene Maids offers comprehensive cleaning services across the DFW metroplex including standard house cleaning, deep cleaning, move-in/move-out cleaning, commercial and office cleaning, and Airbnb/rental turnover cleaning. All services are customizable to your specific needs.",
      },
      {
        question: "How do I book a cleaning or get a free quote?",
        answer: "You can book instantly through our website by clicking 'Book Now', or request a free personalized quote by clicking 'Get a Free Quote'. You can also call us directly at (469) 935-7031. We offer same-day availability for most services.",
      },
      {
        question: "What areas in DFW do you serve?",
        answer: "We serve 28+ cities across the Dallas-Fort Worth metroplex including Dallas, Fort Worth, Plano, Frisco, McKinney, Arlington, Irving, Garland, Richardson, Carrollton, Denton, Lewisville, Allen, Flower Mound, Southlake, Grapevine, Coppell, Prosper, Celina, and many more.",
      },
    ],
  },
  {
    name: "Safety & Trust",
    icon: "shield",
    faqs: [
      {
        question: "Are your cleaners background-checked and insured?",
        answer: "Absolutely. Every Hygiene Maids team member undergoes a thorough background check, is fully bonded and insured, and receives extensive training in our cleaning protocols. Your safety and peace of mind are our top priorities.",
      },
      {
        question: "What is your satisfaction guarantee?",
        answer: "We stand behind our work with a 100% Satisfaction Guarantee. If you're not completely happy with any aspect of our cleaning, contact us within 24 hours and we'll re-clean the area at no additional cost.",
      },
      {
        question: "Do you carry liability insurance?",
        answer: "Yes, Hygiene Maids carries comprehensive general liability insurance and workers' compensation coverage. This protects you, your property, and our team members during every cleaning visit.",
      },
    ],
  },
  {
    name: "Services & Pricing",
    icon: "sparkles",
    faqs: [
      {
        question: "How much does house cleaning cost in Dallas-Fort Worth?",
        answer: "Pricing depends on your home size, service type, and frequency. Standard cleaning starts at competitive rates with significant discounts for recurring services: 20% off weekly, 15% off biweekly, and 10% off monthly. Get a free instant quote on our website.",
      },
      {
        question: "What's the difference between standard and deep cleaning?",
        answer: "Standard cleaning covers regular maintenance tasks like dusting, vacuuming, mopping, and bathroom sanitization. Deep cleaning goes further — inside appliances, baseboard scrubbing, grout cleaning, light fixture detailing, and more. We recommend a deep clean first, then maintain with standard cleanings.",
      },
      {
        question: "Do I need to provide cleaning supplies or equipment?",
        answer: "No! Our team arrives fully equipped with professional-grade, eco-friendly cleaning supplies and equipment. If you have specific products you prefer, we're happy to use those instead.",
      },
      {
        question: "Do you offer move-in/move-out cleaning?",
        answer: "Yes! Our move-in/move-out cleaning is one of our most popular services. We clean every surface, cabinet, and fixture to help you secure your deposit or start fresh in your new home. This service is available throughout the DFW metroplex.",
      },
    ],
  },
  {
    name: "Scheduling & Logistics",
    icon: "clock",
    faqs: [
      {
        question: "Do you offer same-day or next-day cleaning?",
        answer: "Yes! We offer same-day and next-day availability for most service types, subject to team availability. Call us at (469) 935-7031 for urgent bookings and we'll do our best to accommodate your schedule.",
      },
      {
        question: "Can I reschedule or cancel a cleaning?",
        answer: "Absolutely. We understand plans change. You can reschedule or cancel your cleaning with at least 24 hours' notice at no charge. Simply call us or manage your booking through your account.",
      },
      {
        question: "How long does a typical cleaning take?",
        answer: "A standard cleaning for a 2-3 bedroom home typically takes 2-3 hours. Deep cleaning takes 3-5 hours depending on the home's size and condition. We'll provide a time estimate when you book.",
      },
      {
        question: "Do I need to be home during the cleaning?",
        answer: "No, you don't need to be home. Many of our clients provide a key, garage code, or smart lock access. All our team members are background-checked and bonded for your peace of mind.",
      },
    ],
  },
  {
    name: "Eco-Friendly",
    icon: "leaf",
    faqs: [
      {
        question: "What cleaning products do you use?",
        answer: "We use professional-grade, eco-friendly cleaning products that are safe for children, pets, and the environment. Our products are non-toxic, biodegradable, and free from harsh chemicals like ammonia and chlorine.",
      },
      {
        question: "Are your products safe for pets?",
        answer: "Yes! All our cleaning products are pet-safe. We use plant-based formulas and essential oil-based disinfectants that effectively clean without leaving harmful residues on floors or surfaces where your pets walk and play.",
      },
    ],
  },
];

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("General");
  const [openFaq, setOpenFaq] = useState<string | null>(null);



  const filteredCategories = searchQuery
    ? FAQ_CATEGORIES.map((cat) => ({
        ...cat,
        faqs: cat.faqs.filter(
          (faq) =>
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter((cat) => cat.faqs.length > 0)
    : FAQ_CATEGORIES.filter((cat) => cat.name === activeCategory);

  const totalFaqs = FAQ_CATEGORIES.reduce((acc, cat) => acc + cat.faqs.length, 0);

  // Schema markup
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_CATEGORIES.flatMap((cat) =>
      cat.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      }))
    ),
  };

  return (
    <div className="min-h-screen bg-white">
{/* Hero */}
      <section className="relative bg-[#0C1829] py-16 lg:py-20">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 right-20 w-40 h-40 rounded-full bg-[#0D9488]/30 blur-3xl" />
          <div className="absolute bottom-10 left-20 w-60 h-60 rounded-full bg-[#0D9488]/20 blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0D9488]/20 text-[#5EEAD4] text-sm font-medium mb-6">
              <HelpCircle size={14} /> FREQUENTLY ASKED QUESTIONS
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              How Can We <span className="text-[#0D9488]">Help You?</span>
            </h1>
            <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
              Find answers to the most common questions about our cleaning services across Dallas-Fort Worth.
            </p>
          </FadeIn>

          {/* Search */}
          <FadeIn delay={0.1}>
            <div className="mt-8 max-w-lg mx-auto relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent text-base"
              />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Breadcrumbs */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Breadcrumbs items={[{ label: "FAQ" }]} />
      </div>

      {/* Category Tabs + FAQ Content */}
      <section className="py-16 lg:py-20 bg-[#FAFAF8]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Tabs */}
          {!searchQuery && (
            <FadeIn>
              <div className="flex flex-wrap gap-2 mb-10 justify-center">
                {FAQ_CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => { setActiveCategory(cat.name); setOpenFaq(null); }}
                    className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                      activeCategory === cat.name
                        ? "bg-[#0D9488] text-white shadow-lg shadow-[#0D9488]/25"
                        : "bg-white text-[#0C1829] border border-gray-200 hover:border-[#0D9488]/30"
                    }`}
                  >
                    {cat.name}
                    <span className="ml-1.5 text-xs opacity-60">({cat.faqs.length})</span>
                  </button>
                ))}
              </div>
            </FadeIn>
          )}

          {/* FAQ Items */}
          <div className="space-y-3">
            {filteredCategories.map((cat) => (
              <div key={cat.name}>
                {searchQuery && (
                  <h3 className="text-sm font-semibold text-[#0D9488] uppercase tracking-wider mb-3 mt-6">{cat.name}</h3>
                )}
                {cat.faqs.map((faq) => {
                  const isOpen = openFaq === faq.question;
                  return (
                    <FadeIn key={faq.question}>
                      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-3">
                        <button
                          onClick={() => setOpenFaq(isOpen ? null : faq.question)}
                          className="w-full flex items-center justify-between px-6 py-5 text-left"
                        >
                          <span className="text-base font-medium text-[#0C1829] pr-4">{faq.question}</span>
                          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
                            <ChevronDown size={20} className="text-gray-400 flex-shrink-0" />
                          </motion.div>
                        </button>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-4">
                                {faq.answer}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </FadeIn>
                  );
                })}
              </div>
            ))}
          </div>

          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <HelpCircle size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No questions found matching your search.</p>
              <button onClick={() => setSearchQuery("")} className="mt-3 text-[#0D9488] font-medium hover:underline">
                Clear search
              </button>
            </div>
          )}

          {/* Stats */}
          <FadeIn>
            <div className="mt-12 text-center">
              <p className="text-sm text-gray-500">
                {totalFaqs} questions across {FAQ_CATEGORIES.length} categories
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Still have questions? <a href="/contact" className="text-[#0D9488] font-medium hover:underline">Contact us</a> or call <a href={`tel:${BRAND.phoneRaw}`} className="text-[#0D9488] font-medium hover:underline">{BRAND.phone}</a>
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Related Resources */}
      <section className="py-16 bg-[#FAFAF8]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <h2 className="text-2xl font-bold text-[#0C1829] mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Helpful Resources
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: "Cleaning Checklist", href: "/checklist", desc: "Free printable checklists" },
                { title: "Our Services", href: "/services", desc: "View all cleaning options" },
                { title: "Service Areas", href: "/locations", desc: "28+ DFW cities served" },
                { title: "Cleaning Blog", href: "/blog", desc: "Tips & expert advice" },
                { title: "Deep Cleaning", href: "/services/deep-cleaning", desc: "Thorough top-to-bottom clean" },
                { title: "Move-In/Out", href: "/services/move-in-move-out-cleaning", desc: "Get your deposit back" },
                { title: "About Us", href: "/about", desc: "Our story & values" },
                { title: "Contact Us", href: "/contact", desc: "Get in touch today" },
              ].map((link, i) => (
                <a key={i} href={link.href} className="p-4 rounded-xl border border-gray-100 bg-white hover:border-[#0D9488]/30 hover:shadow-sm transition-all group block">
                  <h3 className="font-semibold text-[#0C1829] group-hover:text-[#0D9488] transition-colors text-sm">{link.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{link.desc}</p>
                </a>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      <CTASection
        title="Still Have Questions?"
        subtitle="Our team is here to help. Contact us anytime or book your cleaning today."
      />
</div>
  );
}
