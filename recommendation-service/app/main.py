import os
import logging
from contextlib import asynccontextmanager
from typing import Optional, List

from fastapi import FastAPI, Query, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from app.models.schemas import (
    RecommendationResponse,
    SimilarResponse,
    HealthResponse,
    MetricsResponse,
    EvaluationMetrics,
    TrainRequest,
    InteractionInput,
)
from app.recommender.engine import HybridRecommendationEngine
from app.services.data_loader import load_interactions_from_mongodb, load_products_from_mongodb

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("velora.recommender")

# Instantiate singleton recommendation engine
engine = HybridRecommendationEngine()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup & shutdown lifespan handler.
    Initializes hybrid interaction matrix and content TF-IDF vectors on startup.
    """
    logger.info("Initializing Velora Hybrid Recommendation Microservice...")
    try:
        products = load_products_from_mongodb()
        interactions = load_interactions_from_mongodb()
        engine.fit(interactions=interactions, products=products)
        stats = engine.get_stats()
        logger.info(
            f"✅ Hybrid Recommendation Engine initialized successfully: "
            f"{stats['users_indexed']} users, {stats['items_indexed']} items, "
            f"{stats['interactions_count']} interactions, {stats['content_vectors_indexed']} content vectors "
            f"(Sparsity: {stats['sparsity_percent']}%)"
        )
    except Exception as e:
        logger.error(f"Failed to fit hybrid recommendation engine during startup: {e}")
    yield
    logger.info("Velora Recommendation Microservice shutting down.")

app = FastAPI(
    title="Velora Hybrid Recommendation Microservice",
    description="Production-grade AI recommendation service using Hybrid Collaborative Filtering (IBCF + UBCF), Content-Based TF-IDF, and Popularity signals.",
    version="2.0.0",
    lifespan=lifespan,
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["General"])
def root():
    return {
        "service": "Velora Hybrid Recommendation Engine",
        "tagline": "Personalized Shopping, Reimagined.",
        "status": "online",
        "algorithm": "Hybrid 3-Signal (Collaborative Filtering 45% + Content TF-IDF 35% + Popularity 10% + Category Affinity 10%)",
        "version": "2.0.0",
        "endpoints": {
            "health": "/health",
            "recommendations": "/recommendations/{user_id}",
            "similar_products": "/similar/{product_id}",
            "interactions": "/interactions",
            "metrics": "/metrics",
            "train": "/train",
        },
    }

@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    """
    Health check endpoint returning model version, indexed counts, and matrix sparsity.
    """
    stats = engine.get_stats()
    return HealthResponse(
        status="healthy",
        service="velora-hybrid-recommendation-service",
        version="2.0.0",
        users_indexed=stats["users_indexed"],
        items_indexed=stats["items_indexed"],
        interactions_count=stats["interactions_count"],
        sparsity_percent=stats["sparsity_percent"],
    )

@app.post("/interactions", tags=["Interactions"])
def record_interaction_event(payload: InteractionInput):
    """
    Records an incoming user interaction in real time and dynamically updates user profile vectors.
    """
    try:
        engine.add_interaction(
            user_id=payload.user_id,
            product_id=payload.product_id,
            interaction_type=payload.interaction_type,
            weight=payload.weight,
        )
        return {
            "status": "success",
            "message": f"Interaction '{payload.interaction_type}' recorded in real time.",
            "user_id": payload.user_id,
            "product_id": payload.product_id,
        }
    except Exception as e:
        logger.error(f"Error logging real-time interaction: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record interaction: {str(e)}",
        )

@app.get("/recommendations/{user_id}", response_model=RecommendationResponse, tags=["Recommendations"])
def get_user_recommendations(
    user_id: str,
    limit: int = Query(10, ge=1, le=50, description="Max number of recommendations to return"),
    exclude_purchased: bool = Query(True, description="Whether to filter out previously purchased items"),
    exclude_product_ids: Optional[str] = Query(None, description="Comma-separated product IDs to exclude (e.g. dismissed items)"),
):
    """
    Retrieve Top-N personalized recommendations for a user with explainability.
    Employs Hybrid Scoring (Collaborative Filtering + Content TF-IDF + Popularity) and strict exclusion of already-interacted items.
    """
    try:
        excluded_list = [pid.strip() for pid in exclude_product_ids.split(",") if pid.strip()] if exclude_product_ids else []
        
        # Ensure fresh user state from MongoDB if user not yet in memory
        if user_id != "guest" and user_id not in engine.user_interacted_items:
            try:
                db_interactions = load_interactions_from_mongodb()
                user_matches = [i for i in db_interactions if str(i.get("user_id")) == str(user_id)]
                if len(user_matches) > 0:
                    products = load_products_from_mongodb()
                    engine.fit(interactions=db_interactions, products=products)
            except Exception as db_err:
                logger.debug(f"DB reload check: {db_err}")

        recs = engine.recommend_for_user(
            user_id=user_id,
            limit=limit,
            exclude_purchased=exclude_purchased,
            exclude_interacted=True,
            exclude_product_ids=excluded_list,
        )

        # Strategy classification
        user_interactions_count = len(engine.user_interacted_items.get(user_id, {}))
        if user_interactions_count == 0:
            strategy_name = "cold_start_popular"
        elif user_interactions_count <= 2:
            strategy_name = "hybrid_sparse"
        else:
            strategy_name = "hybrid"

        return RecommendationResponse(
            userId=user_id,
            status="success",
            strategy=strategy_name,
            count=len(recs),
            recommendations=recs,
        )
    except Exception as e:
        logger.error(f"Error computing hybrid recommendations for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate recommendations: {str(e)}",
        )

@app.get("/similar/{product_id}", response_model=SimilarResponse, tags=["Recommendations"])
def get_similar_items(
    product_id: str,
    limit: int = Query(6, ge=1, le=20, description="Max number of similar items"),
):
    """
    Retrieve item-to-item similar products based on TF-IDF content similarity and co-occurrence.
    """
    try:
        similar = engine.get_similar_products(product_id=product_id, limit=limit)
        return SimilarResponse(
            productId=product_id,
            status="success",
            count=len(similar),
            recommendations=similar,
        )
    except Exception as e:
        logger.error(f"Error computing item similarity for product {product_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve similar items: {str(e)}",
        )

@app.post("/train", tags=["Model Lifecycle"])
def train_model(payload: Optional[TrainRequest] = None):
    """
    Trigger model retraining with new interaction data or fresh database reload.
    """
    try:
        products = load_products_from_mongodb()
        if payload and payload.interactions and len(payload.interactions) > 0:
            interactions = [i.model_dump() for i in payload.interactions]
        else:
            interactions = load_interactions_from_mongodb()

        engine.fit(interactions=interactions, products=products)
        stats = engine.get_stats()

        return {
            "status": "success",
            "message": "Hybrid recommendation model retrained successfully.",
            "stats": stats,
        }
    except Exception as e:
        logger.error(f"Error retraining model: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model retraining failed: {str(e)}",
        )

@app.get("/metrics", response_model=MetricsResponse, tags=["Evaluation"])
def get_evaluation_metrics():
    """
    Calculates offline recommendation evaluation metrics (Precision@5, Recall@5, F1@5, Hit Rate).
    """
    from app.evaluate import evaluate_recommender
    try:
        metrics = evaluate_recommender(engine)
        return MetricsResponse(
            status="success",
            metrics=EvaluationMetrics(**metrics),
            description="Offline Top-5 Hybrid Evaluation metrics evaluated via 80/20 train-test interaction split.",
        )
    except Exception as e:
        logger.error(f"Evaluation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Evaluation failed: {str(e)}",
        )

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("RECOMMENDATION_PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
