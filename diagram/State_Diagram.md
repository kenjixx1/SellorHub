# Sellor — State Diagram Specifications

**Project:** Sellor Multi-Store E-Commerce Platform  
**Version:** 1.0  
**Date:** April 17, 2026  
**Notation:** Plain textbook-style state machine (one diagram per object)

**Conventions:**

- **One object per diagram** — each section models the lifecycle of a single aggregate or entity.
- **States** — named conditions the object can be in.
- **Transitions** — `FromState --[event / condition]--> ToState`
- **`[Start]`** — initial pseudo-state (object does not exist yet).
- **`[End]`** — final pseudo-state (object removed from the domain or lifecycle complete).
- **Self-transitions** — same state on both sides when an event occurs but the named state is unchanged (e.g. cart still Active after updating quantity).

**Source:** Derived from [`backend/CLASSES_SUMMARY.md`](../backend/CLASSES_SUMMARY.md) and related models/services.

---

## Overview Table

| ID | Object | Primary model / service | Notes |
|----|--------|-------------------------|-------|
| ST-01 | Order | `Order`, `OrderStatus` | Enum-backed; partial enforcement in `OrderService` (see ST-01 note). |
| ST-02 | Product | `Product`, `ProductStatus` | Enum-backed. |
| ST-03 | Inquiry | `Inquiry`, `InquiryStatus` | Enum-backed. |
| ST-04 | Seller (approval) | `User`, `AdminService` | Conceptual states from `selling_approve` + ban. |
| ST-05 | Cart (session) | `CartService`, `CartItem` | Aggregate “shopping cart” lifecycle (not a single DB row). |
| ST-06 | Store | `Store`, `StoreService`, `AdminService` | Includes planned moderation state (see ST-06 note). |
| ST-07 | Shipment | `Shipment` | Timestamps imply delivery progression. |
| ST-08 | Product image | `ProductImage`, `ProductService` | Thumbnail = position 0 convention. |
| ST-09 | Store rating | `StoreRating`, `RatingService` | Create / update / delete. |
| ST-10 | Address | `Address`, `AddressService` | Default flag toggling. |
| ST-11 | Product group | `ProductGroup`, `ProductGroupService` | Delete uncategorizes products. |
| ST-12 | Buyer (account) | `User`, `AdminService` | Conceptual; separate from seller approval (ST-04). |

---

## ST-01: Order

**Model:** `Order` (`app/models/order.py`)  
**Enum:** `OrderStatus` — `placed`, `paid`, `packing`, `shipped`, `delivered_pending_confirm`, `delivered`, `cancelled`, `refunded`  
**Purpose:** Represents a checkout transaction from placement through fulfilment, cancellation, or refund.

### States

| State | Meaning |
|-------|---------|
| Placed | Order created; awaiting payment / seller action per business rules. |
| Paid | Payment recorded (when payment gateway exists); ready for fulfilment. |
| Packing | Seller is preparing items for shipment. |
| Shipped | Order handed to carrier; in transit. |
| DeliveredPendingConfirm | Arrived; buyer must confirm delivery. |
| Delivered | Buyer confirmed; order complete. |
| Cancelled | Order will not be fulfilled. |
| Refunded | Money returned after delivery (or policy-defined refund path). |

### Initial and final states

- **Initial:** `[Start]` → first real state is **Placed** (on successful checkout / `create_order_*`).
- **Final:** **Cancelled**, **Delivered**, and **Refunded** → `[End]` (order row may remain for history).

### Transitions

```
[Start] --[buyer completes checkout]--> Placed

Placed --[payment confirmed]--> Paid
Placed --[buyer or seller cancels]--> Cancelled

Paid --[seller starts packing]--> Packing
Paid --[seller or admin cancels]--> Cancelled

Packing --[seller ships order]--> Shipped

Shipped --[order arrives / system marks awaiting confirm]--> DeliveredPendingConfirm

DeliveredPendingConfirm --[buyer confirms receipt]--> Delivered

Delivered --[buyer requests refund / policy refund]--> Refunded

Cancelled --> [End]
Delivered --> [End]
Refunded --> [End]
```

### Implementation note (backend)

