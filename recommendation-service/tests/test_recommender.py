import pytest
from fastapi.testclient import TestClient
from app.main import app, engine
from app.services.data_loader import DEFAULT_SEED_INTERACTIONS

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_engine():
    # Ensure engine is fitted before running tests
    engine.fit(DEFAULT_SEED_INTERACTIONS)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "Velora" in data["service"]
    assert "Recommendation Engine" in data["service"]
    assert data["status"] == "online"

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["users_indexed"] >= 1
    assert data["items_indexed"] >= 1
    assert "sparsity_percent" in data

def test_user_recommendations_known_user():
    response = client.get("/recommendations/user_demo_1?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["userId"] == "user_demo_1"
    assert len(data["recommendations"]) <= 5
    assert len(data["recommendations"]) > 0
    
    # Verify explainability structure
    rec = data["recommendations"][0]
    assert "productId" in rec
    assert "score" in rec
    assert "reason" in rec
    assert "reason_type" in rec

def test_recommendation_exclusion_feedback():
    # Exclude top candidate
    initial_res = client.get("/recommendations/user_demo_1?limit=5")
    top_prod = initial_res.json()["recommendations"][0]["productId"]

    excluded_res = client.get(f"/recommendations/user_demo_1?limit=5&exclude_product_ids={top_prod}")
    assert excluded_res.status_code == 200
    recs = excluded_res.json()["recommendations"]
    rec_ids = [r["productId"] for r in recs]
    assert top_prod not in rec_ids

def test_user_recommendations_cold_start_unknown_user():
    # Unknown user with zero interaction history
    response = client.get("/recommendations/completely_unknown_user_999?limit=4")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["strategy"] == "cold_start_popular"
    assert len(data["recommendations"]) <= 4
    
    for item in data["recommendations"]:
        assert item["similarity_type"] == "cold_start_popular"
        assert item["reason_type"] == "cold_start_popular"
        assert item["score"] > 0

def test_similar_products():
    response = client.get("/similar/prod_headphones_1?limit=3")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["productId"] == "prod_headphones_1"
    assert len(data["recommendations"]) <= 3

def test_model_training_and_metrics():
    train_res = client.post("/train", json={"force_db_reload": False})
    assert train_res.status_code == 200
    assert train_res.json()["status"] == "success"

    metrics_res = client.get("/metrics")
    assert metrics_res.status_code == 200
    m = metrics_res.json()["metrics"]
    assert "precision_at_5" in m
    assert "recall_at_5" in m
    assert "f1_at_5" in m
    assert m["precision_at_5"] >= 0.0
