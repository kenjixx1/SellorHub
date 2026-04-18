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
│   │   ├── cart.py              # Cart line items (per buyer)
│   │   ├── address.py           # Shipping address model
│   │   ├── order.py             # Order model
│   │   ├── order_item.py        # Order line item model
│   │   ├── order_status_history.py  # Order status audit log
│   │   ├── shipment.py          # Shipment tracking model
│   │   └── store_rating.py      # Store ratings / reviews
│   │
│   ├── services/                 # Business logic layer
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── user_service.py
│   │   ├── store_service.py
│   │   ├── product_group_service.py
│   │   ├── product_service.py
│   │   ├── inquiry_service.py
│   │   ├── cart_service.py
│   │   ├── address_service.py
│   │   ├── order_service.py
│   │   ├── rating_service.py
│   │   └── admin_service.py
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
│   │   ├── order.py             # Order schemas
│   │   ├── cart.py              # Cart API schemas
│   │   └── rating.py             # Store rating schemas
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
- `phone_number` - Optional phone number (unique)
- `avatar_url` - Optional profile image URL
- `selling_approve` - Seller approval status (boolean)
- `created_at` - Account creation timestamp

**Relationships:**
- `store` - One-to-one with Store (for sellers)
- `addresses` - One-to-many with Address
- `orders` - One-to-many with Order (as buyer)
- `status_changes` - One-to-many with OrderStatusHistory (as editor)
- `cart_items` - One-to-many with CartItem (via backref)
- `store_ratings` - One-to-many with StoreRating (via backref, as buyer)

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
- `ratings` - One-to-many with StoreRating (via `backref="ratings"`)

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

**Enum:** `OrderStatus` - placed, paid, packing, shipped, delivered_pending_confirm, delivered, cancelled, refunded

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

### 1.12 StoreRating Model (`app/models/store_rating.py`)

**Class:** `StoreRating`  
**Table:** `store_ratings`

**Purpose:** One rating (1–5 stars + optional comment) per buyer per store; optionally linked to a completed order.

**Fields:**
- `id` - Primary key
- `store_id` - Foreign key to Store
- `buyer_id` - Foreign key to User
- `order_id` - Foreign key to Order (nullable)
- `score` - Integer 1–5
- `comment` - Optional text
- `created_at`, `updated_at` - Timestamps

**Relationships:**
- `store` - Many-to-one with Store
- `buyer` - Many-to-one with User
- `order` - Many-to-one with Order (optional)

**Constraints:**
- Unique (`store_id`, `buyer_id`)
- Check: `score` between 1 and 5

---

## 2. Service classes (application / business logic)

Services hold **transactional business rules** and orchestrate ORM models. Each service takes a SQLAlchemy **`Session`** in `__init__(self, db: Session)` and is constructed per request from routers. They map closely to **API domains** (not one service per table).

### 2.1 AuthService (`app/services/auth_service.py`)

**Class:** `AuthService`

**Primary entities:** `User`

**Methods:**
- `register_user(user_data: UserCreate) -> User` — create account, hash password
- `login_user(login_data: UserLogin) -> Token` — verify credentials, issue JWT
- `get_user_by_email(email: str) -> Optional[User]`
- `get_user_by_id(user_id: int) -> Optional[User]`

---

### 2.2 UserService (`app/services/user_service.py`)

**Class:** `UserService`

**Primary entities:** `User`

**Methods:**
- `get_user_by_id(user_id: int) -> Optional[User]`
- `update_user_profile(user_id: int, update_data: UserUpdate) -> User`
- `delete_user(user_id: int) -> bool`

---

### 2.3 StoreService (`app/services/store_service.py`)

**Class:** `StoreService`

**Primary entities:** `Store`, `Product` (counts)

**Methods:**
- `create_store(store_data: StoreCreate, owner_id: int) -> Store`
- `get_store_by_id(store_id: int) -> Optional[Store]`
- `get_store_by_slug(slug: str) -> Optional[Store]`
- `get_store_by_owner_id(owner_id: int) -> Optional[Store]`
- `get_all_stores(skip, limit) -> tuple[List[Store], int]`
- `get_store_with_product_count(store_id: int) -> Optional[dict]`
- `update_store(store_id: int, update_data: StoreUpdate) -> Store`
- `delete_store(store_id: int) -> bool`
- `search_stores(query: str, skip, limit) -> tuple[List[Store], int]`

---

### 2.4 ProductGroupService (`app/services/product_group_service.py`)

**Class:** `ProductGroupService`

