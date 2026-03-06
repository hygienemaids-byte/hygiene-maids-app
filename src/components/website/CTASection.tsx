"use client";
/*
 * CTASection — Reusable contained CTA block
 * Rounded container with gradient bg inside a neutral section — avoids full-width colored bg
 */
import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { motion } from "framer-motion";

interface CTASectionProps {
  title?: string;
  subtitle?: string;
  showPhone?: boolean;
}

export default function CTASection({
  title = "Ready for a Spotless Home?",
  subtitle = "Book your professional cleaning today and experience the Hygiene Maids difference.",
  showPhone = true,
}: CTASectionProps) {
  const { ref, isVisible } = useScrollAnimation(0.15);

  return (
    <section className="py-16 lg:py-20 bg-[#FAFAF8]">
      <div ref={ref} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0D9488] to-[#0A7A70] px-8 py-14 sm:px-14 sm:py-16 text-center"
        >
          {/* Decorative blurs */}
          <div className="absolute top-0 left-0 w-48 h-48 rounded-full bg-white/10 blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-white/10 blur-3xl translate-x-1/3 translate-y-1/3" />

          <div className="relative z-10">
            <h2
              className="text-3xl sm:text-4xl font-bold text-white leading-tight"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {title}
            </h2>
            <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
              {subtitle}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/book"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-[#0D9488] bg-white rounded-xl hover:bg-gray-50 transition-all shadow-xl"
              >
                Book Now <ArrowRight size={18} />
              </Link>
              <Link
                href="/quote"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white border-2 border-white/60 rounded-xl hover:bg-white/10 transition-all"
              >
                Get Free Quote
              </Link>
            </div>
            {showPhone && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <Phone size={16} className="text-white/60" />
                <a href={`tel:${BRAND.phoneRaw}`} className="text-white/60 hover:text-white transition-colors font-medium">
                  Or call us: {BRAND.phone}
                </a>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
