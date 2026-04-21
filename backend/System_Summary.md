# System layer summary (`app/systems/`)

This document lists every **`*System`** class, its methods, what each method is for, and a one-line note on how it works. All systems take a SQLAlchemy `Session` in `__init__(self, db)` and use it for queries and commits unless noted.

---

## AuthSystem (`auth_system.py`)

| Method | What it does | How it works (one line) |
|--------|----------------|-------------------------|
| `register_user(user_data)` | Creates a new account after uniqueness checks. | Rejects duplicate username/email, hashes password, sets `selling_approve` for sellers, saves user. |
| `login_user(login_data)` | Returns a JWT and user payload for valid credentials. | Looks up by email, verifies password, builds token with expiry from settings. |
| `get_user_by_email(email)` | Finds a user by email or returns `None`. | Simple `User.email` filter query. |
| `get_user_by_id(user_id)` | Finds a user by id or returns `None`. | Simple `User.id` filter query. |

---

## UserSystem (`user_system.py`)

| Method | What it does | How it works (one line) |
|--------|----------------|-------------------------|
| `get_user_by_id(user_id)` | Loads one user by id or `None`. | Query `User` by primary key. |
| `get_all_users(role, skip, limit)` | Paginated users, optional role filter. | Filters by `User.role` when provided, orders newest first, pages results. |
| `search_users(search_query, skip, limit)` | Search users by username/email. | Uses case-insensitive `ilike` on username or email, then paginates. |
| `get_pending_sellers(skip, limit)` | Lists unapproved seller accounts. | Filters `SELLER` users with `selling_approve = false`, oldest first. |
| `approve_seller(user_id, approve)` | Grants or revokes seller approval. | Loads user, verifies seller role, updates `selling_approve`, commits. |
| `update_user_profile(user_id, update_data)` | Updates profile fields with uniqueness checks. | Loads user, rejects taken username/email, applies fields, commits. |
| `delete_user(user_id)` | Deletes the user row. | Loads user or 404, deletes, commits. |
| `list_addresses(user_id)` | Lists saved shipping addresses for a user. | Orders default address first, then newest first. |
| `get_address(address_id, user_id)` | Loads one owned address. | Filters by address id + `user_id` or 404. |
| `create_address(user_id, data)` | Adds a shipping address. | Clears other defaults when needed, inserts `Address`, commits. |
| `update_address(address_id, user_id, data)` | Partially updates an address. | Loads address, clears old default when needed, patches provided fields, commits. |
| `delete_address(address_id, user_id)` | Deletes an owned address. | Loads via `get_address`, deletes, commits. |
| `_clear_defaults(user_id)` | Internal: unsets existing default addresses. | Bulk-updates matching `Address` rows before saving a new default. |

---

## StoreSystem (`store_system.py`)

| Method | What it does | How it works (one line) |
|--------|----------------|-------------------------|
| `create_store(store_data, owner_id)` | Creates a store for a seller. | Rejects duplicate slug and second store per owner, inserts `Store`, commits. |
| `get_store_by_id(store_id)` | Loads store by id or `None`. | Query `Store.id`. |
| `get_store_by_slug(slug)` | Loads store by public slug or `None`. | Query `Store.slug`. |
| `is_slug_taken(slug)` | Returns whether a slug already exists. | Returns true if any row has that `slug`. |
| `get_store_by_owner_id(owner_id)` | Gets the seller’s store (one per owner) or `None`. | Query `Store.owner_id`. |
| `get_all_stores(skip, limit)` | Paginated list of all stores + total count. | Count all, then `offset`/`limit`. |
| `get_store_with_product_count(store_id)` | Store row plus active product count, or `None`. | Loads store, counts `Product` with `ACTIVE` for that `store_id`. |
| `update_store(store_id, update_data)` | Updates name/description/logo (not slug). | Loads store or 404, calls `store.update_profile(...)`, commits. |
| `delete_store(store_id)` | Deletes a store. | Loads or 404, deletes row, commits. |
| `search_stores(query, skip, limit)` | Text search on name/description with pagination. | `ilike` on name OR description, count, then page results. |

---

## ProductSystem (`product_system.py`)