**Primary entities:** `ProductGroup`, `Product`

**Methods:**
- `create_product_group(group_data: ProductGroupCreate, store_id: int) -> ProductGroup`
- `get_product_group_by_id(group_id: int) -> Optional[ProductGroup]`
- `get_store_product_groups(store_id: int) -> List[ProductGroup]`
- `get_store_product_groups_with_counts(store_id: int) -> List[dict]`
- `update_product_group(group_id: int, name: str, store_id: int) -> ProductGroup`
- `delete_product_group(group_id: int, store_id: int) -> bool`

---

### 2.5 ProductService (`app/services/product_service.py`)

**Class:** `ProductService`

**Primary entities:** `Product`, `ProductImage`, `Store`

**Methods:**
- `create_product(product_data: ProductCreate, store_id: int) -> Product`
- `get_product_by_id(product_id: int, include_hidden: bool = False) -> Optional[Product]`
- `get_store_products(...)` — seller listing with filters/pagination
- `search_products(...)` — marketplace search
- `update_product(product_id: int, update_data: ProductUpdate, store_id: int) -> Product`
- `delete_product(product_id: int, store_id: int) -> bool`
- `add_product_image(image_data: ProductImageCreate) -> ProductImage`
- `delete_product_image(image_id: int, store_id: int) -> bool`
- `reorder_product_images(product_id: int, image_positions: dict[int, int], store_id: int) -> List[ProductImage]`

---

### 2.6 InquiryService (`app/services/inquiry_service.py`)

**Class:** `InquiryService`

**Primary entities:** `Inquiry`, `Store`, `Product`

**Methods:**
- `create_inquiry(inquiry_data: InquiryCreate) -> Inquiry`
- `get_inquiry_by_id(inquiry_id: int) -> Optional[Inquiry]`
- `get_store_inquiries(...)` — seller inbox
- `get_product_inquiries(...)`
- `update_inquiry_status(...)` — e.g. new → replied → closed
- `delete_inquiry(inquiry_id: int, store_id: int) -> bool`
- `get_inquiry_statistics(store_id: int) -> dict`

---

### 2.7 CartService (`app/services/cart_service.py`)

**Class:** `CartService`

**Primary entities:** `CartItem`, `Product`

**Methods:**
- `get_cart(user_id: int) -> dict` — items, totals
- `add_item(user_id: int, product_id: int, quantity: int) -> dict`
- `update_item(user_id: int, item_id: int, quantity: int) -> dict`
- `remove_item(user_id: int, item_id: int) -> dict`
- `clear_cart(user_id: int) -> dict`

**Notes:** Private helpers `_validate_product`, `_cart_query`, `_to_response` support cart operations.

---

### 2.8 AddressService (`app/services/address_service.py`)

**Class:** `AddressService`

**Primary entities:** `Address`, `User`

**Methods:**
- `list_addresses(user_id: int) -> List[Address]`
- `get_address(address_id: int, user_id: int) -> Address`
- `create_address(user_id: int, data: AddressCreate) -> Address`
- `update_address(address_id: int, user_id: int, data: AddressUpdate) -> Address`
- `delete_address(address_id: int, user_id: int) -> bool`

**Notes:** `_clear_defaults` ensures a single default address when needed.

---

### 2.9 OrderService (`app/services/order_service.py`)

**Class:** `OrderService`

**Primary entities:** `Order`, `OrderItem`, `OrderStatusHistory`, `CartItem`, `Product`, `Store`, `Address`

**Methods:**
- `create_order_from_cart(buyer_id: int, store_id: int, shipping_address_id: int) -> Order`
- `create_order_direct(buyer_id: int, data: OrderCreate) -> Order`
- `get_order(order_id: int) -> Optional[Order]`
- `list_buyer_orders(buyer_id: int, skip: int, limit: int) -> Tuple[List[Order], int]`
- `list_store_orders(store_id: int, skip: int, limit: int, status_filter: Optional[OrderStatus]) -> Tuple[List[Order], int]`
- `update_order_status(order_id: int, new_status: OrderStatus, changed_by_user_id: int, note: Optional[str], is_seller: bool, is_buyer: bool) -> Order` — enforces allowed transitions by role

**Notes:** Defines `_SELLER_TRANSITIONS` and `_BUYER_TRANSITIONS` for valid status moves.

---

### 2.10 RatingService (`app/services/rating_service.py`)

**Class:** `RatingService`

**Primary entities:** `StoreRating`, `Order`, `Store`, `User`

