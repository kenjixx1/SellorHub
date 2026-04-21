# Model layer summary (`app/models/`)

SQLAlchemy **ORM** classes map database tables to Python objects. Columns and `relationship()` define persistence; **domain methods** encode business rules on the entity. This document lists each model (and enums where defined), every **method** / **property**, what it does, and a one-line note on how it works.

---

## `UserRole` (`user.py`)

Enumeration for `User.role`.

| Value | Meaning (one line) |
|-------|---------------------|
| `BUYER` | Default marketplace shopper. |
| `SELLER` | Can run a store after approval. |
| `ADMIN` | Platform administration. |

---

## `User` (`user.py`)

| Attribute area | Notes |
|----------------|--------|
| Identity | `id`, `username`, `email`, `password_hash`, `role`, `phone_number`, `avatar_url`, `selling_approve`, `created_at` |
| Relationships | `store` (one store per seller), `addresses`, `orders` (as buyer), `status_changes` (order history edits) |

| Method | What it does | How it works (one line) |
|--------|----------------|-------------------------|
| `__repr__` | Debug string for logging / shells. | Returns `<User(id=..., username=..., role=...)>` |

---

## `Store` (`store.py`)

| Attribute area | Notes |
|----------------|--------|
| Identity | `id`, `owner_id` (unique → one store per user), `slug` (unique public URL key), `name`, `description`, `logo_url`, `created_at` |
| Relationships | `owner`, `product_groups`, `products`, `inquiries`, `orders` |

| Method | What it does | How it works (one line) |
|--------|----------------|-------------------------|
| `is_owned_by(user_id)` | Checks if a user owns this store. | Compares `self.owner_id == user_id`. |
| `update_profile(name, description, logo_url)` | Updates display fields; only non-`None` args apply. | Sets each attribute when the corresponding argument is not `None`. |
| `__repr__` | Debug string. | Returns `<Store(id=..., slug=..., name=...)>` |

---

## `ProductGroup` (`product_group.py`)

| Attribute area | Notes |
|----------------|--------|
| Identity | `id`, `store_id`, `name`, `created_at` |
| Constraint | Unique `(store_id, name)` — category names unique per store |
| Relationships | `store`, `products` |

| Method | What it does | How it works (one line) |
|--------|----------------|-------------------------|
| `belongs_to_store(store_id)` | Whether this group is under that store. | Compares `self.store_id == store_id`. |
| `rename(new_name)` | Sets the category name. | Assigns `self.name = new_name`. |
| `__repr__` | Debug string. | Returns `<ProductGroup(id=..., store_id=..., name=...)>` |

---

## `ProductStatus` (`product.py`)

| Value | Meaning (one line) |
|-------|---------------------|
| `ACTIVE` | Listed and purchasable (subject to stock rules). |
| `SOLD` | Listing state (legacy / optional use). |
| `HIDDEN` | Not shown to buyers; admin or seller hide. |

---

## `Product` (`product.py`)

| Attribute area | Notes |
|----------------|--------|
| Identity | `id`, `store_id`, `group_id` (nullable), `title`, `description`, `price`, `stock` (nullable = untracked), `status`, `created_at`, `updated_at` |
| Relationships | `store`, `group`, `images`, `inquiries`, `order_items` |

| Method | What it does | How it works (one line) |
|--------|----------------|-------------------------|
| `is_purchasable(quantity)` | Boolean: can buy this many units now? | Requires `ACTIVE` and enough `stock` if stock is tracked. |
| `assert_purchasable(quantity)` | Same rules as purchasable but raises on failure. | Raises `ValueError` if not active or insufficient stock. |
| `line_total(quantity)` | Money for one line at current price. | `Decimal(price) * quantity`. |
| `reserve_stock(quantity)` | Decrements inventory after a successful reservation path. | Subtracts from `self.stock` when stock is not `None`. |
| `hide()` | Moderation: hide from catalog. | Sets `status` to `HIDDEN`. |
| `activate()` | Restore from hidden to sellable. | Sets `status` to `ACTIVE`. |
| `__repr__` | Debug string. | Returns `<Product(id=..., title=..., price=..., status=...)>` |

