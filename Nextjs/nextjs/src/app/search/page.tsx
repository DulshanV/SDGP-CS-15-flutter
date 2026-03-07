export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import SearchPage from "./PageClient";

export const metadata: Metadata = {
  title: "Search HS Codes",
  description:
    "Find the right Harmonized System code for any product. AI-powered semantic search across 16,000+ HS codes with instant results and confidence scoring.",
  openGraph: {
    title: "Search HS Codes | CeylonHS",
    description:
      "AI-powered HS code search across 16,000+ codes. Get instant, accurate trade classification results.",
    url: "https://ceylonhs.com/search",
  },
  alternates: {
    canonical: "https://ceylonhs.com/search",
  },
};

export default function Page() {
  return <SearchPage />;
}
