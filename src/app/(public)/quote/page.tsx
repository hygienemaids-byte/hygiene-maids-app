"use client";
/*
 * Quote — Hygiene Maids Free Quote Flow
 * Polished multi-step form with icons, sleek design, premium feel
 */
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { BRAND, IMAGES, SERVICES } from "@/lib/constants";
import {
  ArrowRight, ArrowLeft, CheckCircle, Phone, Sparkles, Home as HomeIcon,
  Building, Star, Bed, Bath, CalendarClock, Plus, User, Mail, MapPin,
  MessageSquare, Calendar, Shield, Clock, Award, Repeat, Zap
} from "lucide-react";
import Breadcrumbs from "@/components/website/Breadcrumbs";

type Step = 1 | 2 | 3 | 4;

const serviceIcons: Record<string, typeof HomeIcon> = {
  "standard-cleaning": HomeIcon,
  "deep-cleaning": Sparkles,
  "move-in-out-cleaning": Building,
  "commercial-cleaning": Building,
  "airbnb-rental-turnover": Star,
};

const frequencyOptions = [
  { value: "one-time", label: "One-Time", icon: Zap, badge: "" },
  { value: "weekly", label: "Weekly", icon: Repeat, badge: "Save 20%" },
  { value: "biweekly", label: "Biweekly", icon: CalendarClock, badge: "Save 15%" },
  { value: "monthly", label: "Monthly", icon: Calendar, badge: "Save 10%" },
];

const extraOptions = [
  { label: "Inside Oven", icon: "🔥" },
  { label: "Inside Fridge", icon: "❄️" },
  { label: "Laundry", icon: "👕" },
  { label: "Inside Windows", icon: "🪟" },
  { label: "Garage", icon: "🚗" },
  { label: "Organize Closets", icon: "👔" },
  { label: "Baseboards", icon: "🧹" },
  { label: "Ceiling Fans", icon: "💨" },
];

const steps = [
  { num: 1, label: "Service", icon: Sparkles },
  { num: 2, label: "Details", icon: HomeIcon },
  { num: 3, label: "Contact", icon: User },
  { num: 4, label: "Done", icon: CheckCircle },
];

