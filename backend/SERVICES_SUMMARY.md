# Service Layer Summary

This document provides an overview of all service classes created for business logic and database operations.

## Architecture

```
API Request
    ↓
Router (validates input with Pydantic schemas)
    ↓
Service (business logic - THIS LAYER)
    ↓
Model (SQLAlchemy ORM)
    ↓
Database
```

## Service Classes

### 1. AuthService (`app/services/auth_service.py`)

**Purpose:** Handles user authentication and registration.

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

### 2. UserService (`app/services/user_service.py`)

**Purpose:** Manages user profile operations.

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

### 3. StoreService (`app/services/store_service.py`)

**Purpose:** Handles all store-related operations.

**Methods:**

#### `create_store(store_data: StoreCreate, owner_id: int) -> Store`
- Creates new store for seller
- Validates unique slug
- Enforces one store per seller
- **Raises:** HTTPException if slug exists or seller has store

#### `get_store_by_id(store_id: int) -> Optional[Store]`
- Retrieves store by ID

#### `get_store_by_slug(slug: str) -> Optional[Store]`
- Retrieves store by public slug

#### `get_store_by_owner_id(owner_id: int) -> Optional[Store]`
- Gets seller's store

#### `get_all_stores(skip: int, limit: int) -> tuple[List[Store], int]`
- Lists all stores with pagination
- Returns (stores list, total count)

#### `get_store_with_product_count(store_id: int) -> Optional[dict]`
- Gets store with active product count
- Returns dict with store and product_count

#### `update_store(store_id: int, update_data: StoreUpdate) -> Store`
- Updates store info (name, description, logo)
- **Note:** Slug cannot be changed
- **Raises:** HTTPException if store not found

#### `delete_store(store_id: int) -> bool`
- Deletes store and all related data (cascade)
- **Raises:** HTTPException if store not found

#### `search_stores(query: str, skip: int, limit: int) -> tuple[List[Store], int]`
- Searches stores by name or description
- Returns (matching stores, total count)

---

### 4. ProductGroupService (`app/services/product_group_service.py`)

**Purpose:** Manages product categories within stores.

**Methods:**

#### `create_product_group(group_data: ProductGroupCreate, store_id: int) -> ProductGroup`
- Creates category for store
- Validates unique name per store
- **Raises:** HTTPException if name exists in store

#### `get_product_group_by_id(group_id: int) -> Optional[ProductGroup]`
- Retrieves group by ID

#### `get_store_product_groups(store_id: int) -> List[ProductGroup]`
- Gets all categories for a store
- Ordered by name

#### `get_store_product_groups_with_counts(store_id: int) -> List[dict]`
- Gets categories with product counts
- Returns list of dicts with group info and product_count

#### `update_product_group(group_id: int, name: str, store_id: int) -> ProductGroup`
- Updates category name
- Validates ownership and uniqueness
- **Raises:** HTTPException if unauthorized or name exists

#### `delete_product_group(group_id: int, store_id: int) -> bool`
- Deletes category (products set to NULL group_id)
- **Raises:** HTTPException if unauthorized

---

### 5. ProductService (`app/services/product_service.py`)

**Purpose:** Comprehensive product management.

**Methods:**

#### `create_product(product_data: ProductCreate, store_id: int) -> Product`
- Creates new product for store
- All fields validated by schema

#### `get_product_by_id(product_id: int, include_hidden: bool) -> Optional[Product]`
- Gets product by ID
- `include_hidden`: Show hidden products (for owners/admins)

#### `get_store_products(store_id: int, skip: int, limit: int, group_id, status, include_hidden) -> tuple[List[Product], int]`
- Gets products for a store
- Filters: group_id, status, include_hidden
- Returns (products list, total count)

