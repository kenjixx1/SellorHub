---
name: Additional frontend models
overview: Extend [frontend/src/lib/models/](frontend/src/lib/models/) with domain classes for Order, Cart/CartItem, Address, Inquiry, ProductGroup, and Rating, mirroring DTOs in [frontend/src/lib/types.ts](frontend/src/lib/types.ts), plus optional adoption in pages and a short doc update.
todos:
  - id: add-model-files
    content: Create Order, Cart, CartItem, Address, Inquiry, ProductGroup, Rating (+ optional OrderLineItem) under frontend/src/lib/models/ with fromDto and pure helpers
    status: complete
  - id: optional-index
    content: Add models/index.ts barrel re-exports
    status: complete
  - id: optional-pages
    content: Optionally wrap DTOs in Cart, Checkout, Orders, Profile, SellerDashboard pages
    status: pending
  - id: doc-update
    content: Document model list in CLAUDE.md or plan.md
    status: pending
isProject: false
---

# Additional domain model classes (`frontend/src/lib/models/`)

Handoff for implementing **extra OOP model classes** beyond the existing [`Product`](frontend/src/lib/models/Product.ts), [`Store`](frontend/src/lib/models/Store.ts), and [`User`](frontend/src/lib/models/User.ts). Keep **DTO interfaces in** [`types.ts`](frontend/src/lib/types.ts); models are **wrappers** with `constructor(dto)` + `static fromDto(dto)` + small domain helpers.

## Design rules (same as existing models)

- **No imports from `services/`** inside `models/` (avoids circular deps). Instance methods should be **pure** (formatting, predicates, derived values).
- **Services keep returning DTOs**; UI or a thin adapter can call `Order.fromDto(res)` when you want entity instances.
- Match field nullability to DTOs (`?? null` for optional strings/numbers where appropriate).

## Classes to add (one file each)

| File | Source DTO(s) in [`types.ts`](frontend/src/lib/types.ts) | Suggested helpers (examples) |
|------|----------------------------------------------------------|-----------------------------|
| `Order.ts` | `OrderResponse`, nested `OrderItemResponse[]`, optional `AddressResponse` | `lineItemsCount()`, `formattedTotal()`, `statusLabel()` |
| `OrderLineItem.ts` (optional) | `OrderItemResponse` | `lineTotal()` = `unit_price_snapshot * quantity` — *or* implement as methods on `Order` only to avoid extra file |
| `Cart.ts` | `CartResponse` | `itemCount` from `total_items`, `formattedTotal()` from `total_price` |
| `CartItem.ts` | `CartItem` | `lineTotal()` using embedded `product.price` (parse), `title()` from `product.title` |
| `Address.ts` | `AddressResponse` | `fullAddress()` / `oneLine()` for display; `isDefault()` |
| `Inquiry.ts` | `Inquiry`, nested `InquiryProductInfo` | `isNew()`, `isClosed()` from `InquiryStatus` |
| `ProductGroup.ts` | `ProductGroup` | display `name`, `product_count` accessor |
| `Rating.ts` | `RatingResponse` | `hasComment()`, `shortComment(maxLen)`; optional star display helper |

**Skip (keep as types only):** `InquiryStats`, filter types, `StoreSummaryRating` (aggregate of many ratings — could add `StoreRatingSummary` later if needed), `DirectCheckoutItem` unless checkout UI benefits.

## Optional barrel

Add [`frontend/src/lib/models/index.ts`](frontend/src/lib/models/index.ts) re-exporting all models for cleaner imports:

`import { Order, Cart, Address } from '../lib/models'`

## Adoption strategy (minimize churn)

- **Phase 1:** Add classes + `fromDto`; no page changes required.
- **Phase 2 (optional):** In high-value pages ([`CartPage.tsx`](frontend/src/pages/CartPage.tsx), [`CheckoutPage.tsx`](frontend/src/pages/CheckoutPage.tsx), [`OrdersPage.tsx`](frontend/src/pages/OrdersPage.tsx), [`SellerDashboardPage.tsx`](frontend/src/pages/SellerDashboardPage.tsx) inquiries, [`ProfilePage.tsx`](frontend/src/pages/ProfilePage.tsx) addresses), wrap DTOs once after `*Service` calls, e.g. `setOrders(data.map(Order.fromDto))` — only where it simplifies rendering.

Today only [`AuthContext.tsx`](frontend/src/auth/AuthContext.tsx) imports a model ([`User`](frontend/src/lib/models/User.ts)); widespread migration is optional.

## Documentation

Append a short subsection to [CLAUDE.md](CLAUDE.md) (or [plan.md](plan.md) if used as living doc): list all model classes and that they wrap `types.ts` DTOs.

## Verification

- Run `npm run build` in `frontend/`.
- Smoke-test cart, checkout, orders list, profile addresses, seller dashboard inquiry list.

## Note on `plan.md`

To keep a **single root** [plan.md](plan.md), copy this section under a new heading (e.g. “Part 2 — Additional domain models”) after implementation planning, or replace the old handoff if the original lib refactor is already done.
