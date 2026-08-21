import os
import sys
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple

# Ensure parent directory is in sys.path when running evaluate.py directly
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from app.recommender.engine import HybridRecommendationEngine
from app.services.data_loader import load_interactions_from_mongodb, load_products_from_mongodb

def split_train_test(
    interactions: List[Dict[str, Any]],
    test_ratio: float = 0.25,
    random_seed: int = 42
) -> Tuple[List[Dict[str, Any]], Dict[str, set]]:
    """
    Splits user interaction logs into Train split and Test ground-truth held-out sets.
    Ensures users with >= 2 interactions have test items for genuine evaluation.
    """
    np.random.seed(random_seed)
    df = pd.DataFrame(interactions)

    user_col = "userId" if "userId" in df.columns else "user_id"
    prod_col = "productId" if "productId" in df.columns else "product_id"

    df["u"] = df[user_col].astype(str)
    df["p"] = df[prod_col].astype(str)

    train_records = []
    test_ground_truth = {}

    for user_id, group in df.groupby("u"):
        items = group["p"].unique().tolist()
        if len(items) >= 2:
            n_test = max(1, int(len(items) * test_ratio))
            test_items = set(np.random.choice(items, size=n_test, replace=False))
            test_ground_truth[user_id] = test_items

            for _, row in group.iterrows():
                if str(row["p"]) not in test_items:
                    train_records.append(row.to_dict())
        else:
            for _, row in group.iterrows():
                train_records.append(row.to_dict())

    return train_records, test_ground_truth

def evaluate_recommender(
    engine: HybridRecommendationEngine = None,
    k: int = 5
) -> Dict[str, Any]:
    """
    Evaluates Hybrid Recommendation Engine using Precision@K, Recall@K, F1@K, and Hit Rate.
    """
    interactions = load_interactions_from_mongodb()
    products = load_products_from_mongodb()

    if not interactions:
        return {
            "precision_at_5": 0.0,
            "recall_at_5": 0.0,
            "f1_at_5": 0.0,
            "hit_rate_at_5": 0.0,
            "users_evaluated": 0,
            "total_interactions": 0,
        }

    train_data, test_truth = split_train_test(interactions, test_ratio=0.25, random_seed=42)

    eval_engine = HybridRecommendationEngine()
    eval_engine.fit(interactions=train_data, products=products)

    precisions = []
    recalls = []
    f1s = []
    hit_rates = []

    for user_id, actual_relevant_items in test_truth.items():
        if not actual_relevant_items:
            continue

        # Get Top-K recommendations from model (excluding train-set interactions)
        recs = eval_engine.recommend_for_user(
            user_id=user_id,
            limit=k,
            exclude_purchased=False,
            exclude_interacted=True
        )
        rec_ids = [r["productId"] for r in recs]

        # Calculate overlap (True Positives)
        hits = len(set(rec_ids).intersection(actual_relevant_items))

        precision = hits / k if k > 0 else 0.0
        recall = hits / len(actual_relevant_items) if len(actual_relevant_items) > 0 else 0.0
        f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
        hit = 1.0 if hits > 0 else 0.0

        precisions.append(precision)
        recalls.append(recall)
        f1s.append(f1)
        hit_rates.append(hit)

    mean_precision = float(np.mean(precisions)) if precisions else 0.0
    mean_recall = float(np.mean(recalls)) if recalls else 0.0
    mean_f1 = float(np.mean(f1s)) if f1s else 0.0
    mean_hit_rate = float(np.mean(hit_rates)) if hit_rates else 0.0

    return {
        "precision_at_5": round(mean_precision, 4),
        "recall_at_5": round(mean_recall, 4),
        "f1_at_5": round(mean_f1, 4),
        "hit_rate_at_5": round(mean_hit_rate, 4),
        "users_evaluated": len(test_truth),
        "total_interactions": len(interactions),
    }

def print_evaluation_report():
    print("\n" + "=" * 58)
    print("      Velora Hybrid Recommendation Evaluation Report")
    print("=" * 58)
    
    metrics = evaluate_recommender(k=5)
    
    print(f"Precision@5:        {metrics['precision_at_5']:.4f}  ({metrics['precision_at_5']*100:.1f}%)")
    print(f"Recall@5:           {metrics['recall_at_5']:.4f}  ({metrics['recall_at_5']*100:.1f}%)")
    print(f"F1@5:               {metrics['f1_at_5']:.4f}")
    print(f"Hit Rate@5:         {metrics['hit_rate_at_5']:.4f}  ({metrics['hit_rate_at_5']*100:.1f}%)")
    print(f"Evaluated Users:    {metrics['users_evaluated']}")
    print(f"Total Interactions: {metrics['total_interactions']}")
    print("=" * 58)
    print("Evaluation Strategy: 75/25 Train-Test User Split")
    print("Algorithm:           Hybrid (CF + Content TF-IDF + Popularity)")
    print("=" * 58 + "\n")

    return metrics

if __name__ == "__main__":
    print_evaluation_report()
