# Sellor — Class Diagram (Text Format)

---

## 1. Model Classes (SQLAlchemy ORM)

---

### User
- Attributes:
  - id: int (PK)
  - username: str (unique)
  - email: str (unique)
  - password_hash: str
  - role: UserRole (buyer / seller / admin)
  - phone_number: str (optional, unique)
  - avatar_url: str (optional)
  - selling_approve: bool
  - created_at: datetime
- Methods:
  - (inherited from SQLAlchemy Base)

---

### Store
- Attributes:
  - id: int (PK)
  - owner_id: int (FK → User, unique)
  - slug: str (unique)
  - name: str
  - description: str (optional)
  - logo_url: str (optional)
  - created_at: datetime
- Methods:
  - is_owned_by(user_id: int) → bool
  - update_profile(name, description, logo_url) → None

---

### ProductGroup
- Attributes:
  - id: int (PK)
  - store_id: int (FK → Store)
  - name: str (unique per store)
  - created_at: datetime
- Methods:
  - (inherited from SQLAlchemy Base)

---

### Product
- Attributes:
  - id: int (PK)
  - store_id: int (FK → Store)
  - group_id: int (FK → ProductGroup, nullable)
  - title: str
  - description: str (optional)
  - price: decimal
  - stock: int (nullable)
  - status: ProductStatus (active / sold / hidden)
  - created_at: datetime
  - updated_at: datetime
- Methods:
  - is_purchasable(quantity: int = 1) → bool
  - assert_purchasable(quantity: int = 1) → None
  - line_total(quantity: int) → decimal
  - reserve_stock(quantity: int) → None
  - hide() → None
  - activate() → None

---

### ProductImage
- Attributes:
  - id: int (PK)
  - product_id: int (FK → Product)
  - image_url: str
  - position: int (0-indexed)
  - created_at: datetime
- Methods:
  - (inherited from SQLAlchemy Base)

---

### Inquiry
- Attributes:
  - id: int (PK)
  - store_id: int (FK → Store)
  - product_id: int (FK → Product)
  - buyer_name: str
  - buyer_email: str
  - message: str
  - status: InquiryStatus (new / replied / closed)
  - created_at: datetime
- Methods:
  - (inherited from SQLAlchemy Base)

---

### CartItem
- Attributes:
  - id: int (PK)
  - user_id: int (FK → User)
  - product_id: int (FK → Product)
  - quantity: int
  - created_at: datetime
- Methods:
  - (inherited from SQLAlchemy Base)

---

### Address
- Attributes:
  - id: int (PK)
  - user_id: int (FK → User)
  - label: str
  - recipient_name: str
  - phone: str
  - address_line1: str
  - address_line2: str (nullable)
  - city: str
  - province: str
  - postal_code: str
  - country: str (default: Thailand)
  - is_default: bool
  - created_at: datetime
- Methods:
  - (inherited from SQLAlchemy Base)

---

### Order
- Attributes:
  - id: int (PK)
  - order_number: str (unique)
  - buyer_id: int (FK → User)
  - store_id: int (FK → Store)
  - status: OrderStatus (placed / paid / packing / shipped / delivered_pending_confirm / delivered / cancelled / refunded)
  - total_amount: decimal
  - currency: str (default: THB)
  - shipping_address_id: int (FK → Address)
  - created_at: datetime
  - updated_at: datetime
- Methods:
  - allowed_transitions(is_seller: bool = False, is_buyer: bool = False) → Set[OrderStatus]
  - can_transition_to(new_status: OrderStatus, is_seller: bool = False, is_buyer: bool = False) → bool
  - assert_transition(new_status: OrderStatus, is_seller: bool = False, is_buyer: bool = False) → None
  - apply_transition(new_status: OrderStatus, is_seller: bool = False, is_buyer: bool = False) → None
  - calculate_total() → decimal

---

