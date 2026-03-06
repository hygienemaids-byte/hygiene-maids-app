"use client";
/*
 * Privacy Policy — Hygiene Maids
 * Professional legal page with luxury styling, breadcrumbs, SEO
 */
import Link from "next/link";
import { BRAND } from "@/lib/constants";
import Breadcrumbs from "@/components/website/Breadcrumbs";
import { Shield, Lock, Eye, Database, UserCheck, Mail } from "lucide-react";

const sections = [
  {
    icon: Database,
    title: "Information We Collect",
    content: `When you use Hygiene Maids' services or visit our website, we may collect the following types of information:

**Personal Information:** Name, email address, phone number, home or business address, and payment information that you voluntarily provide when booking a cleaning service, requesting a quote, or contacting us.

**Service Information:** Details about your property including number of bedrooms, bathrooms, square footage, cleaning preferences, special instructions, and service history.

**Automatically Collected Information:** When you visit our website, we may automatically collect certain information including your IP address, browser type, device information, pages visited, time spent on pages, and referring website. We use cookies and similar tracking technologies to enhance your browsing experience.

**Communication Records:** Records of your communications with us, including emails, phone calls, text messages, and chat conversations, which help us improve our customer service.`,
  },
  {
    icon: Eye,
    title: "How We Use Your Information",
    content: `We use the information we collect for the following purposes:

**Service Delivery:** To schedule, perform, and manage your cleaning services, process payments, and communicate with you about your appointments.

**Customer Support:** To respond to your inquiries, resolve complaints, and provide customer assistance.

**Service Improvement:** To understand how our customers use our services, identify areas for improvement, and develop new service offerings.

**Marketing Communications:** With your consent, to send you promotional offers, newsletters, cleaning tips, and updates about our services. You can opt out of marketing communications at any time.

**Legal Compliance:** To comply with applicable laws, regulations, and legal processes, and to protect our rights, privacy, safety, or property.

**Safety and Security:** To verify the identity of our customers, prevent fraud, and ensure the safety of our cleaning professionals and customers.`,
  },
  {
    icon: Lock,
    title: "How We Protect Your Information",
    content: `Hygiene Maids takes the security of your personal information seriously. We implement appropriate technical and organizational measures to protect your data, including:

**Encryption:** All sensitive data transmitted through our website is encrypted using industry-standard SSL/TLS encryption technology.

**Access Controls:** Access to personal information is restricted to authorized employees and contractors who need the information to perform their job duties.

**Secure Storage:** Personal information is stored on secure servers with appropriate physical, electronic, and procedural safeguards.

**Regular Audits:** We conduct regular security assessments and audits to identify and address potential vulnerabilities.

**Employee Training:** All Hygiene Maids team members receive training on data protection and privacy practices.

While we strive to protect your personal information, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security but are committed to maintaining the highest standards of data protection.`,
  },
  {
    icon: UserCheck,
    title: "Information Sharing and Disclosure",
    content: `Hygiene Maids does not sell, trade, or rent your personal information to third parties. We may share your information in the following limited circumstances:

**Service Providers:** We may share information with trusted third-party service providers who assist us in operating our business, such as payment processors, scheduling software providers, and email service providers. These providers are contractually obligated to protect your information.

**Cleaning Professionals:** We share relevant service details (address, cleaning instructions, access information) with our vetted cleaning professionals assigned to your service.

**Legal Requirements:** We may disclose your information if required by law, court order, or government regulation, or if we believe disclosure is necessary to protect our rights, your safety, or the safety of others.

**Business Transfers:** In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the transaction. We will notify you of any such change.`,
  },
  {
    icon: Shield,
    title: "Your Rights and Choices",
    content: `You have the following rights regarding your personal information:

**Access and Correction:** You may request access to the personal information we hold about you and ask us to correct any inaccuracies.

**Deletion:** You may request that we delete your personal information, subject to certain legal exceptions.

**Opt-Out of Marketing:** You can unsubscribe from marketing emails by clicking the "unsubscribe" link in any promotional email or by contacting us directly.

**Cookie Preferences:** You can manage your cookie preferences through your browser settings. Note that disabling certain cookies may affect the functionality of our website.

**Do Not Track:** Our website currently does not respond to "Do Not Track" signals from browsers.

**California Residents:** If you are a California resident, you may have additional rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information we collect, the right to delete your information, and the right to opt out of the sale of your information.

**Texas Residents:** Under the Texas Data Privacy and Security Act, you have the right to access, correct, delete, and obtain a copy of your personal data, as well as the right to opt out of targeted advertising and data sales.`,
  },
  {
    icon: Mail,
    title: "Contact Us About Privacy",
    content: `If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:

**Hygiene Maids**
Email: booking@hygienemaids.com
Phone: (469) 935-7031
Service Area: Dallas-Fort Worth Metroplex, TX

**Response Time:** We aim to respond to all privacy-related inquiries within 30 business days.

**Policy Updates:** We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws. We will notify you of any material changes by posting the updated policy on our website with a new "Last Updated" date. We encourage you to review this policy periodically.

This Privacy Policy was last updated on March 1, 2026.`,
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
{/* Hero */}
      <section className="bg-[#0C1829] py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#0D9488]/20 rounded-full mb-4">
            <Shield size={14} className="text-[#0D9488]" />
            <span className="text-xs font-semibold text-[#0D9488] tracking-wider uppercase">Your Privacy Matters</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Privacy Policy
          </h1>
          <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
            At Hygiene Maids, we are committed to protecting your privacy and ensuring the security of your personal information.
          </p>
        </div>
      </section>

      {/* Breadcrumbs */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Breadcrumbs items={[{ label: "Privacy Policy" }]} />
      </div>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-10 shadow-sm">
          <p className="text-sm text-gray-500 mb-8">
            <strong>Effective Date:</strong> March 1, 2026 &nbsp;|&nbsp; <strong>Last Updated:</strong> March 1, 2026
          </p>

          <p className="text-[#0C1829]/80 leading-relaxed mb-10">
            This Privacy Policy describes how Hygiene Maids ("we," "us," or "our") collects, uses, shares, and protects your personal information when you visit our website, use our services, or interact with us. By using our services, you agree to the collection and use of information in accordance with this policy. We serve the entire Dallas-Fort Worth metroplex including Dallas, Fort Worth, Plano, Frisco, McKinney, Arlington, Irving, and 20+ additional cities.
          </p>

          <div className="space-y-10">
            {sections.map((section, i) => {
              const Icon = section.icon;
              return (
                <div key={i}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#0D9488]/10 flex items-center justify-center flex-shrink-0">
                      <Icon size={20} className="text-[#0D9488]" />
                    </div>
                    <h2 className="text-xl font-bold text-[#0C1829]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {section.title}
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
              Have questions about our privacy practices? We're here to help.
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