#### `search_products(search_query, min_price, max_price, group_ids, store_ids, status, skip, limit, sort_by) -> tuple[List[Product], int]`
- Advanced product search and filtering
- **Parameters:**
  - `search_query`: Search title/description
  - `min_price`, `max_price`: Price range
  - `group_ids`: Filter by categories
  - `store_ids`: Filter by stores
  - `status`: Filter by status
  - `sort_by`: "newest", "price_asc", "price_desc", "alphabetical"
- Returns (products list, total count)

#### `update_product(product_id: int, update_data: ProductUpdate, store_id: int) -> Product`
- Updates product fields
- Validates ownership
- **Raises:** HTTPException if unauthorized

#### `delete_product(product_id: int, store_id: int) -> bool`
- Deletes product
- Validates ownership
- **Raises:** HTTPException if unauthorized

#### `add_product_image(image_data: ProductImageCreate) -> ProductImage`
- Adds image to product
- Validates position uniqueness
- Enforces max 5 images per product
- **Raises:** HTTPException if position conflict or max reached

#### `delete_product_image(image_id: int, store_id: int) -> bool`
- Deletes product image
- Validates ownership
- **Raises:** HTTPException if unauthorized

#### `reorder_product_images(product_id: int, image_positions: dict, store_id: int) -> List[ProductImage]`
- Reorders product images
- `image_positions`: Dict mapping image_id to new position
- Returns updated images list
- **Raises:** HTTPException if unauthorized

---

### 6. InquiryService (`app/services/inquiry_service.py`)

**Purpose:** Handles buyer-seller communication.

**Methods:**

#### `create_inquiry(inquiry_data: InquiryCreate) -> Inquiry`
- Creates inquiry about a product
- Automatically sets store_id from product
- Status set to NEW
- **Raises:** HTTPException if product not found
- **TODO:** Send email notification to seller

#### `get_inquiry_by_id(inquiry_id: int) -> Optional[Inquiry]`
- Retrieves inquiry by ID

#### `get_store_inquiries(store_id: int, status, skip, limit) -> tuple[List[Inquiry], int]`
- Gets all inquiries for a store
- Filter by status (optional)
- Ordered by newest first
- Returns (inquiries list, total count)

#### `get_product_inquiries(product_id: int, skip, limit) -> tuple[List[Inquiry], int]`
- Gets inquiries for specific product
- Returns (inquiries list, total count)

#### `update_inquiry_status(inquiry_id: int, update_data: InquiryUpdate, store_id: int) -> Inquiry`
- Updates inquiry status (new → replied → closed)
- Validates ownership
- **Raises:** HTTPException if unauthorized

#### `delete_inquiry(inquiry_id: int, store_id: int) -> bool`
- Deletes inquiry
- Validates ownership
- **Raises:** HTTPException if unauthorized

#### `get_inquiry_statistics(store_id: int) -> dict`
- Gets inquiry stats for store
- Returns counts by status: new, replied, closed, total

---

### 7. AdminService (`app/services/admin_service.py`)

**Purpose:** Platform administration and moderation.

**Methods:**

#### User Management

##### `get_all_users(role, skip, limit) -> tuple[List[User], int]`
- Lists all users with pagination
- Filter by role (optional)
- Returns (users list, total count)

##### `get_pending_sellers(skip, limit) -> tuple[List[User], int]`
- Gets sellers awaiting approval
- Ordered by oldest first
- Returns (pending sellers, total count)

##### `approve_seller(user_id: int, approve: bool) -> User`
- Approves or rejects seller application
- **TODO:** Send email notification
- **Raises:** HTTPException if user not found or not a seller

##### `search_users(search_query: str, skip, limit) -> tuple[List[User], int]`
- Searches users by username or email
- Returns (matching users, total count)

##### `ban_user(user_id: int) -> User`
- Bans a user (placeholder implementation)
- Currently sets selling_approve=False for sellers
- **TODO:** Add is_banned field to User model

#### Store Management

##### `get_all_stores(skip, limit) -> tuple[List[Store], int]`
- Lists all stores (admin view)
- Returns (stores list, total count)

