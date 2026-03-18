import type { Metadata } from 'next';
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Log In',
  description: 'Log in to your CeylonHS account to save your favorite HS codes and access your search history.',
  keywords: 'login, account, sign in, CeylonHS, HS codes, trade classification',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  'itemListElement': [
    { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://ceylonhs.com/' },
    { '@type': 'ListItem', 'position': 2, 'name': 'Log In', 'item': 'https://ceylonhs.com/login' }
  ]
};

import Login from "./PageClient";
export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Login />
    </>
  );
}
