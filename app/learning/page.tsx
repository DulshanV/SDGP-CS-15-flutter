"use client";
import { useState, useEffect, useRef } from "react";
import { Play, Award, ChevronDown, ChevronRight, BookOpen, Search } from 'lucide-react';

// ── DATA ──────────────────────────────────────────────────────────────────────
const MODULES = [
  {
    id: 1,
    code: "M01",
    title: "Introduction to HS Codes",
    subtitle: "Why trade classification matters",
    icon: "🌐",
    color: "#2563EB",
    gradient: "from-blue-600 to-blue-400",
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
            "Essential for customs clearance and duty calculation"
          ]
        }
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
            "5,224+ Subheadings at 6-digit precision"
          ]
        }
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
            "Ensure regulatory compliance"
          ]
        }
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
            "Real-time updates from WCO revisions"
          ]
        }
      }
    ]
  },
  {
    id: 2,
    code: "M02",
    title: "Searching HS Codes with AI",
    subtitle: "Master the hybrid AI search engine",
    icon: "🔍",
    color: "#7C3AED",
    gradient: "from-violet-600 to-purple-400",
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
            "Click any result to see the full HS hierarchy"
          ]
        }
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
            "✅ 'Dilmah tea bags' → HS 0902.30"
          ]
        }
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
            "Hierarchy: Full path from Section to Subheading"
          ]
        }
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
            "Use autocomplete for WCO terminology"
          ]
        }
      }
    ]
  },
  {
    id: 3,
    code: "M03",
    title: "AI-Powered Classification",
    subtitle: "Understand the hybrid AI pipeline",
    icon: "🤖",
    color: "#059669",
    gradient: "from-emerald-600 to-teal-400",
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
            "Combined result in under 100ms total"
          ]
        }
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
            "Continuously learns from new classifications"
          ]
        }
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
            "Below 60%: Consult a customs broker"
          ]
        }
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
            "Use the feedback button to report errors"
          ]
        }
      }
    ]
  },
  {
    id: 4,
    code: "M04",
    title: "Favourites & History",
    subtitle: "Organize your code library",
    icon: "⭐",
    color: "#D97706",
    gradient: "from-amber-500 to-orange-400",
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
            "Export your favourites as CSV for customs declarations"
          ]
        }
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
            "Export history as PDF for audit purposes"
          ]
        }
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
            "One-click export to Excel for declarations"
          ]
        }
      }
    ]
  },
  {
    id: 5,
    code: "M05",
    title: "Using the AI Chatbot",
    subtitle: "Your 24/7 customs classification assistant",
    icon: "💬",
    color: "#DC2626",
    gradient: "from-red-600 to-rose-400",
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
            "Ask about trade agreement eligibility"
          ]
        }
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
            "✅ 'Does ISFTA apply to my coconut oil import?'"
          ]
        }
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
            "Ask for 'alternative codes' if uncertain"
          ]
        }
      }
    ]
  }
];

