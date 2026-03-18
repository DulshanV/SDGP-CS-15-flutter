import { ImageResponse } from 'next/og';

/**
 * Dynamic OG Image Generation
 * 
 * Uses Next.js Image Response API to generate Open Graph images
 * Automatically served at /opengraph-image for meta tags
 * 
 * Size: 1200x630 (recommended OG image dimensions)
 */
export const runtime = 'edge';
export const alt = 'CeylonHS - AI-Powered HS Code Search Platform';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Logo/Brand Area */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              fontSize: '80px',
              fontWeight: 'bold',
              color: '#fff',
              letterSpacing: '-0.02em',
            }}
          >
            CeylonHS
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '40px',
            color: '#e0e7ff',
            textAlign: 'center',
            maxWidth: '900px',
            lineHeight: '1.3',
            marginBottom: '30px',
          }}
        >
          AI-Powered HS Code Search Platform
        </div>

        {/* Feature Highlights */}
        <div
          style={{
            display: 'flex',
            gap: '30px',
            marginTop: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '24px',
              color: '#dbeafe',
            }}
          >
            ⚡ Instant Search
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '24px',
              color: '#dbeafe',
            }}
          >
            🤖 AI-Enriched Results
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '24px',
              color: '#dbeafe',
            }}
          >
            🎯 9,963 HS Codes
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            fontSize: '20px',
            color: '#93c5fd',
          }}
        >
          ceylonhs.com
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
