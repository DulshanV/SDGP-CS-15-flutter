export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import AdminDashboard from "./PageClient";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description:
    "CeylonHS administration panel. Manage users, synonyms, training data, and system configuration.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <AdminDashboard />;
}
