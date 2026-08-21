# NexaCart Microservice Architecture Specification

NexaCart implements a resilient, decoupled microservice architecture separating the UI, API Gateway/Business logic layer, Machine Learning Recommendation microservice, and MongoDB datastore.

---

## High-Level Architecture Diagram

```
                              ┌───────────────────────────────────┐
                              │      React 18 + Vite Client       │
                              │     Port 5173 / Web Browser       │
                              └─────────────────┬─────────────────┘
                                                │
                                                │ REST API + Bearer JWT
                                                ▼
                              ┌───────────────────────────────────┐
                              │     Node.js / Express Gateway     │
                              │             Port 5000             │
                              │  - Auth & Role Authorization      │
                              │  - Product & Order Lifecycle      │
                              │  - Interaction Event Ingestion    │
                              │  - Fallback Circuit Breaker       │
                              └───┬───────────────────────────┬───┘
                                  │                           │
          Mongoose Queries & CRUD │                           │ Internal HTTP Request
                                  ▼                           ▼
        ┌───────────────────────────────┐     ┌───────────────────────────────┐
        │       MongoDB Datastore       │◄────┤    Python FastAPI Service     │
        │           Port 27017          │ Read│          Port 8000            │
        │ - Users        - Products     │ Logs│ - Collaborative Filtering     │
        │ - Orders       - Categories   │     │ - Cosine Similarity Engine    │
        │ - Interactions (Weighted)     │     │ - Train/Test Offline Pipeline │
        └───────────────────────────────┘     └───────────────────────────────┘
```

---

## Architectural Principles & Design Decisions

### 1. Separation of Machine Learning & Core E-Commerce
- **Why Node.js for Backend?** High I/O throughput, non-blocking event-driven architecture, ideal for handling high-concurrency client requests, sessions, and database operations.
- **Why Python FastAPI for Recommendation?** Python is the industry standard for scientific computation (NumPy, Pandas, Scikit-learn). FastAPI provides high-performance asynchronous execution, automatic OpenAPI generation, and sub-10ms response times.
- **Resilience & Fault Tolerance:** If the Python ML microservice is offline, under heavy load, or fails, the Node.js backend detects the timeout and gracefully returns a Bayesian weighted popularity/trending recommendation fallback. The e-commerce website never crashes.

### 2. User Privacy & Microservice Boundary
- The frontend client only communicates with the Node.js API Gateway.
- The Python recommendation microservice is an internal service, not directly exposed to the public internet, shielding algorithmic endpoints and internal matrix weights.
- Client requests identify the user strictly via verified JWT tokens. User IDs provided in request bodies are ignored for authenticated actions.

### 3. Latency & Performance Optimization
- Similarity matrices are cached in memory on the Python microservice after fitting.
- User-item dot products are executed using vectorized NumPy operations in $O(K \cdot N)$ time.
- MongoDB queries leverage compound indexes (`{ userId: 1, productId: 1, type: 1 }` and text indexes) for instant lookup.
