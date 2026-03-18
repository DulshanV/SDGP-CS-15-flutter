"""
Fine-tuning pipeline for the HS code embedding model.

Usage:
    cd backend
    python -m scripts.finetune_embeddings [--min-pairs 50] [--epochs 3] [--dry-run]

This script:
1. Exports training pairs from the training_pairs table
   (auto-collected from enrichment feedback loop + manual admin additions)
2. Formats them for sentence-transformers fine-tuning
3. Fine-tunes the base model (all-MiniLM-L6-v2) on (query, HS description) pairs
4. Saves the fine-tuned model to data/finetuned_model/
5. Optionally rebuilds the FAISS index with the new model

The fine-tuned model is used by setting EMBEDDING_MODEL=./data/finetuned_model
in .env, then re-running scripts.embed_dataset to rebuild the FAISS index.

Training approach: MultipleNegativesRankingLoss (contrastive learning)
  - Each (query, positive_description) pair teaches the model that these should
    be close in embedding space
  - Other descriptions in the batch serve as implicit negatives
  - This is the standard approach for fine-tuning retrieval models

Minimum recommended training pairs: 50 (will warn below this)
Optimal: 200+ pairs for measurable improvement
"""

import os
import sys
import json
import time
import argparse
import logging
from typing import List, Dict

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(levelname)s  %(message)s")
logger = logging.getLogger(__name__)


def export_training_pairs(min_quality: float = 0.5) -> List[Dict]:
    """Load training pairs from the SQLite database."""
    from app.services.training_collector import training_collector
    training_collector.initialize()
    pairs = training_collector.get_training_pairs(approved_only=True, min_quality=min_quality)
    return pairs


def augment_with_synonym_cache() -> List[Dict]:
    """
    Generate additional training pairs from the synonym_cache.
    Each (source_term → resolved_keywords) mapping is a natural training pair.
    """
    import sqlite3
    from app.core.config import settings

    db_url = settings.database_url.replace("sqlite+aiosqlite:///", "")
    db_path = os.path.abspath(db_url)

    if not os.path.exists(db_path):
        return []

    pairs = []
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.execute(
            """
            SELECT source_term, resolved_keywords, explanation, confidence
            FROM synonym_cache
            WHERE resolved_keywords IS NOT NULL AND confidence >= 0.7
            """
        )
        for row in cursor.fetchall():
            source_term = row[0]
            keywords = row[1]
            explanation = row[2] or ""
            confidence = row[3] or 0.0

            # The keywords are what the LLM says this brand/term maps to
            # in HS terminology. This is a strong training signal.
            pairs.append({
                "query": source_term,
                "positive_description": keywords,
                "source": "synonym_cache",
                "quality_score": confidence,
            })

            # Also create a pair with the explanation if it's informative
            if explanation and len(explanation) > 10:
                pairs.append({
                    "query": source_term,
                    "positive_description": explanation,
                    "source": "synonym_explanation",
                    "quality_score": confidence * 0.8,
                })

        conn.close()
    except Exception as e:
        logger.warning(f"Failed to augment from synonym cache: {e}")

    return pairs


def create_hard_negatives(pairs: List[Dict], metadata_path: str) -> List[tuple]:
    """
    Create (query, positive, negative) triplets for better training.
    Hard negatives are descriptions that are *close* but wrong — e.g.,
    for "iPhone" the positive is "smartphone" but a hard negative is "telephone parts".
    """
    import random

    if not os.path.exists(metadata_path):
        return [(p["query"], p["positive_description"]) for p in pairs]

    with open(metadata_path, "r", encoding="utf-8") as f:
        all_meta = json.load(f)

    all_descriptions = [m.get("description", "") for m in all_meta if m.get("description", "")]

    triplets = []
    for pair in pairs:
        query = pair["query"]
        positive = pair["positive_description"]

        # Pick a random negative that's NOT the positive
        # In a more sophisticated version, we'd use FAISS to find hard negatives
        negative = random.choice(all_descriptions)
        attempts = 0
        while negative.lower() == positive.lower() and attempts < 5:
            negative = random.choice(all_descriptions)
            attempts += 1

        triplets.append((query, positive, negative))

    return triplets


