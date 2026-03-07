export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Login from "./PageClient";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to your CeylonHS account to access saved HS codes, search history, and personalised trade classification tools.",
  openGraph: {
    title: "Sign In | CeylonHS",
    description:
      "Access your CeylonHS account for saved codes, search history, and more.",
    url: "https://ceylonhs.com/login",
  },
  alternates: {
    canonical: "https://ceylonhs.com/login",
  },
};

export default function Page() {
  return <Login />;
}
