# Frontend `src/lib` refactor: classes + domain models

Handoff spec: refactor [frontend/src/lib/](frontend/src/lib/) from **free functions + types** into **service classes** and **domain model classes** (`Product`, `Store`, `User`, …) aligned in naming with backend entities. Update all consumers.

---

## Goals

1. Replace per-module async functions with **exported service classes** and **singleton instances** (e.g. `export class AuthService { ... }` + `export const authService = new AuthService()`).
2. Add **entity-style classes** for main domains (at minimum `Product`, `Store`, `User`) with `fromDto` factories, getters/helpers, and optional instance methods that delegate to services (see circular-import rule below).
3. Optionally wrap the HTTP helpers in [frontend/src/lib/api.ts](frontend/src/lib/api.ts) as an `ApiClient` class; keep `ApiError`, `API_BASE_URL`, and `apiUpload` for multipart.
4. Consolidate ad-hoc `apiFetch` usage in pages into services.
5. Update project docs (e.g. [CLAUDE.md](CLAUDE.md) frontend section) to describe the new layout.

---

## Current layout (reference)

| File | Contents |
|------|----------|
| [api.ts](frontend/src/lib/api.ts) | `apiFetch`, `apiUpload`, `ApiError`, `API_BASE_URL` |
| [types.ts](frontend/src/lib/types.ts) | Shared DTOs: cart, order, address, checkout, etc. |
| [auth.ts](frontend/src/lib/auth.ts) | `User`, `login`, `register`, `me` |
| [stores.ts](frontend/src/lib/stores.ts) | `StoreProfile`, store list, public profile/groups/products, create/update store |
| [marketplace.ts](frontend/src/lib/marketplace.ts) | `getPublicProducts`, `getProduct`, `PublicProduct` |
| [seller.ts](frontend/src/lib/seller.ts) | Seller dashboard, inquiries types, `SellerProduct`, product CRUD, image upload, groups |
| [cart.ts](frontend/src/lib/cart.ts) | Cart CRUD |
| [orders.ts](frontend/src/lib/orders.ts) | Checkout, list orders, update status |
| [ratings.ts](frontend/src/lib/ratings.ts) | Store ratings, create/update/delete rating |
| [admin.ts](frontend/src/lib/admin.ts) | Admin stats, users, approvals |
| [addresses.ts](frontend/src/lib/addresses.ts) | `getAddresses`, `getAddress` only |

---

## Consumers to update

Grep imports from `../lib/` or `./lib/` in:

- [frontend/src/pages/](frontend/src/pages/) (all pages that import lib)
- [frontend/src/auth/AuthContext.tsx](frontend/src/auth/AuthContext.tsx)
- [frontend/src/main.tsx](frontend/src/main.tsx)

---

## Gaps to close (while refactoring)

1. **[ProfilePage.tsx](frontend/src/pages/ProfilePage.tsx)** uses raw `apiFetch` / `apiUpload` for:
   - `/api/addresses` (list, create, update, delete, set default)
   - `/api/users/me` (PATCH profile)
   - `/api/users/me/avatar` (upload)
   Move these into **`AddressService`** (extend [addresses.ts](frontend/src/lib/addresses.ts)) and **`UserService`** (new).

2. **[ProductDetailPage.tsx](frontend/src/pages/ProductDetailPage.tsx)** posts to `/api/inquiries` via raw `apiFetch`. Move to **`InquiryService.create(...)`** (new).

3. **[seller.ts `uploadProductImage`](frontend/src/lib/seller.ts)** sends `FormData` through `apiFetch`. Use **`apiUpload`** from [api.ts](frontend/src/lib/api.ts) in the new product service.

4. **[orders.ts](frontend/src/lib/orders.ts)** mixes `{ token }` style with manual `Authorization` headers. Prefer consistent `apiFetch(..., { token })` when rewriting `OrderService`.

---

## Target architecture

### HTTP layer

- Either keep `apiFetch`/`apiUpload` as functions or wrap them in `ApiClient` with a singleton `apiClient`.
- Pages should not call `fetch` directly for API routes covered by services.

### Service classes (singletons)

Suggested mapping:

| Service | Responsibility |
|---------|------------------|
| `AuthService` | `login`, `register`, `me` |
| `StoreService` | `listStores`, `getStoreProfile`, `getStoreGroups`, `getStoreProducts`, `createStore`, `updateStore` |
| `ProductService` | **Merge** [marketplace.ts](frontend/src/lib/marketplace.ts) + product endpoints from [seller.ts](frontend/src/lib/seller.ts): public list/detail, seller list/create/update/delete, `uploadProductImage` via `apiUpload` |
| `SellerService` | `getSellerDashboard`, `getMyProductGroups` (or split `ProductGroupService` if preferred) |
| `CartService` | Same as current [cart.ts](frontend/src/lib/cart.ts) |
| `OrderService` | Same as current [orders.ts](frontend/src/lib/orders.ts) |
| `RatingService` | Same as current [ratings.ts](frontend/src/lib/ratings.ts) |
| `AdminService` | Same as current [admin.ts](frontend/src/lib/admin.ts) |
| `AddressService` | Current reads + full CRUD/default used by ProfilePage |
| `UserService` | Profile update + avatar upload |
| `InquiryService` | Buyer inquiry submission |

Export pattern:

```ts
export class AuthService { /* ... */ }
export const authService = new AuthService()
```

### Domain model classes

- **`Product`**: built from `SellerProduct` / `PublicProduct` JSON; helpers (e.g. primary image, formatted price).
- **`Store`**: wrap `StoreProfile`.
- **`User`**: wrap auth `User` DTO (optional).

**Circular import rule:** Service methods should return **plain DTOs** (or primitives). **`Product` / `Store` / `User` may import and call service singletons** for instance methods (e.g. `uploadImage`). **Do not** have services import entity classes if that creates a cycle; instead callers can do `Product.fromDto(await productService.getById(id))`.

### Types

- Keep [types.ts](frontend/src/lib/types.ts) for cross-cutting shapes (`CartResponse`, `OrderResponse`, etc.) or move carefully without breaking imports.
- Preserve existing exported type names where possible (`SellerProduct`, `StoreProfile`, …) via re-exports to reduce page churn.

### File layout (pick one strategy)

**A — Subfolders (recommended)**

```
frontend/src/lib/
  api.ts                 # ApiClient + ApiError + API_BASE_URL + apiUpload
  types.ts
  services/
    authService.ts
    storeService.ts
    productService.ts
    sellerService.ts
    cartService.ts
    orderService.ts
    ratingService.ts
    adminService.ts
    addressService.ts
    userService.ts
    inquiryService.ts
  models/
    Product.ts
    Store.ts
    User.ts
```

**B — Barrel re-exports**

Keep old filenames (`stores.ts`, `auth.ts`, …) as thin files that re-export from `services/*` so fewer import path changes in pages.

---

## Migration checklist

1. Implement services + models; wire `ProductService` merge and `apiUpload` for images.
2. Replace every page import: `getStoreProfile` → `storeService.getProfile` (or whatever naming you choose—stay consistent).
3. Refactor ProfilePage and ProductDetailPage to use services only.
4. Run `npm run build` (or `pnpm`/`yarn` as used) in `frontend/` and fix TypeScript errors.
5. Smoke-test: login/register, explore, product detail (inquiry + cart), checkout, addresses/profile, seller dashboard, admin.
6. Update [CLAUDE.md](CLAUDE.md) (or README) to document `services/` + `models/`.

---

## Non-goals

- Do not mirror SQLAlchemy relationships on the client; models are **DTOs + helpers**.
- No backend changes required for this refactor unless you discover API mismatches.