### OrderItem
- Attributes:
  - id: int (PK)
  - order_id: int (FK → Order)
  - product_id: int (FK → Product)
  - product_title_snapshot: str
  - unit_price_snapshot: decimal
  - quantity: int
- Methods:
  - (inherited from SQLAlchemy Base)

---

### OrderStatusHistory
- Attributes:
  - id: int (PK)
  - order_id: int (FK → Order)
  - status: OrderStatus
  - note: str (optional)
  - changed_by_user_id: int (FK → User)
  - created_at: datetime
- Methods:
  - (inherited from SQLAlchemy Base)

---

### Shipment
- Attributes:
  - id: int (PK)
  - order_id: int (FK → Order, unique)
  - carrier: str
  - tracking_number: str
  - shipped_at: datetime
  - delivered_at: datetime (nullable)
- Methods:
  - (inherited from SQLAlchemy Base)

---

### StoreRating
- Attributes:
  - id: int (PK)
  - store_id: int (FK → Store)
  - buyer_id: int (FK → User)
  - order_id: int (FK → Order, nullable)
  - score: int (1–5)
  - comment: str (optional)
  - created_at: datetime
  - updated_at: datetime
- Methods:
  - (inherited from SQLAlchemy Base)

---

## 2. Enumerations

---

### UserRole
- Values: buyer, seller, admin

### ProductStatus
- Values: active, sold, hidden

### InquiryStatus
- Values: new, replied, closed

### OrderStatus
- Values: placed, paid, packing, shipped, delivered_pending_confirm, delivered, cancelled, refunded

---

## 3. System Classes

---

### AuthSystem
- Attributes:
  - db: Session
- Methods:
  - register_user(user_data: UserCreate) → User
  - login_user(login_data: UserLogin) → Token
  - get_user_by_email(email: str) → Optional[User]
  - get_user_by_id(user_id: int) → Optional[User]

---

### UserSystem
- Attributes:
  - db: Session
- Methods:
  - get_user_by_id(user_id: int) → Optional[User]
  - update_user_profile(user_id: int, update_data: UserUpdate) → User
  - delete_user(user_id: int) → bool

---

### StoreSystem
- Attributes:
  - db: Session
- Methods:
  - create_store(store_data: StoreCreate, owner_id: int) → Store
  - get_store_by_id(store_id: int) → Optional[Store]
  - get_store_by_slug(slug: str) → Optional[Store]
  - is_slug_taken(slug: str) → bool
  - get_store_by_owner_id(owner_id: int) → Optional[Store]
  - get_all_stores(skip, limit) → tuple[List[Store], int]
  - get_store_with_product_count(store_id: int) → Optional[dict]
  - update_store(store_id: int, update_data: StoreUpdate) → Store
  - delete_store(store_id: int) → bool
  - search_stores(query: str, skip, limit) → tuple[List[Store], int]

---

### ProductGroupSystem
- Attributes:
  - db: Session
- Methods:
  - create_product_group(group_data: ProductGroupCreate, store_id: int) → ProductGroup
  - get_product_group_by_id(group_id: int) → Optional[ProductGroup]
  - get_store_product_groups(store_id: int) → List[ProductGroup]
  - get_store_product_groups_with_counts(store_id: int) → List[dict]
  - update_product_group(group_id: int, name: str, store_id: int) → ProductGroup
  - delete_product_group(group_id: int, store_id: int) → bool

---

### ProductSystem
- Attributes:
  - db: Session
- Methods:
  - create_product(product_data: ProductCreate, store_id: int) → Product
  - get_product_by_id(product_id: int, include_hidden: bool = False) → Optional[Product]
  - get_store_products(store_id, skip, limit, group_id, status, include_hidden) → tuple[List[Product], int]
  - search_products(search_query, min_price, max_price, group_ids, store_ids, status, skip, limit, sort_by) → tuple[List[Product], int]
  - update_product(product_id: int, update_data: ProductUpdate, store_id: int) → Product
  - delete_product(product_id: int, store_id: int) → bool
  - add_product_image(image_data: ProductImageCreate) → ProductImage
  - delete_product_image(image_id: int, store_id: int) → bool
  - reorder_product_images(product_id: int, image_positions: dict[int, int], store_id: int) → List[ProductImage]