`OrderService.update_order_status` currently allows a **subset** of transitions by role (`_SELLER_TRANSITIONS`, `_BUYER_TRANSITIONS`): e.g. seller may move **placed** or **paid** → **packing** or **cancelled**; **packing** → **shipped**; buyer may move **shipped** → **delivered**, and **delivered_pending_confirm** → **delivered**. Transitions such as **placed** → **paid** or **shipped** → **delivered_pending_confirm** are part of the **intended** domain model but may be performed outside this helper or in future work. Use this diagram as the **target** lifecycle; align code over time.

---

## ST-02: Product

**Model:** `Product` (`app/models/product.py`)  
**Enum:** `ProductStatus` — `active`, `sold`, `hidden`  
**Purpose:** Listing visibility and sellability for a store’s product.

### States

| State | Meaning |
|-------|---------|
| Active | Visible to buyers (subject to store being visible). |
| Sold | Marked sold / no longer offered. |
| Hidden | Not shown in public catalogue (seller or admin moderation). |

### Initial and final states

- **Initial:** `[Start]` → **Active** (default create) or **Hidden** (seller creates as draft / admin hides on create).
- **Final:** No terminal delete state in this diagram; deletion is a separate “remove from system” operation (optional extension: `Active|Sold|Hidden` --[delete]--> `[End]`).

### Transitions

```
[Start] --[create with status active]--> Active
[Start] --[create as hidden / admin hides on create]--> Hidden

Active --[seller marks sold / stock depleted rule]--> Sold
Active --[seller hides listing / admin hides product]--> Hidden

Sold --[seller relists product]--> Active

Hidden --[seller or admin restores / unhide]--> Active
```

---

## ST-03: Inquiry

**Model:** `Inquiry` (`app/models/inquiry.py`)  
**Enum:** `InquiryStatus` — `new`, `replied`, `closed`  
**Purpose:** Buyer message to seller tied to a product; manual lifecycle in dashboard.

### States

| State | Meaning |
|-------|---------|
| New | Submitted; seller has not marked progress. |
| Replied | Seller indicated they responded (e.g. via email). |
| Closed | Conversation archived / no further action. |

### Initial and final states

- **Initial:** `[Start]` → **New** (public inquiry submit).
- **Final:** **Closed** → `[End]` (record may be retained for audit).

### Transitions

```
[Start] --[buyer submits inquiry]--> New

New --[seller marks as replied]--> Replied
New --[seller closes without reply]--> Closed

Replied --[seller closes inquiry]--> Closed

Closed --> [End]
```

---

## ST-04: Seller — approval & trust

**Model:** `User` with `role = seller` (`app/models/user.py`)  
**Fields / ops:** `selling_approve`; `AdminService.approve_seller`, `ban_user`  
**Purpose:** Gate store creation and selling until admin trusts the seller.

### States

| State | Meaning |
|-------|---------|
| PendingApproval | Registered as seller; `selling_approve` is false; awaiting admin. |
| Approved | Admin approved; seller may create and operate a store. |
| Rejected | Admin rejected application (conceptual; may map to same DB flag as pending — document as process state). |
| Banned | Platform revoked access (moderation). |

### Initial and final states

- **Initial:** `[Start]` → **PendingApproval** (seller registration).
- **Final:** **Banned** → `[End]` (account unusable for selling; buyer side may differ — see ST-12).

### Transitions

```
[Start] --[seller registers as seller]--> PendingApproval

PendingApproval --[admin approveSeller(approve=true)]--> Approved
PendingApproval --[admin approveSeller(approve=false)]--> Rejected

Rejected --[seller reapplies / admin reopens application]--> PendingApproval

Approved --[admin ban_user]--> Banned
Approved --[admin revokes selling approval]--> PendingApproval

Banned --> [End]
```

---

## ST-05: Cart (buyer session aggregate)

**Concept:** Aggregate of `CartItem` rows for one buyer (`CartService`).  
**Purpose:** Model shopping session from empty basket through checkout outcome.

### States

| State | Meaning |
|-------|---------|
| Empty | No line items (or cart cleared). |
| Active | One or more items; buyer may edit quantities. |
| CheckingOut | Checkout flow started; totals locked or payment pending. |
| Ordered | Checkout succeeded; cart cleared and order created. |
| Abandoned | Checkout abandoned (timeout / navigate away without completing). |

### Initial and final states

