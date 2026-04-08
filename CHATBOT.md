# Chatbot – Associated Files

This document lists every file that is part of the CeylonHS AI Chatbot feature.

---

## Frontend

| File | Description |
|------|-------------|
| `Nextjs/nextjs/src/components/Chatbot.tsx` | Main React component – floating action button, message bubbles, quick-action chips, typing indicator, HS code result cards, dark/light theme, mobile-responsive layout. |
| `Nextjs/nextjs/src/app/layout.tsx` | Root layout that mounts `<Chatbot />` globally so the widget appears on every page. |
| `Nextjs/nextjs/src/app/globals.css` | CSS animations used by the chatbot (`chatbotPulse`, `chatbotDot`) and responsive overrides for screens ≤ 480 px. |
| `Nextjs/nextjs/src/lib/api.ts` | API client library – exposes `chatMessage(message)` which posts to `POST /api/v1/chat` and returns `{ reply, results }`. Also defines the `ChatResult` and `ChatApiResponse` TypeScript interfaces. |
| `Nextjs/nextjs/src/app/learning/page.tsx` | Learning/tutorial page – Module M05 documents how to use the chatbot (intro, effective queries, complex scenarios). |

---

## Backend

| File | Description |
|------|-------------|
| `backend/app/api/routes/chat.py` | FastAPI route handler for `POST /api/v1/chat`. Accepts a `ChatRequest` (1–1 000 chars), builds the system prompt from the knowledge base, calls Groq (Llama 3.3 70 B), and returns `ChatResponse { reply, results }`. Rate-limited to 60 requests/minute. |
| `backend/data/knowledge_base.txt` | FAQ-style knowledge base injected into the chatbot system prompt to give it context about the CeylonHS platform. |
| `backend/app/core/config.py` | Application settings – includes `groq_api_key`, `groq_model`, `gemini_api_key`, `gemini_model`, `cohere_api_key`, `cohere_model`, `enrichment_confidence_threshold`, and `rate_limit_default` used by the chatbot and enrichment service. |
| `backend/app/services/enrichment_service.py` | Multi-provider LLM service (Groq → Gemini → Cohere cascade) that resolves unknown brand names and product terms into HS-code keywords. Results are permanently cached in SQLite. Used by the search pipeline, but shares the same LLM providers as the chatbot. |
| `backend/app/main.py` | FastAPI entry point – registers the chat router (`app.include_router(chat_router)`) alongside all other routers. |

---

## API Endpoint

```
POST /api/v1/chat
Content-Type: application/json

Request  : { "message": "<user text>" }
Response : { "reply": "<assistant text>", "results": [ { "hscode", "description", "relevance_pct" } ] }
```

---

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `GROQ_API_KEY` | _(required)_ | Primary LLM provider for chat |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Groq model used by chatbot |
| `GEMINI_API_KEY` | _(optional)_ | Fallback LLM provider |
| `GEMINI_MODEL` | `gemini-2.0-flash` | Gemini model for enrichment fallback |
| `COHERE_API_KEY` | _(optional)_ | Second fallback LLM provider |
| `COHERE_MODEL` | `command-r` | Cohere model for enrichment fallback |
| `ENRICHMENT_CONFIDENCE_THRESHOLD` | `0.35` | Minimum confidence to use an enriched result |
| `RATE_LIMIT_DEFAULT` | `60/minute` | Rate limit applied to the chat endpoint |