---

### InquirySystem
- Attributes:
  - db: Session
- Methods:
  - create_inquiry(inquiry_data: InquiryCreate) → Inquiry
  - get_inquiry_by_id(inquiry_id: int) → Optional[Inquiry]
  - get_store_inquiries(store_id, status, skip, limit) → tuple[List[Inquiry], int]
  - get_product_inquiries(product_id, skip, limit) → tuple[List[Inquiry], int]
  - update_inquiry_status(inquiry_id: int, update_data: InquiryUpdate, store_id: int) → Inquiry
  - delete_inquiry(inquiry_id: int, store_id: int) → bool
  - get_inquiry_statistics(store_id: int) → dict

---

### CartSystem
- Attributes:
  - db: Session
- Methods:
  - get_cart(user_id: int) → dict
  - add_item(user_id: int, product_id: int, quantity: int) → dict
  - update_item(user_id: int, item_id: int, quantity: int) → dict
  - remove_item(user_id: int, item_id: int) → dict
  - clear_cart(user_id: int) → dict

---

### AddressSystem
- Attributes:
  - db: Session
- Methods:
  - list_addresses(user_id: int) → List[Address]
  - get_address(address_id: int, user_id: int) → Address
  - create_address(user_id: int, data: AddressCreate) → Address
  - update_address(address_id: int, user_id: int, data: AddressUpdate) → Address
  - delete_address(address_id: int, user_id: int) → bool

---

### OrderSystem
- Attributes:
  - db: Session
- Methods:
  - create_order_from_cart(buyer_id: int, store_id: int, shipping_address_id: int) → Order
  - create_order_direct(buyer_id: int, data: OrderCreate) → Order
  - get_order(order_id: int) → Optional[Order]
  - list_buyer_orders(buyer_id: int, skip: int, limit: int) → tuple[List[Order], int]
  - list_store_orders(store_id: int, skip: int, limit: int, status_filter: Optional[OrderStatus]) → tuple[List[Order], int]
  - update_order_status(order_id: int, new_status: OrderStatus, changed_by_user_id: int, note: Optional[str], is_seller: bool, is_buyer: bool) → Order

---

### RatingSystem
- Attributes:
  - db: Session
- Methods:
  - create_rating(buyer_id: int, data: RatingCreate) → StoreRating
  - update_rating(rating_id: int, buyer_id: int, data: RatingUpdate) → StoreRating
  - delete_rating(rating_id: int, buyer_id: int) → bool
  - get_store_ratings(store_id: int, skip: int, limit: int) → dict

---

### AdminSystem
- Attributes:
  - db: Session
- Methods:
  - get_all_users(role, skip, limit) → tuple[List[User], int]
  - get_pending_sellers(skip, limit) → tuple[List[User], int]
  - approve_seller(user_id: int, approve: bool) → User
  - search_users(search_query, skip, limit) → tuple[List[User], int]
  - ban_user(user_id: int) → User
  - get_all_stores(skip, limit) → tuple[List[Store], int]
  - hide_store(store_id: int, hide: bool) → Store
  - get_all_products(skip, limit, status) → tuple[List[Product], int]
  - hide_product(product_id: int) → Product
  - unhide_product(product_id: int) → Product
  - get_platform_statistics() → dict

---

## 4. Utility / Configuration Classes

---

