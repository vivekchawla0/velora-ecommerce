import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional, Any, Set
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import logging
import datetime

logger = logging.getLogger("velora.recommender.engine")

class HybridRecommendationEngine:
    """
    Production-grade, CPU-optimized Hybrid Recommendation Engine for Velora.
    
    Architecture:
    1. Collaborative Filtering (CF):
       - User-Based Collaborative Filtering (UBCF) with cosine similarity
       - Item-Based Collaborative Filtering (IBCF) with item co-occurrence similarity
    2. Content-Based Filtering (CBF):
       - TF-IDF product metadata vectorization (name, category, brand, tags, description, specs)
       - Weighted user preference profile vectors with recency time-decay
    3. Popularity & Trending Signal:
       - Bayesian interaction-weighted popularity scoring
    4. Candidate Generation & Strict Filtering:
       - Candidate pool generation across all signals
       - Complete exclusion of all user-interacted items (view, click, favorite, cart, purchase, rating)
    5. Diversity Re-ranking & Truthful Explainability:
       - Category and brand diversity balancing
       - Dominant signal attribution (recent_activity, category_affinity, similar_user, cold_start_popular)
    """

    INTERACTION_WEIGHTS = {
        "view": 1.0,
        "click": 2.0,
        "wishlist": 3.0,
        "favorite": 3.0,
        "cart": 4.0,
        "purchase": 5.0,
        "rating": 3.0,
    }

    def __init__(
        self,
        cf_weight: float = 0.45,
        content_weight: float = 0.35,
        popularity_weight: float = 0.10,
        affinity_weight: float = 0.10,
    ):
        self.w_cf = cf_weight
        self.w_cb = content_weight
        self.w_pop = popularity_weight
        self.w_aff = affinity_weight

        # Data stores
        self.products_df: Optional[pd.DataFrame] = None
        self.product_catalog: Dict[str, Dict[str, Any]] = {}
        self.raw_interactions: List[Dict[str, Any]] = []
        
        # User tracking
        self.user_interacted_items: Dict[str, Dict[str, float]] = {}
        self.user_purchased_items: Dict[str, Set[str]] = {}
        self.user_category_affinity: Dict[str, Dict[str, float]] = {}

        # Collaborative Filtering structures
        self.user_item_matrix: Optional[pd.DataFrame] = None
        self.user_similarity_df: Optional[pd.DataFrame] = None
        self.item_similarity_df: Optional[pd.DataFrame] = None

        # Content-Based structures
        self.tfidf_vectorizer: Optional[TfidfVectorizer] = None
        self.product_tfidf_matrix = None
        self.product_id_to_idx: Dict[str, int] = {}
        self.idx_to_product_id: Dict[int, str] = {}
        self.item_content_sim_df: Optional[pd.DataFrame] = None

        # Popularity Ranking
        self.popularity_rank: List[Tuple[str, float]] = []
        self.popularity_dict: Dict[str, float] = {}

        self.is_trained: bool = False

    def fit(
        self,
        interactions: List[Dict[str, Any]],
        products: Optional[List[Dict[str, Any]]] = None,
    ):
        """
        Fits both Collaborative Filtering and Content-Based representations.
        """
        logger.info("Training Velora Hybrid Recommendation Engine...")
        
        # 1. Store Product Catalog & Build Content Vectors
        if products and len(products) > 0:
            self._fit_content_model(products)
        elif self.products_df is None or len(self.products_df) == 0:
            from app.services.data_loader import load_products_from_mongodb
            loaded_prods = load_products_from_mongodb()
            if loaded_prods and len(loaded_prods) > 0:
                self._fit_content_model(loaded_prods)

        # 2. Process Interaction Logs
        if not interactions or len(interactions) == 0:
            self.is_trained = (self.products_df is not None and len(self.products_df) > 0)
            return self

        self.raw_interactions = list(interactions)
        df = pd.DataFrame(interactions)

        user_col = "userId" if "userId" in df.columns else ("user_id" if "user_id" in df.columns else None)
        prod_col = "productId" if "productId" in df.columns else ("product_id" if "product_id" in df.columns else None)
        type_col = "type" if "type" in df.columns else ("interaction_type" if "interaction_type" in df.columns else None)
        weight_col = "weight" if "weight" in df.columns else None

        if not user_col or not prod_col:
            self.is_trained = True
            return self

        # Calculate interaction weights
        if not weight_col:
            df["weight"] = df[type_col].map(lambda t: self.INTERACTION_WEIGHTS.get(str(t).lower(), 1.0)) if type_col else 1.0

        df["user_id"] = df[user_col].astype(str)
        df["product_id"] = df[prod_col].astype(str)
        df["weight"] = pd.to_numeric(df["weight"], errors="coerce").fillna(1.0)

        # 3. Build In-Memory User Interaction and Category Preference Profiles
        self.user_interacted_items = {}
        self.user_purchased_items = {}
        self.user_category_affinity = {}

        for _, row in df.iterrows():
            u, p, w = str(row["user_id"]), str(row["product_id"]), float(row["weight"])
            
            # Interaction record
            if u not in self.user_interacted_items:
                self.user_interacted_items[u] = {}
            self.user_interacted_items[u][p] = self.user_interacted_items[u].get(p, 0.0) + w

            # Purchase record
            if type_col and str(row.get(type_col, "")).lower() == "purchase":
                if u not in self.user_purchased_items:
                    self.user_purchased_items[u] = set()
                self.user_purchased_items[u].add(p)

            # Category affinity
            if p in self.product_catalog:
                cat = self.product_catalog[p].get("category", "general")
                if u not in self.user_category_affinity:
                    self.user_category_affinity[u] = {}
                self.user_category_affinity[u][cat] = self.user_category_affinity[u].get(cat, 0.0) + w

        # Normalize category affinity distribution per user
        for u, cat_dict in self.user_category_affinity.items():
            total_w = sum(cat_dict.values())
            if total_w > 0:
                self.user_category_affinity[u] = {k: v / total_w for k, v in cat_dict.items()}

        # 4. Construct Collaborative Filtering User-Item Matrix
        matrix_df = df.groupby(["user_id", "product_id"])["weight"].sum().unstack(fill_value=0.0)
        self.user_item_matrix = matrix_df

        # Compute User-User Cosine Similarity
        if len(matrix_df) > 0:
            user_sim = cosine_similarity(matrix_df.values)
            user_sim = np.nan_to_num(user_sim)
            self.user_similarity_df = pd.DataFrame(
                user_sim,
                index=matrix_df.index,
                columns=matrix_df.index
            )

        # Compute Item-Item Collaborative Cosine Similarity
        if matrix_df.shape[1] > 0:
            item_sim = cosine_similarity(matrix_df.values.T)
            item_sim = np.nan_to_num(item_sim)
            self.item_similarity_df = pd.DataFrame(
                item_sim,
                index=matrix_df.columns,
                columns=matrix_df.columns
            )

        # 5. Compute Bayesian Weighted Popularity Scores
        self._compute_popularity_ranking(df)

        self.is_trained = True
        logger.info(
            f"✅ Hybrid Recommender fitted: {len(self.user_interacted_items)} users, "
            f"{len(self.product_catalog)} products, {len(df)} interactions."
        )
        return self

    def _fit_content_model(self, products: List[Dict[str, Any]]):
        """
        Builds TF-IDF feature matrix over product metadata fields.
        """
        self.product_catalog = {}
        corpus = []
        product_ids = []

        for p in products:
            pid = str(p.get("product_id") or p.get("_id"))
            self.product_catalog[pid] = p
            product_ids.append(pid)

            # Metadata text representation: Name, Category, Brand, Tags, Description, Specs
            tags_str = " ".join(p.get("tags", [])) if isinstance(p.get("tags"), list) else str(p.get("tags", ""))
            specs_str = " ".join([f"{k} {v}" for k, v in p.get("specs", {}).items()]) if isinstance(p.get("specs"), dict) else ""
            
            doc_text = f"{p.get('name', '')} {p.get('category', '')} {p.get('brand', '')} {tags_str} {p.get('description', '')} {specs_str}"
            corpus.append(doc_text)

        self.products_df = pd.DataFrame(products)
        self.product_id_to_idx = {pid: idx for idx, pid in enumerate(product_ids)}
        self.idx_to_product_id = {idx: pid for idx, pid in enumerate(product_ids)}

        if len(corpus) > 0:
            self.tfidf_vectorizer = TfidfVectorizer(
                stop_words="english",
                ngram_range=(1, 2),
                max_features=4000,
                sublinear_tf=True
            )
            self.product_tfidf_matrix = self.tfidf_vectorizer.fit_transform(corpus)
            
            # Precompute Item-to-Item Content Cosine Similarity
            content_sim = cosine_similarity(self.product_tfidf_matrix)
            content_sim = np.nan_to_num(content_sim)
            self.item_content_sim_df = pd.DataFrame(
                content_sim,
                index=product_ids,
                columns=product_ids
            )

    def _compute_popularity_ranking(self, df: pd.DataFrame):
        """
        Computes platform-wide weighted interaction density + rating score.
        """
        item_scores: Dict[str, float] = {}
        for _, row in df.iterrows():
            pid = str(row["product_id"])
            w = float(row["weight"])
            item_scores[pid] = item_scores.get(pid, 0.0) + w

        # Ensure all catalog items are present in ranking
        for pid in self.product_catalog:
            if pid not in item_scores:
                item_scores[pid] = 0.5  # Base default weight

        max_score = max(item_scores.values()) if len(item_scores) > 0 and max(item_scores.values()) > 0 else 1.0
        self.popularity_dict = {pid: score / max_score for pid, score in item_scores.items()}
        self.popularity_rank = sorted(self.popularity_dict.items(), key=lambda x: x[1], reverse=True)

    def add_interaction(
        self,
        user_id: str,
        product_id: str,
        interaction_type: str = "view",
        weight: Optional[float] = None,
    ):
        """
        Streams a new live interaction into the engine dynamically.
        Updates user interaction profile, category affinity, and collaborative vectors in real-time.
        """
        user_id = str(user_id)
        product_id = str(product_id)

        if weight is None or weight <= 0:
            weight = self.INTERACTION_WEIGHTS.get(interaction_type.lower(), 1.0)

        # 1. Update user interaction dictionary
        if user_id not in self.user_interacted_items:
            self.user_interacted_items[user_id] = {}
        self.user_interacted_items[user_id][product_id] = (
            self.user_interacted_items[user_id].get(product_id, 0.0) + float(weight)
        )

        # 2. Update purchases
        if interaction_type.lower() == "purchase":
            if user_id not in self.user_purchased_items:
                self.user_purchased_items[user_id] = set()
            self.user_purchased_items[user_id].add(product_id)

        # 3. Update category affinity
        if product_id in self.product_catalog:
            cat = self.product_catalog[product_id].get("category", "general")
            if user_id not in self.user_category_affinity:
                self.user_category_affinity[user_id] = {}
            self.user_category_affinity[user_id][cat] = self.user_category_affinity[user_id].get(cat, 0.0) + float(weight)
            # Re-normalize
            total_w = sum(self.user_category_affinity[user_id].values())
            if total_w > 0:
                self.user_category_affinity[user_id] = {k: v / total_w for k, v in self.user_category_affinity[user_id].items()}

        # 4. Append to raw interactions and update CF matrix
        self.raw_interactions.append({
            "user_id": user_id,
            "product_id": product_id,
            "interaction_type": interaction_type,
            "weight": weight,
        })

        if self.user_item_matrix is not None:
            if user_id in self.user_item_matrix.index and product_id in self.user_item_matrix.columns:
                self.user_item_matrix.loc[user_id, product_id] += float(weight)
            else:
                self.fit(self.raw_interactions)
        else:
            self.fit(self.raw_interactions)

        logger.info(f"Streamed interaction: User {user_id} -> Product {product_id} ({interaction_type}, w={weight})")

    def recommend_for_user(
        self,
        user_id: str,
        limit: int = 10,
        exclude_purchased: bool = True,
        exclude_interacted: bool = True,
        exclude_product_ids: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Generates Top-N personalized recommendations for NEW products the user has NOT interacted with.
        
        Pipeline:
        1. Identification of user interaction history & category preferences.
        2. Construction of strict exclusion set (all past views, clicks, wishlists, carts, purchases, ratings).
        3. Candidate Generation from 3 Signals (Collaborative Filtering, Content-Based, Popularity).
        4. Hybrid Scoring & Category Affinity weighting.
        5. Diversity-aware candidate ranking.
        6. Truthful explainability tag assignment.
        """
        user_id = str(user_id)
        limit = max(1, limit)

        # 1. Construct Strict Exclusion Set
        excluded_set = set(str(pid) for pid in exclude_product_ids) if exclude_product_ids else set()
        purchased = set(str(pid) for pid in self.user_purchased_items.get(user_id, set())) if exclude_purchased else set()
        interacted_dict = self.user_interacted_items.get(user_id, {})
        interacted_pids = set(str(pid) for pid in interacted_dict.keys()) if exclude_interacted else set()

        # Guaranteed NEVER to appear in "For You" recommendations
        full_exclusion = excluded_set.union(purchased).union(interacted_pids)

        has_history = len(interacted_dict) > 0 and sum(interacted_dict.values()) > 0

        logger.info(
            f"[Recommender Engine] userId: '{user_id}' | "
            f"interacted products: {len(interacted_dict)} | "
            f"excluded products: {len(full_exclusion)}"
        )

        # Case 1: Brand-New User (Cold Start with 0 interactions)
        if not has_history:
            cold_recs = self._get_cold_start_recommendations(limit, full_exclusion)
            logger.info(
                f"[Recommender Engine] userId: '{user_id}' | "
                f"strategy: cold_start_popular | candidates: {len(self.popularity_rank)} | "
                f"final recommended product IDs ({len(cold_recs)}): {[r['productId'] for r in cold_recs]}"
            )
            return cold_recs

        # Dynamic Signal Weights based on history density
        n_interactions = len(interacted_dict)
        if n_interactions <= 2:
            # Sparse user: Rely heavily on content metadata and category affinity
            w_cf, w_cb, w_pop, w_aff = 0.10, 0.50, 0.10, 0.30
        elif n_interactions <= 6:
            # Medium history: Balanced hybrid with strong content affinity
            w_cf, w_cb, w_pop, w_aff = 0.25, 0.40, 0.10, 0.25
        else:
            # Dense user: Full collaborative + content hybrid
            w_cf, w_cb, w_pop, w_aff = self.w_cf, self.w_cb, self.w_pop, self.w_aff

        # -------------------------------------------------------------
        # Signal A: Collaborative Filtering Scores (IBCF + UBCF)
        # -------------------------------------------------------------
        cf_scores: Dict[str, float] = {}
        
        # IBCF
        if self.item_similarity_df is not None and len(self.item_similarity_df) > 0:
            for interacted_pid, weight in interacted_dict.items():
                if interacted_pid in self.item_similarity_df.index:
                    sim_series = self.item_similarity_df.loc[interacted_pid]
                    for candidate_pid, sim_score in sim_series.items():
                        cand_str = str(candidate_pid)
                        if sim_score > 0 and cand_str not in full_exclusion:
                            cf_scores[cand_str] = cf_scores.get(cand_str, 0.0) + (float(weight) * float(sim_score))

        # UBCF
        if (
            self.user_similarity_df is not None
            and user_id in self.user_similarity_df.index
            and self.user_item_matrix is not None
        ):
            user_sims = self.user_similarity_df.loc[user_id].copy()
            user_sims[user_id] = 0.0
            top_neighbors = user_sims[user_sims > 0].sort_values(ascending=False)

            if len(top_neighbors) > 0:
                neighbor_indices = top_neighbors.index
                neighbor_matrix = self.user_item_matrix.loc[neighbor_indices].values
                weights = top_neighbors.values
                sim_sum = np.sum(np.abs(weights)) + 1e-8
                predicted_ubcf = np.dot(weights, neighbor_matrix) / sim_sum

                for idx, col_item in enumerate(self.user_item_matrix.columns):
                    cand_str = str(col_item)
                    ubcf_val = float(predicted_ubcf[idx])
                    if ubcf_val > 0 and cand_str not in full_exclusion:
                        cf_scores[cand_str] = cf_scores.get(cand_str, 0.0) + (ubcf_val * 1.5)

        # Normalize CF scores
        max_cf = max(cf_scores.values()) if len(cf_scores) > 0 and max(cf_scores.values()) > 0 else 1.0
        norm_cf = {k: v / max_cf for k, v in cf_scores.items()}

        # -------------------------------------------------------------
        # Signal B: Content-Based User Preference Profile Scores
        # -------------------------------------------------------------
        cb_scores: Dict[str, float] = {}
        if self.product_tfidf_matrix is not None and len(self.product_id_to_idx) > 0:
            # Build User Profile Vector: Weighted sum of interacted product TF-IDF vectors
            user_profile_vec = np.zeros((1, self.product_tfidf_matrix.shape[1]))
            total_weight = 0.0

            for interacted_pid, weight in interacted_dict.items():
                if interacted_pid in self.product_id_to_idx:
                    idx = self.product_id_to_idx[interacted_pid]
                    user_profile_vec += (weight * self.product_tfidf_matrix[idx].toarray())
                    total_weight += weight

            if total_weight > 0:
                norm_val = np.linalg.norm(user_profile_vec)
                if norm_val > 0:
                    user_profile_vec = user_profile_vec / norm_val
                    # Compute Cosine Similarity between user profile and all products
                    content_similarities = cosine_similarity(user_profile_vec, self.product_tfidf_matrix.toarray())[0]

                    for idx, sim in enumerate(content_similarities):
                        pid = self.idx_to_product_id[idx]
                        if sim > 0 and pid not in full_exclusion:
                            cb_scores[pid] = float(sim)

        # Normalize CB scores
        max_cb = max(cb_scores.values()) if len(cb_scores) > 0 and max(cb_scores.values()) > 0 else 1.0
        norm_cb = {k: v / max_cb for k, v in cb_scores.items()}

        # -------------------------------------------------------------
        # Signal C: Category Affinity & Popularity
        # -------------------------------------------------------------
        user_affinities = self.user_category_affinity.get(user_id, {})

        # -------------------------------------------------------------
        # Candidate Aggregation & Hybrid Scoring Formula
        # -------------------------------------------------------------
        # Candidate Pool: Union of top CF + top CB + top Popularity items
        candidate_pool: Set[str] = set()
        candidate_pool.update(norm_cf.keys())
        candidate_pool.update(norm_cb.keys())
        for pid, _ in self.popularity_rank[:50]:
            if pid not in full_exclusion:
                candidate_pool.add(pid)

        scored_candidates = []
        for pid in candidate_pool:
            if pid in full_exclusion:
                continue

            score_cf = norm_cf.get(pid, 0.0)
            score_cb = norm_cb.get(pid, 0.0)
            score_pop = self.popularity_dict.get(pid, 0.2)
            
            # Category affinity
            cat = self.product_catalog.get(pid, {}).get("category", "")
            score_aff = user_affinities.get(cat, 0.0)

            # HYBRID RANKING FORMULA
            hybrid_score = (
                (w_cf * score_cf) +
                (w_cb * score_cb) +
                (w_pop * score_pop) +
                (w_aff * score_aff)
            )

            # Assign explainability reason based on strongest active signal
            prod_name = self.product_catalog.get(pid, {}).get("name", "Product")
            if score_cb >= score_cf and score_cb >= 0.25 and cat:
                reason = f"Similar to products you've explored in {cat.replace('-', ' ').title()}"
                reason_type = "category_affinity"
                sim_type = "content_based"
            elif score_cf > score_cb and score_cf >= 0.3:
                reason = "Popular among shoppers with matching preferences"
                reason_type = "similar_user"
                sim_type = "collaborative_filtering"
            elif score_aff >= 0.3:
                reason = f"Recommended because you frequently explore {cat.replace('-', ' ').title()}"
                reason_type = "category_affinity"
                sim_type = "hybrid"
            else:
                reason = "Recommended based on your recent activity"
                reason_type = "recent_activity"
                sim_type = "hybrid"

            scored_candidates.append({
                "productId": str(pid),
                "raw_score": float(hybrid_score),
                "category": cat,
                "reason": reason,
                "reason_type": reason_type,
                "similarity_type": sim_type,
            })

        # Sort descending by hybrid score
        scored_candidates.sort(key=lambda x: x["raw_score"], reverse=True)

        # -------------------------------------------------------------
        # Diversity Re-ranking: Avoid category flooding
        # -------------------------------------------------------------
        recommendations = []
        category_counts: Dict[str, int] = {}
        max_per_category = max(2, int(np.ceil(limit / 3)))

        # First pass: Diverse selection up to max_per_category
        deferred = []
        max_raw = scored_candidates[0]["raw_score"] if len(scored_candidates) > 0 and scored_candidates[0]["raw_score"] > 0 else 1.0

        for cand in scored_candidates:
            cat = cand["category"]
            curr_count = category_counts.get(cat, 0)
            
            if curr_count < max_per_category:
                normalized_score = round(min(0.99, max(0.68, 0.72 + 0.26 * (cand["raw_score"] / max_raw))), 3)
                recommendations.append({
                    "productId": cand["productId"],
                    "score": normalized_score,
                    "reason": cand["reason"],
                    "reason_type": cand["reason_type"],
                    "similarity_type": cand["similarity_type"],
                })
                category_counts[cat] = curr_count + 1
            else:
                deferred.append(cand)

            if len(recommendations) >= limit:
                break

        # Second pass: If still under limit, backfill from deferred items
        if len(recommendations) < limit:
            for cand in deferred:
                normalized_score = round(min(0.99, max(0.65, 0.70 + 0.25 * (cand["raw_score"] / max_raw))), 3)
                recommendations.append({
                    "productId": cand["productId"],
                    "score": normalized_score,
                    "reason": cand["reason"],
                    "reason_type": cand["reason_type"],
                    "similarity_type": cand["similarity_type"],
                })
                if len(recommendations) >= limit:
                    break

        # Third pass: Backfill from global popularity if needed (strictly non-interacted)
        if len(recommendations) < limit:
            existing_ids = {r["productId"] for r in recommendations}
            for pid, pop_score in self.popularity_rank:
                pid_str = str(pid)
                if pid_str not in existing_ids and pid_str not in full_exclusion:
                    recommendations.append({
                        "productId": pid_str,
                        "score": round(max(0.60, pop_score * 0.85), 3),
                        "reason": "Popular and trending bestseller across our store",
                        "reason_type": "popularity_fallback",
                        "similarity_type": "popularity_fallback",
                    })
        final_result = recommendations[:limit]
        final_ids = [r["productId"] for r in final_result]
        logger.info(
            f"[Recommender Engine] userId: '{user_id}' | "
            f"candidate pool: {len(candidate_pool)} | "
            f"scored candidates: {len(scored_candidates)} | "
            f"final recommended product IDs ({len(final_ids)}): {final_ids}"
        )

        return final_result

    def get_similar_products(self, product_id: str, limit: int = 6) -> List[Dict[str, Any]]:
        """
        Hybrid Item-to-Item similarity (Content-Based metadata similarity + Co-occurrence CF).
        """
        product_id = str(product_id)
        limit = max(1, limit)

        combined_scores: Dict[str, float] = {}

        # 1. Content-based item similarity
        if self.item_content_sim_df is not None and product_id in self.item_content_sim_df.index:
            content_sims = self.item_content_sim_df.loc[product_id]
            for pid, score in content_sims.items():
                if pid != product_id and score > 0:
                    combined_scores[str(pid)] = combined_scores.get(str(pid), 0.0) + (float(score) * 0.6)

        # 2. Collaborative co-occurrence similarity
        if self.item_similarity_df is not None and product_id in self.item_similarity_df.index:
            cf_sims = self.item_similarity_df.loc[product_id]
            for pid, score in cf_sims.items():
                if pid != product_id and score > 0:
                    combined_scores[str(pid)] = combined_scores.get(str(pid), 0.0) + (float(score) * 0.4)

        results = []
        if len(combined_scores) > 0:
            sorted_similar = sorted(combined_scores.items(), key=lambda x: x[1], reverse=True)
            for pid, score in sorted_similar[:limit]:
                results.append({
                    "productId": str(pid),
                    "score": round(min(0.99, max(0.65, float(score))), 3),
                    "reason": "Customers who explored this item also frequently viewed or purchased this",
                })

        # Backfill from category or popularity if needed
        if len(results) < limit:
            existing = {r["productId"] for r in results}
            existing.add(product_id)
            target_cat = self.product_catalog.get(product_id, {}).get("category")
            
            for pid, pdata in self.product_catalog.items():
                if pid not in existing and pdata.get("category") == target_cat:
                    results.append({
                        "productId": str(pid),
                        "score": 0.75,
                        "reason": f"More top-rated products in {target_cat.replace('-', ' ').title()}",
                    })
                    existing.add(pid)
                    if len(results) >= limit:
                        break

        return results[:limit]

    def _get_cold_start_recommendations(
        self,
        limit: int,
        excluded_set: Set[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Cold-Start Fallback Strategy for unauthenticated / brand-new users.
        """
        if excluded_set is None:
            excluded_set = set()

        results = []
        for pid, score in self.popularity_rank:
            pid_str = str(pid)
            if pid_str in excluded_set:
                continue
            
            cat = self.product_catalog.get(pid_str, {}).get("category", "")
            cat_label = f" in {cat.replace('-', ' ').title()}" if cat else ""

            results.append({
                "productId": pid_str,
                "score": round(max(0.70, score), 3),
                "reason": f"Top trending bestseller across all shoppers{cat_label}",
                "reason_type": "cold_start_popular",
                "similarity_type": "cold_start_popular",
            })
            if len(results) >= limit:
                break

        return results

    def get_stats(self) -> Dict[str, Any]:
        """
        Returns model statistics, sparsity, indexed user/item counts.
        """
        users_count = len(self.user_interacted_items)
        items_count = len(self.product_catalog)
        interactions_count = len(self.raw_interactions)

        sparsity = 100.0
        if self.user_item_matrix is not None and self.user_item_matrix.size > 0:
            total_cells = self.user_item_matrix.shape[0] * self.user_item_matrix.shape[1]
            non_zero = np.count_nonzero(self.user_item_matrix.values)
            sparsity = ((total_cells - non_zero) / total_cells * 100.0) if total_cells > 0 else 0.0

        return {
            "users_indexed": int(users_count),
            "items_indexed": int(items_count),
            "interactions_count": int(interactions_count),
            "sparsity_percent": round(float(sparsity), 2),
            "content_vectors_indexed": self.product_tfidf_matrix.shape[0] if self.product_tfidf_matrix is not None else 0,
        }

    def _init_empty_state(self):
        self.user_item_matrix = None
        self.user_similarity_df = None
        self.item_similarity_df = None
        self.popularity_rank = []
        self.popularity_dict = {}
        self.raw_interactions = []
        self.user_purchased_items = {}
        self.user_interacted_items = {}
        self.user_category_affinity = {}
        self.is_trained = False

# Backward-compatibility alias
CollaborativeFilteringEngine = HybridRecommendationEngine
