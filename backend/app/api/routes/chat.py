"""
Chat API route.
Groq-powered conversational assistant for CeylonHS website support.
Uses llama-3.3-70b-versatile via Groq API with a knowledge base.
"""

import os
import logging
from fastapi import APIRouter, Request
from pydantic import BaseModel, Field
from app.core.config import settings
from app.core.limiter import limiter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["chat"])


# ── Request / Response models ─────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)


class ChatResponse(BaseModel):
    reply: str
    results: list = []


# ── Load knowledge base ───────────────────────────────────────────────────

_KNOWLEDGE_BASE = ""
_kb_paths = [
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "knowledge_base.txt"),
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "data", "knowledge_base.txt"),
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "knowledge_base.txt"),
]

for _p in _kb_paths:
    if os.path.exists(_p):
        with open(_p, "r", encoding="utf-8") as _f:
            _KNOWLEDGE_BASE = _f.read()
        logger.info("Chat knowledge base loaded from %s", _p)
        break

if not _KNOWLEDGE_BASE:
    logger.warning("No knowledge_base.txt found – chatbot will operate without KB context")


# ── System prompt ─────────────────────────────────────────────────────────

SYSTEM_PROMPT = f"""
You are the 'CeylonHS Website Support Guide'. 
Your ONLY job is to help users understand how to use the CeylonHS website.

STRICT RULES:
1. YOU ARE NOT THE SEARCH ENGINE. 
2. NEVER ask the user what product they want to search for.
3. NEVER attempt to give an HS code.
4. If a user gives you a product name (e.g., "laptop" or "tea"), tell them politely: "Please type that into the main 'HS Code Finder' search box on the webpage to get your result."

HOW TO USE THE SYSTEM:
- To find an HS code: Go to the Search page, enter product details, and click 'Search'.
- Favorites: Users can save an HS code by clicking the 'Star' icon next to a search result.
- History: Past searches are saved in the 'History' tab on the user dashboard.
- Accounts: Users can sign in with Google or create an account.
- Tech Support: Email support@ceylonhs.lk.

KNOWLEDGE BASE (use this to answer questions about CeylonHS):
{_KNOWLEDGE_BASE}

STYLE:
- Keep answers very short and helpful (1-3 sentences maximum).
- Be friendly and professional.
- Use markdown bold (**text**) for emphasis when needed.
"""


# ── Groq client (lazy init) ──────────────────────────────────────────────

_groq_client = None


def _get_groq_client():
    global _groq_client
    if _groq_client is None:
        try:
            from groq import Groq
            api_key = settings.groq_api_key
            if not api_key:
                logger.warning("GROQ_API_KEY not set – chat will not work")
                return None
            _groq_client = Groq(api_key=api_key)
            logger.info("Groq client initialized (model: %s)", settings.groq_model)
        except ImportError:
            logger.error("groq package not installed – run: pip install groq")
            return None
        except Exception as e:
            logger.error("Failed to init Groq client: %s", e)
            return None
    return _groq_client


# ── Route ─────────────────────────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
@limiter.limit(settings.rate_limit_default)
async def chat(body: ChatRequest, request: Request):
    """
    Chat with CeylonHS assistant powered by Groq LLM.
    """
    msg = body.message.strip()

    client = _get_groq_client()
    if client is None:
        return ChatResponse(
            reply="I'm currently unavailable. Please try again later or use the **Search** page directly."
        )

    try:
        completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": msg},
            ],
            model=settings.groq_model,
        )

        bot_reply = completion.choices[0].message.content
        return ChatResponse(reply=bot_reply or "I'm not sure how to help with that. Try the **Search** page!")

    except Exception as e:
        logger.warning("Groq chat failed: %s", e)
        return ChatResponse(
            reply="I'm having trouble right now. Please try again in a moment, or use the **Search** page directly."
        )