### Settings (Pydantic BaseSettings)
- Attributes:
  - APP_NAME: str
  - APP_VERSION: str
  - DEBUG: bool
  - DATABASE_URL: str
  - JWT_SECRET_KEY: str
  - JWT_ALGORITHM: str
  - JWT_EXPIRATION_MINUTES: int
  - BCRYPT_ROUNDS: int
  - CORS_ORIGINS: list[str]
  - MAX_UPLOAD_SIZE: int
  - ALLOWED_EXTENSIONS: list[str]
  - STORAGE_TYPE: str (local / s3 / cloudinary)
  - DEFAULT_PAGE_SIZE: int
  - MAX_PAGE_SIZE: int
- Methods:
  - (auto-loaded from .env file)

---

### Pagination
- Attributes:
  - skip: int
  - limit: int
- Methods:
  - (used as FastAPI dependency)

---

## 5. Pydantic Schema Classes (DTOs)

---

### User Schemas
- UserBase: username, email, role, phone_number
- UserCreate (extends UserBase): password (with validation)
- UserLogin: email, password
- UserUpdate: username, email, phone_number, avatar_url (all optional)
- UserResponse (extends UserBase): id, selling_approve, created_at
- Token: access_token, token_type, expires_in, user (UserResponse)

### Store Schemas
- StoreBase: name, description, logo_url
- StoreCreate (extends StoreBase): slug (current API requirement, planned for auto-generation in the target SD-04 flow)
- StoreUpdate: name, description, logo_url (all optional)
- StoreResponse (extends StoreBase): id, slug, owner_id, product_count, created_at
- StoreWithProducts (extends StoreResponse): products (list)

### ProductGroup Schemas
- ProductGroupBase: name
- ProductGroupCreate (extends ProductGroupBase): (no extra fields)
- ProductGroupResponse (extends ProductGroupBase): id, store_id, product_count, created_at

### Product Schemas
- ProductBase: title, description, price, stock, status, group_id
- ProductCreate (extends ProductBase): (no extra fields)
- ProductUpdate: title, description, price, stock, status, group_id (all optional)
- ProductImageResponse: id, image_url, position
- ProductResponse (extends ProductBase): id, store, group, images, created_at, updated_at
- ProductListResponse: products (list), total, page, pages

### ProductImage Schemas
- ProductImageBase: image_url, position
- ProductImageCreate (extends ProductImageBase): product_id
- ProductImageResponse (extends ProductImageBase): id, created_at

### Inquiry Schemas
- InquiryBase: product_id, buyer_name, buyer_email, message
- InquiryCreate (extends InquiryBase): (no extra fields)
- InquiryUpdate: status (InquiryStatus)
- ProductInfo: id, title
- InquiryResponse (extends InquiryBase): id, product (ProductInfo), status, created_at

### Address Schemas
- AddressBase: label, recipient_name, phone, address_line1, address_line2, city, province, postal_code, country, is_default
- AddressCreate (extends AddressBase): (no extra fields)
- AddressUpdate: all fields optional
- AddressResponse (extends AddressBase): id, created_at

### Order Schemas
- OrderItemCreate: product_id, quantity
- OrderItemResponse: id, product_id, product_title_snapshot, unit_price_snapshot, quantity
- OrderBase: store_id, shipping_address_id
- OrderCreate (extends OrderBase): items (list of OrderItemCreate)
- CheckoutFromCart: store_id, shipping_address_id
- OrderStatusUpdate: status (OrderStatus), note (optional)
- OrderResponse: id, order_number, buyer_id, store, status, total_amount, currency, items, created_at, updated_at

### Cart Schemas
- CartItemAdd: product_id, quantity
- CartItemUpdate: quantity
- CartProductSnapshot: id, title, price, image_url, status
- CartItemResponse: id, product (CartProductSnapshot), quantity, subtotal
- CartResponse: items (list), total_items, total_amount

### Rating Schemas
- RatingCreate: store_id, score, comment (optional), order_id (optional)
- RatingUpdate: score, comment (all optional)
- RatingBuyerInfo: id, username
- RatingResponse: id, store_id, buyer (RatingBuyerInfo), score, comment, created_at, updated_at
- StoreSummaryRating: average_score, total_ratings, score_distribution

