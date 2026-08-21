# Velora — Personalized E-Commerce Platform

> **Personalized Shopping, Reimagined.**  
> Velora is a full-stack personalized e-commerce platform combining modern web development, collaborative-filtering recommendations, microservices, Docker, Kubernetes and AWS-ready infrastructure.

---

## 🌟 Overview & Elevator Pitch

**Velora** is a full-stack personalized commerce platform combining modern web development, collaborative-filtering recommendations, microservices, Docker, Kubernetes and AWS-ready infrastructure. Rather than relying on static or mocked recommendations, Velora features a dedicated **Python FastAPI Machine Learning Microservice** running **Implicit-Feedback Collaborative Filtering**. Every user view, click, wishlist save, cart addition, purchase, review, and dismissal feedback actively trains user-item interaction vectors, generating mathematically verifiable recommendations with explainability in sub-50ms latency.

---

## 🏗️ Microservice Architecture

```
                    ┌─────────────────────────────────────────┐
                    │          React 18 + Vite Frontend       │
                    │         (Port 5173 / Production Nginx)  │
                    └────────────────────┬────────────────────┘
                                         │
                                         │ REST API + Bearer JWT
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │        Node.js / Express API Gateway    │
                    │                  (Port 5000)            │
                    │  - JWT Auth & Role Access Control       │
                    │  - Product Catalog & MongoDB Cart API   │
                    │  - Admin User Management & Audit Logs   │
                    │  - Wishlist & Reviews with Verified Buy │
                    │  - Recommendation Feedback & Filtering  │
                    │  - Order Fulfillment & Stock Decrement  │
                    │  - Circuit Breaker Fallback Handler     │
                    └────────────┬──────────────────────┬─────┘
                                 │                      │
         Mongoose CRUD & Queries │                      │ Internal HTTP Requests
                                 ▼                      ▼
    ┌──────────────────────────────────┐      ┌──────────────────────────────────┐
    │        MongoDB Database          │◄─────┤    Python FastAPI ML Engine      │
    │           (Port 27017)           │ Read │          (Port 8000)             │
    │ - Users         - Products       │ Logs │ - User-Based Collaborative Filter│
    │ - Carts         - Wishlists      │      │ - Cosine Similarity Vectors      │
    │ - Reviews       - Feedback       │      │ - Negative Feedback Exclusion    │
    │ - AuditLogs     - Interactions   │      │ - Explainability Metadata Gen    │
    └──────────────────────────────────┘      └──────────────────────────────────┘
```

---

## 💎 Core Feature Highlights

### 1. Admin User Management System
- **Real Database KPI Statistics:** Dynamic counts of Total Users, Active Users, Blocked Users, New Users This Week, and Admins calculated directly from MongoDB.
- **Responsive Users Directory:** Server-side search (by name/email), filtering (Role, Status, Joined Date), sorting (Newest, Oldest, Name A-Z, Most Orders, Activity), and server-side pagination (`?page=1&limit=20`).
- **Comprehensive User Profile (`/admin/users/:id`):** 
  - Complete customer profile, joined date, and last active timestamp.
  - Aggregated platform metrics (Total Orders, Lifetime Spent, Wishlist Items, Current Cart, Reviews, Activity Logs).
  - Real Order history with order links.
  - Live Wishlist & Read-only Cart inspection.
  - Chronological interaction timeline with weighted scores.
  - Calculated **Top Category Interests** derived from interaction weights ($w_i$).
  - Personalized ML recommendations with confidence score and explainability reasons.
  - Negative feedback list ("Not interested" signals).
- **Administrative Account Controls:**
  - Block / Unblock User (rejects login with 403 status: *"Your account is currently blocked. Please contact support."*).
  - Role management (User $\leftrightarrow$ Admin) with backend self-demotion prevention.
  - Soft Delete (sets `status = 'deleted'`, preserves historical order/review data).
  - Administrative Audit Logging (`AuditLog` collection).