export default function Quote() {
  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState({
    serviceType: "",
    bedrooms: "",
    bathrooms: "",
    frequency: "",
    squareFootage: "",
    extras: [] as string[],
    name: "",
    email: "",
    phone: "",
    address: "",
    preferredDate: "",
    notes: "",
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleExtra = (extra: string) => {
    setFormData(prev => ({
      ...prev,
      extras: prev.extras.includes(extra)
        ? prev.extras.filter(e => e !== extra)
        : [...prev.extras, extra],
    }));
  };

  const handleSubmit = () => {
    setStep(4);
  };

  const selectedService = SERVICES.find(s => s.id === formData.serviceType);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
{/* Hero */}
      <section className="bg-[#0C1829] py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-[#0D9488] blur-[120px]" />
          <div className="absolute bottom-10 left-10 w-56 h-56 rounded-full bg-[#C9A84C] blur-[100px]" />
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#0D9488]/20 rounded-full mb-4">
            <Sparkles size={14} className="text-[#0D9488]" />
            <span className="text-xs font-semibold text-[#0D9488] tracking-wider uppercase">Free Estimate</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Get Your Free Quote
          </h1>
          <p className="mt-4 text-lg text-white/60">
            Tell us about your space and we'll provide a personalized cleaning estimate in minutes.
          </p>
          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 mt-8">
            {[
              { icon: Shield, label: "Licensed & Insured" },
              { icon: Clock, label: "Response in 30 min" },
              { icon: Award, label: "No Obligation" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon size={14} className="text-[#0D9488]" />
                <span className="text-xs text-white/50">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Breadcrumbs */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Breadcrumbs items={[{ label: "Free Quote" }]} />
      </div>

      {/* Progress Steps */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.num;
            const isCompleted = step > s.num;
            return (
              <div key={s.num} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted ? "bg-[#0D9488] text-white shadow-lg shadow-[#0D9488]/25" :
                    isActive ? "bg-[#0D9488] text-white shadow-lg shadow-[#0D9488]/25 ring-4 ring-[#0D9488]/10" :
                    "bg-gray-100 text-gray-400"
                  }`}>
                    {isCompleted ? <CheckCircle size={18} /> : <Icon size={18} />}
                  </div>
                  <span className={`text-xs font-medium mt-2 ${isActive || isCompleted ? "text-[#0C1829]" : "text-gray-400"}`}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-12 sm:w-20 h-0.5 mx-2 mb-5 transition-all duration-500 ${
                    step > s.num ? "bg-[#0D9488]" : "bg-gray-200"
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Steps */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        <AnimatePresence mode="wait">
          {/* Step 1: Service Type */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-[#0C1829] mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  What type of cleaning do you need?
                </h2>
                <p className="text-sm text-gray-500 mb-6">Select the service that best fits your needs.</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {SERVICES.map((service) => {
                    const Icon = serviceIcons[service.id] || Sparkles;
                    const isSelected = formData.serviceType === service.id;
                    return (
                      <button
                        key={service.id}
                        onClick={() => { updateField("serviceType", service.id); setStep(2); }}
                        className={`group flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                          isSelected
                            ? "border-[#0D9488] bg-[#0D9488]/5 shadow-md shadow-[#0D9488]/10"
                            : "border-gray-100 bg-white hover:border-[#0D9488]/40 hover:shadow-md"
                        }`}
                      >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected ? "bg-[#0D9488] text-white" : "bg-gray-50 text-[#0D9488] group-hover:bg-[#0D9488]/10"
                        }`}>
                          <Icon size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-[#0C1829] text-sm">{service.title}</h3>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{service.shortDesc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Home Details */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
                {/* Selected service badge */}
                {selectedService && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0D9488]/10 rounded-full mb-5">
                    <Sparkles size={12} className="text-[#0D9488]" />
                    <span className="text-xs font-semibold text-[#0D9488]">{selectedService.title}</span>
                  </div>
                )}

                <h2 className="text-2xl font-bold text-[#0C1829] mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Tell us about your space
                </h2>
                <p className="text-sm text-gray-500 mb-6">This helps us provide an accurate estimate.</p>

                <div className="space-y-6">
                  {/* Bedrooms & Bathrooms */}
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-[#0C1829] mb-3">
                        <Bed size={16} className="text-[#0D9488]" />
                        Bedrooms
                      </label>
                      <div className="flex gap-2">
                        {["1", "2", "3", "4", "5+"].map(n => (
                          <button
                            key={n}
                            onClick={() => updateField("bedrooms", n)}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                              formData.bedrooms === n
                                ? "bg-[#0D9488] text-white shadow-lg shadow-[#0D9488]/25"
                                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-[#0C1829] mb-3">
                        <Bath size={16} className="text-[#0D9488]" />
                        Bathrooms
                      </label>
                      <div className="flex gap-2">
                        {["1", "2", "3", "4", "5+"].map(n => (
                          <button
                            key={n}
                            onClick={() => updateField("bathrooms", n)}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                              formData.bathrooms === n
                                ? "bg-[#0D9488] text-white shadow-lg shadow-[#0D9488]/25"
                                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Square Footage */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#0C1829] mb-3">
                      <HomeIcon size={16} className="text-[#0D9488]" />
                      Approximate Square Footage
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {["Under 1,000", "1,000–2,000", "2,000–3,000", "3,000+"].map(sq => (
                        <button
                          key={sq}
                          onClick={() => updateField("squareFootage", sq)}
                          className={`py-3 px-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
                            formData.squareFootage === sq
                              ? "bg-[#0D9488] text-white shadow-lg shadow-[#0D9488]/25"
                              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {sq} sq ft
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Frequency */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#0C1829] mb-3">
                      <CalendarClock size={16} className="text-[#0D9488]" />
                      Cleaning Frequency
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {frequencyOptions.map(freq => {
                        const FIcon = freq.icon;
                        return (
                          <button
                            key={freq.value}
                            onClick={() => updateField("frequency", freq.value)}
                            className={`relative flex flex-col items-center gap-2 py-4 px-3 rounded-xl transition-all duration-200 ${
                              formData.frequency === freq.value
                                ? "bg-[#0D9488] text-white shadow-lg shadow-[#0D9488]/25"
                                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            <FIcon size={18} />
                            <span className="text-xs font-bold">{freq.label}</span>
                            {freq.badge && (
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                formData.frequency === freq.value
                                  ? "bg-white/20 text-white"
                                  : "bg-[#0D9488]/10 text-[#0D9488]"
                              }`}>
                                {freq.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add-ons */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#0C1829] mb-3">
                      <Plus size={16} className="text-[#0D9488]" />
                      Add-on Services <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {extraOptions.map(extra => (
                        <button
                          key={extra.label}
                          onClick={() => toggleExtra(extra.label)}
                          className={`flex items-center gap-2 py-2.5 px-3 rounded-xl text-xs font-medium transition-all duration-200 ${
                            formData.extras.includes(extra.label)
                              ? "bg-[#0D9488]/10 text-[#0D9488] ring-2 ring-[#0D9488]/30"
                              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          <span>{extra.icon}</span>
                          {extra.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                  <button onClick={() => setStep(1)} className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-[#0C1829] transition-colors">
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!formData.bedrooms || !formData.bathrooms || !formData.frequency}
                    className="flex items-center gap-2 px-7 py-3 text-sm font-semibold text-white bg-[#0D9488] rounded-xl hover:bg-[#0B8278] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#0D9488]/25"
                  >
                    Continue <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Contact Info */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-[#0C1829] mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  How can we reach you?
                </h2>
                <p className="text-sm text-gray-500 mb-6">We'll send your personalized quote to the contact info below.</p>

                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-[#0C1829] mb-2">
                        <User size={14} className="text-[#0D9488]" />
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-100 focus:border-[#0D9488] focus:bg-white focus:ring-2 focus:ring-[#0D9488]/10 focus:outline-none transition-all text-sm"
                        placeholder="John Smith"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-[#0C1829] mb-2">
                        <Phone size={14} className="text-[#0D9488]" />
                        Phone Number <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-100 focus:border-[#0D9488] focus:bg-white focus:ring-2 focus:ring-[#0D9488]/10 focus:outline-none transition-all text-sm"
                        placeholder="(469) 555-0123"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#0C1829] mb-2">
                      <Mail size={14} className="text-[#0D9488]" />
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-100 focus:border-[#0D9488] focus:bg-white focus:ring-2 focus:ring-[#0D9488]/10 focus:outline-none transition-all text-sm"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#0C1829] mb-2">
                      <MapPin size={14} className="text-[#0D9488]" />
                      Service Address
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => updateField("address", e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-100 focus:border-[#0D9488] focus:bg-white focus:ring-2 focus:ring-[#0D9488]/10 focus:outline-none transition-all text-sm"
                      placeholder="123 Main St, Dallas, TX 75201"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#0C1829] mb-2">
                      <Calendar size={14} className="text-[#0D9488]" />
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      value={formData.preferredDate}
                      onChange={(e) => updateField("preferredDate", e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-100 focus:border-[#0D9488] focus:bg-white focus:ring-2 focus:ring-[#0D9488]/10 focus:outline-none transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#0C1829] mb-2">
                      <MessageSquare size={14} className="text-[#0D9488]" />
                      Additional Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => updateField("notes", e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-100 focus:border-[#0D9488] focus:bg-white focus:ring-2 focus:ring-[#0D9488]/10 focus:outline-none transition-all text-sm resize-none"
                      placeholder="Any special requests, access instructions, or areas of focus..."
                    />
                  </div>
                </div>

                <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                  <button onClick={() => setStep(2)} className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-[#0C1829] transition-colors">
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!formData.name || !formData.email || !formData.phone}
                    className="flex items-center gap-2 px-8 py-3.5 text-sm font-semibold text-white bg-[#0D9488] rounded-xl hover:bg-[#0B8278] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#0D9488]/25"
                  >
                    Get My Free Quote <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
              <div className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-12 shadow-sm text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 mx-auto bg-[#0D9488]/10 rounded-full flex items-center justify-center mb-6"
                >
                  <CheckCircle size={40} className="text-[#0D9488]" />
                </motion.div>
                <h2 className="text-3xl font-bold text-[#0C1829]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Quote Request Received!
                </h2>
                <p className="mt-4 text-gray-500 max-w-md mx-auto leading-relaxed">
                  Thank you, <strong className="text-[#0C1829]">{formData.name}</strong>! We'll review your request and send you a personalized quote within <strong className="text-[#0D9488]">30 minutes</strong> during business hours.
                </p>

                {/* Summary */}
                <div className="mt-8 bg-[#FAFAF8] rounded-xl p-6 text-left max-w-sm mx-auto">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Your Request Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Service</span>
                      <span className="font-semibold text-[#0C1829]">{selectedService?.title || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Bedrooms</span>
                      <span className="font-semibold text-[#0C1829]">{formData.bedrooms || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Bathrooms</span>
                      <span className="font-semibold text-[#0C1829]">{formData.bathrooms || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Frequency</span>
                      <span className="font-semibold text-[#0C1829] capitalize">{formData.frequency || "—"}</span>
                    </div>
                    {formData.extras.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Add-ons</span>
                        <span className="font-semibold text-[#0C1829] text-right">{formData.extras.join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/book"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-semibold text-white bg-[#0D9488] rounded-xl hover:bg-[#0B8278] transition-all shadow-lg shadow-[#0D9488]/25"
                  >
                    Book Now Instead <ArrowRight size={16} />
                  </Link>
                  <a
                    href={`tel:${BRAND.phoneRaw}`}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-semibold text-[#0D9488] border-2 border-[#0D9488] rounded-xl hover:bg-[#0D9488]/5 transition-all"
                  >
                    <Phone size={16} /> Call Us Now
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
</div>
  );
}