---

## `ProductImage` (`product_image.py`)

| Attribute area | Notes |
|----------------|--------|
| Identity | `id`, `product_id`, `image_url`, `position`, `created_at` |
| Constraint | Unique `(product_id, position)` — one image per slot per product |
| Relationships | `product` |

| Method | What it does | How it works (one line) |
|--------|----------------|-------------------------|
| `__repr__` | Debug string. | Returns `<ProductImage(id=..., product_id=..., position=...)>` |

---

## `InquiryStatus` (`inquiry.py`)

| Value | Meaning (one line) |
|-------|---------------------|
| `NEW` | Submitted, not yet handled. |
| `REPLIED` | Seller has responded (workflow). |
| `CLOSED` | Conversation closed. |

---

## `Inquiry` (`inquiry.py`)

| Attribute area | Notes |
|----------------|--------|
| Identity | `id`, `store_id`, `product_id`, `buyer_name`, `buyer_email`, `message`, `status`, `created_at` |
| Relationships | `store`, `product` |

| Method | What it does | How it works (one line) |
|--------|----------------|-------------------------|
| `belongs_to_store(store_id)` | Whether inquiry targets that store. | Compares `self.store_id == store_id`. |
| `mark_replied()` | Moves status to replied. | Sets `self.status = InquiryStatus.REPLIED`. |
| `close()` | Moves status to closed. | Sets `self.status = InquiryStatus.CLOSED`. |
| `update_status(new_status)` | Sets status to any allowed enum value. | Assigns `self.status = new_status`. |
| `__repr__` | Debug string. | Returns `<Inquiry(id=..., product_id=..., status=...)>` |

---

## `CartItem` (`cart.py`)

| Attribute area | Notes |
|----------------|--------|
| Identity | `id`, `user_id`, `product_id`, `quantity`, `created_at`, `updated_at` |
| Constraint | Unique `(user_id, product_id)` — one row per product in cart |
| Relationships | `user`, `product` |

| Method | What it does | How it works (one line) |
|--------|----------------|-------------------------|
| `subtotal()` | Line amount using live product price. | `Decimal(product.price) * quantity`. |
| `merge_quantity(additional)` | Add more units to same line. | `self.quantity += additional`. |
| `set_quantity(new_quantity)` | Replace quantity; validates minimum. | Raises `ValueError` if `< 1`, else assigns `quantity`. |
| `__repr__` | Debug string. | Returns `<CartItem(id=..., user_id=..., product_id=..., qty=...)>` |

---

## `Address` (`address.py`)

| Attribute area | Notes |
|----------------|--------|
| Identity | `id`, `user_id`, `label`, `recipient_name`, `phone`, lines, `city`, `province`, `postal_code`, `country`, `is_default`, `created_at` |
| Relationships | `user`, `orders` (shipping) |

| Method | What it does | How it works (one line) |
|--------|----------------|-------------------------|
| `__repr__` | Debug string. | Returns `<Address(id=..., user_id=..., label=...)>` |

---

## `OrderStatus` (`order.py`)

Lifecycle values stored on `Order.status` and `OrderStatusHistory.status`.

| Value | Meaning (one line) |
|-------|---------------------|
| `PLACED` | Checkout created the order. |
| `PAID` | Payment recorded (if you use this step). |
| `PACKING` | Seller preparing shipment. |
| `SHIPPED` | In transit. |
| `DELIVERED_PENDING_CONFIRM` | Awaiting buyer confirmation. |
| `DELIVERED` | Completed delivery. |
| `CANCELLED` | Cancelled. |
| `REFUNDED` | Refunded. |

**Module-level rules (not methods):** `_SELLER_TRANSITIONS` and `_BUYER_TRANSITIONS` define which next statuses are allowed per role; used by `Order.allowed_transitions()`.

---

## `Order` (`order.py`)

| Attribute area | Notes |
|----------------|--------|
| Identity | `id`, `order_number` (unique), `buyer_id`, `store_id`, `status`, `total_amount`, `currency`, `shipping_address_id`, `created_at`, `updated_at` |
| Relationships | `buyer`, `store`, `shipping_address`, `items`, `status_history`, `shipment` (0..1) |

