# NexaCart Database Documentation

NexaCart uses **MongoDB** as its primary persistent datastore with Mongoose ODM in Node.js and PyMongo in Python.

---

## Collections & Schemas

### 1. `users`
- Stores user credentials, roles (`user`, `admin`), profile data, and category preferences.
- Passwords are encrypted using salted bcrypt (`pre('save')` hook with 10 salt rounds).

### 2. `products`
- Catalog items across 6 core categories (Electronics, Audio, Fashion, Home & Kitchen, Fitness, Beauty).
- Supports text indexing on `name`, `description`, `brand`, and `tags`.
- Tracks real inventory stock quantities, discounts, and ratings.

### 3. `interactions`
- Central collection powering the Collaborative Filtering Recommendation Engine.
- Captures weighted events:
  - `view`: 1.0
  - `click`: 2.0
  - `cart`: 4.0
  - `purchase`: 5.0
  - `rating`: 1.0 to 5.0
- Indexed compound query: `{ userId: 1, productId: 1, type: 1 }`.

### 4. `orders`
- Customer purchases, itemized snapshots, taxes, shipping addresses, payment status, and delivery fulfillment lifecycle (`Processing`, `Confirmed`, `Shipped`, `Delivered`, `Cancelled`).

### 5. `categories`
- Catalog taxonomy navigation and image metadata.

---

## Seed Data Generation

To seed or reset the database with 60+ realistic products, 5 demo accounts, and 50+ weighted interaction logs:

```bash
# From backend directory
npm run seed
```

### Seed Demo Accounts
- **Administrator**: `admin@example.com` / `Admin123!`
- **Demo Shopper (Tech & Audio Enthusiast)**: `demo@example.com` / `Demo123!`
- **Customer (Fashion & Home)**: `sarah@example.com` / `User123!`
- **Customer (Fitness & Outdoors)**: `mike@example.com` / `User123!`
- **Customer (Audio & Gadgets)**: `elena@example.com` / `User123!`
