"use client";
/*
 * Blog — Hygiene Maids Luxury Premium
 * Blog listing page with category filters, SEO-rich articles
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { IMAGES, BLOG_POSTS } from "@/lib/constants";
import { Calendar, Clock, ArrowRight, BookOpen, Search } from "lucide-react";
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

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");



  const categories = ["All", ...Array.from(new Set(BLOG_POSTS.map((p) => p.category)))];

  const filteredPosts = BLOG_POSTS.filter((post) => {
    const matchCategory = activeCategory === "All" || post.category === activeCategory;
    const matchSearch = !searchQuery || post.title.toLowerCase().includes(searchQuery.toLowerCase()) || post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

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
              <BookOpen size={14} /> HYGIENE MAIDS BLOG
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Cleaning Tips & <span className="text-[#0D9488]">Expert Advice</span>
            </h1>
            <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
              Professional insights from DFW's top-rated cleaning service. Tips, guides, and advice to keep your home spotless.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Breadcrumbs */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Breadcrumbs items={[{ label: "Blog" }]} />
      </div>

      {/* Filters + Posts */}
      <section className="py-16 lg:py-20 bg-[#FAFAF8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search + Filters */}
          <FadeIn>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-10">
              <div className="flex flex-wrap gap-2 justify-center">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      activeCategory === cat
                        ? "bg-[#0D9488] text-white shadow-lg shadow-[#0D9488]/25"
                        : "bg-white text-[#0C1829] border border-gray-200 hover:border-[#0D9488]/30"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="relative w-full sm:w-auto">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-10 pr-4 py-2.5 rounded-lg bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent"
                />
              </div>
            </div>
          </FadeIn>

          {/* Featured Post */}
          {filteredPosts.length > 0 && activeCategory === "All" && !searchQuery && (
            <FadeIn>
              <Link href={`/blog/${filteredPosts[0].slug}`}>
                <div className="grid lg:grid-cols-2 gap-0 bg-white rounded-2xl overflow-hidden border border-gray-100 mb-12 group cursor-pointer hover:shadow-lg transition-shadow duration-300">
                  <div className="h-64 lg:h-auto overflow-hidden">
                    <img
                      src={IMAGES[filteredPosts[0].image as keyof typeof IMAGES]}
                      alt={filteredPosts[0].title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-8 lg:p-10 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 rounded-full bg-[#0D9488]/10 text-[#0D9488] text-xs font-semibold">{filteredPosts[0].category}</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar size={12} /> {new Date(filteredPosts[0].date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-[#0C1829] group-hover:text-[#0D9488] transition-colors" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {filteredPosts[0].title}
                    </h2>
                    <p className="mt-3 text-gray-600 leading-relaxed">{filteredPosts[0].excerpt}</p>
                    <div className="mt-6 flex items-center gap-4">
                      <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12} /> {filteredPosts[0].readTime}</span>
                      <span className="text-sm font-semibold text-[#0D9488] flex items-center gap-1 group-hover:gap-2 transition-all">
                        Read Article <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </FadeIn>
          )}

          {/* Post Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(activeCategory === "All" && !searchQuery ? filteredPosts.slice(1) : filteredPosts).map((post, i) => (
              <FadeIn key={post.slug} delay={i * 0.05}>
                <Link href={`/blog/${post.slug}`}>
                  <div className="bg-white rounded-xl overflow-hidden border border-gray-100 group cursor-pointer hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                    <div className="h-48 overflow-hidden">
                      <img
                        src={IMAGES[post.image as keyof typeof IMAGES]}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#0D9488]/10 text-[#0D9488] text-xs font-semibold">{post.category}</span>
                        <span className="text-xs text-gray-400">{post.readTime}</span>
                      </div>
                      <h3 className="text-lg font-bold text-[#0C1829] group-hover:text-[#0D9488] transition-colors leading-snug" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        {post.title}
                      </h3>
                      <p className="mt-2 text-sm text-gray-500 leading-relaxed flex-1">{post.excerpt}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar size={12} /> {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        <span className="text-sm font-semibold text-[#0D9488] flex items-center gap-1 group-hover:gap-2 transition-all">
                          Read <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-16">
              <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No articles found.</p>
              <button onClick={() => { setSearchQuery(""); setActiveCategory("All"); }} className="mt-3 text-[#0D9488] font-medium hover:underline">
                View all articles
              </button>
            </div>
          )}
        </div>
      </section>

      <CTASection
        title="Want a Spotless Home?"
        subtitle="Skip the DIY — let the professionals handle it. Book your cleaning today."
      />
</div>
  );
}
