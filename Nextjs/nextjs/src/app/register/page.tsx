export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Register from "./PageClient";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Join CeylonHS for free and unlock AI-powered HS code search, saved favourites, search history, and smart trade classification tools.",
  openGraph: {
    title: "Create Account | CeylonHS",
    description:
      "Sign up for free AI-powered HS code search and trade classification.",
    url: "https://ceylonhs.com/register",
  },
  alternates: {
    canonical: "https://ceylonhs.com/register",
  },
};

export default function Page() {
  return <Register />;
}
