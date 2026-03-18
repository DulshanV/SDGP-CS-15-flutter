import type { Metadata } from 'next';
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create a CeylonHS account to save your favorite HS codes and access your search history.',
  keywords: 'register, create account, sign up, CeylonHS, HS codes, save favorites',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  'itemListElement': [
    { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://ceylonhs.com/' },
    { '@type': 'ListItem', 'position': 2, 'name': 'Create Account', 'item': 'https://ceylonhs.com/register' }
  ]
};

import Register from "./PageClient";
export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Register />
    </>
  );
}