##### `hide_store(store_id: int, hide: bool) -> Store`
- Hides or unhides a store (moderation)
- **TODO:** Add is_hidden field to Store model

#### Product Management

##### `get_all_products(skip, limit, status) -> tuple[List[Product], int]`
- Lists all products (admin view)
- Filter by status (optional)
- Returns (products list, total count)

##### `hide_product(product_id: int) -> Product`
- Hides a product (sets status to HIDDEN)
- **Raises:** HTTPException if product not found

##### `unhide_product(product_id: int) -> Product`
- Unhides a product (sets status to ACTIVE)
- **Raises:** HTTPException if product not found

#### Platform Statistics

##### `get_platform_statistics() -> dict`
- Gets comprehensive platform statistics
- **Returns dictionary with:**
  ```python
  {
      "users": {
          "total": int,
          "buyers": int,
          "sellers": int,
          "pending_seller_approvals": int
      },
      "stores": {
          "total": int
      },
      "products": {
          "total": int,
          "active": int
      },
      "inquiries": {
          "total": int,
          "today": int
      }
  }
  ```

---

## Usage Example

### In a Route Handler

```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import ProductService
from app.schemas.product import ProductCreate, ProductResponse

router = APIRouter()

@router.post("/products", response_model=ProductResponse)
def create_product(
    product: ProductCreate,
    store_id: int,
    db: Session = Depends(get_db)
):
    service = ProductService(db)
    new_product = service.create_product(product, store_id)
    return new_product
```

### Service Instantiation Pattern

All services follow the same pattern:

```python
# In route handler
from app.services import ProductService, StoreService

def some_route(db: Session = Depends(get_db)):
    # Instantiate service with database session
    product_service = ProductService(db)
    store_service = StoreService(db)
    
    # Call service methods
    product = product_service.get_product_by_id(123)
    store = store_service.get_store_by_slug("my-store")
```

---

## Error Handling

All services raise `HTTPException` for errors:

```python
from fastapi import HTTPException, status

# Example from service
if not product:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Product not found"
    )
```

Route handlers don't need try-catch; FastAPI handles HTTPException automatically.

---

## Common Patterns

### Pagination

```python
# Service method signature
def get_items(skip: int = 0, limit: int = 20) -> tuple[List[Item], int]:
    query = self.db.query(Model)
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return items, total

# In router
items, total = service.get_items(skip=0, limit=20)
pages = (total + limit - 1) // limit
return {"items": items, "total": total, "pages": pages}
```

### Ownership Verification

```python
# Always verify ownership before modify operations
if entity.owner_id != current_user_id:
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You don't have permission to modify this resource"
    )
```

### Search and Filtering

```python
# Build query incrementally
query = self.db.query(Model)

if filter1:
    query = query.filter(Model.field == filter1)

if search_query:
    query = query.filter(Model.name.ilike(f"%{search_query}%"))

# Apply sorting
query = query.order_by(Model.created_at.desc())

# Paginate
total = query.count()
results = query.offset(skip).limit(limit).all()
```

---

## Next Steps

1. ✅ Service layer created
2. ⬜ Create router layer (`app/routers/`)
3. ⬜ Create `app/main.py` FastAPI application
4. ⬜ Implement email notification service
5. ⬜ Write unit tests for services
6. ⬜ Add logging to services
7. ⬜ Implement caching for frequently accessed data

---

## File Structure

```
backend/app/services/
├── __init__.py
├── auth_service.py          # Authentication & registration
├── user_service.py           # User profile management
├── store_service.py          # Store CRUD operations
├── product_group_service.py  # Product categories
├── product_service.py        # Product CRUD & search
├── inquiry_service.py        # Buyer-seller communication
└── admin_service.py          # Platform administration
```

---

**Total:** 7 service classes with 60+ methods covering all MVP functionality.
