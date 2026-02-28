"""
Training data collector — logs every search interaction as potential
fine-tuning data for the embedding model.

Two tables:
  search_log          — every search query + top results (raw signal)
  training_pairs      — curated (query, positive_description) pairs for fine-tuning

The feedback loop works like this:
  1. Every search is logged (query, top results, whether enrichment was used)
  2. When enrichment fires and IMPROVES results, we automatically create
     high-quality training pairs: (original_query → winning HS description)
  3. Admins can also manually approve/reject pairs via the API
  4. The fine-tuning script (scripts/finetune_embeddings.py) reads training_pairs

This is a passive background system — zero overhead on search latency.
"""

import os
import json
import sqlite3
import logging
from datetime import datetime
from typing import Optional, List, Dict

from app.core.config import settings

logger = logging.getLogger(__name__)


class TrainingDataCollector:
    """Collects search interactions and converts successful enrichments into training pairs."""

    def __init__(self):
        self._db_path: Optional[str] = None
        self._initialized = False

    def initialize(self):
        """Create tables if needed."""
        if self._initialized:
            return

        db_url = settings.database_url.replace("sqlite+aiosqlite:///", "")
        self._db_path = os.path.abspath(db_url)

        conn = sqlite3.connect(self._db_path)

        # Raw search log — every query
        conn.execute("""
            CREATE TABLE IF NOT EXISTS search_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                query TEXT NOT NULL,
                corrected_query TEXT,
                enrichment_used INTEGER DEFAULT 0,
                enrichment_keywords TEXT,
                top_hscode TEXT,
                top_description TEXT,
                top_score REAL,
                result_count INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Curated training pairs for fine-tuning
        conn.execute("""
            CREATE TABLE IF NOT EXISTS training_pairs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                query TEXT NOT NULL,
                positive_description TEXT NOT NULL,
                positive_hscode TEXT,
                source TEXT DEFAULT 'enrichment',
                quality_score REAL DEFAULT 0.8,
                approved INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(query, positive_description)
            )
        """)

        # Index for fast lookups
        conn.execute("CREATE INDEX IF NOT EXISTS idx_search_log_query ON search_log(query)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_training_pairs_approved ON training_pairs(approved)")

        conn.commit()
        conn.close()

        self._initialized = True
        logger.info("Training data collector initialized")

    # Queries that are too generic to be useful training data
    _SKIP_QUERIES = {
        "test", "hello", "hi", "a", "b", "search", "asdf", "aaa",
        "help", "what", "how", "where", "why", "who",
    }

    def _is_meaningful_query(self, query: str) -> bool:
        """Filter out trivial / garbage queries that shouldn't become training data."""
        q = query.strip().lower()
        if len(q) < 3:
            return False  # too short
        if len(q.split()) < 2:
            return False  # single word — usually too generic
        if q in self._SKIP_QUERIES:
            return False
        if all(c == q[0] for c in q.replace(" ", "")):
            return False  # "aaaa", "xxx" etc.
        return True

    def _recently_logged(self, conn: sqlite3.Connection, query: str, window_minutes: int = 30) -> bool:
        """Check if we already logged this exact query recently (dedup)."""
        row = conn.execute(
            "SELECT COUNT(*) FROM search_log WHERE LOWER(query) = ? AND created_at > datetime('now', ?)",
            (query.lower().strip(), f"-{window_minutes} minutes"),
        ).fetchone()
        return (row[0] if row else 0) > 0

    def log_search(
        self,
        query: str,
        corrected_query: Optional[str],
        enrichment_used: bool,
        enrichment_keywords: Optional[str],
        results: List[Dict],
    ):
        """
        Log a search interaction. Called after every search.
        Skips trivial/duplicate queries. Only generates training pairs
        from meaningful enrichment successes or very high confidence matches.
        """
        if not self._initialized:
            self.initialize()

        if not self._db_path or not results:
            return

        # Skip meaningless queries entirely
        if not self._is_meaningful_query(query):
            return

        top = results[0]
        try:
            conn = sqlite3.connect(self._db_path)

            # Deduplicate: skip if this exact query was logged in the last 30 min
            if self._recently_logged(conn, query, window_minutes=30):
                conn.close()
                return

            # 1. Log the raw search
            conn.execute(
                """
                INSERT INTO search_log
                (query, corrected_query, enrichment_used, enrichment_keywords,
                 top_hscode, top_description, top_score, result_count)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    query,
                    corrected_query,
                    1 if enrichment_used else 0,
                    enrichment_keywords,
                    top.get("hscode", ""),
                    top.get("description", ""),
                    top.get("relevance_pct", 0),
                    len(results),
                ),
            )

            # 2. Auto-generate training pairs from enrichment successes
            #    Only when enrichment genuinely improved results (top score > 50%)
            if enrichment_used and enrichment_keywords and top.get("relevance_pct", 0) > 50:
                # Only take the #1 result — more selective than top 3
                desc = top.get("description", "")
                hscode = top.get("hscode", "")
                score = top.get("relevance_pct", 0)

                if desc and score >= 45:
                    quality = min(1.0, score / 100.0)
                    try:
                        conn.execute(
                            """
                            INSERT OR IGNORE INTO training_pairs
                            (query, positive_description, positive_hscode, source, quality_score)
                            VALUES (?, ?, ?, 'enrichment', ?)
                            """,
                            (query.lower().strip(), desc, hscode, round(quality, 3)),
                        )
                    except sqlite3.IntegrityError:
                        pass

            # 3. High-confidence direct matches (>80% — truly excellent matches only)
            elif not enrichment_used and top.get("relevance_pct", 0) > 80:
                desc = top.get("description", "")
                hscode = top.get("hscode", "")
                if desc:
                    try:
                        conn.execute(
                            """
                            INSERT OR IGNORE INTO training_pairs
                            (query, positive_description, positive_hscode, source, quality_score)
                            VALUES (?, ?, ?, 'high_confidence', ?)
                            """,
                            (query.lower().strip(), desc, hscode, round(top["relevance_pct"] / 100.0, 3)),
                        )
                    except sqlite3.IntegrityError:
                        pass

            conn.commit()
            conn.close()

        except Exception as e:
            logger.warning(f"Failed to log search data: {e}")

    def get_training_pairs(self, approved_only: bool = True, min_quality: float = 0.5) -> List[Dict]:
        """Export training pairs for fine-tuning."""
        if not self._initialized:
            self.initialize()

        if not self._db_path:
            return []

        try:
            conn = sqlite3.connect(self._db_path)
            if approved_only:
                cursor = conn.execute(
                    """
                    SELECT query, positive_description, positive_hscode, source,
                           quality_score, created_at
                    FROM training_pairs
                    WHERE approved = 1 AND quality_score >= ?
                    ORDER BY quality_score DESC
                    """,
                    (min_quality,),
                )
            else:
                cursor = conn.execute(
                    """
                    SELECT query, positive_description, positive_hscode, source,
                           quality_score, created_at
                    FROM training_pairs
                    ORDER BY quality_score DESC
                    """,
                )

            rows = cursor.fetchall()
            conn.close()

            return [
                {
                    "query": r[0],
                    "positive_description": r[1],
                    "positive_hscode": r[2],
                    "source": r[3],
                    "quality_score": r[4],
                    "created_at": r[5],
                }
                for r in rows
            ]
        except Exception as e:
            logger.warning(f"Failed to export training pairs: {e}")
            return []

    def get_search_stats(self) -> Dict:
        """Get search log statistics for admin dashboard."""
        if not self._initialized:
            self.initialize()

        if not self._db_path:
            return {}

        try:
            conn = sqlite3.connect(self._db_path)
            stats = {}

            # Total searches
            row = conn.execute("SELECT COUNT(*) FROM search_log").fetchone()
            stats["total_searches"] = row[0] if row else 0

            # Enrichment usage
            row = conn.execute("SELECT COUNT(*) FROM search_log WHERE enrichment_used = 1").fetchone()
            stats["enrichment_searches"] = row[0] if row else 0

            # Training pairs
            row = conn.execute("SELECT COUNT(*) FROM training_pairs WHERE approved = 1").fetchone()
            stats["training_pairs"] = row[0] if row else 0

            # Average top score
            row = conn.execute("SELECT AVG(top_score) FROM search_log WHERE top_score > 0").fetchone()
            stats["avg_top_score"] = round(row[0], 1) if row and row[0] else 0

            # Top queries (most searched)
            cursor = conn.execute(
                """
                SELECT query, COUNT(*) as cnt
                FROM search_log
                GROUP BY LOWER(query)
                ORDER BY cnt DESC
                LIMIT 20
                """
            )
            stats["top_queries"] = [{"query": r[0], "count": r[1]} for r in cursor.fetchall()]

            conn.close()
            return stats
        except Exception as e:
            logger.warning(f"Failed to get search stats: {e}")
            return {}

    def approve_pair(self, pair_id: int, approved: bool = True) -> bool:
        """Admin approve/reject a training pair."""
        if not self._db_path:
            return False
        try:
            conn = sqlite3.connect(self._db_path)
            conn.execute(
                "UPDATE training_pairs SET approved = ? WHERE id = ?",
                (1 if approved else 0, pair_id),
            )
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.warning(f"Failed to update training pair {pair_id}: {e}")
            return False

    def add_manual_pair(self, query: str, description: str, hscode: str = "") -> bool:
        """Admin manually adds a training pair."""
        if not self._initialized:
            self.initialize()
        if not self._db_path:
            return False
        try:
            conn = sqlite3.connect(self._db_path)
            conn.execute(
                """
                INSERT OR REPLACE INTO training_pairs
                (query, positive_description, positive_hscode, source, quality_score, approved)
                VALUES (?, ?, ?, 'manual', 1.0, 1)
                """,
                (query.lower().strip(), description, hscode),
            )
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.warning(f"Failed to add manual pair: {e}")
            return False


# Singleton
training_collector = TrainingDataCollector()
