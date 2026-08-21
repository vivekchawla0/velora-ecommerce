from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class RecommendationItem(BaseModel):
    productId: str = Field(..., description="Unique product ID")
    score: float = Field(..., description="Collaborative filtering / similarity confidence score")
    reason: str = Field(..., description="Explainability explanation for why this item was recommended")
    reason_type: str = Field("similar_user", description="Categorical reason type (similar_user, recent_activity, cold_start_popular, popularity_fallback)")
    similarity_type: str = Field("collaborative_filtering", description="Algorithm source (user_cf, item_cf, popularity)")
    context_items: Optional[List[str]] = Field(default=None, description="Contextual items that influenced this recommendation")

class RecommendationResponse(BaseModel):
    userId: str
    status: str = "success"
    strategy: str
    count: int
    recommendations: List[RecommendationItem]

class SimilarProductItem(BaseModel):
    productId: str
    score: float
    reason: str

class SimilarResponse(BaseModel):
    productId: str
    status: str = "success"
    count: int
    recommendations: List[SimilarProductItem]

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    users_indexed: int
    items_indexed: int
    interactions_count: int
    sparsity_percent: float

class EvaluationMetrics(BaseModel):
    precision_at_5: float
    recall_at_5: float
    f1_at_5: float
    hit_rate_at_5: float
    users_evaluated: int
    total_interactions: int

class MetricsResponse(BaseModel):
    status: str
    metrics: EvaluationMetrics
    description: str

class InteractionInput(BaseModel):
    user_id: str
    product_id: str
    interaction_type: str
    weight: float = 1.0

class TrainRequest(BaseModel):
    interactions: Optional[List[InteractionInput]] = None
    force_db_reload: bool = False