def finetune(
    pairs: List[Dict],
    output_dir: str = "./data/finetuned_model",
    base_model: str = "all-MiniLM-L6-v2",
    epochs: int = 3,
    batch_size: int = 16,
    warmup_ratio: float = 0.1,
    learning_rate: float = 2e-5,
):
    """
    Fine-tune the base embedding model on collected training pairs.

    Uses MultipleNegativesRankingLoss — the standard loss for training
    retrieval models. Each batch provides implicit negatives.
    """
    from sentence_transformers import SentenceTransformer, InputExample, losses
    from torch.utils.data import DataLoader

    logger.info(f"Loading base model: {base_model}")
    model = SentenceTransformer(base_model, device="cpu")

    # Prepare training examples
    train_examples = []
    for pair in pairs:
        query = pair["query"]
        positive = pair["positive_description"]
        quality = pair.get("quality_score", 0.8)

        # Weight high-quality pairs more by repeating them
        repeats = 1
        if quality >= 0.9:
            repeats = 3
        elif quality >= 0.7:
            repeats = 2

        for _ in range(repeats):
            train_examples.append(InputExample(texts=[query, positive]))

    logger.info(f"Training examples: {len(train_examples)} (from {len(pairs)} unique pairs)")

    # DataLoader
    train_dataloader = DataLoader(train_examples, shuffle=True, batch_size=batch_size)

    # Loss function: MultipleNegativesRankingLoss
    # This is the best loss for training retrieval/search models.
    # Given (query, positive) pairs, other positives in the batch are negatives.
    train_loss = losses.MultipleNegativesRankingLoss(model=model)

    # Calculate warmup steps
    total_steps = len(train_dataloader) * epochs
    warmup_steps = int(total_steps * warmup_ratio)

    logger.info(f"Training config:")
    logger.info(f"  Base model:    {base_model}")
    logger.info(f"  Output:        {output_dir}")
    logger.info(f"  Epochs:        {epochs}")
    logger.info(f"  Batch size:    {batch_size}")
    logger.info(f"  Learning rate: {learning_rate}")
    logger.info(f"  Total steps:   {total_steps}")
    logger.info(f"  Warmup steps:  {warmup_steps}")

    # Fine-tune
    logger.info("Starting fine-tuning...")
    start = time.time()

    model.fit(
        train_objectives=[(train_dataloader, train_loss)],
        epochs=epochs,
        warmup_steps=warmup_steps,
        output_path=output_dir,
        show_progress_bar=True,
        optimizer_params={"lr": learning_rate},
    )

    elapsed = time.time() - start
    logger.info(f"Fine-tuning complete in {elapsed:.1f}s")
    logger.info(f"Model saved to: {output_dir}")

    return output_dir


def evaluate_model(model_path: str, pairs: List[Dict], top_k: int = 10):
    """
    Quick evaluation: encode all pairs' queries and check if the positive
    description appears in the top-K FAISS results.
    """
    from sentence_transformers import SentenceTransformer
    import numpy as np

    logger.info(f"Evaluating model: {model_path}")
    model = SentenceTransformer(model_path, device="cpu")

    # Load metadata
    from app.core.config import settings
    persist_dir = os.path.abspath(settings.chroma_persist_dir)
    metadata_file = os.path.join(persist_dir, "hs_codes_metadata.json")

    if not os.path.exists(metadata_file):
        logger.warning("No metadata file — skipping evaluation")
        return

    with open(metadata_file, "r", encoding="utf-8") as f:
        all_meta = json.load(f)

    descriptions = [m.get("description", "") for m in all_meta]

    # Encode all descriptions
    logger.info(f"Encoding {len(descriptions)} descriptions...")
    desc_embeddings = model.encode(descriptions, normalize_embeddings=True, show_progress_bar=True)

    hits = 0
    total = min(len(pairs), 100)
    test_pairs = pairs[:total]

    for pair in test_pairs:
        query = pair["query"]
        positive_desc = pair["positive_description"].lower()

        query_emb = model.encode([query], normalize_embeddings=True)
        scores = np.dot(desc_embeddings, query_emb.T).flatten()
        top_indices = np.argsort(scores)[-top_k:][::-1]

        top_descs = [descriptions[i].lower() for i in top_indices]
        if any(positive_desc in d or d in positive_desc for d in top_descs):
            hits += 1

    recall = hits / total * 100 if total > 0 else 0
    logger.info(f"Recall@{top_k}: {hits}/{total} = {recall:.1f}%")
    return recall