---

## 6. Utility Functions (not classes, but used across the system)

---

### Security (app/utils/security.py)
- hash_password(password: str) → str
- verify_password(plain: str, hashed: str) → bool
- create_access_token(data: dict) → str
- decode_access_token(token: str) → dict

### Storage (app/utils/storage.py)
- validate_image_file(file) → bool
- generate_unique_filename(filename: str) → str
- save_upload_file(file, subfolder: str) → str
- save_upload_file_local(file, subfolder: str) → str
- save_upload_file_s3(file, subfolder: str) → str
- save_upload_file_cloudinary(file, subfolder: str) → str

### Dependencies (app/dependencies.py)
- get_current_user() → User
- get_current_active_seller() → User
- get_current_admin() → User
- get_user_store() → Store
- verify_store_ownership(store_id: int) → bool

---

## 7. Relationships

---

### User ↔ Store
- One User (seller) has one Store (1:1)
- Store.owner_id → User.id

### Store ↔ ProductGroup
- One Store has many ProductGroups (1:M)
- ProductGroup.store_id → Store.id

### Store ↔ Product
- One Store has many Products (1:M)
- Product.store_id → Store.id

### ProductGroup ↔ Product
- One ProductGroup has many Products (1:M, optional)
- Product.group_id → ProductGroup.id (nullable)

### Product ↔ ProductImage
- One Product has many ProductImages (1:M)
- ProductImage.product_id → Product.id

### Product ↔ Inquiry
- One Product has many Inquiries (1:M)
- Inquiry.product_id → Product.id

### Store ↔ Inquiry
- One Store has many Inquiries (1:M)
- Inquiry.store_id → Store.id

### User ↔ CartItem
- One User (buyer) has many CartItems (1:M)
- CartItem.user_id → User.id

### Product ↔ CartItem
- One Product has many CartItems (1:M)
- CartItem.product_id → Product.id

### User ↔ Address
- One User has many Addresses (1:M)
- Address.user_id → User.id

### User ↔ Order
- One User (buyer) has many Orders (1:M)
- Order.buyer_id → User.id

### Store ↔ Order
- One Store has many Orders (1:M)
- Order.store_id → Store.id

### Address ↔ Order
- One Address has many Orders (1:M)
- Order.shipping_address_id → Address.id

### Order ↔ OrderItem
- One Order has many OrderItems (1:M)
- OrderItem.order_id → Order.id

### Product ↔ OrderItem
- One Product has many OrderItems (1:M)
- OrderItem.product_id → Product.id

### Order ↔ OrderStatusHistory
- One Order has many OrderStatusHistory records (1:M)
- OrderStatusHistory.order_id → Order.id

### User ↔ OrderStatusHistory
- One User (editor) has many OrderStatusHistory records (1:M)
- OrderStatusHistory.changed_by_user_id → User.id

### Order ↔ Shipment
- One Order has one Shipment (1:0..1)
- Shipment.order_id → Order.id (unique)

### Store ↔ StoreRating
- One Store has many StoreRatings (1:M)
- StoreRating.store_id → Store.id

### User ↔ StoreRating
- One User (buyer) has many StoreRatings (1:M)
- StoreRating.buyer_id → User.id

### Order ↔ StoreRating
- One Order has one StoreRating (1:0..1, optional)
- StoreRating.order_id → Order.id (nullable)

---

### System → Model Dependencies

- AuthSystem → User
- UserSystem → User
- StoreSystem → Store, Product
- ProductGroupSystem → ProductGroup, Product
- ProductSystem → Product, ProductImage, Store
- InquirySystem → Inquiry, Store, Product
- CartSystem → CartItem, Product
- AddressSystem → Address, User
- OrderSystem → Order, OrderItem, OrderStatusHistory, CartItem, Product, Store, Address
- RatingSystem → StoreRating, Order, Store, User
- AdminSystem → User, Store, Product

---
