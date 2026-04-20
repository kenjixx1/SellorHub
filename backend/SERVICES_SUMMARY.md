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

**Purpose:** Orchestrates user profile management workflows.

**Methods:**

#### `get_user_by_id(user_id: int) -> Optional[User]`
- Retrieves user by ID

#### `update_user_profile(user_id: int, update_data: UserUpdate) -> User`
- Updates user profile fields
- Validates unique username/email
- **Raises:** HTTPException if user not found or validation fails

#### `delete_user(user_id: int) -> bool`
- Deletes user account
- **Raises:** HTTPException if user not found

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

### 4. ProductGroupSystem (`app/systems/product_group_system.py`)

**Purpose:** Orchestrates product-category CRUD.
Delegates `belongs_to_store()` and `rename()` checks to the `ProductGroup` entity.

---

### 5. ProductSystem (`app/systems/product_system.py`)

**Purpose:** Orchestrates product CRUD, image management, and search.
Does **not** duplicate availability/stock checks; those are delegated to `Product.assert_purchasable()` and `Product.reserve_stock()`.

**Key methods:**

#### `create_product / update_product / delete_product`
- Standard CRUD with ownership verification

#### `search_products(...) -> tuple[List[Product], int]`
- Advanced filtering: keyword, price range, category, store, sort order

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

### 9. AddressSystem (`app/systems/address_system.py`)

**Purpose:** Orchestrates shipping address CRUD.

---

### 10. AdminSystem (`app/systems/admin_system.py`)

**Purpose:** Orchestrates admin user, store, and product management.
Delegates `Product.hide()` and `Product.activate()` to the Product entity.

---

### 11. RatingSystem (`app/systems/rating_system.py`)

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
├── user_system.py           # User profile management
├── store_system.py          # Store CRUD operations
├── product_group_system.py  # Product categories
├── product_system.py        # Product CRUD & search
├── inquiry_system.py        # Buyer-seller communication
├── cart_system.py           # Shopping cart management
├── order_system.py          # Checkout & order management
├── address_system.py        # Shipping addresses
├── admin_system.py          # Platform administration
└── rating_system.py         # Store ratings
```

---

**Total:** 11 system classes covering all MVP functionality, with domain rules distributed to model entities.
