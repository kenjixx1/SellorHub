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

---

## Planned (MVP)

Pages implied by MVP scope not yet built in the UI.

### Public / discovery

- Store directory or home browse (all stores / featured).
- Public store page (unique slug / URL), e.g. `/store/:slug`.
- Product listing (per store and/or global catalog) with search and filters.
- Product detail (images, description, link to seller / store).
- Submit inquiry (from product or store, or a dedicated form route).

### Buyer (authenticated)

- Account / profile (improve `/me` from current stub).
- My inquiries — list and detail.

### Seller (authenticated) — future iterations

- Full product CRUD page (list, create, edit, image upload).
- Product groups management page.
- Seller inquiry inbox (full list + reply/status update).
- Store setup / edit page.

### Admin (authenticated, `role === admin`) — future iterations

- Store management / browse.
- Product moderation (hide/unhide).
- User detail page and delete flow.
- Fine-grained admin navigation/sidebar.

---

## Post-MVP (later)

Orders, checkout, shipments, revenue graphs, and related buyer/seller flows (backend has model scaffolding; not MVP UI targets for this list).