**Methods:**
- `create_rating(buyer_id: int, data: RatingCreate) -> StoreRating`
- `update_rating(rating_id: int, buyer_id: int, data: RatingUpdate) -> StoreRating`
- `delete_rating(rating_id: int, buyer_id: int) -> bool`
- `get_store_ratings(store_id: int, skip: int, limit: int) -> dict`

**Notes:** `_require_completed_order` restricts ratings to buyers with completed orders for the store.

---

### 2.11 AdminService (`app/services/admin_service.py`)

**Class:** `AdminService`

**Primary entities:** `User`, `Store`, `Product` (platform moderation)

**Methods:**
- `get_all_users(...)` — list with role filters
- `get_pending_sellers(skip, limit) -> tuple[List[User], int]`
- `approve_seller(user_id: int, approve: bool = True) -> User`
- `search_users(...)`
- `ban_user(user_id: int) -> User`
- `get_all_stores(skip, limit) -> tuple[List[Store], int]`
- `hide_store(store_id: int, hide: bool = True) -> Store`
- `get_all_products(...)`
- `hide_product(product_id: int) -> Product`
- `unhide_product(product_id: int) -> Product`
- `get_platform_statistics() -> dict`

---

### 2.12 Service ↔ model dependency (summary diagram)

Use this in a report as a **layered class diagram**: routers depend on services; services depend on models and `Session`.

