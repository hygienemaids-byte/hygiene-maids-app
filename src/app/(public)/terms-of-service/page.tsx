"use client";
/*
 * Terms of Service — Hygiene Maids
 * Professional legal page with luxury styling, breadcrumbs, SEO
 */
import Link from "next/link";
import { BRAND } from "@/lib/constants";
import Breadcrumbs from "@/components/website/Breadcrumbs";
import { FileText, Clock, DollarSign, ShieldCheck, AlertTriangle, Scale, Mail } from "lucide-react";

const sections = [
  {
    icon: FileText,
    title: "Service Agreement",
    content: `By booking a cleaning service with Hygiene Maids, you ("Client") agree to the following terms and conditions. These terms constitute a binding agreement between you and Hygiene Maids ("Company," "we," "us," or "our").

**Scope of Services:** Hygiene Maids provides professional residential and commercial cleaning services throughout the Dallas-Fort Worth metroplex, including standard house cleaning, deep cleaning, move-in/move-out cleaning, commercial cleaning, and Airbnb/rental turnover cleaning.

**Service Area:** We currently serve 28+ cities across the DFW metroplex including Dallas, Fort Worth, Plano, Frisco, McKinney, Arlington, Irving, Garland, Richardson, Carrollton, Denton, Lewisville, and surrounding areas.

**Eligibility:** You must be at least 18 years of age and have the legal authority to enter into this agreement. If you are booking on behalf of a business, you represent that you have the authority to bind the business to these terms.`,
  },
  {
    icon: Clock,
    title: "Booking, Scheduling & Cancellation",
    content: `**Booking:** Services can be booked through our website, by phone at (469) 935-7031, or by email. All bookings are subject to availability.

**Confirmation:** You will receive a booking confirmation via email and/or text message. Please review the details carefully and contact us immediately if any information is incorrect.

**Access to Property:** You must ensure that our cleaning professionals have access to your property at the scheduled time. This may include providing keys, access codes, or being present to grant entry. If our team is unable to access the property, a lockout fee may apply.

**Cancellation Policy:** We understand that plans change. Our cancellation policy is as follows:
- Cancellations made 24+ hours before the scheduled service: No charge
- Cancellations made 12-24 hours before the scheduled service: 25% of the service fee
- Cancellations made less than 12 hours before the scheduled service: 50% of the service fee
- No-shows or same-day cancellations without notice: Full service fee

**Rescheduling:** You may reschedule your appointment at no charge with at least 24 hours' notice, subject to availability.

**Late Arrivals:** While we strive to arrive within the scheduled window, traffic and unforeseen circumstances may occasionally cause delays. We will notify you as soon as possible if we anticipate a delay.`,
  },
  {
    icon: DollarSign,
    title: "Pricing, Payment & Refunds",
    content: `**Pricing:** Service prices are based on the size of your property, the type of cleaning requested, frequency of service, and any additional add-on services. Prices quoted are estimates and may be adjusted based on the actual condition of the property.

**Additional Charges:** Extra charges may apply for:
- Properties in significantly dirtier condition than described
- Additional rooms or areas not included in the original quote
- Special requests or add-on services (inside oven, inside fridge, laundry, etc.)
- Pet hair removal requiring extra time
- Properties requiring supplies not typically included

**Payment:** Payment is due upon completion of each cleaning service unless otherwise arranged. We accept major credit cards, debit cards, and digital payment methods. For recurring services, your payment method on file will be charged after each completed service.

**Recurring Service Discounts:** Clients who book recurring services receive the following discounts:
- Weekly service: 20% discount
- Biweekly service: 15% discount
- Monthly service: 10% discount

Discounts apply only to regularly scheduled services and may be forfeited if services are frequently skipped or cancelled.

**Refunds:** If you are not satisfied with our service, please contact us within 24 hours. We will arrange a complimentary re-clean of the areas in question. If the re-clean does not meet your expectations, we will issue a partial or full refund at our discretion.`,
  },
  {
    icon: ShieldCheck,
    title: "Our Guarantee & Liability",
    content: `**Satisfaction Guarantee:** Hygiene Maids stands behind the quality of our work. If you are not completely satisfied with any aspect of our cleaning service, contact us within 24 hours and we will re-clean the affected areas at no additional charge.

**Insurance:** Hygiene Maids is fully licensed, bonded, and insured. Our general liability insurance covers accidental damage to your property that occurs during the course of our cleaning services.

**Damage Claims:** In the unlikely event that damage occurs during a cleaning service:
- Report the damage to us within 24 hours of the service
- Provide photos and a description of the damage
- We will investigate the claim and work to resolve it promptly
- Verified claims will be repaired or compensated up to the fair market value of the item

**Limitations of Liability:** Our liability is limited to the cost of the cleaning service or the fair market value of any damaged item, whichever is less. We are not liable for:
- Pre-existing damage or wear and tear
- Damage caused by defective or improperly installed fixtures
- Items of extraordinary value not disclosed prior to service
- Damage resulting from the Client's negligence or instructions
- Indirect, incidental, or consequential damages

**Property Preparation:** Clients are responsible for securing valuables, fragile items, and personal belongings before the cleaning service. We recommend removing or securing items of significant sentimental or monetary value.`,
  },
  {
    icon: AlertTriangle,
    title: "Client Responsibilities & Safety",
    content: `**Safe Environment:** You agree to provide a safe working environment for our cleaning professionals. This includes:
- Disclosing any known hazards (mold, pest infestations, structural issues)
- Securing pets during the cleaning service
- Ensuring adequate lighting and ventilation
- Removing any items that could pose a safety risk

**Harassment Policy:** Hygiene Maids has a zero-tolerance policy for harassment, abuse, or inappropriate behavior toward our cleaning professionals. Any such behavior will result in immediate termination of service.

**Pets:** Please secure all pets in a separate room or area during the cleaning service. While our team members are pet-friendly, this ensures the safety of both your pets and our professionals. We are not responsible for pets that escape due to open doors during cleaning.

**Supplies and Equipment:** Hygiene Maids provides all necessary cleaning supplies and equipment unless otherwise arranged. Our products are professional-grade and eco-friendly. If you prefer specific products be used, please let us know in advance.

**Communication:** You agree to provide accurate contact information and respond to communications regarding your scheduled services in a timely manner.`,
  },
  {
    icon: Scale,
    title: "General Legal Terms",
    content: `**Governing Law:** These Terms of Service are governed by the laws of the State of Texas, without regard to conflict of law principles. Any disputes arising from these terms shall be resolved in the courts of Dallas County, Texas.

**Dispute Resolution:** Before pursuing legal action, both parties agree to attempt to resolve any disputes through good-faith negotiation. If negotiation fails, disputes may be submitted to binding arbitration in accordance with the rules of the American Arbitration Association.

**Intellectual Property:** All content on the Hygiene Maids website, including text, images, logos, and design elements, is the property of Hygiene Maids and is protected by copyright and trademark laws. You may not reproduce, distribute, or create derivative works without our written permission.

**Modifications:** Hygiene Maids reserves the right to modify these Terms of Service at any time. Changes will be posted on our website with an updated effective date. Continued use of our services after changes are posted constitutes acceptance of the modified terms.

**Severability:** If any provision of these terms is found to be unenforceable, the remaining provisions will continue in full force and effect.

**Entire Agreement:** These Terms of Service, together with our Privacy Policy, constitute the entire agreement between you and Hygiene Maids regarding the use of our services.

**Force Majeure:** Hygiene Maids shall not be liable for any failure or delay in performing our obligations due to circumstances beyond our reasonable control, including natural disasters, severe weather, pandemics, government actions, or other force majeure events.`,
  },
  {
    icon: Mail,
    title: "Contact Information",
    content: `If you have any questions about these Terms of Service, please contact us:

**Hygiene Maids**
Email: booking@hygienemaids.com
Phone: (469) 935-7031
Service Area: Dallas-Fort Worth Metroplex, TX
Hours: Monday – Saturday, 7:00 AM – 7:00 PM

We are committed to providing transparent, fair, and professional service to all of our clients across the Dallas-Fort Worth area.

These Terms of Service were last updated on March 1, 2026.`,
  },
];

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
{/* Hero */}
      <section className="bg-[#0C1829] py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#0D9488]/20 rounded-full mb-4">
            <FileText size={14} className="text-[#0D9488]" />
            <span className="text-xs font-semibold text-[#0D9488] tracking-wider uppercase">Legal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Terms of Service
          </h1>
          <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
            Please review these terms carefully before booking our professional cleaning services.
          </p>
        </div>
      </section>

      {/* Breadcrumbs */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Breadcrumbs items={[{ label: "Terms of Service" }]} />
      </div>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-10 shadow-sm">
          <p className="text-sm text-gray-500 mb-8">
            <strong>Effective Date:</strong> March 1, 2026 &nbsp;|&nbsp; <strong>Last Updated:</strong> March 1, 2026
          </p>

          <p className="text-[#0C1829]/80 leading-relaxed mb-10">
            Welcome to Hygiene Maids. These Terms of Service ("Terms") govern your use of our website and professional cleaning services. By booking a service, submitting a quote request, or using our website, you agree to be bound by these Terms. If you do not agree with any part of these Terms, please do not use our services.
          </p>

          {/* Table of Contents */}
          <div className="bg-[#FAFAF8] rounded-xl p-6 mb-10">
            <h3 className="text-sm font-bold text-[#0C1829] mb-3 uppercase tracking-wider">Table of Contents</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {sections.map((section, i) => (
                <a
                  key={i}
                  href={`#section-${i}`}
                  className="text-sm text-[#0D9488] hover:text-[#0B8278] transition-colors"
                >
                  {i + 1}. {section.title}
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-10">
            {sections.map((section, i) => {
              const Icon = section.icon;
              return (
                <div key={i} id={`section-${i}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#0D9488]/10 flex items-center justify-center flex-shrink-0">
                      <Icon size={20} className="text-[#0D9488]" />
                    </div>
                    <h2 className="text-xl font-bold text-[#0C1829]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {i + 1}. {section.title}
                    </h2>
                  </div>
                  <div className="text-[#0C1829]/70 leading-relaxed whitespace-pre-line text-sm pl-[52px]">
                    {section.content.split("**").map((part, j) =>
                      j % 2 === 0 ? part : <strong key={j} className="text-[#0C1829]">{part}</strong>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 pt-8 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500 mb-4">
              Have questions about our terms? We're happy to clarify.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#0D9488] rounded-lg hover:bg-[#0B8278] transition-all"
              >
                Contact Us
              </Link>
              <a
                href={`mailto:${BRAND.email}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-[#0D9488] border border-[#0D9488] rounded-lg hover:bg-[#0D9488]/5 transition-all"
              >
                <Mail size={16} /> Email Us
              </a>
            </div>
          </div>
        </div>
      </section>
</div>
  );
}
