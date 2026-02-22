# Sellor API — Endpoint Reference

**Base URL (local dev):** `http://localhost:8000`  
**Interactive Docs:** `http://localhost:8000/docs`  
**Alternative Docs:** `http://localhost:8000/redoc`

---

## Authentication

All protected endpoints require a JWT Bearer token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

### Role Legend

| Symbol | Role | Description |
|--------|------|-------------|
| 🔓 | Public | No token required |
| 👤 | Any User | Any authenticated user |
| 🏪 | Seller | Approved seller account only |
| 🔑 | Admin | Admin account only |

---

## Response Formats

### Success — Paginated List
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "pages": 5,
  "limit": 20
}
```

### Error
```json
{
  "detail": "Error message describing what went wrong"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | OK — request succeeded |
| `201` | Created — resource created |
| `204` | No Content — deleted successfully |
| `400` | Bad Request — invalid input |
| `401` | Unauthorized — missing or invalid token |
| `403` | Forbidden — insufficient permissions |
| `404` | Not Found — resource doesn't exist |
| `422` | Unprocessable Entity — validation error |

---

## 1. System

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | 🔓 | API root info and links |
| `GET` | `/api/health` | 🔓 | Health check — returns status and version |

---

## 2. Authentication

**Prefix:** `/api/auth`

| Method | Endpoint | Auth | Status | Description |
|--------|----------|------|--------|-------------|
| `POST` | `/api/auth/register` | 🔓 | `201` | Register a new buyer or seller account |
| `POST` | `/api/auth/login` | 🔓 | `200` | Login and receive JWT access token |
| `GET` | `/api/auth/me` | 👤 | `200` | Get current authenticated user profile |

### POST `/api/auth/register` — Request Body
```json
{
  "username": "nisa_jewelry",
  "email": "nisa@example.com",
  "password": "SecurePass123",
  "role": "seller",
  "phone_number": "+66812345678"
}
```

> **Notes:**
> - `role` accepts `"buyer"` or `"seller"` (not `"admin"`)
> - `phone_number` is optional
> - Password must be min 8 chars, at least 1 uppercase letter and 1 digit
> - Sellers start unapproved — admin must approve before they can create a store

### POST `/api/auth/login` — Request Body
```json
{
  "email": "nisa@example.com",
  "password": "SecurePass123"
}
```

### POST `/api/auth/login` — Response
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user": {
    "id": 1,
    "username": "nisa_jewelry",
    "email": "nisa@example.com",
    "role": "seller",
    "selling_approve": false,
    "created_at": "2026-01-26T10:00:00Z"
  }
}
```

---

## 3. Stores

**Prefix:** `/api/stores`

| Method | Endpoint | Auth | Status | Description |
|--------|----------|------|--------|-------------|
| `GET` | `/api/stores` | 🔓 | `200` | Browse all stores with optional search and pagination |
| `GET` | `/api/stores/{slug}` | 🔓 | `200` | View a store's public profile by its slug |
| `GET` | `/api/stores/{slug}/products` | 🔓 | `200` | Browse active products in a specific store |
| `GET` | `/api/stores/{slug}/groups` | 🔓 | `200` | Get product categories for a store with counts |
| `POST` | `/api/stores` | 🏪 | `201` | Create your seller store |
| `PUT` | `/api/stores/me` | 🏪 | `200` | Update your store's info (slug cannot change) |
| `GET` | `/api/stores/me/dashboard` | 🏪 | `200` | Get dashboard stats: products + inquiry counts |

### GET `/api/stores` — Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `search` | `string` | — | Search by store name or description |
| `page` | `int` | `1` | Page number |
| `limit` | `int` | `20` | Items per page (max 100) |

### GET `/api/stores/{slug}/products` — Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `group_id` | `int` | — | Filter by product category ID |
| `min_price` | `float` | — | Minimum product price |
| `max_price` | `float` | — | Maximum product price |
| `sort_by` | `string` | `newest` | `newest` \| `price_asc` \| `price_desc` \| `alphabetical` |
| `page` | `int` | `1` | Page number |
| `limit` | `int` | `20` | Items per page (max 100) |

### POST `/api/stores` — Request Body
```json
{
  "name": "Nisa's Handmade Jewelry",
  "slug": "nisa-jewelry",
  "description": "Handcrafted silver jewelry from Chiang Mai.",
  "logo_url": "https://cdn.example.com/logo.jpg"
}
```

> **Notes:**
> - `slug` must be lowercase letters, numbers, and hyphens only (e.g., `nisa-jewelry`)
> - `slug` cannot be changed after creation
> - One store per seller is enforced

### PUT `/api/stores/me` — Request Body
```json
{
  "name": "Updated Store Name",
  "description": "Updated description.",
  "logo_url": "https://cdn.example.com/new-logo.jpg"
}
```

> All fields are optional (partial update).

---

## 4. Products

**Prefix:** `/api/products`

| Method | Endpoint | Auth | Status | Description |
|--------|----------|------|--------|-------------|
| `GET` | `/api/products` | 🔓 | `200` | Search and filter products across all stores |
| `GET` | `/api/products/{product_id}` | 🔓 | `200` | Get full product details by ID |
| `GET` | `/api/products/seller/list` | 🏪 | `200` | List all products in your store (inc. hidden) |
| `POST` | `/api/products` | 🏪 | `201` | Create a new product in your store |
| `PUT` | `/api/products/{product_id}` | 🏪 | `200` | Update a product |
| `DELETE` | `/api/products/{product_id}` | 🏪 | `204` | Permanently delete a product |
| `POST` | `/api/products/{product_id}/images` | 🏪 | `201` | Upload an image for a product |
| `DELETE` | `/api/products/{product_id}/images/{image_id}` | 🏪 | `204` | Delete a product image |
| `PUT` | `/api/products/{product_id}/images/reorder` | 🏪 | `200` | Reorder a product's images |

### GET `/api/products` — Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `search` | `string` | — | Search in title and description |
| `min_price` | `float` | — | Minimum price filter |
| `max_price` | `float` | — | Maximum price filter |
| `group_ids` | `int[]` | — | Filter by category IDs (repeatable: `?group_ids=1&group_ids=2`) |
| `store_ids` | `int[]` | — | Filter by store IDs (repeatable) |
| `sort_by` | `string` | `newest` | `newest` \| `price_asc` \| `price_desc` \| `alphabetical` |
| `page` | `int` | `1` | Page number |
| `limit` | `int` | `20` | Items per page (max 100) |

### GET `/api/products/seller/list` — Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `group_id` | `int` | — | Filter by category ID |
| `status` | `string` | — | Filter by status: `active` \| `sold` \| `hidden` |
| `page` | `int` | `1` | Page number |
| `limit` | `int` | `20` | Items per page (max 100) |

### POST `/api/products` — Request Body
```json
{
  "title": "Handmade Silver Bracelet",
  "description": "Sterling silver with turquoise gemstone.",
  "price": 850.00,
  "stock": 5,
  "status": "active",
  "group_id": 3
}
```

> **Notes:**
> - `status` accepts `"active"`, `"sold"`, `"hidden"` (default: `"active"`)
> - `stock` is optional (null = unlimited)
> - `group_id` is optional (null = uncategorized)

### PUT `/api/products/{product_id}` — Request Body
```json
{
  "title": "Updated Title",
  "price": 900.00,
  "status": "sold"
}
```

> All fields are optional (partial update).

### POST `/api/products/{product_id}/images` — Form Data

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | ✅ | Image file (JPEG, PNG, WebP, max 5MB) |
| `position` | `int` (query) | ✅ | Display order 0–4 (0 = thumbnail) |

### PUT `/api/products/{product_id}/images/reorder` — Request Body
```json
{
  "101": 0,
  "102": 1,
  "103": 2
}
```

> Dictionary mapping `image_id` → `new_position`.

---

## 5. Product Categories

**Prefix:** `/api/product-groups`

| Method | Endpoint | Auth | Status | Description |
|--------|----------|------|--------|-------------|
| `GET` | `/api/product-groups/my-store` | 🏪 | `200` | List all categories in your store with product counts |
| `POST` | `/api/product-groups` | 🏪 | `201` | Create a new product category |
| `PUT` | `/api/product-groups/{group_id}` | 🏪 | `200` | Rename a product category |
| `DELETE` | `/api/product-groups/{group_id}` | 🏪 | `204` | Delete a category (products become uncategorized) |

### POST `/api/product-groups` — Request Body
```json
{
  "name": "Bracelets"
}
```

### PUT `/api/product-groups/{group_id}` — Request Body
```json
{
  "name": "Silver Bracelets"
}
```

> **Note:** Category names must be unique within a store.

---

## 6. Inquiries

**Prefix:** `/api/inquiries`

| Method | Endpoint | Auth | Status | Description |
|--------|----------|------|--------|-------------|
| `POST` | `/api/inquiries` | 🔓 | `201` | Submit an inquiry about a product (no account needed) |
| `GET` | `/api/inquiries` | 🏪 | `200` | List all inquiries in your store |
| `GET` | `/api/inquiries/stats` | 🏪 | `200` | Get inquiry counts by status (new, replied, closed) |
| `GET` | `/api/inquiries/{inquiry_id}` | 🏪 | `200` | Get full details of a single inquiry |
| `PUT` | `/api/inquiries/{inquiry_id}/status` | 🏪 | `200` | Update inquiry status (new → replied → closed) |
| `DELETE` | `/api/inquiries/{inquiry_id}` | 🏪 | `204` | Permanently delete an inquiry |

### POST `/api/inquiries` — Request Body
```json
{
  "product_id": 127,
  "buyer_name": "David Chen",
  "buyer_email": "david@example.com",
  "message": "Do you ship to Chiang Mai? What is the shipping cost?"
}
```

### GET `/api/inquiries` — Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | `string` | — | Filter by status: `new` \| `replied` \| `closed` |
| `page` | `int` | `1` | Page number |
| `limit` | `int` | `20` | Items per page (max 100) |

### PUT `/api/inquiries/{inquiry_id}/status` — Request Body
```json
{
  "status": "replied"
}
```

> `status` accepts `"new"`, `"replied"`, or `"closed"`.

### GET `/api/inquiries/stats` — Response
```json
{
  "new": 5,
  "replied": 12,
  "closed": 30,
  "total": 47
}
```

---

## 7. Admin

**Prefix:** `/api/admin`  
> All admin endpoints require 🔑 **Admin role**.

### 7.1 Platform Statistics

| Method | Endpoint | Status | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/admin/stats` | `200` | Platform-wide statistics (users, stores, products, inquiries) |