- **Initial:** `[Start]` → **Empty** (new session / no items).
- **Final:** **Ordered** or **Abandoned** → `[End]` for that checkout attempt; cart returns to **Empty** for the next session.

### Transitions

```
[Start] --[session with no items]--> Empty

Empty --[buyer adds first item]--> Active

Active --[buyer adds / updates / removes item; count > 0]--> Active
Active --[buyer removes all items / clear_cart]--> Empty

Active --[buyer starts checkout]--> CheckingOut

CheckingOut --[payment succeeds; order created; clear_cart]--> Ordered
CheckingOut --[buyer cancels checkout / back to shop]--> Active
CheckingOut --[timeout / abandon checkout]--> Abandoned

Ordered --> [End]
Abandoned --> [End]
```

**Note:** After **Ordered**, the buyer’s cart is logically **Empty** again for subsequent shopping; model that as a new cycle `[Start]` → Empty if needed.

---

## ST-06: Store

**Model:** `Store` (`app/models/store.py`)  
**Related:** `StoreService`, `AdminService.hide_store`  
**Purpose:** Seller storefront lifecycle and moderation visibility.

### States

| State | Meaning |
|-------|---------|
| Created | Store row exists; seller may still be completing profile (conceptual). |
| Active | Publicly listed; `/store/{slug}` works for visitors. |
| Hidden | Moderation: hidden from public listings (requires `is_hidden` or equivalent when implemented). |
| Deleted | Store removed from platform. |

### Initial and final states

- **Initial:** `[Start]` → **Created** on `create_store`, then typically **Active** once live.
- **Final:** **Deleted** → `[End]`.

### Transitions

```
[Start] --[seller creates store]--> Created

Created --[store goes live / first publish]--> Active

Active --[admin hide_store(hide=true)]--> Hidden
Hidden --[admin hide_store(hide=false)]--> Active

Active --[seller or admin deletes store]--> Deleted
Hidden --[admin deletes store]--> Deleted

Deleted --> [End]
```

### Implementation note (backend)

`AdminService.hide_store` documents a future **`is_hidden`** field on `Store`; until persisted, **Hidden** is a **target** moderation state in the model, not necessarily stored.

---

## ST-07: Shipment

**Model:** `Shipment` (`app/models/shipment.py`)  
**Purpose:** Tracking record for a shipped order.

### States

| State | Meaning |
|-------|---------|
| Pending | Shipment entity exists; carrier/tracking may be set; not yet shipped. |
| Shipped | `shipped_at` set; in transit. |
| Delivered | `delivered_at` set; delivery complete. |

### Initial and final states

- **Initial:** `[Start]` → **Pending** when shipment row is created for an order.
- **Final:** **Delivered** → `[End]` (record retained).

### Transitions

```
[Start] --[shipment record created / tracking assigned]--> Pending

Pending --[seller marks shipped; shipped_at set]--> Shipped

Shipped --[delivery confirmed; delivered_at set]--> Delivered

Delivered --> [End]
```

---

## ST-08: Product image

**Model:** `ProductImage` (`app/models/product_image.py`)  
**Related:** `ProductService` upload / reorder / delete  
**Purpose:** Image row lifecycle inside a product’s gallery (max 5 images; position 0 = thumbnail).

### States

| State | Meaning |
|-------|---------|
| Thumbnail | Image at `position = 0` (primary image). |
| Gallery | Image at `position > 0`. |

### Initial and final states

- **Initial:** `[Start]` → **Thumbnail** or **Gallery** on first upload depending on chosen position.
- **Final:** `[End]` on delete.

### Transitions

```
[Start] --[upload with position = 0]--> Thumbnail
[Start] --[upload with position > 0]--> Gallery

Gallery --[reorder to position 0]--> Thumbnail
Thumbnail --[another image becomes position 0; this image moved]--> Gallery

Thumbnail --[delete_product_image]--> [End]
Gallery --[delete_product_image]--> [End]
```

---

## ST-09: Store rating

**Model:** `StoreRating` (`app/models/store_rating.py`)  
**Service:** `RatingService`  
**Purpose:** Buyer’s scored review of a store (optionally linked to completed order).

### States

