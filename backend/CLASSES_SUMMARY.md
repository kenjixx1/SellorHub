# Backend Classes Summary

This document provides an overview of all classes created for the Sellor platform backend.

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── config.py                 # Application configuration
│   ├── database.py               # Database connection setup
│   ├── dependencies.py           # FastAPI dependency injection functions
│   │
│   ├── models/                   # SQLAlchemy ORM Models
│   │   ├── __init__.py
│   │   ├── user.py              # User account model
│   │   ├── store.py             # Store model
│   │   ├── product_group.py     # Product category model
│   │   ├── product.py           # Product listing model
│   │   ├── product_image.py     # Product image model
│   │   ├── inquiry.py           # Buyer-seller inquiry model
│   │   ├── address.py           # Shipping address model (Post-MVP)
│   │   ├── order.py             # Order model (Post-MVP)
│   │   ├── order_item.py        # Order line item model (Post-MVP)
│   │   ├── order_status_history.py  # Order tracking model (Post-MVP)
│   │   └── shipment.py          # Shipment tracking model (Post-MVP)
│   │
│   ├── schemas/                  # Pydantic Schemas (DTOs)
│   │   ├── __init__.py
│   │   ├── user.py              # User request/response schemas
│   │   ├── store.py             # Store request/response schemas
│   │   ├── product_group.py     # Product group schemas
│   │   ├── product.py           # Product schemas
│   │   ├── product_image.py     # Product image schemas
│   │   ├── inquiry.py           # Inquiry schemas
│   │   ├── address.py           # Address schemas
│   │   └── order.py             # Order schemas
│   │
│   └── utils/                    # Utility Functions
│       ├── __init__.py
│       ├── security.py          # JWT and password hashing
│       └── storage.py           # File upload handling
│
├── requirements.txt              # Python dependencies
└── .env.example                  # Environment variables template
```

---

## 1. SQLAlchemy Models (Database Tables)

### 1.1 User Model (`app/models/user.py`)

**Class:** `User`  
**Table:** `users`

**Purpose:** Represents user accounts for buyers, sellers, and admins.

**Fields:**
- `id` - Primary key
- `username` - Unique username
- `email` - Unique email address
- `password_hash` - Hashed password (bcrypt)
- `role` - User role (buyer, seller, admin)
- `phone_number` - Optional phone number
- `selling_approve` - Seller approval status (boolean)
- `created_at` - Account creation timestamp

**Relationships:**
- `store` - One-to-one with Store (for sellers)
- `addresses` - One-to-many with Address
- `orders` - One-to-many with Order (as buyer)

**Enum:** `UserRole` - buyer, seller, admin

---

### 1.2 Store Model (`app/models/store.py`)

**Class:** `Store`  
**Table:** `stores`

**Purpose:** Represents a seller's store with unique public URL.

**Fields:**
- `id` - Primary key
- `owner_id` - Foreign key to User (unique, one store per seller)
- `slug` - Unique URL slug (e.g., "nisa-jewelry")
- `name` - Store name
- `description` - Store description
- `logo_url` - Logo image URL
- `created_at` - Store creation timestamp

**Relationships:**
- `owner` - Many-to-one with User
- `product_groups` - One-to-many with ProductGroup
- `products` - One-to-many with Product
- `inquiries` - One-to-many with Inquiry
- `orders` - One-to-many with Order

---

### 1.3 ProductGroup Model (`app/models/product_group.py`)

**Class:** `ProductGroup`  
**Table:** `product_groups`

**Purpose:** Categories within a store for organizing products.

**Fields:**
- `id` - Primary key
- `store_id` - Foreign key to Store
- `name` - Category name (unique per store)
- `created_at` - Creation timestamp

**Relationships:**
- `store` - Many-to-one with Store
- `products` - One-to-many with Product

**Constraints:**
- Unique constraint on (store_id, name)

---

### 1.4 Product Model (`app/models/product.py`)

**Class:** `Product`  
**Table:** `products`

**Purpose:** Represents product listings by sellers.

**Fields:**
- `id` - Primary key
- `store_id` - Foreign key to Store
- `group_id` - Foreign key to ProductGroup (nullable)
- `title` - Product title
- `description` - Product description
- `price` - Product price (decimal)
- `stock` - Stock quantity (nullable)
- `status` - Product status (active, sold, hidden)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

**Relationships:**
- `store` - Many-to-one with Store
- `group` - Many-to-one with ProductGroup
- `images` - One-to-many with ProductImage
- `inquiries` - One-to-many with Inquiry
- `order_items` - One-to-many with OrderItem

**Enum:** `ProductStatus` - active, sold, hidden

---

### 1.5 ProductImage Model (`app/models/product_image.py`)

**Class:** `ProductImage`  
**Table:** `product_images`

**Purpose:** Multiple images per product with display order.

**Fields:**
- `id` - Primary key
- `product_id` - Foreign key to Product
- `image_url` - Image URL
- `position` - Display order (0-indexed)
- `created_at` - Creation timestamp

**Relationships:**
- `product` - Many-to-one with Product

**Constraints:**
- Unique constraint on (product_id, position)

---

### 1.6 Inquiry Model (`app/models/inquiry.py`)

**Class:** `Inquiry`  
**Table:** `inquiries`

**Purpose:** Buyer-seller communication system (MVP).

**Fields:**
- `id` - Primary key
- `store_id` - Foreign key to Store
- `product_id` - Foreign key to Product
- `buyer_name` - Buyer's name
- `buyer_email` - Buyer's email
- `message` - Inquiry message
- `status` - Inquiry status (new, replied, closed)
- `created_at` - Creation timestamp

**Relationships:**
- `store` - Many-to-one with Store
- `product` - Many-to-one with Product

**Enum:** `InquiryStatus` - new, replied, closed

---

### 1.7 Address Model (`app/models/address.py`) - Post-MVP

**Class:** `Address`  
**Table:** `addresses`

**Purpose:** Saved shipping addresses for buyers.

**Fields:**
- `id` - Primary key
- `user_id` - Foreign key to User
- `label` - Address label (e.g., "Home", "Work")
- `recipient_name` - Recipient name
- `phone` - Contact phone
- `address_line1` - Address line 1
- `address_line2` - Address line 2 (nullable)
- `city` - City
- `province` - Province/state
- `postal_code` - Postal code
- `country` - Country (default: Thailand)
- `is_default` - Default address flag
- `created_at` - Creation timestamp

**Relationships:**
- `user` - Many-to-one with User
- `orders` - One-to-many with Order

---

### 1.8 Order Model (`app/models/order.py`) - Post-MVP

**Class:** `Order`  
**Table:** `orders`

**Purpose:** Completed checkout transactions.

**Fields:**
- `id` - Primary key
- `order_number` - Unique order number (e.g., "ORD-2026-000123")
- `buyer_id` - Foreign key to User
- `store_id` - Foreign key to Store
- `status` - Order status
- `total_amount` - Total order amount
- `currency` - Currency code (default: THB)
- `shipping_address_id` - Foreign key to Address
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

**Relationships:**
- `buyer` - Many-to-one with User
- `store` - Many-to-one with Store
- `shipping_address` - Many-to-one with Address
- `items` - One-to-many with OrderItem
- `status_history` - One-to-many with OrderStatusHistory
- `shipment` - One-to-one with Shipment

**Enum:** `OrderStatus` - placed, paid, packing, shipped, delivered, cancelled, refunded

---

### 1.9 OrderItem Model (`app/models/order_item.py`) - Post-MVP

**Class:** `OrderItem`  
**Table:** `order_items`

**Purpose:** Line items in an order with product snapshots.

**Fields:**
- `id` - Primary key
- `order_id` - Foreign key to Order
- `product_id` - Foreign key to Product
- `product_title_snapshot` - Product title at time of order
- `unit_price_snapshot` - Product price at time of order
- `quantity` - Quantity ordered

**Relationships:**
- `order` - Many-to-one with Order
- `product` - Many-to-one with Product

---

### 1.10 OrderStatusHistory Model (`app/models/order_status_history.py`) - Post-MVP

**Class:** `OrderStatusHistory`  
**Table:** `order_status_history`

**Purpose:** Audit log for order status changes.

**Fields:**
- `id` - Primary key
- `order_id` - Foreign key to Order
- `status` - Status at this point
- `note` - Optional note
- `changed_by_user_id` - Foreign key to User (who made the change)
- `created_at` - Timestamp

**Relationships:**
- `order` - Many-to-one with Order
- `changed_by` - Many-to-one with User

---

### 1.11 Shipment Model (`app/models/shipment.py`) - Post-MVP

**Class:** `Shipment`  
**Table:** `shipments`

**Purpose:** Tracking information for shipped orders.

**Fields:**
- `id` - Primary key
- `order_id` - Foreign key to Order (unique)
- `carrier` - Shipping carrier name
- `tracking_number` - Tracking number
- `shipped_at` - Shipment timestamp
- `delivered_at` - Delivery timestamp

**Relationships:**
- `order` - One-to-one with Order

---

## 2. Pydantic Schemas (API DTOs)

### 2.1 User Schemas (`app/schemas/user.py`)

**Classes:**
- `UserBase` - Base user fields
- `UserCreate` - User registration (includes password validation)
- `UserLogin` - Login credentials
- `UserUpdate` - Update profile
- `UserResponse` - User response (excludes password)
- `Token` - JWT token response

---

### 2.2 Store Schemas (`app/schemas/store.py`)

**Classes:**
- `StoreBase` - Base store fields
- `StoreCreate` - Create store (includes slug validation)
- `StoreUpdate` - Update store
- `StoreResponse` - Store response
- `StoreWithProducts` - Store with products list

---

### 2.3 ProductGroup Schemas (`app/schemas/product_group.py`)

**Classes:**
- `ProductGroupBase` - Base fields
- `ProductGroupCreate` - Create category
- `ProductGroupResponse` - Category response

---

### 2.4 Product Schemas (`app/schemas/product.py`)

**Classes:**
- `ProductBase` - Base product fields
- `ProductCreate` - Create product
- `ProductUpdate` - Update product (partial)
- `ProductImageResponse` - Image info
- `ProductResponse` - Product with images
- `ProductListResponse` - Paginated product list

---

### 2.5 ProductImage Schemas (`app/schemas/product_image.py`)

**Classes:**
- `ProductImageBase` - Base image fields
- `ProductImageCreate` - Upload image
- `ProductImageResponse` - Image response

---

### 2.6 Inquiry Schemas (`app/schemas/inquiry.py`)

**Classes:**
- `InquiryBase` - Base inquiry fields
- `InquiryCreate` - Submit inquiry
- `InquiryUpdate` - Update status
- `ProductInfo` - Product info for inquiry
- `InquiryResponse` - Inquiry with product info

---

### 2.7 Address Schemas (`app/schemas/address.py`)

**Classes:**
- `AddressBase` - Base address fields
- `AddressCreate` - Create address
- `AddressUpdate` - Update address
- `AddressResponse` - Address response

---

### 2.8 Order Schemas (`app/schemas/order.py`)

**Classes:**
- `OrderItemCreate` - Add item to order
- `OrderItemResponse` - Order item response
- `OrderBase` - Base order fields
- `OrderCreate` - Create order
- `OrderResponse` - Order with items

---

## 3. Utility Classes and Functions

### 3.1 Security Utils (`app/utils/security.py`)

**Functions:**
- `hash_password(password: str)` - Hash password with bcrypt
- `verify_password(plain, hashed)` - Verify password
- `create_access_token(data: dict)` - Generate JWT token
- `decode_access_token(token: str)` - Decode and verify JWT

---

### 3.2 Storage Utils (`app/utils/storage.py`)

**Functions:**
- `validate_image_file(file)` - Validate uploaded image
- `generate_unique_filename(filename)` - UUID-based filename
- `save_upload_file(file, subfolder)` - Save to configured storage
- `save_upload_file_local(file, subfolder)` - Save to local filesystem
- `save_upload_file_s3(file, subfolder)` - Save to AWS S3
- `save_upload_file_cloudinary(file, subfolder)` - Save to Cloudinary

---

### 3.3 Dependencies (`app/dependencies.py`)

**Dependency Functions:**
- `get_current_user()` - Get authenticated user from JWT
- `get_current_active_seller()` - Verify user is approved seller
- `get_current_admin()` - Verify user is admin
- `get_user_store()` - Get seller's store
- `verify_store_ownership(store_id)` - Verify user owns store

**Helper Classes:**
- `Pagination` - Pagination helper for list endpoints

---

## 4. Configuration Classes

### 4.1 Settings (`app/config.py`)

**Class:** `Settings` (Pydantic BaseSettings)

**Configuration Groups:**
- Application settings (name, version, debug)
- Database (connection URL)
- Security (JWT secret, algorithm, token expiry)
- Password hashing (bcrypt rounds)
- CORS (allowed origins)
- File upload (max size, allowed extensions)
- Storage (type: local/s3/cloudinary, credentials)
- Email (SMTP configuration)
- Pagination (default/max page size)

**Global Instance:** `settings`

---

### 4.2 Database (`app/database.py`)

**Objects:**
- `engine` - SQLAlchemy engine
- `SessionLocal` - Session factory
- `Base` - Declarative base for models

**Functions:**
- `get_db()` - Dependency to get database session

---

## 5. Enumerations

All enums are string-based for better API compatibility:

- `UserRole` - buyer, seller, admin
- `ProductStatus` - active, sold, hidden
- `InquiryStatus` - new, replied, closed
- `OrderStatus` - placed, paid, packing, shipped, delivered, cancelled, refunded

---

## Next Steps

1. **Install Dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Configure Environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and secret key
   ```

3. **Initialize Database:**
   ```bash
   alembic init alembic
   # Configure alembic.ini and alembic/env.py
   alembic revision --autogenerate -m "Initial migration"
   alembic upgrade head
   ```

4. **Create API Routes:**
   - Create `app/routers/` directory
   - Implement route handlers for auth, stores, products, inquiries, admin
   - Create `app/main.py` to initialize FastAPI app

5. **Run Development Server:**
   ```bash
   uvicorn app.main:app --reload
   ```

---

## Class Relationships Diagram

```
User (buyer/seller/admin)
  ├── Store (1:1 for sellers)
  │     ├── ProductGroup (1:M)
  │     │     └── Product (1:M)
  │     ├── Product (1:M)
  │     │     ├── ProductImage (1:M)
  │     │     └── Inquiry (1:M)
  │     ├── Inquiry (1:M)
  │     └── Order (1:M)
  ├── Address (1:M)
  └── Order (1:M as buyer)
        ├── OrderItem (1:M)
        ├── OrderStatusHistory (1:M)
        └── Shipment (1:1)
```

---

**Document Version:** 1.0  
**Last Updated:** January 26, 2026  
**Status:** All MVP and Post-MVP classes implemented