### GET `/api/admin/stats` — Response
```json
{
  "users": {
    "total": 523,
    "buyers": 430,
    "sellers": 89,
    "pending_seller_approvals": 7
  },
  "stores": {
    "total": 76
  },
  "products": {
    "total": 1847,
    "active": 1620
  },
  "inquiries": {
    "total": 943,
    "today": 34
  }
}
```

### 7.2 User Management

| Method | Endpoint | Status | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/admin/users` | `200` | List all users (filter by role, search by name/email) |
| `GET` | `/api/admin/users/pending-sellers` | `200` | List sellers awaiting approval |
| `GET` | `/api/admin/users/{user_id}` | `200` | Get full details for a user |
| `PUT` | `/api/admin/users/{user_id}/approve-seller` | `200` | Approve or reject a seller application |
| `DELETE` | `/api/admin/users/{user_id}` | `204` | Permanently delete a user account |

### GET `/api/admin/users` — Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `role` | `string` | — | Filter by role: `buyer` \| `seller` \| `admin` |
| `search` | `string` | — | Search by username or email |
| `page` | `int` | `1` | Page number |
| `limit` | `int` | `50` | Items per page (max 100) |

### PUT `/api/admin/users/{user_id}/approve-seller` — Request Body
```json
{
  "approve": true
}
```

> Set `"approve": false` to revoke seller access.

### 7.3 Store Management

| Method | Endpoint | Status | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/admin/stores` | `200` | List all stores on the platform (search supported) |