| State | Meaning |
|-------|---------|
| Submitted | Rating row created with score/comment. |
| Updated | Buyer edited score or comment at least once. |
| Deleted | Rating removed (soft-delete not specified — treat as removed from active set). |

### Initial and final states

- **Initial:** `[Start]` → **Submitted** (`create_rating`, after eligibility checks).
- **Final:** **Deleted** → `[End]`.

### Transitions

```
[Start] --[buyer submits rating]--> Submitted

Submitted --[buyer updates rating]--> Updated
Updated --[buyer updates again]--> Updated

Submitted --[buyer or admin deletes rating]--> Deleted
Updated --[buyer or admin deletes rating]--> Deleted

Deleted --> [End]
```

---

## ST-10: Address

**Model:** `Address` (`app/models/address.py`)  
**Service:** `AddressService` (`is_default`)  
**Purpose:** Saved shipping address lifecycle for a buyer.

### States

| State | Meaning |
|-------|---------|
| Saved | Address exists; not the default. |
| Default | This row is the buyer’s default shipping address. |
| Deleted | Row removed (or logically deleted if implemented). |

### Initial and final states

- **Initial:** `[Start]` → **Saved** or **Default** (first address often becomes default).
- **Final:** **Deleted** → `[End]`.

### Transitions

```
[Start] --[create address; is_default = false]--> Saved
[Start] --[create first address / set as default]--> Default

Saved --[buyer sets as default]--> Default
Default --[buyer sets another address as default]--> Saved

Saved --[buyer deletes address]--> Deleted
Default --[buyer deletes default]--> Deleted

Deleted --> [End]
```

---

## ST-11: Product group (category)

**Model:** `ProductGroup` (`app/models/product_group.py`)  
**Service:** `ProductGroupService.delete_product_group` (uncategorize products)  
**Purpose:** Store-scoped category; products may reference it.

### States

| State | Meaning |
|-------|---------|
| Empty | Category exists; no product has this `group_id`. |
| Populated | At least one product assigned to the category. |
| Deleted | Category row removed; products’ `group_id` set to null. |

### Initial and final states

- **Initial:** `[Start]` → **Empty** on `create_product_group`.
- **Final:** **Deleted** → `[End]`.

### Transitions

```
[Start] --[seller creates category]--> Empty

Empty --[seller assigns product to category]--> Populated
Populated --[all products moved or uncategorized]--> Empty

Empty --[seller deletes empty category]--> Deleted
Populated --[seller deletes category; cascade null on products]--> Deleted

Deleted --> [End]
```

---

## ST-12: Buyer — account (non-seller focus)

**Model:** `User` with `role = buyer` (`app/models/user.py`)  
**Related:** `AdminService.ban_user`  
**Purpose:** Simplified account standing for a buyer (orthogonal to seller approval in ST-04).

### States

| State | Meaning |
|-------|---------|
| Registered | Account created; may not have completed profile. |
| Active | Normal use (browse, cart, orders). |
| Banned | Platform suspended the account. |

### Initial and final states

- **Initial:** `[Start]` → **Registered** on registration with role buyer.
- **Final:** **Banned** → `[End]` for “usable buyer” lifecycle.

### Transitions

```
[Start] --[buyer registers]--> Registered

Registered --[first login / email verified / policy gate]--> Active

Active --[admin ban_user]--> Banned

Banned --> [End]
```

**Note:** Sellers also use `User`; combine with **ST-04** when documenting full user moderation. Admins are out of scope for this lifecycle unless extended.

---

## Summary

| ID | Object | Initial | Terminal / final states |
|----|--------|---------|-------------------------|
| ST-01 | Order | Placed | Cancelled, Delivered, Refunded |
| ST-02 | Product | Active or Hidden | (optional delete → End) |
| ST-03 | Inquiry | New | Closed |
| ST-04 | Seller | PendingApproval | Banned |
| ST-05 | Cart | Empty | Ordered, Abandoned |
| ST-06 | Store | Created | Deleted |
| ST-07 | Shipment | Pending | Delivered |
| ST-08 | Product image | Thumbnail or Gallery | End on delete |
| ST-09 | Store rating | Submitted | Deleted |
| ST-10 | Address | Saved or Default | Deleted |
| ST-11 | Product group | Empty | Deleted |
| ST-12 | Buyer | Registered | Banned |

---

*End of Document*
