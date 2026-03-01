import type { Metadata } from "next";

import LandingNav from "@/components/landing/LandingNav";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Stats from "@/components/landing/Stats";
import Pricing from "@/components/landing/Pricing";
import Testimonials from "@/components/landing/Testimonials";
import Team from "@/components/landing/Team";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

/* ================================================================
   SEO — Comprehensive metadata for crawlers & social sharing
   ================================================================ */

export const metadata: Metadata = {
  metadataBase: new URL("https://ceylonhs.com"),
  title: {
    default: "CeylonHS — AI-Powered HS Code Search & Trade Classification",
    template: "%s | CeylonHS",
  },
  description:
    "Classify products to 6-digit HS codes in seconds with AI-powered hybrid search. Smart brand recognition, 16,000+ codes, sub-second results. Built for Sri Lankan and global trade.",
  keywords: [
    "HS code search",
    "harmonized system classifier",
    "trade classification",
    "customs tariff lookup",
    "HS code finder",
    "AI trade compliance",
    "Sri Lanka customs",
    "product classification",
    "CeylonHS",
    "HS code lookup",
    "customs code search",
    "trade compliance software",
  ],
  authors: [{ name: "CeylonHS Team" }],
  creator: "CeylonHS",
  publisher: "CeylonHS",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ceylonhs.com",
    siteName: "CeylonHS",
    title: "CeylonHS — AI-Powered HS Code Search & Trade Classification",
    description:
      "Classify products to 6-digit HS codes in seconds with AI-powered hybrid search. Smart brand recognition, 16,000+ codes, sub-second results.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CeylonHS — AI-Powered HS Code Classification",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CeylonHS — AI-Powered HS Code Search",
    description:
      "Classify products to 6-digit HS codes in seconds. Smart brand recognition, 16,000+ codes.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://ceylonhs.com",
  },
};

/* ================================================================
   JSON-LD — Structured data for rich search results
   ================================================================ */

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "CeylonHS",
      url: "https://ceylonhs.com",
      description:
        "AI-powered Harmonized System code search and classification engine for international trade.",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://ceylonhs.com/search?query={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "SoftwareApplication",
      name: "CeylonHS",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "AI-powered Harmonized System code classification for international trade. Hybrid search with brand recognition.",
      offers: {
        "@type": "AggregateOffer",
        lowPrice: "3",
        highPrice: "9",
        priceCurrency: "USD",
        offerCount: "3",
      },
    },
    {
      "@type": "Organization",
      name: "CeylonHS",
      url: "https://ceylonhs.com",
      logo: "https://ceylonhs.com/logo.png",
      // sameAs: [] — add verified social profile URLs here when they exist
      contactPoint: {
        "@type": "ContactPoint",
        email: "hello@ceylonhs.com",
        contactType: "customer service",
      },
    },
  ],
};

/* ================================================================
   Page — Server component (no "use client") for SEO-first rendering
   ================================================================ */

export default function Home() {
  return (
    <>
      {/* Structured data for search engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <LandingNav />

      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Stats />
        <Pricing />
        <Testimonials />
        <Team />
        <CTASection />
      </main>

      <Footer />
    </>
  );
}
