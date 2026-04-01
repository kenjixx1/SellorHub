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
| `/profile` | Done | [`frontend/src/pages/ProfilePage.tsx`](frontend/src/pages/ProfilePage.tsx) — Edit user profile information. |
| `/store/:slug` | Done (MVP) | [`frontend/src/pages/PublicStorePage.tsx`](frontend/src/pages/PublicStorePage.tsx) — Public storefront; store header (logo, name, description, meta), products grouped by category with rectangular cards, ungrouped products shown last; handles loading skeleton, 404, empty store states. |
| `/stores` | Done (MVP) | [`frontend/src/pages/StoresPage.tsx`](frontend/src/pages/StoresPage.tsx) — Public store directory; debounced search, paginated store cards with logo/name/description/product count, loading skeletons, empty state, links to `/store/:slug`. Navbar link next to Explore. |
| `/` (home) | Updated | `HomePage` in [`frontend/src/main.tsx`](frontend/src/main.tsx) — now includes a "Latest Stores" preview section showing the 6 newest stores with a "View all stores" link to `/stores`. |




---

## Planned (MVP)

Pages implied by MVP scope not yet built in the UI.

### Public / discovery

- Product listing (per store and/or global catalog) with search and filters.
- Product detail (images, description, link to seller / store).
- Submit inquiry (from product or store, or a dedicated form route).

### Buyer (authenticated)

- My inquiries — list and detail.

### Seller (authenticated) — future iterations

- Product groups management page.
- Seller inquiry inbox (full list + reply/status update).

### Admin (authenticated, `role === admin`) — future iterations

- Store management / browse.
- Product moderation (hide/unhide).
- User detail page and delete flow.
- Fine-grained admin navigation/sidebar.

---

## Post-MVP (later)

Orders, checkout, shipments, revenue graphs, and related buyer/seller flows (backend has model scaffolding; not MVP UI targets for this list).
