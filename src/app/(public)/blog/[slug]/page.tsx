"use client";
/*
 * BlogPost — Individual Blog Article Page
 * SEO-rich article with schema markup, related posts, and CTAs
 */
import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import { motion } from "framer-motion";
import { IMAGES, BLOG_POSTS, BRAND } from "@/lib/constants";
import { Calendar, Clock, ArrowLeft, ArrowRight, Share2, BookOpen } from "lucide-react";
import CTASection from "@/components/website/CTASection";
import Breadcrumbs from "@/components/website/Breadcrumbs";
import BlogBookingCTA from "@/components/website/BlogBookingCTA";
import { toast } from "sonner";

export default function BlogPost() {
  const params = useParams();
  const slug = params.slug as string;
  const post = BLOG_POSTS.find((p) => p.slug === slug);



  if (!post) { notFound(); }

  const currentIndex = BLOG_POSTS.findIndex((p) => p.slug === slug);
  const relatedPosts = BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, 3);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: post.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast("Link copied to clipboard!");
    }
  };

  // Article schema
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `https://hygienemaids.com/blog/${post.slug}`,
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: "Hygiene Maids", url: "https://hygienemaids.com" },
    publisher: {
      "@type": "Organization",
      name: "Hygiene Maids",
      logo: { "@type": "ImageObject", url: IMAGES.logoWhite, width: 600, height: 200 },
    },
    image: IMAGES[post.image as keyof typeof IMAGES],
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://hygienemaids.com/blog/${post.slug}` },
    articleSection: post.category,
    wordCount: post.content.split(/\s+/).length,
    inLanguage: "en-US",
    isPartOf: { "@id": "https://hygienemaids.com/#website" },
    about: {
      "@type": "Thing",
      name: post.category,
      description: `Professional ${post.category.toLowerCase()} information and tips for Dallas-Fort Worth homeowners`
    },
    keywords: `${post.category}, house cleaning Dallas, cleaning tips DFW, ${post.title.toLowerCase()}`
  };

  // Detect city from post content for localized CTA
  const detectCity = (content: string): string | undefined => {
    const cityMatch = content.match(/\b(Plano|Frisco|McKinney|Allen|Fort Worth|Arlington|Irving|Southlake|Flower Mound|Grapevine|Keller|Colleyville|Prosper|Celina|Lewisville|Denton|Carrollton|Garland|Mesquite|Grand Prairie|Mansfield|Bedford|Euless|Hurst|Coppell|Highland Park|University Park|Addison)\b/);
    return cityMatch ? cityMatch[1] : undefined;
  };
  const detectedCity = detectCity(post.content);

  // Parse content into sections with mid-article CTA
  const renderContent = (content: string) => {
    const sections = content.split("\n\n");
    const midPoint = Math.floor(sections.length / 2);
    const elements: React.ReactNode[] = [];

    sections.forEach((section, i) => {
      // Insert booking CTA at midpoint
      if (i === midPoint) {
        elements.push(<BlogBookingCTA key="mid-cta" city={detectedCity} />);
      }

      if (section.startsWith("### ")) {
        elements.push(
          <h3 key={i} className="text-xl font-bold text-[#0C1829] mt-8 mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {section.replace("### ", "")}
          </h3>
        );
      } else if (section.startsWith("## ")) {
        elements.push(
          <h2 key={i} className="text-2xl font-bold text-[#0C1829] mt-10 mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {section.replace("## ", "")}
          </h2>
        );
      } else if (section.startsWith("- ")) {
        const items = section.split("\n").filter((l) => l.startsWith("- "));
        elements.push(
          <ul key={i} className="space-y-2 my-4">
            {items.map((item, j) => (
              <li key={j} className="flex items-start gap-3 text-gray-600 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] mt-2.5 flex-shrink-0" />
                <span dangerouslySetInnerHTML={{ __html: item.replace("- ", "").replace(/\*\*(.*?)\*\*/g, "<strong class='text-[#0C1829]'>$1</strong>") }} />
              </li>
            ))}
          </ul>
        );
      } else if (section.match(/^\d+\./)) {
        const items = section.split("\n").filter((l) => l.match(/^\d+\./));
        elements.push(
          <ol key={i} className="space-y-2 my-4">
            {items.map((item, j) => (
              <li key={j} className="flex items-start gap-3 text-gray-600 leading-relaxed">
                <span className="w-6 h-6 rounded-full bg-[#0D9488]/10 text-[#0D9488] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{j + 1}</span>
                <span dangerouslySetInnerHTML={{ __html: item.replace(/^\d+\.\s*/, "").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
              </li>
            ))}
          </ol>
        );
      } else {
        elements.push(
          <p key={i} className="text-gray-600 leading-relaxed my-4" dangerouslySetInnerHTML={{ __html: section.replace(/\*\*(.*?)\*\*/g, "<strong class='text-[#0C1829]'>$1</strong>") }} />
        );
      }
    });

    return elements;
  };

  return (
    <div className="min-h-screen bg-white">
{/* Breadcrumbs */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Breadcrumbs items={[{ label: "Blog", href: "/blog" }, { label: post.title }]} />
      </div>

      {/* Article Header */}
      <section className="relative bg-[#0C1829] py-16 lg:py-20">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 right-20 w-40 h-40 rounded-full bg-[#0D9488]/30 blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-[#0D9488] transition-colors mb-6">
              <ArrowLeft size={14} /> Back to Blog
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-[#0D9488]/20 text-[#5EEAD4] text-xs font-semibold">{post.category}</span>
              <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar size={12} /> {new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
              <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12} /> {post.readTime}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {post.title}
            </h1>
            <p className="mt-4 text-lg text-gray-300">{post.excerpt}</p>
          </motion.div>
        </div>
      </section>

      {/* Featured Image */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
          <img
            src={IMAGES[post.image as keyof typeof IMAGES]}
            alt={post.title}
            className="w-full h-64 sm:h-80 lg:h-96 object-cover rounded-2xl shadow-xl"
          />
        </motion.div>
      </div>

      {/* Article Content */}
      <section className="py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.article initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }} className="prose-lg">
            {renderContent(post.content)}
          </motion.article>

          {/* Share + Author */}
          <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={IMAGES.logoWhite} alt="Hygiene Maids" className="h-10 w-10 rounded-full object-contain bg-white border border-gray-100 p-1" />
              <div>
                <p className="text-sm font-semibold text-[#0C1829]">Hygiene Maids Team</p>
                <p className="text-xs text-gray-500">Professional Cleaning Experts</p>
              </div>
            </div>
            <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 hover:text-[#0D9488] border border-gray-200 rounded-lg transition-colors">
              <Share2 size={14} /> Share
            </button>
          </div>
        </div>
      </section>

      {/* Related Posts */}
      <section className="py-12 bg-[#FAFAF8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-[#0C1829] mb-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            More Articles
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {relatedPosts.map((rp) => (
              <Link key={rp.slug} href={`/blog/${rp.slug}`}>
                <div className="bg-white rounded-xl overflow-hidden border border-gray-100 group cursor-pointer hover:shadow-lg transition-all duration-300">
                  <div className="h-40 overflow-hidden">
                    <img
                      src={IMAGES[rp.image as keyof typeof IMAGES]}
                      alt={rp.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#0D9488]/10 text-[#0D9488] text-xs font-semibold">{rp.category}</span>
                    <h3 className="mt-2 text-base font-bold text-[#0C1829] group-hover:text-[#0D9488] transition-colors leading-snug" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {rp.title}
                    </h3>
                    <div className="mt-3 flex items-center gap-1 text-sm font-semibold text-[#0D9488]">
                      Read <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        title="Ready to Experience Professional Cleaning?"
        subtitle="Let the experts handle the cleaning while you enjoy your free time."
      />
</div>
  );
}
