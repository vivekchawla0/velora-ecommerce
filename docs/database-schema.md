# NexaCart Database Schema Specification

This document details the MongoDB schemas, data types, indexes, and validation rules used across the platform.

---

## 1. User Schema (`users`)

| Field | Type | Required | Unique | Indexed | Description |
|---|---|---|---|---|---|
| `_id` | ObjectId | Yes | Yes | Primary | Auto-generated document ID |
| `name` | String | Yes | No | No | User full name (max 50 chars) |
| `email` | String | Yes | Yes | Yes | Lowercase verified email address |
| `password` | String | Yes | No | No | Salted bcrypt hash (`select: false`) |
| `role` | String | Yes | No | Yes | `'user'` or `'admin'` |
| `avatar` | String | No | No | No | URL to user profile avatar |
| `preferences`| Object | No | No | No | `{ favoriteCategories: [String] }` |
| `createdAt` | Date | Auto | No | No | Registration timestamp |
| `updatedAt` | Date | Auto | No | No | Last profile modification |

---

## 2. Product Schema (`products`)

| Field | Type | Required | Indexed | Description |
|---|---|---|---|---|
| `_id` | ObjectId | Yes | Primary | Document identifier |
| `name` | String | Yes | Text | Product title (max 200 chars) |
| `description` | String | Yes | Text | Full markdown/HTML description |
| `price` | Number | Yes | Yes | Current retail price ($ USD) |
| `originalPrice`| Number | No | No | MSRP strikethrough price |
| `discountPercentage`| Number | No | No | Discount calculation (0-100) |
| `category` | String | Yes | Yes | Category slug (e.g. `electronics`) |
| `brand` | String | Yes | Text | Manufacturer / Brand name |
| `images` | [String] | Yes | No | Array of image URLs |
| `rating` | Number | No | Yes | Aggregate rating (0.0 - 5.0) |
| `ratingCount` | Number | No | No | Number of customer ratings |
| `stock` | Number | Yes | No | Available inventory count |
| `tags` | [String] | No | Text | Keyword tags for search & similarity |
| `featured` | Boolean | No | Yes | Spotlight homepage flag |
| `specs` | Map<String> | No | No | Key-value technical specifications |

---

## 3. Interaction Schema (`interactions`)

| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | ObjectId | Yes | Primary identifier |
| `userId` | ObjectId | Yes | Foreign key reference to `User._id` |
| `productId` | ObjectId | Yes | Foreign key reference to `Product._id` |
| `type` | String | Yes | `'view'`, `'click'`, `'cart'`, `'purchase'`, `'rating'` |
| `weight` | Number | Yes | Numerical weight (1.0, 2.0, 4.0, 5.0, rating) |
| `ratingValue` | Number | No | Optional 1-5 rating score |
| `metadata` | Object | No | Device / source context |
| `createdAt` | Date | Auto | Event timestamp |

**Indexes:**
- Compound: `{ userId: 1, productId: 1, type: 1 }`
- Single: `{ createdAt: -1 }`

---

## 4. Order Schema (`orders`)

| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | ObjectId | Yes | Primary order ID |
| `userId` | ObjectId | Yes | Buyer ID |
| `items` | [OrderItem]| Yes | Array of `{ productId, name, price, quantity, image }` |
| `subtotal` | Number | Yes | Price before taxes and shipping |
| `tax` | Number | Yes | Sales tax amount |
| `shippingFee` | Number | Yes | Shipping cost ($0 if subtotal > $50) |
| `totalAmount` | Number | Yes | Total final billed amount |
| `shippingAddress`| Object | Yes | `{ fullName, street, city, state, postalCode, country }` |
| `paymentMethod` | String | Yes | `'credit_card'`, `'paypal'`, `'upi'`, `'cod'` |
| `paymentStatus` | String | Yes | `'completed'`, `'pending'`, `'failed'` |
| `status` | String | Yes | `'Processing'`, `'Confirmed'`, `'Shipped'`, `'Delivered'`, `'Cancelled'` |
| `createdAt` | Date | Auto | Order timestamp |
