export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import HistoryPage from "./PageClient";

export const metadata: Metadata = {
  title: "Search History",
  description:
    "Review your past HS code searches. Revisit previous product classifications and export your search history.",
  openGraph: {
    title: "Search History | CeylonHS",
    description:
      "Revisit your past HS code searches and product classifications.",
    url: "https://ceylonhs.com/history",
  },
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: "https://ceylonhs.com/history",
  },
};

export default function Page() {
  return <HistoryPage />;
}