const QUIZ_BANK = {
  1: [
    { q: "How many digits are in a standard international HS code?", options: ["4", "6", "8", "10"], answer: 1 },
    { q: "Which organization maintains the Harmonized System?", options: ["WTO", "IMF", "WCO", "UN"], answer: 2 },
    { q: "What do the first 2 digits of an HS code represent?", options: ["Section", "Chapter", "Heading", "Subheading"], answer: 1 }
  ],
  2: [
    { q: "What search technology does CeylonHS use for fast results?", options: ["Elasticsearch", "Typesense", "Solr", "Algolia"], answer: 1 },
    { q: "What does a green confidence badge indicate?", options: ["50%+ accuracy", "75%+ accuracy", "95%+ accuracy", "100% accuracy"], answer: 2 },
    { q: "Which query style works BEST with CeylonHS?", options: ["HS numbers only", "Natural language descriptions", "Latin product names", "Only English"], answer: 1 }
  ],
  3: [
    { q: "Which AI model does CeylonHS use for brand enrichment?", options: ["GPT-4", "Claude", "Gemini Flash", "Llama"], answer: 2 },
    { q: "What should you do if a product has <60% confidence score?", options: ["Use the code anyway", "Try again tomorrow", "Add more product details", "Call Sri Lanka Customs"], answer: 2 },
    { q: "How many AI layers does CeylonHS use?", options: ["1", "2", "3", "5"], answer: 2 }
  ],
  4: [
    { q: "How do you save an HS code to Favourites?", options: ["Email it", "Click the ⭐ icon", "Screenshot it", "Print it"], answer: 1 },
    { q: "What can Collections be exported as?", options: ["PDF only", "CSV only", "Excel spreadsheet", "JSON only"], answer: 2 },
    { q: "Search history is available when you are...", options: ["Using mobile", "Logged in", "On paid plan", "Using Chrome"], answer: 1 }
  ],
  5: [
    { q: "Where is the chatbot located on the CeylonHS website?", options: ["Top navigation", "Footer", "Bottom-right bubble", "Side panel"], answer: 2 },
    { q: "What does GRI stand for in customs classification?", options: ["Global Rate Index", "General Rules of Interpretation", "Goods Registration Interface", "Global Revenue Index"], answer: 1 },
    { q: "The chatbot is specialized in what domain?", options: ["General knowledge", "Sri Lankan cuisine", "WCO HS nomenclature & customs", "Shipping logistics only"], answer: 2 }
  ]
};

// ── COMPONENTS ────────────────────────────────────────────────────────────────

function ProgressRing({ percent, size = 60, stroke = 5, color = "#2563EB" }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(.4,0,.2,1)" }}
      />
    </svg>
  );
}

function Badge({ children, color = "#2563EB", bg }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
      background: bg || color + "18", color
    }}>{children}</span>
  );
}

