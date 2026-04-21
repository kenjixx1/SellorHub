# System Layer Summary

> **Architecture note:** The application layer was previously called `services/`. It has been renamed to `systems/` and the class names changed from `*Service` to `*System` as part of the OOP refactor. The `services/` folder is retained for backwards reference but all active code now lives under `app/systems/`.

## Architecture

```
API Request
    ↓
Router (validates input with Pydantic schemas)
    ↓
System (orchestration: queries, transactions, cross-entity workflows)
    ↓
Model/Entity (domain rules: availability, transitions, invariants)
    ↓
Database
```

### Diagram alignment note

- The sequence and class diagrams under [`diagram/`](../diagram/) should use the same `*System` control objects as the active backend code in `app/systems/`.
- The legacy `app/services/` folder is retained only for reference; it should not be treated as the current application layer.
- `SD-04` in [`diagram/SQ_Diagram.md`](../diagram/SQ_Diagram.md) now documents the **target** auto-generated store slug flow. The current backend schema still requires `slug` on `StoreCreate` until that code path is implemented.

### Responsibility split

| Layer | Owns |
|-------|------|
| **Models / entities** (`app/models/`) | Business invariants, state transitions, domain calculations |
| **Systems** (`app/systems/`) | Use-case orchestration, DB sessions, transactions, HTTP error mapping |
| **Routers** (`app/routers/`) | HTTP parsing, dependency injection, thin delegation to systems |
| **Schemas** (`app/schemas/`) | Request/response shapes (DTOs only) |

**Per-method reference:** [`System_Summary.md`](System_Summary.md) lists every `*System` class, each public method, what it does, and a one-line note on how it works.

**Model reference:** [`Model_Summary.md`](Model_Summary.md) lists ORM entities in `app/models/`, enums, columns/relationships overview, and each domain method with a one-line note.

---

## System Classes

### 1. AuthSystem (`app/systems/auth_system.py`)

**Purpose:** Orchestrates user registration and login workflows.

**Methods:**

#### `register_user(user_data: UserCreate) -> User`
- Creates new user account
- Hashes password with bcrypt
- Checks for duplicate username/email
- Sets `selling_approve=False` for sellers
- **Raises:** HTTPException if username/email exists

#### `login_user(login_data: UserLogin) -> Token`
- Authenticates user credentials
- Verifies password
- Generates JWT access token
- Returns token with user info
- **Raises:** HTTPException if credentials invalid

#### `get_user_by_email(email: str) -> Optional[User]`
- Finds user by email address

#### `get_user_by_id(user_id: int) -> Optional[User]`
- Finds user by ID

---

### 2. UserSystem (`app/systems/user_system.py`)

**Purpose:** Orchestrates user profile, address-book, and account admin workflows.

**Methods:**

#### `get_user_by_id(user_id: int) -> Optional[User]`
- Retrieves user by ID

#### `get_all_users(role: Optional[UserRole], skip: int, limit: int) -> tuple[List[User], int]`
- Admin listing for users with optional role filter

#### `search_users(search_query: str, skip: int, limit: int) -> tuple[List[User], int]`
- Search users by username or email

#### `get_pending_sellers(skip: int, limit: int) -> tuple[List[User], int]`
- Lists unapproved seller accounts

#### `approve_seller(user_id: int, approve: bool = True) -> User`
- Approves or rejects a seller account

#### `update_user_profile(user_id: int, update_data: UserUpdate) -> User`
- Updates user profile fields
- Validates unique username/email
- **Raises:** HTTPException if user not found or validation fails

#### `delete_user(user_id: int) -> bool`
- Deletes user account
- **Raises:** HTTPException if user not found

#### `list_addresses(user_id: int) -> List[Address]`
- Lists the current user's saved shipping addresses

#### `get_address(address_id: int, user_id: int) -> Address`
- Loads one owned address or raises 404

#### `create_address(user_id: int, data: AddressCreate) -> Address`
- Creates a shipping address and keeps a single default

#### `update_address(address_id: int, user_id: int, data: AddressUpdate) -> Address`
- Partially updates an owned address

#### `delete_address(address_id: int, user_id: int) -> bool`
- Deletes one owned address

---

### 3. StoreSystem (`app/systems/store_system.py`)

**Purpose:** Orchestrates store creation, lookup, and update workflows.
Delegates profile updates to the `Store.update_profile()` domain method.

**Methods:**

#### `create_store(store_data: StoreCreate, owner_id: int) -> Store`
- Creates new store for seller
- Validates unique slug
- Enforces one store per seller
- **Raises:** HTTPException if slug exists or seller has store

#### `get_store_by_id / get_store_by_slug / get_store_by_owner_id`
- Lookup helpers

#### `update_store(store_id: int, update_data: StoreUpdate) -> Store`
- Delegates to `store.update_profile()` on the entity
- **Raises:** HTTPException if store not found

#### `is_slug_taken(slug: str) -> bool`
- Returns `True` if a store with the given slug already exists in the database
- Used by `GET /api/stores/check-slug` to power the frontend slug availability check

#### `search_stores / get_all_stores`
- Query and search helpers with pagination

---

### 4. ProductSystem (`app/systems/product_system.py`)

**Purpose:** Orchestrates product CRUD, product-group management, image management, and search.
Does **not** duplicate availability/stock checks; those are delegated to `Product.assert_purchasable()` and `Product.reserve_stock()`.