### 2. Wishlist System
- **Heart Toggle & Persistence:** Instant heart toggle on all product cards and product detail views synchronized with MongoDB `Wishlist` collection.
- **Dedicated Page:** `/wishlist` showcasing saved products, live inventory status, "Add to Bag" integration, and instant removal.
- **ML Signal:** Adding an item to the wishlist records an implicit interaction signal with weight **$w=3.0$**.

### 3. Product Reviews & Ratings
- **Verified Purchase Calculation:** The backend automatically inspects historical completed orders (`Order.findOne({ userId, 'items.productId': productId })`) to assign the `Verified Purchase` badge.
- **Dynamic Average Rating:** Recalculates `Product.rating` and `Product.ratingCount` upon review creation, update, or deletion via MongoDB Aggregation pipelines.
- **Breakdown Distribution:** Displays percentage distribution across 5★, 4★, 3★, 2★, and 1★ ratings.
- **Duplicate Prevention:** Unique compound index `{ userId: 1, productId: 1 }` prevents duplicate reviews while allowing editing.

### 4. Recommendation Explainability — "Why am I seeing this?"
- **Transparent Reasoning:** Every recommendation is tagged with structured explainability:
  - `similar_user`: *"Shoppers with similar taste in Audio and Technology also loved this"*
  - `recent_activity`: *"Based on products you recently viewed and saved to your wishlist"*
  - `cold_start_popular`: *"Top trending bestseller across all shoppers"*
  - `category_affinity`: *"More from Electronics & Gadgets"*
- **Subtle UI Popover:** Clean, non-intrusive metadata popup directly on recommendation cards.

### 5. Recommendation Feedback — "Not Interested"
- **Negative Feedback Collection:** Shoppers can click "Not interested" on any recommendation.
- **Negative Filtering:** Excludes dismissed product IDs from both Python Collaborative Filtering candidate pools and Node.js fallback queries.
- **Instant Client Removal:** Dismissed items are removed immediately with feedback confirmation: *"We'll show you fewer recommendations like this."*

### 6. Personalized "For You" Hub (`/for-you`)
- **Cold-Start Strategy:** If a shopper has zero interaction history, shows a welcoming discovery interface (*"Welcome to Velora. Explore a few products and we'll personalize your shopping experience."*) with top trending and popular items.
- **Personalized Feed:** "Recommended for You", "Because You Viewed...", and "Recently Viewed" event logs.
- **Demarcated Sponsored Picks:** Separated and clearly labeled partner campaigns.

---

## ⚖️ Interaction Weights & ML Formulation

| Interaction Type | Weight ($w_i$) | Rationale |
|---|---|---|
| **View** | `1.0` | Passive browsing interest |
| **Click** | `2.0` | Intentional product exploration |
| **Wishlist** | `3.0` | Explicit product curation and high intent |
| **Cart Addition** | `4.0` | Strong pre-purchase conversion intent |
| **Purchase** | `5.0` | Definitive positive preference signal |
| **Rating** | `1.0 - 5.0` | Direct explicit feedback (1★ = low, 5★ = maximum) |

---

## 🛠️ Technology Stack

| Layer | Technologies | Key Responsibilities |
|---|---|---|
| **Frontend** | React 18, Vite, React Router 6, Axios, Lucide Icons | Premium White Theme UI, User Management Directory & Profile, Live Cart & Wishlist Sync, Explainability Popovers, For You Hub |
| **Backend API** | Node.js, Express.js, Mongoose, JWT, bcryptjs, Helmet | API Gateway, Role Authorization, User Management CRUD, Audit Logs, Catalog CRUD, MongoDB Cart & Wishlist, Reviews, Feedback, Order Fulfillment |
| **ML Microservice** | Python 3.13, FastAPI, Uvicorn, NumPy, Pandas, Scikit-Learn | Sparse User-Item Matrix, Cosine Similarity, UBCF, IBCF, Feedback Exclusion, Explainability |
| **Database** | MongoDB 7.0 + Mongoose (Dev In-Memory Fallback) | Users, AuditLogs, Products, Categories, Carts, Wishlists, Reviews, Feedback, Interactions, Orders |
| **DevOps & Cloud** | Docker, Docker Compose, Kubernetes, GitHub Actions | Multi-stage Dockerfiles, K8s Deployments/Services/Probes, CI/CD Pipeline |