// ── LESSON VIEWER ─────────────────────────────────────────────────────────────
function LessonViewer({ topic, onComplete, onBack }) {
  const [tab, setTab] = useState("learn");
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const contentRef = useRef();

  useEffect(() => {
    setReadProgress(0);
    const timer = setInterval(() => {
      setReadProgress(p => { if (p >= 100) { clearInterval(timer); return 100; } return p + 2; });
    }, 120);
    return () => clearInterval(timer);
  }, [topic.id]);

  const moduleId = parseInt(topic.id[0]);
  const quizzes = QUIZ_BANK[moduleId] || [];
  const score = quizSubmitted ? quizzes.filter((q, i) => quizAnswers[i] === q.answer).length : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#0A0F1E", color: "#F1F5F9", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#111827", borderBottom: "1px solid #1E293B", padding: "16px 32px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={onBack} style={{ background: "#1E293B", border: "none", color: "#94A3B8", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>
          ← Back
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "#64748B", marginBottom: 2 }}>CeylonHS Academy</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#F1F5F9" }}>{topic.title}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 12, color: "#64748B" }}>{readProgress < 100 ? "Reading..." : "✓ Read"}</div>
          <div style={{ width: 80, height: 4, background: "#1E293B", borderRadius: 2 }}>
            <div style={{ width: `${readProgress}%`, height: "100%", background: "#2563EB", borderRadius: 2, transition: "width 0.3s" }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #1E293B", display: "flex", gap: 0, paddingLeft: 32 }}>
        {["learn", "notes", "quiz"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: "none", border: "none", color: tab === t ? "#2563EB" : "#64748B",
            borderBottom: tab === t ? "2px solid #2563EB" : "2px solid transparent",
            padding: "14px 20px", cursor: "pointer", fontFamily: "inherit", fontSize: 13,
            fontWeight: tab === t ? 700 : 400, textTransform: "capitalize", transition: "all 0.2s"
          }}>{t === "learn" ? "📖 Learn" : t === "notes" ? "📝 Key Notes" : "🧠 Quiz"}</button>
        ))}
      </div>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "40px 32px" }} ref={contentRef}>
        {tab === "learn" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, color: "#F1F5F9", lineHeight: 1.2 }}>{topic.content.heading}</h1>
            <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
              <Badge color="#2563EB">⏱ {topic.duration}</Badge>
              <Badge color="#059669">📖 Reading</Badge>
            </div>

            {/* Highlight box */}
            <div style={{ background: "linear-gradient(135deg, #1E3A8A22, #2563EB22)", border: "1px solid #2563EB44", borderRadius: 12, padding: "20px 24px", marginBottom: 32 }}>
              <div style={{ fontSize: 12, color: "#60A5FA", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 8 }}>KEY TAKEAWAY</div>
              <div style={{ fontSize: 16, color: "#93C5FD", fontWeight: 500, lineHeight: 1.6 }}>💡 {topic.content.highlight}</div>
            </div>

            {/* Body */}
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "#CBD5E1", marginBottom: 32 }}>{topic.content.body}</p>

            {/* Points */}
            <div style={{ display: "grid", gap: 12 }}>
              {topic.content.points.map((point, i) => (
                <div key={i} style={{
                  background: "#111827", border: "1px solid #1E293B", borderRadius: 10,
                  padding: "14px 20px", display: "flex", alignItems: "flex-start", gap: 12,
                  animation: `slideUp 0.3s ease ${i * 0.08}s both`
                }}>
                  <div style={{ width: 24, height: 24, background: "#2563EB22", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#60A5FA", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                  <span style={{ fontSize: 14, color: "#CBD5E1", lineHeight: 1.5 }}>{point}</span>
                </div>
              ))}
            </div>

            {readProgress === 100 && (
              <div style={{ marginTop: 40, textAlign: "center", animation: "fadeIn 0.5s ease" }}>
                <div style={{ fontSize: 14, color: "#64748B", marginBottom: 16 }}>You've finished this lesson</div>
                <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                  <button onClick={() => setTab("quiz")} style={{
                    background: "linear-gradient(135deg, #2563EB, #7C3AED)", color: "#fff", border: "none",
                    padding: "14px 32px", borderRadius: 10, fontFamily: "inherit", fontSize: 14, fontWeight: 700,
                    cursor: "pointer"
                  }}>Take the Quiz 🧠</button>
                  <button onClick={onComplete} style={{
                    background: "#1E293B", color: "#94A3B8", border: "none",
                    padding: "14px 32px", borderRadius: 10, fontFamily: "inherit", fontSize: 14, fontWeight: 600,
                    cursor: "pointer"
                  }}>Mark Complete ✓</button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "notes" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: "#F1F5F9" }}>Key Points to Remember</h2>
            <div style={{ display: "grid", gap: 16 }}>
              {topic.content.points.map((point, i) => (
                <div key={i} style={{
                  background: "#111827", borderLeft: "3px solid #2563EB",
                  borderRadius: "0 10px 10px 0", padding: "16px 20px"
                }}>
                  <div style={{ fontSize: 12, color: "#60A5FA", fontWeight: 700, marginBottom: 4 }}>POINT {i + 1}</div>
                  <div style={{ fontSize: 15, color: "#CBD5E1" }}>{point}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 32, background: "#111827", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 12, color: "#F59E0B", fontWeight: 700, marginBottom: 8 }}>⚡ HIGHLIGHT</div>
              <div style={{ fontSize: 15, color: "#FCD34D" }}>{topic.content.highlight}</div>
            </div>
          </div>
        )}

        {tab === "quiz" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: "#F1F5F9" }}>Module Quiz</h2>
            <p style={{ fontSize: 14, color: "#64748B", marginBottom: 32 }}>Test your knowledge — {quizzes.length} questions</p>

            {quizSubmitted ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>{score === quizzes.length ? "🏆" : score >= 2 ? "🎉" : "📚"}</div>
                <div style={{ fontSize: 40, fontWeight: 800, color: score === quizzes.length ? "#10B981" : score >= 2 ? "#F59E0B" : "#EF4444", marginBottom: 8 }}>
                  {score}/{quizzes.length}
                </div>
                <div style={{ fontSize: 16, color: "#94A3B8", marginBottom: 32 }}>
                  {score === quizzes.length ? "Perfect score! You're ready to move on." : score >= 2 ? "Good work! Review missed questions below." : "Review the lesson and try again."}
                </div>
                <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                  <button onClick={() => { setQuizAnswers({}); setQuizSubmitted(false); }} style={{ background: "#1E293B", color: "#94A3B8", border: "none", padding: "12px 24px", borderRadius: 8, fontFamily: "inherit", cursor: "pointer" }}>Retry</button>
                  <button onClick={onComplete} style={{ background: "linear-gradient(135deg, #059669, #10B981)", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 8, fontFamily: "inherit", fontWeight: 700, cursor: "pointer" }}>Complete Lesson ✓</button>
                </div>
              </div>
            ) : (
              <div>
                {quizzes.map((q, qi) => (
                  <div key={qi} style={{ marginBottom: 32 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#F1F5F9", marginBottom: 16 }}>
                      <span style={{ color: "#60A5FA", marginRight: 8 }}>Q{qi + 1}.</span>{q.q}
                    </div>
                    <div style={{ display: "grid", gap: 10 }}>
                      {q.options.map((opt, oi) => (
                        <button key={oi} onClick={() => setQuizAnswers(a => ({ ...a, [qi]: oi }))} style={{
                          background: quizAnswers[qi] === oi ? "#1E3A8A" : "#111827",
                          border: `1px solid ${quizAnswers[qi] === oi ? "#2563EB" : "#1E293B"}`,
                          color: quizAnswers[qi] === oi ? "#93C5FD" : "#94A3B8",
                          borderRadius: 8, padding: "12px 20px", textAlign: "left",
                          fontFamily: "inherit", fontSize: 14, cursor: "pointer", transition: "all 0.15s"
                        }}>
                          <span style={{ marginRight: 10, opacity: 0.5 }}>{["A", "B", "C", "D"][oi]}.</span>{opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setQuizSubmitted(true)}
                  disabled={Object.keys(quizAnswers).length < quizzes.length}
                  style={{
                    background: Object.keys(quizAnswers).length < quizzes.length ? "#1E293B" : "linear-gradient(135deg, #2563EB, #7C3AED)",
                    color: Object.keys(quizAnswers).length < quizzes.length ? "#64748B" : "#fff",
                    border: "none", padding: "14px 36px", borderRadius: 10,
                    fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer"
                  }}
                >Submit Answers</button>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

// ── MODULE DETAIL ─────────────────────────────────────────────────────────────
function ModuleDetail({ module, completed, onTopicComplete, onBack }) {
  const [activeTopic, setActiveTopic] = useState(null);
  const completedCount = module.topics.filter(t => completed.has(t.id)).length;
  const pct = Math.round((completedCount / module.topics.length) * 100);

  if (activeTopic) {
    return (
      <LessonViewer
        topic={activeTopic}
        onComplete={() => { onTopicComplete(activeTopic.id); setActiveTopic(null); }}
        onBack={() => setActiveTopic(null)}
      />
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0A0F1E", color: "#F1F5F9", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, #0A0F1E 0%, ${module.color}33 100%)`,
        borderBottom: "1px solid #1E293B", padding: "48px 48px 40px"
      }}>
        <button onClick={onBack} style={{ background: "#1E293B", border: "none", color: "#94A3B8", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontFamily: "inherit", fontSize: 13, marginBottom: 24 }}>← All Modules</button>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 24 }}>
          <div style={{ fontSize: 56 }}>{module.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <Badge color={module.color}>{module.code}</Badge>
              <Badge color={module.color}>{module.category}</Badge>
              <Badge color="#64748B">⏱ {module.duration}</Badge>
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>{module.title}</h1>
            <p style={{ fontSize: 16, color: "#94A3B8", marginBottom: 20 }}>{module.subtitle}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ flex: 1, maxWidth: 200 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748B", marginBottom: 4 }}>
                  <span>Progress</span><span>{completedCount}/{module.topics.length} lessons</span>
                </div>
                <div style={{ height: 6, background: "#1E293B", borderRadius: 3 }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: module.color, borderRadius: 3, transition: "width 0.5s" }} />
                </div>
              </div>
              {pct === 100 && <Badge color="#10B981">✓ Completed</Badge>}
            </div>
          </div>
        </div>
      </div>

      {/* Lessons */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 48px" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, color: "#94A3B8", letterSpacing: "0.05em" }}>LESSONS</h2>
        <div style={{ display: "grid", gap: 12 }}>
          {module.topics.map((topic, i) => {
            const done = completed.has(topic.id);
            return (
              <button key={topic.id} onClick={() => setActiveTopic(topic)} style={{
                background: "#111827", border: `1px solid ${done ? module.color + "44" : "#1E293B"}`,
                borderRadius: 12, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16,
                cursor: "pointer", textAlign: "left", transition: "all 0.2s", width: "100%"
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = module.color + "88"}
                onMouseLeave={e => e.currentTarget.style.borderColor = done ? module.color + "44" : "#1E293B"}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: done ? module.color + "33" : "#1E293B",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, flexShrink: 0
                }}>
                  {done ? <span style={{ color: module.color, fontWeight: 700 }}>✓</span> : <span style={{ color: "#64748B", fontSize: 14, fontWeight: 700 }}>{i + 1}</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: done ? "#94A3B8" : "#F1F5F9", marginBottom: 4, fontFamily: "inherit" }}>{topic.title}</div>
                  <div style={{ fontSize: 12, color: "#64748B", fontFamily: "inherit" }}>⏱ {topic.duration}</div>
                </div>
                <div style={{ color: "#64748B", fontSize: 18 }}>›</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── CERTIFICATE ───────────────────────────────────────────────────────────────
function Certificate({ name, date }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0A0F1E", display: "flex", alignItems: "center", justifyContent: "center", padding: 32, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{
        width: "100%", maxWidth: 720,
        background: "linear-gradient(135deg, #0F172A, #1E1B4B)",
        border: "2px solid #2563EB44", borderRadius: 20,
        padding: 56, textAlign: "center", position: "relative", overflow: "hidden"
      }}>
        {/* Decorative corners */}
        {[["0","0","right","bottom"],["auto","0","left","bottom"],["0","auto","right","top"],["auto","auto","left","top"]].map(([b,r,bl,tr],i) => (
          <div key={i} style={{ position: "absolute", bottom: b, right: r, top: b === "0" ? undefined : tr, left: r === "0" ? undefined : bl, width: 60, height: 60, border: "2px solid #2563EB44", borderRadius: i < 2 ? "100% 0 0 0" : "0 0 0 100%" }} />
        ))}

        <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
        <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "#60A5FA", fontWeight: 700, marginBottom: 16 }}>CEYLONHS ACADEMY</div>
        <div style={{ fontSize: 13, color: "#64748B", marginBottom: 8 }}>This certifies that</div>
        <div style={{ fontSize: 36, fontWeight: 800, color: "#F1F5F9", marginBottom: 8 }}>{name || "Trade Professional"}</div>
        <div style={{ fontSize: 14, color: "#94A3B8", marginBottom: 32 }}>has successfully completed</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#60A5FA", marginBottom: 8 }}>CeylonHS Trade Classification Fundamentals</div>
        <div style={{ fontSize: 13, color: "#64748B", marginBottom: 40 }}>All 5 modules · 18 lessons · 5 quizzes passed</div>

        <div style={{ display: "flex", justifyContent: "center", gap: 48, marginBottom: 40 }}>
          {[["16,000+","HS Codes Learned"],["5","Modules Completed"],["2026","Certification Year"]].map(([val,lbl]) => (
            <div key={lbl} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#2563EB" }}>{val}</div>
              <div style={{ fontSize: 11, color: "#64748B" }}>{lbl}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <div style={{ height: 1, width: 60, background: "#1E293B" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#2563EB", fontWeight: 700 }}>CEYLONHS.COM</div>
            <div style={{ fontSize: 10, color: "#64748B" }}>Issued {date}</div>
          </div>
          <div style={{ height: 1, width: 60, background: "#1E293B" }} />
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function CeylonHSAcademy() {
  const [view, setView] = useState("home"); // home | module | cert
  const [activeModule, setActiveModule] = useState(null);
  const [completed, setCompleted] = useState(new Set());
  const [userName, setUserName] = useState("Trade Professional");
  const [nameInput, setNameInput] = useState("");
  const [showNameModal, setShowNameModal] = useState(false);
  const [hovered, setHovered] = useState(null);

  const totalTopics = MODULES.reduce((a, m) => a + m.topics.length, 0);
  const totalCompleted = completed.size;
  const overallPct = Math.round((totalCompleted / totalTopics) * 100);
  const allDone = MODULES.every(m => m.topics.every(t => completed.has(t.id)));

  const handleTopicComplete = (id) => {
    setCompleted(prev => new Set([...prev, id]));
  };

  if (view === "module" && activeModule) {
    return (
      <ModuleDetail
        module={activeModule}
        completed={completed}
        onTopicComplete={handleTopicComplete}
        onBack={() => setView("home")}
      />
    );
  }

  if (view === "cert") {
    return (
      <div>
        <div style={{ background: "#111827", padding: "16px 32px", display: "flex", alignItems: "center", gap: 16, fontFamily: "'DM Sans', sans-serif" }}>
          <button onClick={() => setView("home")} style={{ background: "#1E293B", border: "none", color: "#94A3B8", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontFamily: "inherit" }}>← Back to Academy</button>
        </div>
        <Certificate name={userName} date={new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0A0F1E", color: "#F1F5F9", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #111827; } ::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 3px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes floatDot { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      `}</style>

      {/* NAV */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "#0A0F1Eee", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #1E293B",
        padding: "0 40px", display: "flex", alignItems: "center", gap: 24, height: 60
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, background: "linear-gradient(135deg, #2563EB, #7C3AED)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚡</div>
          <span style={{ fontWeight: 800, fontSize: 16 }}>Ceylon<span style={{ color: "#2563EB" }}>HS</span> Academy</span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 80, height: 5, background: "#1E293B", borderRadius: 3 }}>
            <div style={{ width: `${overallPct}%`, height: "100%", background: "linear-gradient(90deg, #2563EB, #7C3AED)", borderRadius: 3, transition: "width 0.5s" }} />
          </div>
          <span style={{ fontSize: 12, color: "#64748B" }}>{overallPct}%</span>
        </div>
        <div style={{ fontSize: 13, color: "#64748B" }}>{totalCompleted}/{totalTopics} lessons</div>
        <button
          onClick={() => setShowNameModal(true)}
          style={{ background: "#1E293B", border: "none", color: "#94A3B8", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}
        >👤 {userName}</button>
      </nav>

      {/* Name modal */}
      {showNameModal && (
        <div style={{ position: "fixed", inset: 0, background: "#000000aa", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#111827", border: "1px solid #1E293B", borderRadius: 16, padding: 32, width: 360 }}>
            <h3 style={{ marginBottom: 16, fontWeight: 700 }}>Your Name for Certificate</h3>
            <input
              value={nameInput} onChange={e => setNameInput(e.target.value)}
              placeholder="Enter your full name"
              style={{ width: "100%", background: "#0A0F1E", border: "1px solid #1E293B", color: "#F1F5F9", borderRadius: 8, padding: "10px 14px", fontFamily: "inherit", fontSize: 14, marginBottom: 16, outline: "none" }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowNameModal(false)} style={{ flex: 1, background: "#1E293B", border: "none", color: "#94A3B8", borderRadius: 8, padding: "10px", fontFamily: "inherit", cursor: "pointer" }}>Cancel</button>
              <button onClick={() => { if (nameInput.trim()) setUserName(nameInput.trim()); setShowNameModal(false); }} style={{ flex: 1, background: "#2563EB", border: "none", color: "#fff", borderRadius: 8, padding: "10px", fontFamily: "inherit", fontWeight: 700, cursor: "pointer" }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* HERO */}
      <div style={{
        background: "radial-gradient(ellipse 80% 50% at 50% -10%, #2563EB22, transparent)",
        padding: "72px 40px 56px", textAlign: "center"
      }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#2563EB18", border: "1px solid #2563EB33", borderRadius: 20, padding: "6px 16px", fontSize: 12, color: "#60A5FA", fontWeight: 600, marginBottom: 24 }}>
          <span style={{ width: 6, height: 6, background: "#2563EB", borderRadius: "50%", animation: "pulse 2s infinite" }} />
          FREE · SELF-PACED · CERTIFICATE ON COMPLETION
        </div>
        <h1 style={{ fontSize: "clamp(36px, 5vw, 58px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 20 }}>
          Master HS Code Classification<br />
          <span style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED, #06B6D4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            with CeylonHS AI
          </span>
        </h1>
        <p style={{ fontSize: 18, color: "#94A3B8", maxWidth: 540, margin: "0 auto 40px", lineHeight: 1.7 }}>
          From zero to certified trade professional. Learn to classify 16,000+ products, master our AI search engine, and speed up your customs workflow.
        </p>

        {/* Stats */}
        <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
          {[["5","Modules"],["18","Lessons"],["<48min","Total Time"],["Free","Certificate"]].map(([val,lbl]) => (
            <div key={lbl} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#F1F5F9" }}>{val}</div>
              <div style={{ fontSize: 12, color: "#64748B" }}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* WHY SECTION */}
      <div style={{ padding: "60px 40px", maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "#2563EB", fontWeight: 700, marginBottom: 12 }}>WHY THIS MATTERS</div>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>Why Learn HS Code Classification?</h2>
          <p style={{ fontSize: 15, color: "#64748B", maxWidth: 500, margin: "0 auto" }}>Misclassification costs Sri Lankan businesses millions in penalties annually.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {[
            { icon: "💰", title: "Avoid Costly Penalties", body: "Wrong HS codes trigger customs audits and fines that can exceed the value of your shipment." },
            { icon: "⚡", title: "Faster Clearance", body: "Correct codes mean zero holds at Colombo Port — your cargo moves in hours, not days." },
            { icon: "🤝", title: "Access Trade Agreements", body: "FTAs like ISFTA require precise classification to claim preferential duty rates." },
            { icon: "📊", title: "Data-Driven Decisions", body: "Accurate classification gives you clean trade data for business intelligence and planning." }
          ].map((item, i) => (
            <div key={i} style={{
              background: "#111827", border: "1px solid #1E293B", borderRadius: 14, padding: 24,
              animation: `fadeUp 0.5s ease ${i * 0.1}s both`
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{item.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: "#F1F5F9" }}>{item.title}</div>
              <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>{item.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* OVERALL PROGRESS */}
      {totalCompleted > 0 && (
        <div style={{ padding: "0 40px 40px", maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ background: "linear-gradient(135deg, #1E3A8A22, #7C3AED22)", border: "1px solid #2563EB33", borderRadius: 16, padding: "24px 32px", display: "flex", alignItems: "center", gap: 24 }}>
            <ProgressRing percent={overallPct} size={72} stroke={6} color="#2563EB" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: "#94A3B8", marginBottom: 4 }}>Your Learning Progress</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{overallPct}% Complete · {totalCompleted} of {totalTopics} lessons done</div>
            </div>
            {allDone && (
              <button onClick={() => setView("cert")} style={{
                background: "linear-gradient(135deg, #059669, #10B981)", color: "#fff", border: "none",
                padding: "14px 28px", borderRadius: 10, fontFamily: "inherit", fontSize: 14, fontWeight: 700,
                cursor: "pointer"
              }}>🏆 Get Certificate</button>
            )}
          </div>
        </div>
      )}

      {/* MODULES GRID */}
      <div style={{ padding: "0 40px 80px", maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "#2563EB", fontWeight: 700, marginBottom: 16 }}>COURSE MODULES</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          {MODULES.map((mod, i) => {
            const modCompleted = mod.topics.filter(t => completed.has(t.id)).length;
            const modPct = Math.round((modCompleted / mod.topics.length) * 100);
            const isHov = hovered === mod.id;
            return (
              <div
                key={mod.id}
                onClick={() => { setActiveModule(mod); setView("module"); }}
                onMouseEnter={() => setHovered(mod.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background: isHov ? "#111827" : "#0D1424",
                  border: `1px solid ${isHov ? mod.color + "66" : "#1E293B"}`,
                  borderRadius: 16, padding: 28, cursor: "pointer",
                  transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
                  transform: isHov ? "translateY(-4px)" : "none",
                  boxShadow: isHov ? `0 20px 40px ${mod.color}22` : "none",
                  animation: `fadeUp 0.4s ease ${i * 0.07}s both`
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                  <div style={{ fontSize: 40 }}>{mod.icon}</div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "#64748B", marginBottom: 4 }}>{mod.code}</div>
                    {modPct === 100
                      ? <Badge color="#10B981">✓ Done</Badge>
                      : modPct > 0
                        ? <Badge color={mod.color}>{modPct}%</Badge>
                        : <Badge color="#64748B">{mod.duration}</Badge>}
                  </div>
                </div>

                <div style={{ marginBottom: 6 }}>
                  <Badge color={mod.color}>{mod.category}</Badge>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6, color: "#F1F5F9" }}>{mod.title}</h3>
                <p style={{ fontSize: 13, color: "#64748B", marginBottom: 20, lineHeight: 1.5 }}>{mod.subtitle}</p>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 4, background: "#1E293B", borderRadius: 2 }}>
                      <div style={{ width: `${modPct}%`, height: "100%", background: mod.color, borderRadius: 2, transition: "width 0.5s" }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: "#64748B", flexShrink: 0 }}>{modCompleted}/{mod.topics.length}</span>
                </div>

                <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: "#64748B" }}>📖 {mod.lessons} lessons</span>
                  <span style={{ fontSize: 13, color: mod.color, fontWeight: 700 }}>
                    {modPct === 100 ? "Review →" : modPct > 0 ? "Continue →" : "Start →"}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Coming Soon Module */}
          <div style={{
            background: "#0D1424", border: "1px dashed #1E293B", borderRadius: 16, padding: 28,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: 240
          }}>
            <div style={{ fontSize: 32, marginBottom: 12, animation: "floatDot 3s ease infinite" }}>🚀</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>More Modules Coming</div>
            <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6, maxWidth: 200 }}>
              Advanced duty calculation, FTA eligibility, and API integration modules in development.
            </div>
            <div style={{ marginTop: 16 }}>
              <Badge color="#64748B">Coming Soon</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* CTA FOOTER */}
      <div style={{
        background: "linear-gradient(135deg, #1E3A8A, #2563EB)",
        padding: "60px 40px", textAlign: "center"
      }}>
        <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 12 }}>Ready to Classify Smarter?</h2>
        <p style={{ fontSize: 16, color: "#93C5FD", marginBottom: 32 }}>Complete all modules and earn your free CeylonHS certification.</p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => { setActiveModule(MODULES[0]); setView("module"); }} style={{
            background: "#fff", color: "#1E3A8A", border: "none", padding: "14px 32px", borderRadius: 10,
            fontFamily: "inherit", fontSize: 15, fontWeight: 800, cursor: "pointer"
          }}>Start Learning Free →</button>
          <a href="https://ceylonhs.com" target="_blank" rel="noreferrer" style={{
            background: "transparent", color: "#fff", border: "2px solid #ffffff44", padding: "14px 32px", borderRadius: 10,
            fontFamily: "inherit", fontSize: 15, fontWeight: 600, cursor: "pointer", textDecoration: "none", display: "inline-block"
          }}>Try CeylonHS ↗</a>
        </div>
      </div>
    </div>
  );
}