| Method | What it does | How it works (one line) |
|--------|----------------|-------------------------|
| `_get_store_group(group_id, store_id)` | Internal: validates a product group belongs to the store. | Loads `ProductGroup` and rejects cross-store assignment. |
| `create_product_group(group_data, store_id)` | Adds a category (group) to a store. | Rejects duplicate name in same store, inserts `ProductGroup`, commits. |
| `get_product_group_by_id(group_id)` | Loads one group or `None`. | Query `ProductGroup.id`. |
| `get_store_product_groups(store_id)` | Lists all groups for a store, sorted by name. | Filter by `store_id`, order by `name`. |
| `get_store_product_groups_with_counts(store_id)` | Lists groups plus product counts. | Aggregates `COUNT(Product.id)` with `ProductGroup` in one grouped query. |
| `update_product_group(group_id, name, store_id)` | Renames a group if allowed. | Loads group, checks `belongs_to_store`, rejects duplicate name, commits. |
| `delete_product_group(group_id, store_id)` | Deletes a group. | Loads group, checks `belongs_to_store`, deletes, commits. |
| `create_product(product_data, store_id)` | Creates a product row for a store. | Validates `group_id` belongs to the same store, then inserts and commits. |
| `get_product_by_id(product_id, include_hidden)` | Loads product; optionally hides hidden from buyers. | Query by id; unless `include_hidden`, filters out `HIDDEN`. |
| `get_store_products(store_id, skip, limit, group_id, status, include_hidden)` | Paginated products for one store with optional filters. | Builds filter (store, optional group/status, hidden rule), count, order by `created_at` desc, page. |
| `get_all_products(skip, limit, status)` | Paginated admin listing of all products. | Optional status filter, newest first, returns rows + total count. |
| `search_products(...)` | Marketplace-style product search with filters and sort. | Applies status, text on title/description, price range, group/store ids, sort mode, count, page. |
| `update_product(product_id, update_data, store_id)` | Updates fields if product belongs to `store_id`. | Loads with hidden allowed, checks `store_id`, validates new `group_id`, patches fields, commits. |
| `delete_product(product_id, store_id)` | Deletes product if owned by store. | Same ownership check, delete row, commits. |
| `hide_product(product_id)` | Hides a product for admin moderation. | Loads product with hidden allowed, calls `product.hide()`, commits. |
| `unhide_product(product_id)` | Restores a hidden product to active. | Loads product with hidden allowed, calls `product.activate()`, commits. |
| `add_product_image(image_data)` | Adds an image at a slot for a product. | Rejects duplicate position and more than 5 images, inserts `ProductImage`, commits. |
| `delete_product_image(image_id, store_id)` | Deletes one image if its product belongs to store. | Loads image, loads product, checks `store_id`, deletes image, commits. |
| `reorder_product_images(product_id, image_positions, store_id)` | Sets new positions for images. | Verifies product belongs to store, updates each image’s `position` from dict, commits, returns ordered list. |

---

## InquirySystem (`inquiry_system.py`)

| Method | What it does | How it works (one line) |
|--------|----------------|-------------------------|
| `create_inquiry(inquiry_data)` | Buyer/guest submits inquiry for a product. | Loads product for `store_id`, creates `Inquiry` with `NEW`, commits. |
| `get_inquiry_by_id(inquiry_id)` | Loads one inquiry or `None`. | Query `Inquiry.id`. |
| `get_store_inquiries(store_id, status, skip, limit)` | Paginated inquiries for a store, optional status filter. | Filter store (and status if set), count, order by `created_at` desc, page. |
| `get_product_inquiries(product_id, skip, limit)` | Paginated inquiries for one product. | Filter `product_id`, count, order desc, page. |
| `update_inquiry_status(inquiry_id, update_data, store_id)` | Seller updates status (e.g. replied). | Loads inquiry, `belongs_to_store`, `inquiry.update_status(...)`, commits. |
| `delete_inquiry(inquiry_id, store_id)` | Deletes inquiry if it belongs to store. | Same ownership check, delete, commits. |
| `get_inquiry_statistics(store_id)` | Counts per status + total for dashboard. | `GROUP BY` status for store, fills dict `new`/`replied`/`closed`/`total`. |

---

## CartSystem (`cart_system.py`)

| Method | What it does | How it works (one line) |
|--------|----------------|-------------------------|
| `_load_purchasable_product(product_id, quantity)` | Internal: load product and enforce buy rules. | Query product or 404, `assert_purchasable` or map error to 400. |
| `_cart_query(user_id)` | Internal: base query for user’s cart lines with product eager load. | `CartItem` filtered by `user_id` with `joinedload(product)`. |
| `get_cart(user_id)` | Returns cart JSON: items, total_items, total_amount. | Loads all lines, sums quantities and `CartItem.subtotal()`, maps via `_to_response`. |
| `add_item(user_id, product_id, quantity)` | Adds qty or merges with existing line. | Validates product/qty, merges or new `CartItem`, commits, returns `get_cart`. |
| `update_item(user_id, item_id, quantity)` | Sets line quantity. | Finds line, validates stock via product, `set_quantity`, commits, `get_cart`. |
| `remove_item(user_id, item_id)` | Removes one cart line. | Finds line or 404, delete, commits, `get_cart`. |
| `clear_cart(user_id)` | Removes all lines for user. | Bulk delete `CartItem` for user, commits, empty totals. |
| `_to_response(item)` | Internal: dict for one cart line + product snapshot. | Picks first image URL, builds nested product dict. |

