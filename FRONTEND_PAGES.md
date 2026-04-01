# SellorHub — frontend pages

Concise inventory of **routes/screens** for the SPA. Routes live in [`frontend/src/main.tsx`](frontend/src/main.tsx). Visual tokens and UI classes: [`frontend/THEME.md`](frontend/THEME.md). Backend contract: [`backend/API_ENDPOINTS.md`](backend/API_ENDPOINTS.md). Broader backlog: [`CLAUDE.md`](CLAUDE.md) (frontend UI + API integration).

---

## Implemented

| Route | Status | Where / notes |
| ----- | ------ | ------------- |
| `/` | Done | Landing / hero — `HomePage` in [`frontend/src/main.tsx`](frontend/src/main.tsx) |
| `/login` | Done | [`frontend/src/pages/LoginPage.tsx`](frontend/src/pages/LoginPage.tsx) — routes to `/admin`, `/seller`, or `/me` by role |
| `/register` | Done | [`frontend/src/pages/RegisterPage.tsx`](frontend/src/pages/RegisterPage.tsx) |
| `/me` | Stub | Generic account placeholder — `MePage` in [`frontend/src/main.tsx`](frontend/src/main.tsx) (buyers land here) |
| `/seller` | Done (MVP) | [`frontend/src/pages/SellerDashboardPage.tsx`](frontend/src/pages/SellerDashboardPage.tsx) — requires `role === seller`; shows store header, overview stats, recent inquiries, product preview, product groups; handles unapproved and no-store states |
| `/admin` | Done (MVP) | [`frontend/src/pages/AdminPage.tsx`](frontend/src/pages/AdminPage.tsx) — requires `role === admin`; shows platform stats, users list, pending seller approvals |
| `/store-settings` | Done | [`frontend/src/pages/StoreSettingsPage.tsx`](frontend/src/pages/StoreSettingsPage.tsx) — handles both creating a new store and editing an existing store |
| `/products` | Done | [`frontend/src/pages/ManageProductsPage.tsx`](frontend/src/pages/ManageProductsPage.tsx) — lists all products with edit/delete actions |
| `/products/new` | Done | [`frontend/src/pages/CreateProductPage.tsx`](frontend/src/pages/CreateProductPage.tsx) — creates a product and uploads an image by URL or file |
| `/products/:id/edit` | Done | [`frontend/src/pages/EditProductPage.tsx`](frontend/src/pages/EditProductPage.tsx) — edits specific product details |
| `/explore` | Done | [`frontend/src/pages/ExplorePage.tsx`](frontend/src/pages/ExplorePage.tsx) — Public marketplace grid (Mercari-style) with global search. |
| `/products/:id` | Done | [`frontend/src/pages/ProductDetailPage.tsx`](frontend/src/pages/ProductDetailPage.tsx) — Product details, gallery, and inquiry form. |
| `/profile` | Done | [`frontend/src/pages/ProfilePage.tsx`](frontend/src/pages/ProfilePage.tsx) — Edit user profile (username, email, phone). Avatar section: click "Change Avatar" to upload JPEG/PNG/WebP → `POST /api/users/me/avatar`; profile fields saved via `PUT /api/users/me`. Avatar shown in-page and in the navbar `ProfileDropdown` (falls back to initials when unset). |
| `/store/:slug` | Done (MVP) | [`frontend/src/pages/PublicStorePage.tsx`](frontend/src/pages/PublicStorePage.tsx) — Public storefront; store header (logo, name, description, meta), products grouped by category with rectangular cards, ungrouped products shown last; handles loading skeleton, 404, empty store states. |
| `/stores` | Done (MVP) | [`frontend/src/pages/StoresPage.tsx`](frontend/src/pages/StoresPage.tsx) — Public store directory; debounced search, paginated store cards with logo/name/description/product count, loading skeletons, empty state, links to `/store/:slug`. Navbar link next to Explore. |
| `/` (home) | Updated | `HomePage` in [`frontend/src/main.tsx`](frontend/src/main.tsx) — now includes a "Latest Stores" preview section showing the 6 newest stores with a "View all stores" link to `/stores`. |

---

## Need to Update

Existing pages that need changes to support newly implemented backend features.

| Route | File | What needs updating |
| ----- | ---- | ------------------- |
| `/products/new` | [`frontend/src/pages/CreateProductPage.tsx`](frontend/src/pages/CreateProductPage.tsx) | Support uploading up to 5 images after product creation (`POST /api/products/{id}/images`, position 0–4); replace single-image input with a multi-file uploader |
| `/products/:id/edit` | [`frontend/src/pages/EditProductPage.tsx`](frontend/src/pages/EditProductPage.tsx) | Add image management panel: view all current images, upload additional images, delete individual images (`DELETE /api/products/{id}/images/{imgId}`), drag-to-reorder (`PUT /api/products/{id}/images/reorder`) |
| `/products/:id` | [`frontend/src/pages/ProductDetailPage.tsx`](frontend/src/pages/ProductDetailPage.tsx) | Upgrade to full image gallery: thumbnail strip + main viewer using all images from `GET /api/products/{id}`; also add "Add to Cart" button (`POST /api/cart/items`) |
| `/store/:slug` | [`frontend/src/pages/PublicStorePage.tsx`](frontend/src/pages/PublicStorePage.tsx) | Add ratings summary (star average + review count) in store header via `GET /api/ratings/store/{store_id}`; add paginated reviews/comments section at the bottom of the page |

---

## Planned (MVP)

Pages implied by MVP scope not yet built in the UI.

### Buyer (authenticated)

- **`/cart`** — Shopping cart page: list items (product image, name, price, quantity controls), store grouping, remove item, clear cart, total price, proceed to checkout. API: `GET /api/cart`, `PUT /api/cart/items/{id}`, `DELETE /api/cart/items/{id}`, `DELETE /api/cart`.
- **`/checkout`** — Checkout flow: select/add shipping address, review order summary, confirm order. API: `GET /api/addresses`, `POST /api/orders/checkout/cart` or `POST /api/orders/checkout`.
- **`/orders`** — My orders list: paginated list of past and active orders with status badges and links to detail. API: `GET /api/orders/mine`.
- **`/orders/:id`** — Order detail: full order info, items, shipping address, status timeline, and (if delivered) a rate-this-store prompt. API: `GET /api/orders/{id}`, `POST /api/ratings`.
- **`/addresses`** — Shipping address book: list, create, edit, delete, set default. API: `GET /api/addresses`, `POST /api/addresses`, `PUT /api/addresses/{id}`, `DELETE /api/addresses/{id}`.
- My inquiries — list and detail.

### Seller (authenticated) — future iterations

- Product groups management page.
- Seller inquiry inbox (full list + reply/status update).
- **`/seller/orders`** — Seller order inbox: list orders for the store, update order status (packed → shipped → delivered). API: `GET /api/orders/store/list`, `PUT /api/orders/{id}/status`.

### Admin (authenticated, `role === admin`) — future iterations

- Store management / browse.
- Product moderation (hide/unhide).
- User detail page and delete flow.
- Fine-grained admin navigation/sidebar.

### Public / discovery

- Submit inquiry (from product or store, or a dedicated form route).

---

## Post-MVP (later)

Revenue graphs, payment gateway integration, shipment tracking, and advanced seller analytics.