| Method | What it does | How it works (one line) |
|--------|----------------|-------------------------|
| `allowed_transitions(is_seller, is_buyer)` | Set of next statuses allowed for given role flags. | Unions seller and/or buyer transition maps for `self.status`. |
| `can_transition_to(new_status, is_seller, is_buyer)` | Whether this transition is allowed. | Returns `new_status in allowed_transitions(...)`. |
| `assert_transition(new_status, is_seller, is_buyer)` | Enforces transition or fails. | Raises `ValueError` if `can_transition_to` is false. |
| `apply_transition(new_status, is_seller, is_buyer)` | Validates then sets status. | Calls `assert_transition`, then `self.status = new_status`. |
| `calculate_total()` | Sum of line totals from snapshots. | Loops `self.items`, sums `unit_price_snapshot * quantity`. |
| `__repr__` | Debug string. | Returns `<Order(id=..., order_number=..., status=...)>` |

---

## `OrderItem` (`order_item.py`)

| Attribute area | Notes |
|----------------|--------|
| Identity | `id`, `order_id`, `product_id` (nullable if product deleted), `product_title_snapshot`, `unit_price_snapshot`, `quantity` |
| Relationships | `order`, `product` |

| Method / property | What it does | How it works (one line) |
|-------------------|----------------|-------------------------|
| `line_total()` | Line amount at order time (immutable snapshot). | `Decimal(unit_price_snapshot) * quantity`. |
| `product_image_url` (property) | First image URL for display if product still exists. | Returns first `product.images[0].image_url` or `None`. |
| `__repr__` | Debug string. | Returns `<OrderItem(id=..., order_id=..., product_id=...)>` |

---

## `OrderStatusHistory` (`order_status_history.py`)

| Attribute area | Notes |
|----------------|--------|
| Identity | `id`, `order_id`, `status`, `note`, `changed_by_user_id`, `created_at` |
| Relationships | `order`, `changed_by` |

| Method | What it does | How it works (one line) |
|--------|----------------|-------------------------|
| `__repr__` | Debug string. | Returns `<OrderStatusHistory(id=..., order_id=..., status=...)>` |

---

## `Shipment` (`shipment.py`)

| Attribute area | Notes |
|----------------|--------|
| Identity | `id`, `order_id` (unique → one shipment per order), `carrier`, `tracking_number`, `shipped_at`, `delivered_at` |
| Relationships | `order` |

| Method | What it does | How it works (one line) |
|--------|----------------|-------------------------|
| `__repr__` | Debug string. | Returns `<Shipment(id=..., order_id=..., carrier=...)>` |

---

## `StoreRating` (`store_rating.py`)

| Attribute area | Notes |
|----------------|--------|
| Identity | `id`, `store_id`, `buyer_id`, `order_id` (optional link), `score` (1–5), `comment`, `created_at`, `updated_at` |
| Constraints | Unique `(store_id, buyer_id)` — one rating per buyer per store; `score` between 1 and 5 |
| Relationships | `store`, `buyer`, `order` |

| Method | What it does | How it works (one line) |
|--------|----------------|-------------------------|
| `__repr__` | Debug string. | Returns `<StoreRating(id=..., store_id=..., buyer_id=..., score=...)>` |

---

## File index

| File | Classes / enums |
|------|-----------------|
| `user.py` | `UserRole`, `User` |
| `store.py` | `Store` |
| `product_group.py` | `ProductGroup` |
| `product.py` | `ProductStatus`, `Product` |
| `product_image.py` | `ProductImage` |
| `inquiry.py` | `InquiryStatus`, `Inquiry` |
| `cart.py` | `CartItem` |
| `address.py` | `Address` |
| `order.py` | `OrderStatus`, `Order` |
| `order_item.py` | `OrderItem` |
| `order_status_history.py` | `OrderStatusHistory` |
| `shipment.py` | `Shipment` |
| `store_rating.py` | `StoreRating` |

See also [`System_Summary.md`](System_Summary.md) for orchestration in `app/systems/`, and [`SERVICES_SUMMARY.md`](SERVICES_SUMMARY.md) for architecture.