---

## OrderSystem (`order_system.py`)

| Method | What it does | How it works (one line) |
|--------|----------------|-------------------------|
| `create_order_from_cart(buyer_id, store_id, shipping_address_id)` | Checkout: order from cart for one store. | Validates address + store + non-empty cart for that store, `_build_order_items` from cart, creates order + history, deletes cart lines, commits. |
| `create_order_direct(buyer_id, data)` | Checkout: order from explicit item list (`OrderCreate`). | Validates address + store, `_build_order_items` from tuples, order + history, commits (no cart delete). |
| `get_order(order_id)` | Order with items loaded. | Query with `joinedload(Order.items)`. |
| `list_buyer_orders(buyer_id, skip, limit)` | Buyer’s orders, newest first, with total count. | Filter `buyer_id`, count, page with items eager-loaded. |
| `list_store_orders(store_id, skip, limit, status_filter)` | Store’s orders, optional status, with total. | Filter store (+ status if set), count, page with items. |
| `update_order_status(order_id, new_status, changed_by_user_id, note, is_seller, is_buyer)` | Legal status change + history row. | Loads order, `apply_transition` (domain rules) or 400, append `OrderStatusHistory`, commit. |
| `_build_order_items(cart_items_or_specs, explicit_specs)` | Internal: build `OrderItem` rows, total, decrement stock. | From cart lines or (product_id, qty, store): `assert_purchasable`, snapshots, `reserve_stock`, returns list + `Decimal` total. |

---

## RatingSystem (`rating_system.py`)

| Method | What it does | How it works (one line) |
|--------|----------------|-------------------------|
| `_require_completed_order(buyer_id, store_id)` | Internal: ensures buyer has a delivered order at store. | Query `Order` with `DELIVERED` or 403. |
| `create_rating(buyer_id, data)` | First rating for buyer+store after delivered order. | Store exists, completed order check, no duplicate rating, insert `StoreRating`, commit. |
| `update_rating(rating_id, buyer_id, data)` | Updates score/comment on own rating. | Loads rating by id + buyer, patch fields, commit. |
| `delete_rating(rating_id, buyer_id)` | Deletes own rating. | Loads or 404, delete, commit. |
| `get_store_ratings(store_id, skip, limit)` | Paginated ratings + average + total count. | Count + page ratings with buyer, `avg(score)` for store, return dict. |

---

## AdminSystem (`admin_system.py`)

| Method | What it does | How it works (one line) |
|--------|----------------|-------------------------|
| `get_all_users(role, skip, limit)` | Admin user listing. | Delegates to `UserSystem.get_all_users(...)`. |
| `get_pending_sellers(skip, limit)` | Admin pending-seller queue. | Delegates to `UserSystem.get_pending_sellers(...)`. |
| `get_user_by_id(user_id)` | Loads one user for admin detail view. | Delegates to `UserSystem.get_user_by_id(...)`. |
| `approve_seller(user_id, approve)` | Approves/rejects a seller account. | Delegates to `UserSystem.approve_seller(...)`. |
| `search_users(search_query, skip, limit)` | Search users by username/email. | Delegates to `UserSystem.search_users(...)`. |
| `delete_user(user_id)` | Deletes a user account. | Delegates to `UserSystem.delete_user(...)`. |
| `get_all_stores(skip, limit)` | Paginated admin store listing. | Delegates to `StoreSystem.get_all_stores(...)`. |
| `search_stores(search_query, skip, limit)` | Search stores for admin listings. | Delegates to `StoreSystem.search_stores(...)`. |
| `get_all_products(skip, limit, status)` | Paginated admin product listing. | Delegates to `ProductSystem.get_all_products(...)`. |
| `hide_product(product_id)` | Hides a product for moderation. | Delegates to `ProductSystem.hide_product(...)`. |
| `unhide_product(product_id)` | Restores a hidden product. | Delegates to `ProductSystem.unhide_product(...)`. |
| `get_platform_statistics()` | Dashboard counts: users, stores, products, inquiries. | Multiple `count()` queries + inquiries created today. |

---

## File index

| File | Class |
|------|--------|
| `auth_system.py` | `AuthSystem` |
| `user_system.py` | `UserSystem` |
| `store_system.py` | `StoreSystem` |
| `product_system.py` | `ProductSystem` |
| `inquiry_system.py` | `InquirySystem` |
| `cart_system.py` | `CartSystem` |
| `order_system.py` | `OrderSystem` |
| `rating_system.py` | `RatingSystem` |
| `admin_system.py` | `AdminSystem` |

See also [`SERVICES_SUMMARY.md`](SERVICES_SUMMARY.md) for architecture and responsibility split, and [`Model_Summary.md`](Model_Summary.md) for entity classes and domain methods in `app/models/`.