### GET `/api/admin/stores` — Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `search` | `string` | — | Search by store name |
| `page` | `int` | `1` | Page number |
| `limit` | `int` | `50` | Items per page (max 100) |

### 7.4 Product Moderation

| Method | Endpoint | Status | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/admin/products` | `200` | List all products (filter by status) |
| `PUT` | `/api/admin/products/{product_id}/hide` | `200` | Hide a product from public view |
| `PUT` | `/api/admin/products/{product_id}/unhide` | `200` | Restore a hidden product to active |

### GET `/api/admin/products` — Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | `string` | — | Filter: `active` \| `sold` \| `hidden` |
| `page` | `int` | `1` | Page number |
| `limit` | `int` | `50` | Items per page (max 100) |

---

## Quick Reference — All Endpoints

| # | Method | Endpoint | Auth | Description |
|---|--------|----------|------|-------------|
| 1 | `GET` | `/` | 🔓 | API root |
| 2 | `GET` | `/api/health` | 🔓 | Health check |
| 3 | `POST` | `/api/auth/register` | 🔓 | Register |
| 4 | `POST` | `/api/auth/login` | 🔓 | Login |
| 5 | `GET` | `/api/auth/me` | 👤 | Current user |
| 6 | `GET` | `/api/stores` | 🔓 | Browse stores |
| 7 | `GET` | `/api/stores/{slug}` | 🔓 | Store profile |
| 8 | `GET` | `/api/stores/{slug}/products` | 🔓 | Store products |
| 9 | `GET` | `/api/stores/{slug}/groups` | 🔓 | Store categories |
| 10 | `POST` | `/api/stores` | 🏪 | Create store |
| 11 | `PUT` | `/api/stores/me` | 🏪 | Update my store |
| 12 | `GET` | `/api/stores/me/dashboard` | 🏪 | Seller dashboard |
| 13 | `GET` | `/api/products` | 🔓 | Search products |
| 14 | `GET` | `/api/products/{id}` | 🔓 | Product details |
| 15 | `GET` | `/api/products/seller/list` | 🏪 | My products |
| 16 | `POST` | `/api/products` | 🏪 | Create product |
| 17 | `PUT` | `/api/products/{id}` | 🏪 | Update product |
| 18 | `DELETE` | `/api/products/{id}` | 🏪 | Delete product |
| 19 | `POST` | `/api/products/{id}/images` | 🏪 | Upload image |
| 20 | `DELETE` | `/api/products/{id}/images/{imgId}` | 🏪 | Delete image |
| 21 | `PUT` | `/api/products/{id}/images/reorder` | 🏪 | Reorder images |
| 22 | `GET` | `/api/product-groups/my-store` | 🏪 | List my categories |
| 23 | `POST` | `/api/product-groups` | 🏪 | Create category |
| 24 | `PUT` | `/api/product-groups/{id}` | 🏪 | Rename category |
| 25 | `DELETE` | `/api/product-groups/{id}` | 🏪 | Delete category |
| 26 | `POST` | `/api/inquiries` | 🔓 | Submit inquiry |
| 27 | `GET` | `/api/inquiries` | 🏪 | List my inquiries |
| 28 | `GET` | `/api/inquiries/stats` | 🏪 | Inquiry stats |
| 29 | `GET` | `/api/inquiries/{id}` | 🏪 | Single inquiry |
| 30 | `PUT` | `/api/inquiries/{id}/status` | 🏪 | Update status |
| 31 | `DELETE` | `/api/inquiries/{id}` | 🏪 | Delete inquiry |
| 32 | `GET` | `/api/admin/stats` | 🔑 | Platform stats |
| 33 | `GET` | `/api/admin/users` | 🔑 | List users |
| 34 | `GET` | `/api/admin/users/pending-sellers` | 🔑 | Pending sellers |
| 35 | `GET` | `/api/admin/users/{id}` | 🔑 | User details |
| 36 | `PUT` | `/api/admin/users/{id}/approve-seller` | 🔑 | Approve seller |
| 37 | `DELETE` | `/api/admin/users/{id}` | 🔑 | Delete user |
| 38 | `GET` | `/api/admin/stores` | 🔑 | All stores |
| 39 | `GET` | `/api/admin/products` | 🔑 | All products |
| 40 | `PUT` | `/api/admin/products/{id}/hide` | 🔑 | Hide product |
| 41 | `PUT` | `/api/admin/products/{id}/unhide` | 🔑 | Unhide product |

**Total: 41 endpoints**

---

## Enum Values Reference

### User Role
| Value | Description |
|-------|-------------|
| `buyer` | Can browse stores and submit inquiries |
| `seller` | Can manage store and products (requires approval) |
| `admin` | Full platform access |

### Product Status
| Value | Visible to Buyers | Description |
|-------|-------------------|-------------|
| `active` | ✅ Yes | Product is available |
| `sold` | ✅ Yes (marked sold) | Product is sold out |
| `hidden` | ❌ No | Product is hidden from public |

### Inquiry Status
| Value | Description |
|-------|-------------|
| `new` | Buyer just submitted — not yet handled |
| `replied` | Seller has responded to the buyer |
| `closed` | Inquiry resolved and closed |

### Sort Options
| Value | Description |
|-------|-------------|
| `newest` | Most recently created first (default) |
| `price_asc` | Lowest price first |
| `price_desc` | Highest price first |
| `alphabetical` | A–Z by product title |

---

## Source Files

| Router File | Prefix | Endpoints |
|-------------|--------|-----------|
| `app/routers/auth.py` | `/api/auth` | 3 |
| `app/routers/stores.py` | `/api/stores` | 7 |
| `app/routers/products.py` | `/api/products` | 9 |
| `app/routers/product_groups.py` | `/api/product-groups` | 4 |
| `app/routers/inquiries.py` | `/api/inquiries` | 6 |
| `app/routers/admin.py` | `/api/admin` | 10 |
| `app/main.py` | `/` | 2 |
| **Total** | | **41** |

---

*Last updated: January 26, 2026 — Sellor API v1.0.0*
