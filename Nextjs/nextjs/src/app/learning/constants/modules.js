// ─────────────────────────────────────────────────────────────
// constants/modules.js
// CeylonHS Academy — Module definitions
// Import: import { MODULES } from "@/constants/modules";
// ─────────────────────────────────────────────────────────────

export const MODULES = [
  {
    id: 1,
    code: "M01",
    title: "Introduction to HS Codes",
    subtitle: "Why trade classification matters",
    icon: "🌐",
    color: "#2563EB",
    duration: "8 min",
    lessons: 4,
    category: "Foundation",
    topics: [
      {
        id: "1a",
        title: "What is an HS Code?",
        duration: "2 min",
        content: {
          heading: "Harmonized System (HS) Codes Explained",
          body: "The Harmonized System is a standardized numerical method of classifying traded products. It is used by customs authorities around the world to identify products when assessing duties and taxes and for gathering statistics. Developed and maintained by the World Customs Organization (WCO), it is used by more than 200 countries as the basis for their customs tariffs and for the collection of international trade statistics.",
          highlight: "HS codes are 6-digit numbers used globally to classify every product traded internationally.",
          points: [
            "Used in 200+ countries worldwide",
            "First 6 digits are internationally standardized",
            "Updated every 5 years by the WCO",
            "Essential for customs clearance and duty calculation",
          ],
        },
      },
      {
        id: "1b",
        title: "Structure of an HS Code",
        duration: "2 min",
        content: {
          heading: "Breaking Down the 6-Digit Hierarchy",
          body: "An HS code is built hierarchically. The first two digits represent the Chapter, the next two digits the Heading, and the final two digits the Subheading. For example, 8471.30 — Chapter 84 (Machinery), Heading 8471 (Computers), Subheading 847130 (Portable computers).",
          highlight: "Chapter (2) → Heading (4) → Subheading (6)",
          points: [
            "21 Sections covering all product types",
            "99 Chapters for broad categories",
            "1,244 Headings for specific product types",
            "5,224+ Subheadings at 6-digit precision",
          ],
        },
      },
      {
        id: "1c",
        title: "Why HS Codes Matter for Business",
        duration: "2 min",
        content: {
          heading: "Business Impact of Correct Classification",
          body: "Using the wrong HS code can result in penalties, delays, and overpayment of duties. Correct classification opens doors to trade agreements, preferential tariff rates, and smooth customs clearance. In Sri Lanka alone, misclassification is one of the top causes of cargo delays at Colombo port.",
          highlight: "Correct HS codes save money, time, and legal risk.",
          points: [
            "Avoid customs penalties and fines",
            "Access preferential duty rates under FTAs",
            "Speed up customs clearance",
            "Ensure regulatory compliance",
          ],
        },
      },
      {
        id: "1d",
        title: "Global Trade & Sri Lanka Context",
        duration: "2 min",
        content: {
          heading: "HS Codes in the Sri Lankan Trade Ecosystem",
          body: "Sri Lanka's Department of Customs uses the HS system aligned with the ASEAN Harmonized Tariff Nomenclature (AHTN). CeylonHS was built specifically to serve Sri Lankan traders, customs brokers, and logistics professionals, covering all 16,000+ HS codes relevant to Sri Lanka.",
          highlight: "CeylonHS is purpose-built for Sri Lanka's trade landscape.",
          points: [
            "Sri Lanka Customs uses 8-digit HS codes",
            "ASEAN AHTN alignment for regional trade",
            "CeylonHS indexes 16,000+ local codes",
            "Real-time updates from WCO revisions",
          ],
        },
      },
    ],
  },

  {
    id: 2,
    code: "M02",
    title: "Searching HS Codes with AI",
    subtitle: "Master the hybrid AI search engine",
    icon: "🔍",
    color: "#7C3AED",
    duration: "10 min",
    lessons: 4,
    category: "Core Skills",
    topics: [
      {
        id: "2a",
        title: "Your First Search",
        duration: "2 min",
        content: {
          heading: "Getting Started with CeylonHS Search",
          body: "Navigate to the Search page from the top navigation. The search bar accepts natural language — you don't need to know the code already. Type what you're looking for in plain English: product names, descriptions, brand names, or even partial terms.",
          highlight: "Just type what you're looking for — CeylonHS does the rest.",
          points: [
            "Go to ceylonhs.com and click 'Start Searching Free'",
            "Type a product name, brand, or description",
            "Results appear in under 100ms",
            "Click any result to see the full HS hierarchy",
          ],
        },
      },
      {
        id: "2b",
        title: "Using Natural Language Queries",
        duration: "3 min",
        content: {
          heading: "How to Write Effective Search Queries",
          body: "CeylonHS understands natural language. Instead of searching 'electrical appliance heating element 230V', you can just type 'electric kettle' or even 'Breville kettle'. The semantic AI understands context and product categories, not just keywords.",
          highlight: "The more specific your description, the more precise the result.",
          points: [
            "✅ 'wooden dining chairs' → HS 9401.61",
            "✅ 'Samsung Galaxy phone' → HS 8517.12",
            "✅ 'coconut oil cooking' → HS 1513.11",
            "✅ 'Dilmah tea bags' → HS 0902.30",
          ],
        },
      },
      {
        id: "2c",
        title: "Understanding Search Results",
        duration: "3 min",
        content: {
          heading: "Reading the Results Panel",
          body: "Each result card shows the 6-digit HS code, the official description, the confidence score, and the full hierarchy path (Section → Chapter → Heading → Subheading). The top result is almost always the correct classification. Click 'View Details' to expand the full code tree.",
          highlight: "Green confidence badges mean 95%+ accuracy. Yellow means review recommended.",
          points: [
            "HS Code: The 6-digit classification number",
            "Description: Official WCO product description",
            "Confidence: AI certainty score (0-100%)",
            "Hierarchy: Full path from Section to Subheading",
          ],
        },
      },
      {
        id: "2d",
        title: "Advanced Search Filters",
        duration: "2 min",
        content: {
          heading: "Refining Your Search Results",
          body: "Use the filter panel on the right to narrow results by Chapter, Section, or confidence threshold. The autocomplete suggestions help you find the right terminology. Typo tolerance means 'coco noodles' will still find coconut products even with the typo.",
          highlight: "Filters help when a product falls in multiple categories.",
          points: [
            "Filter by Section (e.g., Section XI: Textiles)",
            "Filter by Chapter for broad category",
            "Set minimum confidence threshold",
            "Use autocomplete for WCO terminology",
          ],
        },
      },
    ],
  },

  {
    id: 3,
    code: "M03",
    title: "AI-Powered Classification",
    subtitle: "Understand the hybrid AI pipeline",
    icon: "🤖",
    color: "#059669",
    duration: "12 min",
    lessons: 4,
    category: "Core Skills",
    topics: [
      {
        id: "3a",
        title: "How the AI Engine Works",
        duration: "3 min",
        content: {
          heading: "The Hybrid AI Pipeline Explained",
          body: "CeylonHS uses a three-layer hybrid approach: First, Typesense keyword search finds exact and fuzzy matches at sub-10ms. Second, semantic embedding models understand product context and meaning. Third, Gemini Flash enrichment resolves brand names and unknown products in real-time.",
          highlight: "Three AI layers working together = 99% classification accuracy.",
          points: [
            "Layer 1: Typesense keyword + typo-tolerant search",
            "Layer 2: Semantic embeddings for context understanding",
            "Layer 3: Gemini Flash for real-time brand enrichment",
            "Combined result in under 100ms total",
          ],
        },
      },
      {
        id: "3b",
        title: "Smart Brand Recognition",
        duration: "3 min",
        content: {
          heading: "How CeylonHS Resolves Brand Names",
          body: "When you type 'Dilmah', CeylonHS doesn't just do keyword matching. It triggers Gemini Flash enrichment to identify Dilmah as a Sri Lankan tea brand, then classifies it under the appropriate tea HS code. This brand resolution works for thousands of local and global brands.",
          highlight: "Type any brand name — we know what it is.",
          points: [
            "Recognizes 10,000+ brand names globally",
            "Resolves Sri Lankan local brands specifically",
            "Falls back to semantic search for unknown brands",
            "Continuously learns from new classifications",
          ],
        },
      },
      {
        id: "3c",
        title: "Confidence Scores Explained",
        duration: "3 min",
        content: {
          heading: "Understanding AI Confidence in Classification",
          body: "Every result includes a confidence score. 95%+ (green) means the AI is highly certain. 80-95% (yellow) means the product could belong to multiple categories — review the hierarchy. Below 80% (orange) means the description was ambiguous — try adding more details to your query.",
          highlight: "Low confidence? Add more product details for better results.",
          points: [
            "95-100%: High confidence, safe to use",
            "80-95%: Review the full hierarchy path",
            "60-80%: Refine your search description",
            "Below 60%: Consult a customs broker",
          ],
        },
      },
      {
        id: "3d",
        title: "When AI Gets It Wrong",
        duration: "3 min",
        content: {
          heading: "Handling Edge Cases and Ambiguous Products",
          body: "Some products genuinely fall in multiple HS categories depending on their primary use. A wooden spoon used in cooking is different from one used as a toy. In these cases, CeylonHS shows multiple candidates with confidence scores. You can also report misclassifications to improve the model.",
          highlight: "Use case determines classification for multi-purpose products.",
          points: [
            "Review 'Alternative Classifications' section",
            "Consider the product's primary use/function",
            "Check the official WCO notes for the chapter",
            "Use the feedback button to report errors",
          ],
        },
      },
    ],
  },

  {
    id: 4,
    code: "M04",
    title: "Favourites & History",
    subtitle: "Organize your code library",
    icon: "⭐",
    color: "#D97706",
    duration: "8 min",
    lessons: 3,
    category: "Productivity",
    topics: [
      {
        id: "4a",
        title: "Saving to Favourites",
        duration: "2 min",
        content: {
          heading: "Building Your Personal HS Code Library",
          body: "Click the star icon on any search result to save it to your Favourites. Saved codes are organized by the date you saved them and can be tagged with custom labels. This is perfect for importers and exporters who work with the same set of products regularly.",
          highlight: "Build a personal library of codes you use most.",
          points: [
            "Click ⭐ on any result to save it",
            "Access all saved codes from the Favourites tab",
            "Add custom tags like 'electronics' or 'urgent'",
            "Export your favourites as CSV for customs declarations",
          ],
        },
      },
      {
        id: "4b",
        title: "Using Search History",
        duration: "3 min",
        content: {
          heading: "Your Complete Search History",
          body: "Every search you perform is automatically saved to your History tab (when logged in). You can re-run past searches with one click, see which codes you've previously verified, and track how your classification needs evolve over time.",
          highlight: "Your search history is your audit trail for compliance.",
          points: [
            "Full searchable history of all past queries",
            "Re-run any past search with one click",
            "Filter history by date range or code",
            "Export history as PDF for audit purposes",
          ],
        },
      },
      {
        id: "4c",
        title: "Organising Collections",
        duration: "3 min",
        content: {
          heading: "Creating Collections for Different Projects",
          body: "Group your saved codes into Collections — for example, 'Electronics Import Q1 2026' or 'Textile Export Codes'. Collections can be shared with team members, exported as spreadsheets, or used as templates for recurring shipments.",
          highlight: "Collections make batch declarations effortless.",
          points: [
            "Create named collections for projects/shipments",
            "Add notes to each code in a collection",
            "Share collections via link with your team",
            "One-click export to Excel for declarations",
          ],
        },
      },
    ],
  },

  {
    id: 5,
    code: "M05",
    title: "Using the AI Chatbot",
    subtitle: "Your 24/7 customs classification assistant",
    icon: "💬",
    color: "#DC2626",
    duration: "10 min",
    lessons: 3,
    category: "Advanced",
    topics: [
      {
        id: "5a",
        title: "Introduction to the Chatbot",
        duration: "3 min",
        content: {
          heading: "Meet Your AI Classification Assistant",
          body: "The CeylonHS chatbot (the blue bubble at the bottom right) is powered by a specialized customs AI. Unlike general chatbots, it has deep knowledge of the WCO HS nomenclature, Sri Lanka Customs regulations, and trade compliance. It can classify products, explain duty rates, and guide you through complex edge cases.",
          highlight: "The chatbot knows HS codes better than most customs brokers.",
          points: [
            "Click the 💬 bubble at bottom-right to open",
            "Ask classification questions in plain English",
            "Get duty rate estimates for Sri Lanka",
            "Ask about trade agreement eligibility",
          ],
        },
      },
      {
        id: "5b",
        title: "Effective Chatbot Queries",
        duration: "4 min",
        content: {
          heading: "How to Ask the Right Questions",
          body: "The chatbot performs best when you give it context. Instead of 'what code is this?', say 'I'm importing 500 units of men's cotton t-shirts from India, what HS code should I use and what duties apply?'. The more context, the more specific the answer.",
          highlight: "Give context: product + use + origin country = perfect answer.",
          points: [
            "✅ 'HS code for importing LED TVs from China?'",
            "✅ 'What duties apply for HS 8471.30 in Sri Lanka?'",
            "✅ 'Difference between HS 0902.10 and 0902.30?'",
            "✅ 'Does ISFTA apply to my coconut oil import?'",
          ],
        },
      },
      {
        id: "5c",
        title: "Chatbot for Complex Scenarios",
        duration: "3 min",
        content: {
          heading: "Handling Complex Classification Scenarios",
          body: "Some products require deeper analysis — kits, sets, composite machines, or products with multiple functions. The chatbot can walk you through the WCO General Rules of Interpretation (GRI) to arrive at the correct code. It can also explain why a product falls in one category over another.",
          highlight: "For ambiguous cases, the chatbot explains its reasoning.",
          points: [
            "Ask about composite goods classification",
            "Request GRI rule explanations",
            "Get chapter notes and legal notes",
            "Ask for 'alternative codes' if uncertain",
          ],
        },
      },
    ],
  },
];
