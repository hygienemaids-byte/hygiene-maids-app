/*
 * Footer — Hygiene Maids Luxury
 * Dark navy bg, teal accents, gold stars, professional mobile grid
 * Grouped links, comprehensive internal linking for SEO
 */
import Link from "next/link";
import { Phone, Mail, MapPin, Star, Clock } from "lucide-react";
import { BRAND, IMAGES, SERVICE_AREAS, SERVICES } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="bg-[#0C1829]">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Desktop: 4 columns / Mobile: stacked with grid sub-sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div>
            <img src={IMAGES.logoDark} alt="Hygiene Maids - DFW Professional Cleaning" className="h-14 w-auto object-contain mb-4" />
            <p className="text-sm leading-relaxed text-white/50 mb-4">
              Dallas-Fort Worth's premier professional cleaning service. Trusted by 500+ families. Licensed, bonded, and insured.
            </p>
            <div className="flex items-center gap-1 mb-4">
              {[1,2,3,4,5].map(i => <Star key={i} size={14} className="fill-[#C9A84C] text-[#C9A84C]" />)}
              <span className="text-sm text-white/40 ml-2">5.0 on Google</span>
            </div>
            {/* Contact info - visible on all screens */}
            <ul className="space-y-3">
              <li>
                <a href={`tel:${BRAND.phoneRaw}`} className="flex items-start gap-3 text-sm text-white/50 hover:text-[#0D9488] transition-colors">
                  <Phone size={16} className="mt-0.5 text-[#0D9488] flex-shrink-0" />
                  {BRAND.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${BRAND.email}`} className="flex items-start gap-3 text-sm text-white/50 hover:text-[#0D9488] transition-colors">
                  <Mail size={16} className="mt-0.5 text-[#0D9488] flex-shrink-0" />
                  {BRAND.email}
                </a>
              </li>
              <li>
                <div className="flex items-start gap-3 text-sm text-white/50">
                  <MapPin size={16} className="mt-0.5 text-[#0D9488] flex-shrink-0" />
                  Dallas-Fort Worth Metroplex, TX
                </div>
              </li>
              <li>
                <div className="flex items-start gap-3 text-sm text-white/50">
                  <Clock size={16} className="mt-0.5 text-[#0D9488] flex-shrink-0" />
                  {BRAND.hours}
                </div>
              </li>
            </ul>
          </div>

          {/* Quick Links + Services — Mobile: 2-col grid */}
          <div>
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase mb-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Company
            </h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 md:grid-cols-1 md:gap-y-3">
              {[
                { label: "Home", href: "/" },
                { label: "About Us", href: "/about" },
                { label: "Our Services", href: "/services" },
                { label: "Service Areas", href: "/locations" },
                { label: "Blog", href: "/blog" },
                { label: "FAQ", href: "/faq" },
                { label: "Contact", href: "/contact" },
                { label: "Cleaning Checklist", href: "/checklist" },
                { label: "Book Now", href: "/book" },
                { label: "Free Quote", href: "/quote" },
                { label: "Join Our Team", href: "/careers" },
              ].map((link) => (
                <Link key={link.href} href={link.href} className="text-sm text-white/50 hover:text-[#0D9488] transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Services sub-section */}
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase mt-8 mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Services
            </h4>
            <div className="grid grid-cols-1 gap-y-2.5">
              {SERVICES.map((service) => (
                <Link key={service.slug} href={`/services/${service.slug}`} className="text-sm text-white/50 hover:text-[#0D9488] transition-colors">
                  {service.title}
                </Link>
              ))}
            </div>
          </div>

          {/* Service Areas — Mobile: 2-col grid */}
          <div>
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase mb-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Service Areas
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 md:grid-cols-1 md:gap-y-3">
              {SERVICE_AREAS.slice(0, 14).map((area) => (
                <Link key={area.slug} href={`/locations/${area.slug}`} className="text-sm text-white/50 hover:text-[#0D9488] transition-colors">
                  {area.city}, {area.state}
                </Link>
              ))}
            </div>
            <Link href="/locations" className="inline-block mt-4 text-sm text-[#0D9488] font-medium hover:text-[#0D9488]/80 transition-colors">
              View all 28+ cities →
            </Link>
          </div>

          {/* Resources + CTA */}
          <div>
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase mb-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Resources
            </h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 md:grid-cols-1 md:gap-y-3">
              {[
                { label: "Cleaning Checklist", href: "/checklist" },
                { label: "Deep Cleaning Guide", href: "/blog/ultimate-guide-deep-cleaning-dallas-home" },
                { label: "Eco-Friendly Products", href: "/blog/eco-friendly-cleaning-products-safe-families-pets" },
                { label: "Move-Out Checklist", href: "/blog/move-out-cleaning-checklist-get-deposit-back" },
                { label: "Airbnb Cleaning Tips", href: "/blog/airbnb-cleaning-tips-5-star-reviews-dallas" },
                { label: "Cleaning Frequency Guide", href: "/blog/how-often-should-you-clean-your-home-dfw" },
              ].map((link) => (
                <Link key={link.href} href={link.href} className="text-sm text-white/50 hover:text-[#0D9488] transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-2">
              <Link href="/book" className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white bg-[#0D9488] rounded-lg hover:bg-[#0B8278] transition-all">
                Book Now
              </Link>
              <Link href="/quote" className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-[#0D9488] border border-[#0D9488] rounded-lg hover:bg-[#0D9488]/10 transition-all">
                Free Quote
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} Hygiene Maids. All Rights Reserved. Licensed, Bonded & Insured.
          </p>
          <div className="flex items-center gap-4 text-xs text-white/30">
            <Link href="/privacy-policy" className="hover:text-[#0D9488] transition-colors">Privacy Policy</Link>
            <Link href="/terms-of-service" className="hover:text-[#0D9488] transition-colors">Terms of Service</Link>
            <Link href="/locations" className="hover:text-[#0D9488] transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
