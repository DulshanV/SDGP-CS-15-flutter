export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import FavoritesPage from "./PageClient";

export const metadata: Metadata = {
  title: "Saved HS Codes",
  description:
    "View and manage your saved Harmonized System codes. Quickly access frequently used trade classifications from your favourites list.",
  openGraph: {
    title: "Saved HS Codes | CeylonHS",
    description:
      "Manage your saved HS codes and frequently used trade classifications.",
    url: "https://ceylonhs.com/favorites",
  },
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: "https://ceylonhs.com/favorites",
  },
};

export default function Page() {
  return <FavoritesPage />;
}
