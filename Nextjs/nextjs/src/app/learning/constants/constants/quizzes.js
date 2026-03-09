// ─────────────────────────────────────────────────────────────
// constants/quizzes.js
// CeylonHS Academy — Quiz questions keyed by module ID
// Import: import { QUIZ_BANK } from "@/constants/quizzes";
// ─────────────────────────────────────────────────────────────

export const QUIZ_BANK = {
  // ── Module 1 · Introduction to HS Codes ──────────────────
  1: [
    {
      q: "How many digits are in a standard international HS code?",
      options: ["4", "6", "8", "10"],
      answer: 1, // "6"
    },
    {
      q: "Which organization maintains the Harmonized System?",
      options: ["WTO", "IMF", "WCO", "UN"],
      answer: 2, // "WCO"
    },
    {
      q: "What do the first 2 digits of an HS code represent?",
      options: ["Section", "Chapter", "Heading", "Subheading"],
      answer: 1, // "Chapter"
    },
  ],

  // ── Module 2 · Searching HS Codes with AI ────────────────
  2: [
    {
      q: "What search technology does CeylonHS use for fast results?",
      options: ["Elasticsearch", "Typesense", "Solr", "Algolia"],
      answer: 1, // "Typesense"
    },
    {
      q: "What does a green confidence badge indicate?",
      options: ["50%+ accuracy", "75%+ accuracy", "95%+ accuracy", "100% accuracy"],
      answer: 2, // "95%+ accuracy"
    },
    {
      q: "Which query style works BEST with CeylonHS?",
      options: ["HS numbers only", "Natural language descriptions", "Latin product names", "Only English"],
      answer: 1, // "Natural language descriptions"
    },
  ],

  // ── Module 3 · AI-Powered Classification ─────────────────
  3: [
    {
      q: "Which AI model does CeylonHS use for brand enrichment?",
      options: ["GPT-4", "Claude", "Gemini Flash", "Llama"],
      answer: 2, // "Gemini Flash"
    },
    {
      q: "What should you do if a product has <60% confidence score?",
      options: ["Use the code anyway", "Try again tomorrow", "Add more product details", "Call Sri Lanka Customs"],
      answer: 2, // "Add more product details"
    },
    {
      q: "How many AI layers does CeylonHS use?",
      options: ["1", "2", "3", "5"],
      answer: 2, // "3"
    },
  ],

  // ── Module 4 · Favourites & History ──────────────────────
  4: [
    {
      q: "How do you save an HS code to Favourites?",
      options: ["Email it", "Click the ⭐ icon", "Screenshot it", "Print it"],
      answer: 1, // "Click the ⭐ icon"
    },
    {
      q: "What can Collections be exported as?",
      options: ["PDF only", "CSV only", "Excel spreadsheet", "JSON only"],
      answer: 2, // "Excel spreadsheet"
    },
    {
      q: "Search history is available when you are...",
      options: ["Using mobile", "Logged in", "On paid plan", "Using Chrome"],
      answer: 1, // "Logged in"
    },
  ],

  // ── Module 5 · Using the AI Chatbot ──────────────────────
  5: [
    {
      q: "Where is the chatbot located on the CeylonHS website?",
      options: ["Top navigation", "Footer", "Bottom-right bubble", "Side panel"],
      answer: 2, // "Bottom-right bubble"
    },
    {
      q: "What does GRI stand for in customs classification?",
      options: [
        "Global Rate Index",
        "General Rules of Interpretation",
        "Goods Registration Interface",
        "Global Revenue Index",
      ],
      answer: 1, // "General Rules of Interpretation"
    },
    {
      q: "The chatbot is specialized in what domain?",
      options: [
        "General knowledge",
        "Sri Lankan cuisine",
        "WCO HS nomenclature & customs",
        "Shipping logistics only",
      ],
      answer: 2, // "WCO HS nomenclature & customs"
    },
  ],
};
