"use client";
/*
 * Breadcrumbs — SEO-optimized with JSON-LD BreadcrumbList schema
 * Renders both visible breadcrumb trail and structured data
 */
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { useEffect } from "react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  const allItems = [{ label: "Home", href: "/" }, ...items];

  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: allItems.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.label,
        ...(item.href ? { item: `https://hygienemaids.com${item.href}` } : {}),
      })),
    };

    const id = "breadcrumb-schema";
    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = id;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schema);

    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }, [allItems]);

  return (
    <nav aria-label="Breadcrumb" className={`${className}`}>
      <ol className="flex items-center flex-wrap gap-1 text-sm" itemScope itemType="https://schema.org/BreadcrumbList">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          return (
            <li
              key={index}
              className="flex items-center gap-1"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {index > 0 && <ChevronRight size={14} className="text-gray-400 mx-0.5" />}
              {isLast ? (
                <span className="text-gray-500 font-medium" itemProp="name">
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className="text-[#0D9488] hover:text-[#0B8278] transition-colors font-medium flex items-center gap-1"
                  itemProp="item"
                >
                  {index === 0 && <Home size={14} />}
                  <span itemProp="name">{item.label}</span>
                </Link>
              ) : (
                <span className="text-gray-500" itemProp="name">{item.label}</span>
              )}
              <meta itemProp="position" content={String(index + 1)} />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
