# CeylonHS Frontend — Next.js 16 + React 19

Modern, responsive web interface for CeylonHS HS code search platform. Built with Next.js App Router, TypeScript, Tailwind CSS, and Framer Motion.

## 🔧 Setup

### Prerequisites
- Node.js 20+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Edit .env.local with your Firebase config
```

### Environment Variables

Create `.env.local` with the following:

```bash
# -- Firebase Authentication --
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1087856269110
NEXT_PUBLIC_FIREBASE_APP_ID=1:1087856269110:web:669a4fb469208428abc597

# -- Backend API --
# Leave empty for production (uses relative URLs via nginx proxy)
# Set to http://127.0.0.1:8000 for local development
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000

# -- EmailJS (Welcome Emails) --
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_...
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_...
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=...
```

## 🚀 Running the App

### Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### Production Build
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

### Testing
```bash
npm test              # Run once
npm run test:watch    # Watch mode
```

## 📁 Project Structure

```
src/
├── app/                    # App Router pages
│   ├── layout.tsx             # Root layout (Firebase, fonts)
│   ├── page.tsx               # Landing page (SSG)
│   ├── search/                # Search UI
│   │   ├── page.tsx              # Server component wrapper
│   │   └── PageClient.tsx        # Client component (search logic)
│   ├── admin/                 # Admin dashboard
│   │   ├── page.tsx              # Server component wrapper
│   │   └── PageClient.tsx        # Client component (tabs, stats)
│   ├── login/                 # Authentication pages
│   │   ├── page.tsx
│   │   └── PageClient.tsx
│   ├── register/
│   ├── history/               # Search history
│   ├── favorites/             # Bookmarked HS codes
│   └── hscode/[hscode]/       # Dynamic HS code detail page
│
├── components/
│   ├── landing/               # Landing page sections
│   │   ├── Hero.tsx              # Hero section + CTA
│   │   ├── HeroCanvas.tsx        # Three.js animated background
│   │   ├── Features.tsx          # Feature cards
│   │   ├── HowItWorks.tsx        # Step-by-step guide
│   │   ├── Stats.tsx             # Animated statistics
│   │   ├── Pricing.tsx           # Pricing tiers
│   │   ├── Testimonials.tsx      # User testimonials
│   │   ├── Team.tsx              # Team member cards
│   │   ├── CTASection.tsx        # Call-to-action banner
│   │   ├── Footer.tsx            # Site footer
│   │   └── LandingNav.tsx        # Landing page navbar
│   └── __tests__/             # Component tests
│
├── lib/
│   ├── firebase.ts            # Firebase config + auth instance
│   ├── api.ts                 # Public API client functions
│   └── adminApi.ts            # Admin API client functions
│
├── tests/
│   └── setup.ts               # Vitest configuration
│
└── styles/
    └── globals.css            # Global styles + Tailwind
```

## 🎨 Key Features

### Landing Page
- **10 sections**: Hero, Features, How It Works, Stats, Pricing, Testimonials, Team, CTA, Footer
- **Three.js canvas**: Animated shoreline + morphing product labels
- **SEO optimized**: Meta tags, JSON-LD, Open Graph, Twitter Cards
- **Static generation**: Pre-rendered at build time for fast load

### Search Interface
- **Real-time search**: As-you-type with debounce
- **Enriched results**: AI-generated product context
- **Filters**: By chapter, relevance score
- **Pagination**: 10 results per page
- **Export**: Download results as CSV

### Admin Dashboard
- **5 tabs**: Overview, Training Pairs, Search Logs, Synonyms, Datasets
- **Stats**:
  - Total users, searches, searches today
  - Trend charts (TODO)
- **Training data**: Approve/reject/delete pairs for model fine-tuning
- **Synonyms**: Manage brand→keyword mappings (e.g., "Dilmah" → "tea")
- **Datasets**: Upload CSV, monitor embedding progress

### Authentication
- **Firebase Auth**: Email/password
- **Password reset**: Via Firebase email
- **Protected routes**: Auto-redirect to /login if not authenticated
- **User profile**: Display name, email, role

### User Features
- **Search history**: Paginated list of past queries
- **Favorites**: Bookmark HS codes for quick access
- **Profile**: View user info (edit TODO in Sprint 3)

## 🧩 Technical Details

### App Router (Next.js 16)
Uses Server Components by default:
- `page.tsx` — Server Component (for SEO, static generation)
- `PageClient.tsx` — Client Component (for interactivity)

Example:
```tsx
// app/search/page.tsx (Server Component)
export default function SearchPage() {
  return <PageClient />;
}

