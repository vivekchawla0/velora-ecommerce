# NexaCart REST API Reference

The backend exposes a standardized RESTful API returning structured JSON responses.

---

## Base URLs
- **Backend API Gateway:** `http://localhost:5000/api`
- **Python Recommendation Microservice (Internal):** `http://localhost:8000`

---

## 1. Authentication Endpoints (`/api/auth`)

### `POST /api/auth/register`
Creates a new customer or admin account.
- **Request Body:**
  ```json
  {
    "name": "Alex Morgan",
    "email": "demo@example.com",
    "password": "Password123!",
    "role": "user"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "65cb789...",
      "name": "Alex Morgan",
      "email": "demo@example.com",
      "role": "user"
    }
  }
  ```

### `POST /api/auth/login`
Authenticates existing credentials and returns JWT bearer token.
- **Request Body:**
  ```json
  {
    "email": "demo@example.com",
    "password": "Demo123!"
  }
  ```

### `GET /api/auth/me`
Returns current authenticated user session (Requires `Authorization: Bearer <token>`).

---

## 2. Product Catalog Endpoints (`/api/products`)

### `GET /api/products`
Query parameters:
- `q`: Search keyword across name, description, brand, and tags
- `category`: Category slug (e.g. `electronics`, `audio`, `fashion`)
- `minPrice`, `maxPrice`: Numeric price bounds
- `minRating`: Minimum rating threshold (e.g. `4.5`)
- `sort`: `price_asc`, `price_desc`, `rating`, `popular`, `discount`, `newest`
- `page`, `limit`: Pagination parameters

### `GET /api/products/:id`
Retrieves a single product document by ID.

### `GET /api/products/categories`
Returns all categories with live aggregated product counts.

---

## 3. User Interaction Tracking (`/api/interactions`)

### `POST /api/interactions`
Records a shopping event associated with the authenticated user.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "productId": "65cb789123...",
    "type": "view",
    "ratingValue": null
  }
  ```
- **Interaction Types & Weights:**
  - `view`: 1.0
  - `click`: 2.0
  - `cart`: 4.0
  - `purchase`: 5.0
  - `rating`: 1.0 - 5.0

### `GET /api/interactions/my-history`
Returns recent chronological interaction history for the logged-in user.

### `GET /api/interactions/summary`
Returns interaction counts broken down by type (views, clicks, carts, purchases).

---

## 4. Recommendation Endpoints (`/api/recommendations`)

### `GET /api/recommendations`
Returns personalized recommendations for the logged-in user or cold-start popular items for guests.
- **Query Parameters:** `limit=10`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "userId": "65cb789...",
    "source": "collaborative_filtering",
    "reason": "Recommended based on activity of shoppers with similar taste",
    "count": 10,
    "recommendations": [
      {
        "_id": "65cb789...",
        "name": "TitanBook Pro 16",
        "price": 2199.00,
        "recommendationScore": 0.94,
        "recommendationReason": "High affinity match based on your recent activity"
      }
    ]
  }
  ```

### `GET /api/recommendations/similar/:productId`
Returns item-to-item similar products based on co-occurrence and cosine vector similarity.

---

## 5. Orders & Checkout (`/api/orders`)

### `POST /api/orders`
Places a new order, decreases inventory stock, and logs purchase interactions.
- **Request Body:**
  ```json
  {
    "items": [{ "productId": "65cb789...", "quantity": 1 }],
    "shippingAddress": {
      "fullName": "Alex Morgan",
      "street": "742 Evergreen Terrace",
      "city": "San Francisco",
      "state": "CA",
      "postalCode": "94107"
    },
    "paymentMethod": "credit_card"
  }
  ```

### `GET /api/orders/my-orders`
Returns the order history for the current user.

---

## 6. Admin Endpoints (`/api/admin`)
*Requires `role: 'admin'` in JWT.*

- `GET /api/admin/stats`: KPI metrics (revenue, orders, users, top-viewed, top-purchased).
- `POST /api/admin/products`: Create catalog product.
- `PUT /api/admin/products/:id`: Update catalog product.
- `DELETE /api/admin/products/:id`: Remove catalog product.
- `GET /api/admin/orders`: List all platform orders.
- `PATCH /api/admin/orders/:id/status`: Update order fulfillment status.
