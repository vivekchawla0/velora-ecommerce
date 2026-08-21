# NexaCart Technical Interview & Defense Guide

This guide equips you to confidently defend every architectural, machine-learning, database, and infrastructure decision during technical interviews and university evaluations.

---

## 1. System Architecture & Design

### Q: Why use a microservice architecture instead of a single monolith?
**Answer:** 
> "A monolithic architecture would tightly couple the I/O-bound web server with CPU-intensive machine learning matrix computations. In NexaCart, Node.js excels at high-throughput, non-blocking asynchronous I/O for client API traffic, while Python FastAPI provides native C-speed vector math via NumPy/Scikit-Learn. By decoupling them into microservices:
> 1. We scale them independently (e.g., scale ML pods during high browsing activity without multiplying database connection pools).
> 2. We achieve fault isolation: if the recommendation service experiences high latency or crashes, the Node.js backend automatically falls back to a Bayesian popularity engine, ensuring zero downtime for customers."

### Q: Why does the frontend communicate through Node.js rather than directly with the Python ML service?
**Answer:**
> "The Node.js backend functions as an **API Gateway & Data Enricher**. The Python service only computes mathematical vector similarity over product IDs. By routing through Node.js:
> 1. Authentication and authorization are centralized at the gateway using JWTs.
> 2. Raw product IDs are enriched with database documents (images, pricing, live inventory stock) in a single response, avoiding multiple round-trips from the client.
> 3. The internal ML microservice is shielded inside a private Kubernetes subnet."

---

## 2. Machine Learning & Recommender Systems

### Q: What is Collaborative Filtering and how did you implement it?
**Answer:**
> "Collaborative Filtering predicts a user's interests by collecting preferences from many similar users based on the premise that people who agreed in the past will agree in the future.
> In NexaCart, we implemented **User-Based Collaborative Filtering (UBCF)** with implicit feedback weighting:
> 1. We map shopping interactions to weights: $\text{view}=1.0, \text{click}=2.0, \text{cart}=4.0, \text{purchase}=5.0$.
> 2. We build a sparse User-Item Matrix $R \in \mathbb{R}^{M \times N}$.
> 3. We compute pairwise user cosine similarities: $\text{sim}(u, v) = \frac{\mathbf{r}_u \cdot \mathbf{r}_v}{\|\mathbf{r}_u\|_2 \|\mathbf{r}_v\|_2 + \epsilon}$.
> 4. For active user $u$, candidate items are scored via the weighted dot product of similar neighbor vectors and ranked."

### Q: How do you solve the Cold-Start problem?
**Answer:**
> "When a new or unauthenticated user arrives, their interaction history is empty ($|\text{Interactions}| = 0$). In NexaCart:
> 1. The engine detects zero non-zero entries in the user vector.
> 2. It switches dynamically to a **Global Bayesian Popularity & Rating Fallback**, ranking products with the highest aggregate engagement and customer review ratings.
> 3. As soon as the user performs a view or click, the interaction is captured, and personalized collaborative filtering takes over on subsequent requests."

### Q: How do you evaluate the recommendation system offline?
**Answer:**
> "We implemented an offline train/test evaluation split in `evaluate.py`:
> 1. We split historical interaction logs per user into 70% train and 30% held-out test ground truth.
> 2. The engine generates Top-5 recommendations ($\text{Top-}K$) based solely on train interactions.
> 3. We compute standard information retrieval metrics:
>    - **Precision@5:** Fraction of recommended items that the user actually interacted with in the test set.
>    - **Recall@5:** Fraction of test set items that were successfully retrieved in the Top-5.
>    - **F1@5:** Harmonic mean balancing precision and recall.
>    - **Hit Rate@5:** Percentage of users who received at least one relevant recommendation."

---

## 3. Backend & Database Engineering

### Q: How does authentication and role-based access control work?
**Answer:**
> "User passwords are encrypted with bcrypt using 10 salt rounds. Upon login, a signed JSON Web Token (JWT) containing the user's `id` and `role` is issued with a configurable expiration. Protected endpoints verify the JWT via an Express middleware (`authMiddleware.js`), which validates the signature and attaches the verified user model to `req.user`. Admin routes enforce an additional `authorize('admin')` check."

### Q: Why MongoDB and what indexing strategy did you apply?
**Answer:**
> "MongoDB offers a flexible JSON document structure ideal for catalog products with dynamic specs, image arrays, and variable categories.
> For performance:
> 1. Text indexing on `{ name: 'text', description: 'text', brand: 'text', tags: 'text' }` powers fast full-text catalog search.
> 2. A compound index on `{ userId: 1, productId: 1, type: 1 }` enables $O(\log N)$ aggregations for model retraining and interaction timeline lookups."

---

## 4. Cloud, Docker & Kubernetes

### Q: What is the difference between a Pod, a Deployment, and a Service in your setup?
**Answer:**
> "- **Pod:** The smallest deployable unit running our containerized microservice instance.
> - **Deployment:** Manages the desired replica state (e.g., 2 replicas of backend and 2 replicas of recommendation engine), handling zero-downtime rolling updates and self-healing.
> - **Service:** Provides a stable internal DNS name and load-balances network traffic across healthy pods.
> - **Probes:** We configured Liveness probes (`/api/health`, `/health`) to restart crashed pods and Readiness probes to prevent routing traffic before initialization."
