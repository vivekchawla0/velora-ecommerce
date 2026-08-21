import os
import logging
from typing import List, Dict, Any
from pymongo import MongoClient

logger = logging.getLogger("velora.recommender.data_loader")

# Default seed interaction fixtures for tests & fallback
DEFAULT_SEED_INTERACTIONS = [
    {"user_id": "user_demo_1", "product_id": "VEL-AUD-001", "interaction_type": "view", "weight": 1.0},
    {"user_id": "user_demo_1", "product_id": "VEL-AUD-001", "interaction_type": "purchase", "weight": 5.0},
    {"user_id": "user_demo_1", "product_id": "VEL-ELEC-001", "interaction_type": "view", "weight": 1.0},
    {"user_id": "user_demo_1", "product_id": "VEL-ELEC-001", "interaction_type": "purchase", "weight": 5.0},
    {"user_id": "user_demo_1", "product_id": "VEL-GAME-001", "interaction_type": "view", "weight": 1.0},
    {"user_id": "user_demo_1", "product_id": "VEL-GAME-001", "interaction_type": "purchase", "weight": 5.0},
    {"user_id": "user_elena_2", "product_id": "VEL-AUD-001", "interaction_type": "view", "weight": 1.0},
    {"user_id": "user_elena_2", "product_id": "VEL-AUD-001", "interaction_type": "purchase", "weight": 5.0},
    {"user_id": "user_elena_2", "product_id": "VEL-ELEC-001", "interaction_type": "view", "weight": 1.0},
    {"user_id": "user_elena_2", "product_id": "VEL-ELEC-001", "interaction_type": "purchase", "weight": 5.0},
    {"user_id": "user_elena_2", "product_id": "VEL-GAME-002", "interaction_type": "view", "weight": 1.0},
    {"user_id": "user_elena_2", "product_id": "VEL-GAME-002", "interaction_type": "purchase", "weight": 5.0},
]

def load_interactions_from_mongodb() -> List[Dict[str, Any]]:
    """
    Reads live interaction collection directly from MongoDB.
    Extracts userId, productId, type, weight, and timestamp.
    """
    mongo_uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017/velora")
    
    try:
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=2000)
        db = client.get_database()
        
        interactions_col = db["interactions"]
        docs = list(interactions_col.find({}))
        
        if len(docs) > 0:
            logger.info(f"Loaded {len(docs)} interactions from MongoDB.")
            formatted = []
            for d in docs:
                if not d.get("userId") or not d.get("productId"):
                    continue
                formatted.append({
                    "user_id": str(d.get("userId")),
                    "product_id": str(d.get("productId")),
                    "interaction_type": str(d.get("type", "view")),
                    "weight": float(d.get("weight", 1.0)),
                    "created_at": d.get("createdAt"),
                })
            return formatted
    except Exception as e:
        logger.warning(f"MongoDB direct connection not available ({e}).")

    return []

def load_products_from_mongodb() -> List[Dict[str, Any]]:
    """
    Reads product metadata collection directly from MongoDB.
    Extracts _id, sku, name, category, brand, tags, description, specs, rating, price.
    """
    mongo_uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017/velora")
    
    try:
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=2000)
        db = client.get_database()
        
        products_col = db["products"]
        docs = list(products_col.find({}))
        
        if len(docs) > 0:
            logger.info(f"Loaded {len(docs)} products from MongoDB.")
            formatted = []
            for d in docs:
                pid = str(d.get("_id"))
                formatted.append({
                    "product_id": pid,
                    "sku": str(d.get("sku", "")),
                    "name": str(d.get("name", "")),
                    "category": str(d.get("category", "")),
                    "brand": str(d.get("brand", "")),
                    "tags": d.get("tags", []) if isinstance(d.get("tags"), list) else [],
                    "description": str(d.get("description", "")),
                    "specs": d.get("specs", {}) if isinstance(d.get("specs"), dict) else {},
                    "rating": float(d.get("rating", 4.5)),
                    "rating_count": int(d.get("ratingCount", 0)),
                    "price": float(d.get("price", 0.0)),
                })
            return formatted
    except Exception as e:
        logger.warning(f"MongoDB product catalog read failed: {e}")

    return []