**Key methods:**

#### `create_product_group / get_product_group_by_id / get_store_product_groups / get_store_product_groups_with_counts / update_product_group / delete_product_group`
- Product-category management now lives inside `ProductSystem`
- Group ownership and renaming still rely on `ProductGroup.belongs_to_store()` / `rename()`

#### `create_product / update_product / delete_product`
- Standard CRUD with ownership verification
- Validates that any `group_id` belongs to the same store before save

#### `search_products(...) -> tuple[List[Product], int]`
- Advanced filtering: keyword, price range, category, store, sort order

#### `get_all_products(skip: int, limit: int, status: Optional[ProductStatus]) -> tuple[List[Product], int]`
- Admin listing helper for product moderation screens

#### `hide_product / unhide_product`
- Admin moderation hooks that delegate visibility state changes to the `Product` entity

#### `add_product_image / delete_product_image / reorder_product_images`
- Image management with position and count limits

---

### 6. InquirySystem (`app/systems/inquiry_system.py`)

**Purpose:** Orchestrates inquiry submission and status-update workflows.
Delegates `belongs_to_store()` and `update_status()` to the `Inquiry` entity.

---

### 7. CartSystem (`app/systems/cart_system.py`)

**Purpose:** Orchestrates shopping-cart workflows.
Delegates:
- Product availability checks to `Product.assert_purchasable()`
- Quantity merging to `CartItem.merge_quantity()`
- Quantity updates to `CartItem.set_quantity()`
- Subtotal calculation to `CartItem.subtotal()`

---

### 8. OrderSystem (`app/systems/order_system.py`)

**Purpose:** Orchestrates checkout and order-management workflows.
Delegates:
- Product availability + stock: `Product.assert_purchasable()`, `Product.reserve_stock()`, `Product.line_total()`
- Status transitions: `Order.apply_transition()` (which calls `Order.assert_transition()`)

**Key methods:**

#### `create_order_from_cart(buyer_id, store_id, shipping_address_id) -> Order`
- Validates address and store
- Builds order from cart items using `_build_order_items()`
- Clears used cart items
- Persists order + initial status history

#### `create_order_direct(buyer_id, data: OrderCreate) -> Order`
- Same flow without cart (explicit item list)

#### `update_order_status(order_id, new_status, ...) -> Order`
- Calls `order.apply_transition()` — transition rules live on the Order entity
- Records status history entry

---

### 9. AdminSystem (`app/systems/admin_system.py`)

**Purpose:** Coordinates admin-facing workflows and platform reporting.
Delegates domain-specific CRUD and moderation to `UserSystem`, `StoreSystem`, and `ProductSystem`.

**Key methods:**

#### `get_all_users / get_pending_sellers / get_user_by_id / search_users / approve_seller / delete_user`
- Admin façade methods delegated to `UserSystem`

#### `get_all_stores / search_stores`
- Admin façade methods delegated to `StoreSystem`

#### `get_all_products / hide_product / unhide_product`
- Admin façade methods delegated to `ProductSystem`

---

### 10. RatingSystem (`app/systems/rating_system.py`)

**Purpose:** Orchestrates store rating workflows.

---

## Usage Example

### In a Route Handler

```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.systems.product_system import ProductSystem
from app.schemas.product import ProductCreate, ProductResponse

router = APIRouter()

@router.post("/products", response_model=ProductResponse)
def create_product(
    product: ProductCreate,
    store_id: int,
    db: Session = Depends(get_db)
):
    system = ProductSystem(db)
    return system.create_product(product, store_id)
```

### System Instantiation Pattern

```python
from app.systems.product_system import ProductSystem
from app.systems.store_system import StoreSystem

def some_route(db: Session = Depends(get_db)):
    product_system = ProductSystem(db)
    store_system = StoreSystem(db)

    product = product_system.get_product_by_id(123)
    store = store_system.get_store_by_slug("my-store")
```

---

## Domain Behaviour on Models

Business rules that were previously duplicated across service/system classes now live on the entities:

| Entity | Domain methods |
|--------|---------------|
| `Product` | `is_purchasable()`, `assert_purchasable()`, `line_total()`, `reserve_stock()`, `hide()`, `activate()` |
| `CartItem` | `subtotal()`, `merge_quantity()`, `set_quantity()` |
| `Order` | `allowed_transitions()`, `can_transition_to()`, `assert_transition()`, `apply_transition()`, `calculate_total()` |
| `OrderItem` | `line_total()` |
| `Store` | `is_owned_by()`, `update_profile()` |
| `ProductGroup` | `belongs_to_store()`, `rename()` |
| `Inquiry` | `belongs_to_store()`, `mark_replied()`, `close()`, `update_status()` |

---

## File Structure

```
backend/app/systems/
├── __init__.py
├── auth_system.py           # Authentication & registration
├── user_system.py           # User accounts, addresses, and admin user actions
├── store_system.py          # Store CRUD operations
├── product_system.py        # Products, categories, images, and moderation
├── inquiry_system.py        # Buyer-seller communication
├── cart_system.py           # Shopping cart management
├── order_system.py          # Checkout & order management
├── admin_system.py          # Admin façade and platform reporting
└── rating_system.py         # Store ratings
```

---

**Total:** 9 system classes covering all MVP functionality, with domain rules distributed to model entities and thin CRUD systems merged into stronger domains.