---

## 🧪 Automated Testing & Verification

### Backend Integration Tests (`npm test` in `backend/`):
- **47/47 Passing Tests (100% Pass Rate)** covering:
  - Authentication & JWT Token Verification
  - Product Catalog CRUD & Stock Decrement
  - Wishlist Toggle, Persistence & ML Weights
  - Cart Operations & Server-side Subtotals
  - Order Fulfillment & Payment Status
  - Product Reviews with Order Verification & Dynamic Rating Math
  - Recommendation Feedback & Candidate Filtering
  - Admin User Listing, Search, Filter & Pagination
  - Admin User Details & Aggregated Platform Stats
  - Admin Block/Unblock & Blocked Login Rejection (403)
  - Admin Role Modification (User $\leftrightarrow$ Admin)
  - Soft Deletion & Audit Logging
  - Security & Role-based Access Control

### Python ML Microservice Tests (`pytest` in `recommendation-service/`):
- **7/7 Passing Tests (100% Pass Rate)** covering Health, UBCF, Cold-Start fallback, Item-Item similarity, Feedback exclusion, Explainability schemas, and Model retraining.

---

## 🎓 Interview Questions & Answers (System Architecture & ML)

### 1. User Management & Authorization
**Q:** *How do you manage users and ensure administrative operations are secure?*  
**A:** Velora uses role-based access control (RBAC) enforced in the Express backend via JWT token verification and role authorization middleware (`authorize('admin')`). Administrative endpoints for listing, inspecting, blocking, role management, and soft-deleting users are isolated under `/api/admin/users`. Actions are recorded in the `AuditLog` collection, and blocked users are actively rejected during login and token validation.

### 2. Soft Deletion vs Hard Deletion
**Q:** *Why did you implement soft deletion for users instead of immediately deleting their database records?*  
**A:** In e-commerce, deleting a user document causes foreign key reference breakage across `orders`, `reviews`, `interactions`, and financial reporting pipelines. Soft deletion (`status: 'deleted'`) disables authentication and hides the account from active directories while preserving historical order accuracy, review integrity, and collaborative filtering interaction logs.

### 3. User Interests Calculation
**Q:** *How does the admin dashboard calculate a user's top category interests?*  
**A:** Rather than hard-coding categories, the backend aggregates the user's historical interaction logs (`Interaction` collection) populated with product categories. Each interaction is multiplied by its domain weight ($w_{\text{view}}=1, w_{\text{click}}=2, w_{\text{wishlist}}=3, w_{\text{cart}}=4, w_{\text{purchase}}=5, w_{\text{rating}}=\text{score}$). The total score per category is normalized against the user's total engagement sum to produce real percentage bars.

### 4. Wishlist vs Cart
**Q:** *Why did you implement a separate Wishlist system instead of using the Cart?*  
**A:** Wishlists capture top-of-funnel consideration and long-term intent without purchase urgency, whereas Carts represent imminent conversion intent. In our ML model, this distinction is reflected by separate interaction weights ($w_{\text{wishlist}}=3.0$ vs $w_{\text{cart}}=4.0$).

### 5. Verified Purchase Fraud Prevention
**Q:** *How do you prevent fake reviews and verify purchase status?*  
**A:** The client cannot submit `verifiedPurchase`. The backend queries completed orders in MongoDB matching `{ userId, 'items.productId': productId, paymentStatus: 'completed' }` and computes `verifiedPurchase` dynamically. Duplicate reviews are prevented via the unique index `{ userId: 1, productId: 1 }`.

---

## 🚀 Running Locally

```bash
# 1. Start Python Recommendation Microservice (Port 8000)
cd recommendation-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000

# 2. Start Node.js API Gateway (Port 5000)
cd backend
npm install
node src/server.js

# 3. Start React Frontend (Port 5173)
cd frontend
npm install
npm run dev
```

Visit **http://localhost:5173** to experience Velora.
Admin credentials: `admin@example.com` / `Admin123!`