def main():
    parser = argparse.ArgumentParser(description="Fine-tune HS code embedding model")
    parser.add_argument("--min-pairs", type=int, default=50,
                        help="Minimum training pairs required (default: 50)")
    parser.add_argument("--min-quality", type=float, default=0.5,
                        help="Minimum quality score for pairs (default: 0.5)")
    parser.add_argument("--epochs", type=int, default=3,
                        help="Training epochs (default: 3)")
    parser.add_argument("--batch-size", type=int, default=16,
                        help="Batch size (default: 16)")
    parser.add_argument("--lr", type=float, default=2e-5,
                        help="Learning rate (default: 2e-5)")
    parser.add_argument("--output", type=str, default="./data/finetuned_model",
                        help="Output directory for fine-tuned model")
    parser.add_argument("--base-model", type=str, default="all-MiniLM-L6-v2",
                        help="Base model to fine-tune")
    parser.add_argument("--dry-run", action="store_true",
                        help="Show statistics without training")
    parser.add_argument("--evaluate", action="store_true",
                        help="Evaluate model after training")
    parser.add_argument("--rebuild-index", action="store_true",
                        help="Rebuild FAISS index after training")
    args = parser.parse_args()

    # 1. Export training pairs
    logger.info("=" * 60)
    logger.info("HS Code Embedding Fine-Tuning Pipeline")
    logger.info("=" * 60)

    logger.info("\nStep 1: Exporting training pairs from database...")
    db_pairs = export_training_pairs(min_quality=args.min_quality)
    logger.info(f"  Database pairs: {len(db_pairs)}")

    logger.info("\nStep 2: Augmenting with synonym cache...")
    cache_pairs = augment_with_synonym_cache()
    logger.info(f"  Synonym cache pairs: {len(cache_pairs)}")

    # Merge and deduplicate
    all_pairs = db_pairs + cache_pairs
    seen = set()
    unique_pairs = []
    for p in all_pairs:
        key = (p["query"].lower(), p["positive_description"].lower())
        if key not in seen:
            seen.add(key)
            unique_pairs.append(p)

    logger.info(f"\nTotal unique pairs: {len(unique_pairs)}")

    # Show source breakdown
    sources = {}
    for p in unique_pairs:
        src = p.get("source", "unknown")
        sources[src] = sources.get(src, 0) + 1
    for src, count in sorted(sources.items()):
        logger.info(f"  {src}: {count}")

    # Show quality distribution
    high_q = sum(1 for p in unique_pairs if p.get("quality_score", 0) >= 0.8)
    mid_q = sum(1 for p in unique_pairs if 0.5 <= p.get("quality_score", 0) < 0.8)
    low_q = sum(1 for p in unique_pairs if p.get("quality_score", 0) < 0.5)
    logger.info(f"\nQuality distribution:")
    logger.info(f"  High (>=0.8): {high_q}")
    logger.info(f"  Medium (0.5-0.8): {mid_q}")
    logger.info(f"  Low (<0.5): {low_q}")

    # Show sample pairs
    logger.info(f"\nSample pairs:")
    for p in unique_pairs[:5]:
        logger.info(f"  '{p['query']}' → '{p['positive_description'][:60]}...' "
                     f"(quality: {p.get('quality_score', '?')})")

    if args.dry_run:
        logger.info("\n[DRY RUN] Would train with the above pairs. Exiting.")
        return

    # Check minimum
    if len(unique_pairs) < args.min_pairs:
        logger.warning(
            f"\n⚠ Only {len(unique_pairs)} pairs available, need at least {args.min_pairs}. "
            f"Keep using the app — training pairs accumulate automatically from:\n"
            f"  • Enrichment successes (brand searches)\n"
            f"  • High-confidence direct matches (>75%)\n"
            f"  • Manual admin additions\n"
            f"  • Synonym cache entries\n"
            f"\nRun with --min-pairs {len(unique_pairs)} to force training anyway,\n"
            f"or run --dry-run to see current stats."
        )
        return

    # 3. Fine-tune
    logger.info(f"\nStep 3: Fine-tuning model...")
    output_dir = finetune(
        pairs=unique_pairs,
        output_dir=args.output,
        base_model=args.base_model,
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.lr,
    )

    # 4. Evaluate
    if args.evaluate:
        logger.info(f"\nStep 4: Evaluating fine-tuned model...")
        evaluate_model(output_dir, unique_pairs)

    # 5. Rebuild index
    if args.rebuild_index:
        logger.info(f"\nStep 5: Rebuilding FAISS index with fine-tuned model...")
        logger.info(f"Set EMBEDDING_MODEL={output_dir} in .env, then run:")
        logger.info(f"  python -m scripts.embed_dataset --force")
        # Could automate this, but it's safer to let the user do it
        # since it replaces the production index.

    logger.info(f"\n{'='*60}")
    logger.info(f"Fine-tuning pipeline complete!")
    logger.info(f"")
    logger.info(f"Next steps:")
    logger.info(f"  1. Set EMBEDDING_MODEL={output_dir} in .env")
    logger.info(f"  2. Delete data/chroma_db/ contents to force re-embedding")
    logger.info(f"  3. Run: python -m scripts.embed_dataset")
    logger.info(f"  4. Restart the server")
    logger.info(f"{'='*60}")


if __name__ == "__main__":
    main()
