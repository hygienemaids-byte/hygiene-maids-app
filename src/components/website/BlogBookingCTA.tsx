/*
 * BlogBookingCTA — Inline booking CTA for blog articles
 * Polished, on-brand component inserted mid-article to drive conversions
 * Improves internal linking and conversion rate
 */
import Link from "next/link";
import { Sparkles, ArrowRight, Phone, Star, Shield } from "lucide-react";
import { BRAND } from "@/lib/constants";

interface BlogBookingCTAProps {
  /** Optional city name for localized CTA */
  city?: string;
  /** Optional service slug for deep linking */
  service?: string;
  /** Variant: 'standard' for mid-article, 'compact' for sidebar */
  variant?: "standard" | "compact";
}

export default function BlogBookingCTA({ city, service, variant = "standard" }: BlogBookingCTAProps) {
  const cityText = city ? ` in ${city}` : " in Dallas-Fort Worth";
  const bookLink = service ? `/services/${service}` : "/book";

  if (variant === "compact") {
    return (
      <div className="bg-gradient-to-br from-[#0C1829] to-[#162544] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-[#0D9488]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#0D9488]">Professional Cleaning</span>
        </div>
        <h4 className="text-lg font-bold mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Ready for a Spotless Home?
        </h4>
        <p className="text-sm text-gray-300 mb-4 leading-relaxed">
          Get a free quote for professional cleaning{cityText}.
        </p>
        <Link
          href="/quote"
          className="flex items-center justify-center gap-2 w-full py-3 bg-[#0D9488] text-white text-sm font-semibold rounded-xl hover:bg-[#0B8278] transition-all"
        >
          Get Free Quote <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  return (
    <div className="my-10 relative overflow-hidden rounded-2xl border border-[#0D9488]/20 bg-gradient-to-r from-[#0C1829] via-[#132038] to-[#0C1829]">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#0D9488]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#0D9488]/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative px-6 py-8 sm:px-8 sm:py-10">
        {/* Badge */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#0D9488]/20 flex items-center justify-center">
            <Sparkles size={16} className="text-[#0D9488]" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#0D9488]">
            Hygiene Maids — Trusted by 500+ DFW Families
          </span>
        </div>

        {/* Heading */}
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Need Professional Cleaning{cityText}?
        </h3>
        <p className="text-gray-300 text-sm sm:text-base mb-6 max-w-xl leading-relaxed">
          Stop spending your weekends cleaning. Our licensed, insured, and background-checked cleaning professionals deliver a spotless home every time — backed by our 100% satisfaction guarantee.
        </p>

        {/* Trust indicators */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-1.5 text-gray-300 text-xs sm:text-sm">
            <Star size={14} className="text-yellow-400 fill-yellow-400" />
            <span>{BRAND.googleRating} Google Rating</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-300 text-xs sm:text-sm">
            <Shield size={14} className="text-[#0D9488]" />
            <span>Licensed & Insured</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-300 text-xs sm:text-sm">
            <Phone size={14} className="text-[#0D9488]" />
            <span>{BRAND.phone}</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={bookLink}
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#0D9488] text-white text-sm font-semibold rounded-xl hover:bg-[#0B8278] transition-all shadow-lg shadow-[#0D9488]/25"
          >
            Book Your Cleaning <ArrowRight size={15} />
          </Link>
          <Link
            href="/quote"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-white/20 text-white text-sm font-semibold rounded-xl hover:border-[#0D9488] hover:text-[#0D9488] transition-all"
          >
            Get a Free Quote
          </Link>
        </div>
      </div>
    </div>
  );
}