```
┌─────────────────────────────────────────────────────────────────┐
│  FastAPI routers (thin) → instantiate *Service(db) per request     │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│ AuthService      │  │ UserService      │  │ StoreService         │
│ User             │  │ User             │  │ Store, Product       │
└──────────────────┘  └──────────────────┘  └──────────────────────┘
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│ ProductGroupServ │  │ ProductService   │  │ InquiryService       │
│ ProductGroup     │  │ Product, ProductI│  │ Inquiry              │
└──────────────────┘  └──────────────────┘  └──────────────────────┘
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│ CartService      │  │ AddressService   │  │ OrderService         │
│ CartItem, Product│  │ Address          │  │ Order, OrderItem, …  │
└──────────────────┘  └──────────────────┘  └──────────────────────┘
┌──────────────────┐  ┌──────────────────┐
│ RatingService    │  │ AdminService     │
│ StoreRating, …   │  │ User, Store, Prod│
└──────────────────┘  └──────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  SQLAlchemy models (section 1) — tables / relationships          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Pydantic Schemas (API DTOs)

### 3.1 User Schemas (`app/schemas/user.py`)

**Classes:**
- `UserBase` - Base user fields
- `UserCreate` - User registration (includes password validation)
- `UserLogin` - Login credentials
- `UserUpdate` - Update profile
- `UserResponse` - User response (excludes password)
- `Token` - JWT token response

---

### 3.2 Store Schemas (`app/schemas/store.py`)

**Classes:**
- `StoreBase` - Base store fields
- `StoreCreate` - Create store (includes slug validation)
- `StoreUpdate` - Update store
- `StoreResponse` - Store response
- `StoreWithProducts` - Store with products list

---

### 3.3 ProductGroup Schemas (`app/schemas/product_group.py`)

**Classes:**
- `ProductGroupBase` - Base fields
- `ProductGroupCreate` - Create category
- `ProductGroupResponse` - Category response

---

### 3.4 Product Schemas (`app/schemas/product.py`)

**Classes:**
- `ProductBase` - Base product fields
- `ProductCreate` - Create product
- `ProductUpdate` - Update product (partial)
- `ProductImageResponse` - Image info
- `ProductResponse` - Product with images
- `ProductListResponse` - Paginated product list

---

### 3.5 ProductImage Schemas (`app/schemas/product_image.py`)

**Classes:**
- `ProductImageBase` - Base image fields
- `ProductImageCreate` - Upload image
- `ProductImageResponse` - Image response

---

### 3.6 Inquiry Schemas (`app/schemas/inquiry.py`)

**Classes:**
- `InquiryBase` - Base inquiry fields
- `InquiryCreate` - Submit inquiry
- `InquiryUpdate` - Update status
- `ProductInfo` - Product info for inquiry
- `InquiryResponse` - Inquiry with product info

---

### 3.7 Address Schemas (`app/schemas/address.py`)

**Classes:**
- `AddressBase` - Base address fields
- `AddressCreate` - Create address
- `AddressUpdate` - Update address
- `AddressResponse` - Address response

---

### 3.8 Order Schemas (`app/schemas/order.py`)

**Classes:**
- `OrderItemCreate` - Add item to order
- `OrderItemResponse` - Order item response
- `OrderBase` - Base order fields
- `OrderCreate` - Create order (direct checkout line items)
- `CheckoutFromCart` - Checkout payload (store + shipping address)
- `OrderStatusUpdate` - Status change payload (seller / buyer confirm)
- `OrderResponse` - Order with items

---

### 3.9 Cart Schemas (`app/schemas/cart.py`)

**Classes:**
- `CartItemAdd` - Add to cart body
- `CartItemUpdate` - Update line quantity
- `CartProductSnapshot` - Product fields embedded in cart
- `CartItemResponse` - Single cart line
- `CartResponse` - Full cart with totals

---

### 3.10 Rating Schemas (`app/schemas/rating.py`)

**Classes:**
- `RatingCreate` - Submit rating (store, score, optional order ref)
- `RatingUpdate` - Update score / comment
- `RatingBuyerInfo` - Public buyer snippet on ratings
- `RatingResponse` - Rating row for API
- `StoreSummaryRating` - Aggregate rating summary for a store

---

## 4. Utility Classes and Functions

### 4.1 Security Utils (`app/utils/security.py`)

**Functions:**
- `hash_password(password: str)` - Hash password with bcrypt
- `verify_password(plain, hashed)` - Verify password
- `create_access_token(data: dict)` - Generate JWT token
- `decode_access_token(token: str)` - Decode and verify JWT

---

### 4.2 Storage Utils (`app/utils/storage.py`)

**Functions:**
- `validate_image_file(file)` - Validate uploaded image
- `generate_unique_filename(filename)` - UUID-based filename
- `save_upload_file(file, subfolder)` - Save to configured storage
- `save_upload_file_local(file, subfolder)` - Save to local filesystem
- `save_upload_file_s3(file, subfolder)` - Save to AWS S3
- `save_upload_file_cloudinary(file, subfolder)` - Save to Cloudinary

---

### 4.3 Dependencies (`app/dependencies.py`)

**Dependency Functions:**
- `get_current_user()` - Get authenticated user from JWT
- `get_current_active_seller()` - Verify user is approved seller
- `get_current_admin()` - Verify user is admin
- `get_user_store()` - Get seller's store
- `verify_store_ownership(store_id)` - Verify user owns store

**Helper Classes:**
- `Pagination` - Pagination helper for list endpoints

---

## 5. Configuration Classes

### 5.1 Settings (`app/config.py`)

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

### 5.2 Database (`app/database.py`)

**Objects:**
- `engine` - SQLAlchemy engine
- `SessionLocal` - Session factory
- `Base` - Declarative base for models

**Functions:**
- `get_db()` - Dependency to get database session

---

## 6. Enumerations

All enums are string-based for better API compatibility:

- `UserRole` - buyer, seller, admin
- `ProductStatus` - active, sold, hidden
- `InquiryStatus` - new, replied, closed
- `OrderStatus` - placed, paid, packing, shipped, delivered_pending_confirm, delivered, cancelled, refunded

---

## 7. Next Steps

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

## 8. Class relationships diagram (persistence)

```
User (buyer/seller/admin)
  ├── Store (1:1 for sellers)
  │     ├── ProductGroup (1:M)
  │     │     └── Product (1:M)
  │     ├── Product (1:M)
  │     │     ├── ProductImage (1:M)
  │     │     ├── Inquiry (1:M)
  │     │     ├── OrderItem (1:M)
  │     │     └── CartItem (1:M)
  │     ├── Inquiry (1:M)
  │     ├── Order (1:M)
  │     └── StoreRating (1:M)
  ├── Address (1:M)
  ├── CartItem (1:M)
  ├── StoreRating (1:M as buyer)
  ├── OrderStatusHistory (1:M as editor)
  └── Order (1:M as buyer)
        ├── OrderItem (1:M)
        ├── OrderStatusHistory (1:M)
        └── Shipment (1:0..1)
```

**Services** (section 2) sit above this graph: each service owns workflows on a subset of these entities; they do not add new tables.

---

## 9. Related design documents

| Document | Description |
|----------|-------------|
| [`../diagram/State_Diagram.md`](../diagram/State_Diagram.md) | Plain-text **state machine** specs (ST-01–ST-12): Order, Product, Inquiry, seller approval, cart session, store, shipment, product image, store rating, address, product group, buyer account. |

---

**Document Version:** 1.2  
**Last Updated:** April 17, 2026  
**Status:** Models, services, schemas, utilities, and cross-reference to state diagrams documented