// app/search/PageClient.tsx (Client Component)
'use client';
export default function PageClient() {
  const [query, setQuery] = useState('');
  // ... interactive logic
}
```

### API Client Pattern

**Public endpoints** ([lib/api.ts](src/lib/api.ts)):
```ts
export async function searchHSCodes(query: string, limit = 10) {
  const { data } = await axios.get(`${BASE_URL}/api/v1/search`, {
    params: { q: query, limit },
    headers: await getAuthHeaders(),  // Optional Firebase token
  });
  return data;
}
```

**Admin endpoints** ([lib/adminApi.ts](src/lib/adminApi.ts)):
```ts
export async function getAdminStats() {
  const { data } = await axios.get(`${BASE}/api/v1/admin/stats`, {
    headers: await authHeaders(),  // Required Firebase token
  });
  return data;
}
```

### Authentication Flow
1. User logs in via Firebase SDK
2. `auth.currentUser.getIdToken()` → JWT
3. Send JWT in `Authorization: Bearer {token}` header
4. Backend verifies token via Firebase Admin SDK

### State Management
Currently uses local state (useState, useEffect). Future: Consider Zustand or React Context for global state.

### Styling
**Tailwind CSS v4** with custom theme:
```css
@import "tailwindcss";

@theme {
  --color-ceylon-blue: oklch(0.5 0.2 250);
  --color-ceylon-gold: oklch(0.7 0.15 80);
}
```

### Animations
**Framer Motion**:
- Landing page: Fade-in, slide-up on scroll
- Search results: Stagger animation
- Admin dashboard: Number counters

**Three.js** (Hero Canvas):
- 3-layer shoreline gradient
- 6 floating labels with product→HS code morphing
- Mouse parallax effect

## 🧪 Testing

### Test Structure
```
src/
├── lib/__tests__/
│   └── api.test.ts                # API client tests
└── components/landing/__tests__/
    └── Hero.test.tsx              # Component tests
```

### Running Tests
```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
```

### Example Test
```tsx
// src/components/landing/__tests__/Hero.test.tsx
import { render, screen } from '@testing-library/react';
import Hero from '../Hero';

describe('Hero Component', () => {
  it('renders main heading', () => {
    render(<Hero />);
    expect(screen.getByRole('heading', { name: /Find Your HS Code/i }))
      .toBeInTheDocument();
  });
});
```

## 🔒 Security

### Environment Variables
**Never commit `.env.local`** — it contains Firebase credentials.

Use `NEXT_PUBLIC_*` prefix for client-side vars:
- ✅ `NEXT_PUBLIC_API_URL` — exposed to browser
- ❌ `SECRET_API_KEY` — server-only (not accessible in browser)

### CORS
Backend must allow frontend domain in `CORS_ORIGINS` env var.

### Rate Limiting
Enforced by backend (SlowAPI). Frontend shows error on 429.

## 🚢 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Add environment variables in Vercel dashboard.

### PM2 (Manual)
```bash
npm run build
pm2 start npm --name "ceylonhs-frontend" -- start
pm2 save
```

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🐛 Common Issues

### Firebase Auth Errors
```bash
# Check Firebase config in .env.local
# Ensure domain is authorized in Firebase Console
```

### API Connection Failed
```bash
# Check NEXT_PUBLIC_API_URL points to running backend
curl http://127.0.0.1:8000/health
```

### Build Errors (Out of Memory)
```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Hydration Errors
Server/client mismatch — ensure:
- No `document`/`window` access in Server Components
- Use `useEffect` for client-only logic
- Check for incorrect nesting (e.g., `<p>` inside `<p>`)

## 📖 Further Reading

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [Firebase Auth](https://firebase.google.com/docs/auth/web/start)

---

**Need help?** Open an issue or contact hello@ceylonhs.com
