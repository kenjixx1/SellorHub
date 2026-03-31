# SellorHub — frontend pages

Concise inventory of **routes/screens** for the SPA. Routes live in [`frontend/src/main.tsx`](frontend/src/main.tsx). Visual tokens and UI classes: [`frontend/THEME.md`](frontend/THEME.md). Backend contract: [`backend/API_ENDPOINTS.md`](backend/API_ENDPOINTS.md). Broader backlog: [`CLAUDE.md`](CLAUDE.md) (frontend UI + API integration).

---

## Implemented

| Route | Status | Where / notes |
| ----- | ------ | ------------- |
| `/` | Done | Landing / hero — `HomePage` in [`frontend/src/main.tsx`](frontend/src/main.tsx) |
| `/login` | Done | [`frontend/src/pages/LoginPage.tsx`](frontend/src/pages/LoginPage.tsx) — redirects to `/admin` if `role === admin`, else `/me` |
| `/register` | Done | [`frontend/src/pages/RegisterPage.tsx`](frontend/src/pages/RegisterPage.tsx) |
| `/me` | Stub | "Dashboard" placeholder + raw user JSON — `MePage` in [`frontend/src/main.tsx`](frontend/src/main.tsx) (not under `pages/` yet) |
| `/admin` | Done (MVP) | [`frontend/src/pages/AdminPage.tsx`](frontend/src/pages/AdminPage.tsx) — requires `role === admin`; shows platform stats, users list, pending seller approvals |

---

## Planned (MVP)

Pages implied by MVP scope (stores, catalog, inquiries, seller tools). Not built in the UI yet unless noted above.

### Public / discovery

- Store directory or home browse (all stores / featured).
- Public store page (unique slug / URL), e.g. `/store/:slug`.
- Product listing (per store and/or global catalog) with search and filters.
- Product detail (images, description, link to seller / store).
- Submit inquiry (from product or store, or a dedicated form route).

### Buyer (authenticated)

- Account / profile (may replace or refine `/me`).
- My inquiries — list and detail.

### Seller (authenticated)

- Seller dashboard (overview; may evolve from `/me` when `role` is seller).
- Store setup / edit (name, slug, description; show approval state if applicable).
- Product CRUD — list, create, edit + image upload UX.
- Product groups / categories management.
- Seller inquiry inbox — list, update status.

### Admin (authenticated, `role === admin`) — future iterations

- Store management / browse.
- Product moderation (hide/unhide).
- User detail page and delete flow.
- Fine-grained admin navigation/sidebar.

---

## Post-MVP (later)

Orders, checkout, shipments, and related buyer/seller flows (backend may have placeholders; not MVP UI targets for this list).
