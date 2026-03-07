import type { Metadata } from 'next';
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Search HS Codes',
  description: 'Classify your products to find accurate 6-digit HS codes using AI.',
  keywords: 'hs codes, search hs code, trade classification, customs code, AI hs code generator',
  openGraph: {
    title: 'Search HS Codes | CeylonHS',
    description: 'Find the accurate HS code for your product instantly.',
    images: [{ url: '/og-search.png', width: 1200, height: 630 }],
  }
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  'itemListElement': [
    { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://ceylonhs.com/' },
    { '@type': 'ListItem', 'position': 2, 'name': 'Search', 'item': 'https://ceylonhs.com/search' }
  ]
};

import SearchPage from "./PageClient";
export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SearchPage />
    </>
  );
}
