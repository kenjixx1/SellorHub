# Sellor — Sequence Diagram Specifications

**Project:** Sellor Multi-Store E-Commerce Platform  
**Version:** 4.1 (entry revised)  
**Date:** April 18, 2026  
**Notation:** Boundary-Control-Entity (BCE) with Combined Fragments (alt)

**Conventions:**

- `/name : Class` — accessing an **existing** entity instance (e.g., `/current : User`, `/selected : Store`)
- `/new : Class` — creating a **new** entity instance (e.g., `/new : Store`)
- Entity retrieval: service sends a direct `load(id)` message to the entity participant; entity returns its data
- Entity persistence: service sends `save()` or `delete()` directly to the entity participant
- Control objects self-loop for **business logic validation and existence/uniqueness checks**
- `alt` — used for both **alternative cases** (two valid condition-based flows) and **exceptional cases** (one normal path, one path where the system cannot proceed)
- Main success scenarios assume the listed **boundary object is already active on screen**; the first message is the first system interaction (UI → control or control → entity), not navigation to the page.

---

## Object Inventory

### Boundary Objects

| Object | Used In |
|--------|---------|
| CreateStoreUI | SD-04 |
| CreateProductUI | SD-07 |
| EditProductUI | SD-09 |
| HomepageUI | SD-10 |
| StorePageUI | SD-10 |
| CheckoutUI | SD-11 |
| ProductDetailUI | SD-12 |
| InquiryFormUI | SD-12 |
| InquiryListUI | SD-13 |
| InquiryDetailUI | SD-13 |
| AdminSellerUI | SD-14 |
| OrderDetailUI | SD-15 |

### Control Objects

| Object | Used In |
|--------|---------|
| StoreService | SD-04, SD-10 |
| ProductService | SD-07, SD-09, SD-10, SD-12 |
| InquiryService | SD-12, SD-13 |
| EmailService | SD-12, SD-14 |
| AdminService | SD-14 |
| OrderService | SD-11, SD-15 |

### Entity Objects

| Object | Used In |
|--------|---------|
| /current : User | SD-04 |
| /selected : User | SD-14 |
| /new : Store | SD-04 |
| /current : Store | SD-07, SD-13 |
| /selected : Store | SD-10, SD-12 |
| /new : Product | SD-07 |
| /selected : Product | SD-09, SD-12 |
| /selected : ProductGroup | SD-07 |
| /new : Inquiry | SD-12 |
| /selected : Inquiry | SD-13 |
| /selected : Address | SD-11 |
| /new : Order | SD-11 |
| /selected : Order | SD-15 |

---

## SD-04: Create Store

**Use Case:** Create Store

**Why Unique to Sellor:** Store creation is gated behind admin approval check + one-store-per-seller constraint + slug uniqueness.

**Participating Objects:**

- `<<boundary>>` CreateStoreUI
- `<<control>>` StoreService
- `<<entity>>` /current : User
- `<<entity>>` /new : Store

**Preconditions:**

- Seller is authenticated with valid JWT
- Seller has role = "seller"

**Postconditions (Success):**

- New Store record exists linked to seller's userId
- Store is publicly accessible at /store/{slug}

### Main Success Scenario

1. Seller -> CreateStoreUI : fillForm(name, slug, description, logo_url)
2. CreateStoreUI -> StoreService : createStore(storeData)
3. StoreService -> /current : User : load(userId)
4. /current : User -> StoreService : return userData
5. StoreService -> /current : User : getApprovalStatus()
6. /current : User -> StoreService : return approved = true
7. StoreService -> StoreService : validateSlugFormat(slug)
8. StoreService -> StoreService : checkSlugAvailable(slug), return true
9. StoreService -> StoreService : checkSellerHasNoStore(userId), return true
10. StoreService -> /new : Store : new Store(name, slug, description, logo_url, userId)
11. /new : Store -> StoreService : return storeData
12. StoreService -> /new : Store : save()
13. /new : Store -> StoreService : return saved
14. StoreService -> CreateStoreUI : return 201 + storeData
15. CreateStoreUI -> Seller : display "Store created" + redirect to dashboard

### alt — Description provided or not (after step 1, sequence continues either way)

**[description provided]:**

1. Steps 2–15 proceed normally with description included
2. CreateStoreUI -> Seller : display store page with seller's description

**[description empty]:**

1. Steps 2–15 proceed normally with description = null
2. CreateStoreUI -> Seller : display store page with "No description yet" placeholder

> Both paths achieve the goal. Store is created either way.

### alt — Seller not approved (exceptional case, at step 6)

**[approved = true]:**

1. Steps 7–15 proceed normally

**[approved = false]:**

1. /current : User -> StoreService : return approved = false
2. StoreService -> CreateStoreUI : return 403 "Seller not approved"
3. CreateStoreUI -> Seller : display "Your account is pending approval"
4. **Steps 7–15 never execute.**

---

## SD-07: Create Product

**Use Case:** Create Product

**Why Unique to Sellor:** Product creation is auto-linked to the seller's store, and the category (group_id) must be validated as belonging to that same store.

**Participating Objects:**

- `<<boundary>>` CreateProductUI
- `<<control>>` ProductService
- `<<entity>>` /current : Store
- `<<entity>>` /selected : ProductGroup
- `<<entity>>` /new : Product

**Preconditions:**

- Seller is authenticated
- Seller has an existing store
- Seller is on Create Product UI

**Postconditions (Success):**

- New Product record exists linked to seller's store
- Product is visible to buyers if status = "active"

### Main Success Scenario

1. CreateProductUI -> ProductService : getMyCategories(token)
2. ProductService -> /current : Store : load(userId)
3. /current : Store -> ProductService : return storeData
4. ProductService -> /current : Store : getProductGroups()
5. /current : Store -> ProductService : return categoryList
6. ProductService -> CreateProductUI : return categoryList
7. CreateProductUI -> Seller : display form with category dropdown
8. Seller -> CreateProductUI : fillForm(title, price, description, stock, status, group_id)
9. CreateProductUI -> ProductService : createProduct(productData)
10. ProductService -> ProductService : validateProductData(title, price)
11. ProductService -> /selected : ProductGroup : load(group_id)
12. /selected : ProductGroup -> ProductService : return groupData
13. ProductService -> /selected : ProductGroup : getStoreId()
14. /selected : ProductGroup -> ProductService : return storeId
15. ProductService -> ProductService : verifyGroupBelongsToStore(group.storeId, seller.storeId)
16. ProductService -> /new : Product : new Product(title, price, description, stock, status, group_id, storeId)
17. /new : Product -> ProductService : return productData
18. ProductService -> /new : Product : save()
19. /new : Product -> ProductService : return saved
20. ProductService -> CreateProductUI : return 201 + productData
21. CreateProductUI -> Seller : display "Product created"

### alt — Category selected or not (after step 8, sequence continues either way)

**[group_id provided]:**

1. Steps 9–21 proceed normally including steps 11–15 (category validation)

**[group_id is null]:**

1. CreateProductUI -> ProductService : createProduct(productData with group_id=null)
2. ProductService -> ProductService : validateProductData(title, price)
3. ProductService skips steps 11–15 (no category to validate)
4. ProductService -> /new : Product : new Product(title, price, description, stock, status, null, storeId)
5. /new : Product -> ProductService : return productData
6. ProductService -> /new : Product : save()
7. /new : Product -> ProductService : return saved
8. ProductService -> CreateProductUI : return 201 + productData
9. CreateProductUI -> Seller : display "Product created (uncategorized)"

> Both paths achieve the goal. Product is created either way.

### alt — Category does not belong to seller's store (exceptional case, at step 15)

**[group.storeId = seller.storeId]:**

1. Steps 16–21 proceed normally

**[group.storeId ≠ seller.storeId]:**

1. ProductService -> ProductService : verifyGroupBelongsToStore fails
2. ProductService -> CreateProductUI : return 400 "Invalid category"
3. CreateProductUI -> Seller : display error message
4. **Steps 16–21 never execute.**

---

## SD-09: Edit Product

**Use Case:** Edit Product

**Why Unique to Sellor:** Product editing requires ownership verification through the seller's store, and re-validates category membership when the category is changed.

**Participating Objects:**

- `<<boundary>>` EditProductUI
- `<<control>>` ProductService
- `<<entity>>` /current : Store
- `<<entity>>` /selected : Product
- `<<entity>>` /selected : ProductGroup

**Preconditions:**

- Seller is authenticated
- Seller has an existing store with at least one product
- Seller is on Edit Product UI; `productId` is available from route or context

**Postconditions (Success):**

- Product record updated with new field values
- Product remains linked to seller's store

### Main Success Scenario

1. EditProductUI -> ProductService : getProduct(productId)
2. ProductService -> /selected : Product : load(productId)
3. /selected : Product -> ProductService : return productData
4. ProductService -> /selected : Product : getStoreId()
5. /selected : Product -> ProductService : return storeId
6. ProductService -> ProductService : verifyOwnership(product.storeId, seller.storeId)
7. ProductService -> EditProductUI : return productData
8. EditProductUI -> Seller : display edit form pre-filled with current values
9. Seller -> EditProductUI : fillForm(title, price, description, stock, status, group_id)
10. EditProductUI -> ProductService : updateProduct(productId, updatedData)
11. ProductService -> ProductService : validateProductData(title, price)
12. ProductService -> /selected : ProductGroup : load(group_id)
13. /selected : ProductGroup -> ProductService : return groupData
14. ProductService -> /selected : ProductGroup : getStoreId()
15. /selected : ProductGroup -> ProductService : return storeId
16. ProductService -> ProductService : verifyGroupBelongsToStore(group.storeId, seller.storeId)
17. ProductService -> /selected : Product : setFields(title, price, description, stock, status, group_id)
18. /selected : Product -> ProductService : return updated
19. ProductService -> /selected : Product : save()
20. /selected : Product -> ProductService : return saved
21. ProductService -> EditProductUI : return 200 + updatedProductData
22. EditProductUI -> Seller : display "Product updated"

### alt — Category changed or unchanged (after step 9, sequence continues either way)

**[group_id changed or newly provided]:**

1. Steps 10–22 proceed normally including steps 12–16 (category validation)

**[group_id unchanged or null]:**

1. EditProductUI -> ProductService : updateProduct(productId, updatedData with no group_id change)
2. ProductService -> ProductService : validateProductData(title, price)
3. ProductService skips steps 12–16 (no category to validate)
4. ProductService -> /selected : Product : setFields(title, price, description, stock, status)
5. /selected : Product -> ProductService : return updated
6. ProductService -> /selected : Product : save()
7. /selected : Product -> ProductService : return saved
8. ProductService -> EditProductUI : return 200 + updatedProductData
9. EditProductUI -> Seller : display "Product updated"

> Both paths achieve the goal. Product is updated either way.

### alt — Product does not belong to seller's store (exceptional case, at step 6)

**[product.storeId = seller.storeId]:**

1. Steps 7–22 proceed normally

**[product.storeId ≠ seller.storeId]:**

1. ProductService -> ProductService : verifyOwnership fails
2. ProductService -> EditProductUI : return 403 "Forbidden"
3. EditProductUI -> Seller : display "Access denied"
4. **Steps 7–22 never execute.**

---

## SD-10: Browse Stores & View Store Page

**Use Case:** Browse Stores and View Store Page

**Why Unique to Sellor:** Core marketplace browsing — homepage store grid → slug-based store page → store-scoped category filtering.

**Participating Objects:**

- `<<boundary>>` HomepageUI
- `<<boundary>>` StorePageUI
- `<<control>>` StoreService
- `<<control>>` ProductService
- `<<entity>>` /selected : Store

**Preconditions:**

- None (public access)
- Homepage is displayed

**Postconditions (Success):**

- Visitor sees paginated store listing
- Visitor sees specific store's active products with category sidebar

### Main Success Scenario

1. HomepageUI -> StoreService : listStores(page, limit)
2. StoreService -> StoreService : loadStoresPaginated(page, limit), return storeList
3. StoreService -> HomepageUI : return storeList
4. HomepageUI -> Visitor : display store card grid
5. Visitor -> HomepageUI : clickStoreCard(slug)
6. HomepageUI -> StorePageUI : navigate(/store/{slug})
7. StorePageUI -> StoreService : getStoreBySlug(slug)
8. StoreService -> /selected : Store : load(slug)
9. /selected : Store -> StoreService : return storeData
10. StoreService -> StorePageUI : return storeDetail
11. StorePageUI -> ProductService : getStoreProducts(storeId, page, limit)
12. ProductService -> /selected : Store : getActiveProducts(page, limit)
13. /selected : Store -> ProductService : return productList
14. ProductService -> StorePageUI : return productList
15. StorePageUI -> StoreService : getStoreGroups(storeId)
16. StoreService -> /selected : Store : getProductGroups()
17. /selected : Store -> StoreService : return groupList with counts
18. StoreService -> StorePageUI : return groupList
19. StorePageUI -> Visitor : display store header + product grid + category sidebar

### alt — Filter by category or view all (after step 19, sequence continues either way)

**[visitor clicks a category in sidebar]:**

1. Visitor -> StorePageUI : filterByCategory(group_id)
2. StorePageUI -> ProductService : getStoreProducts(storeId, group_id, page)
3. ProductService -> /selected : Store : getActiveProducts(group_id, page)
4. /selected : Store -> ProductService : return filteredProductList
5. ProductService -> StorePageUI : return filteredProductList
6. StorePageUI -> Visitor : display filtered product grid

**[visitor does not filter]:**

1. Visitor continues browsing the full product grid from step 19

> Both paths are valid. The page is already loaded.

### alt — Store slug not found (exceptional case, at step 8)

**[slug exists]:**

1. Steps 9–19 proceed normally

**[slug does not exist]:**

1. /selected : Store -> StoreService : return null
2. StoreService -> StorePageUI : return 404 "Store not found"
3. StorePageUI -> Visitor : display "Store not found" page
4. **Steps 10–19 never execute.**

---

## SD-11: Place Order

**Use Case:** Place Order

**Why Unique to Sellor:** Single-store checkout constraint, price and title snapshot at order time, and stock decrement are specific to Sellor's commerce model.

**Participating Objects:**

- `<<boundary>>` CheckoutUI
- `<<control>>` OrderService
- `<<entity>>` /selected : Address
- `<<entity>>` /new : Order

**Preconditions:**

- Buyer is authenticated
- Buyer has items in cart (all from the same store)
- Buyer has at least one saved shipping address
- Checkout UI is displayed

**Postconditions (Success):**

- New Order record exists with status = "placed"
- Order items contain price and title snapshots
- Product stock decremented
- Cart is cleared

### Main Success Scenario

1. CheckoutUI -> OrderService : getCartSummary(token)
2. OrderService -> OrderService : loadCartItems(buyerId), return cartSummary
3. OrderService -> CheckoutUI : return cartSummary + storeInfo
4. CheckoutUI -> Buyer : display order summary + address selection
5. Buyer -> CheckoutUI : selectAddress(addressId)
6. CheckoutUI -> OrderService : placeOrder(token, storeId, addressId)
7. OrderService -> OrderService : validateCart(buyerId, storeId) — non-empty, single store
8. OrderService -> OrderService : checkStockAvailability(cartItems), return sufficient
9. OrderService -> /selected : Address : load(addressId)
10. /selected : Address -> OrderService : return addressData
11. OrderService -> OrderService : verifyAddressBelongsToBuyer(address.userId, buyerId)
12. OrderService -> /new : Order : new Order(buyerId, storeId, addressId, items with price snapshot, status="placed")
13. /new : Order -> OrderService : return orderData
14. OrderService -> OrderService : decrementStock(cartItems)
15. OrderService -> /new : Order : save()
16. /new : Order -> OrderService : return saved
17. OrderService -> OrderService : clearCart(buyerId)
18. OrderService -> CheckoutUI : return 201 + orderData
19. CheckoutUI -> Buyer : display "Order placed" + order confirmation

### alt — Checkout from cart vs. direct item checkout (when checkout is shown, sequence continues either way)

**[checkout from cart (standard)]:**

1. Steps 1–19 proceed normally, loading all items from the buyer's cart

**[direct item checkout (single product, no cart)]:**

1. CheckoutUI -> OrderService : placeOrderDirect(token, storeId, addressId, items)
2. Steps 7–19 proceed normally with provided items instead of cart items
3. CheckoutUI -> Buyer : display "Order placed" + order confirmation

> Both paths achieve the goal. Order is created either way.

### alt — Stock insufficient or cart empty (exceptional case, at step 8)

**[stock sufficient and cart non-empty]:**

1. Steps 9–19 proceed normally

**[stock insufficient or cart empty]:**

1. OrderService -> OrderService : validation fails
2. OrderService -> CheckoutUI : return 400 "Insufficient stock" or "Cart is empty"
3. CheckoutUI -> Buyer : display error message
4. **Steps 9–19 never execute.**

---

## SD-12: View Product Detail & Submit Inquiry

**Use Case:** View Product Detail and Submit Inquiry

**Why Unique to Sellor:** No-auth inquiry submission tied to a specific product, creating a record linked to the store and triggering seller email notification.

**Participating Objects:**

- `<<boundary>>` ProductDetailUI
- `<<boundary>>` InquiryFormUI
- `<<control>>` ProductService
- `<<control>>` InquiryService
- `<<control>>` EmailService
- `<<entity>>` /selected : Product
- `<<entity>>` /selected : Store
- `<<entity>>` /new : Inquiry

**Preconditions:**

- None (public access, no authentication required)
- Product detail UI is displayed for `productId` (e.g. from route)

**Postconditions (Success):**

- Visitor has viewed full product details
- New Inquiry record exists with status = "new"
- Seller has received email notification

### Main Success Scenario

1. ProductDetailUI -> ProductService : getProduct(productId)
2. ProductService -> /selected : Product : load(productId)
3. /selected : Product -> ProductService : return productData
4. ProductService -> /selected : Product : getStatus()
5. /selected : Product -> ProductService : return status = "active"
6. ProductService -> ProductService : verifyProductIsVisible(status ≠ "hidden")
7. ProductService -> /selected : Product : getImages()
8. /selected : Product -> ProductService : return imageList
9. ProductService -> ProductDetailUI : return productData + imageList + storeInfo
10. ProductDetailUI -> Visitor : display product page with gallery
11. Visitor -> InquiryFormUI : clickContactSeller()
12. Visitor -> InquiryFormUI : fillForm(name, email, message)
13. InquiryFormUI -> InquiryService : submitInquiry(productId, name, email, message)
14. InquiryService -> InquiryService : validateInquiryData(name, email, message)
15. InquiryService -> /selected : Product : getStoreId()
16. /selected : Product -> InquiryService : return storeId
17. InquiryService -> /selected : Store : load(storeId)
18. /selected : Store -> InquiryService : return storeData
19. InquiryService -> /new : Inquiry : new Inquiry(productId, storeId, name, email, message, status="new")
20. /new : Inquiry -> InquiryService : return inquiryData
21. InquiryService -> /new : Inquiry : save()
22. /new : Inquiry -> InquiryService : return saved
23. InquiryService -> EmailService : sendNotification(store.sellerEmail, productTitle, name, message)
24. EmailService -> EmailService : composeAndSendEmail()
25. EmailService -> InquiryService : return sent = true
26. InquiryService -> InquiryFormUI : return 201
27. InquiryFormUI -> Visitor : display "Inquiry sent successfully"

### alt — Guest submission or logged-in buyer (after step 11, sequence continues either way)

**[guest visitor]:**

1. Steps 12–27 proceed normally with name and email manually filled by the visitor

**[logged-in buyer]:**

1. InquiryFormUI pre-fills name and email from buyer's profile
2. Steps 13–27 proceed normally

> Both paths achieve the goal. Inquiry is submitted either way.

### alt — Product is hidden (exceptional case, at step 6)

**[status = "active"]:**

1. Steps 7–27 proceed normally

**[status = "hidden"]:**

1. ProductService -> ProductService : verifyProductIsVisible fails
2. ProductService -> ProductDetailUI : return 404 "Product not found"
3. ProductDetailUI -> Visitor : display "Product not found" page
4. **Steps 7–27 never execute.**

### alt — Email service unavailable (exceptional case, at step 24)

**[email sends successfully]:**

1. EmailService -> EmailService : composeAndSendEmail()
2. EmailService -> InquiryService : return sent = true
3. InquiryService -> InquiryFormUI : return 201
4. InquiryFormUI -> Visitor : display "Inquiry sent successfully"

**[email service unavailable]:**

1. EmailService -> EmailService : composeAndSendEmail() fails
2. EmailService -> InquiryService : return sent = false
3. InquiryService -> InquiryService : logEmailFailure() (inquiry already saved at step 22)
4. InquiryService -> InquiryFormUI : return 201
5. InquiryFormUI -> Visitor : display "Inquiry sent successfully"

> Inquiry is saved regardless of email outcome.

---

## SD-13: Seller Manages Inquiries

**Use Case:** Manage Inquiries

**Why Unique to Sellor:** Inquiry lifecycle (new → replied → closed) with manual status tracking. Seller responds externally via email then manually updates status in dashboard.

**Participating Objects:**

- `<<boundary>>` InquiryListUI
- `<<boundary>>` InquiryDetailUI
- `<<control>>` InquiryService
- `<<entity>>` /current : Store
- `<<entity>>` /selected : Inquiry

**Preconditions:**

- Seller is authenticated
- Seller has an existing store with inquiries
- Inquiry list UI is displayed

**Postconditions (Success):**

- Seller has viewed inquiry details
- Inquiry status updated to "replied"

### Main Success Scenario

1. InquiryListUI -> InquiryService : getInquiries(token, page, limit)
2. InquiryService -> /current : Store : load(userId)
3. /current : Store -> InquiryService : return storeData
4. InquiryService -> /current : Store : getInquiries(page, limit)
5. /current : Store -> InquiryService : return inquiryList
6. InquiryService -> InquiryListUI : return inquiryList
7. InquiryListUI -> Seller : display inquiry table
8. Seller -> InquiryListUI : clickInquiryRow(inquiryId)
9. InquiryListUI -> InquiryDetailUI : navigate(inquiryId)
10. InquiryDetailUI -> InquiryService : getInquiry(inquiryId)
11. InquiryService -> /selected : Inquiry : load(inquiryId)
12. /selected : Inquiry -> InquiryService : return inquiryData
13. InquiryService -> /selected : Inquiry : getStoreId()
14. /selected : Inquiry -> InquiryService : return storeId
15. InquiryService -> InquiryService : verifyBelongsToStore(inquiry.storeId, seller.storeId)
16. InquiryService -> InquiryDetailUI : return inquiryDetail
17. InquiryDetailUI -> Seller : display full inquiry (message, buyer email, product link)
18. Seller responds to buyer via external email
19. Seller -> InquiryDetailUI : clickMarkAsReplied(inquiryId)
20. InquiryDetailUI -> InquiryService : updateStatus(inquiryId, "replied")
21. InquiryService -> /selected : Inquiry : setStatus("replied")
22. /selected : Inquiry -> InquiryService : return updated
23. InquiryService -> /selected : Inquiry : save()
24. /selected : Inquiry -> InquiryService : return saved
25. InquiryService -> InquiryDetailUI : return 200
26. InquiryDetailUI -> Seller : display updated status badge

### alt — View all or filter by status (after step 1, sequence continues either way)

**[no filter applied]:**

1. Steps 1–7 proceed normally, all inquiries returned

**[seller selects status filter = "new"]:**

1. InquiryListUI -> InquiryService : getInquiries(token, status="new", page)
2. InquiryService -> /current : Store : load(userId)
3. /current : Store -> InquiryService : return storeData
4. InquiryService -> /current : Store : getInquiries(status="new", page, limit)
5. /current : Store -> InquiryService : return filteredInquiryList
6. InquiryService -> InquiryListUI : return filteredInquiryList
7. InquiryListUI -> Seller : display only new inquiries

> Both paths achieve the goal. Seller views inquiries either way.

### alt — Inquiry does not belong to seller's store (exceptional case, at step 15)

**[inquiry.storeId = seller.storeId]:**

1. Steps 16–26 proceed normally

**[inquiry.storeId ≠ seller.storeId]:**

1. InquiryService -> InquiryService : verifyBelongsToStore fails
2. InquiryService -> InquiryDetailUI : return 403 "Forbidden"
3. InquiryDetailUI -> Seller : display "Access denied"
4. **Steps 16–26 never execute.**

---

## SD-14: Admin Approves / Rejects Sellers

**Use Case:** Approve or Reject Seller Application

**Why Unique to Sellor:** Seller approval workflow is the trust mechanism for the marketplace, gating store creation behind human review.

**Participating Objects:**

- `<<boundary>>` AdminSellerUI
- `<<control>>` AdminService
- `<<control>>` EmailService
- `<<entity>>` /selected : User

**Preconditions:**

- Admin is authenticated with role = "admin"
- At least one seller has selling_approve = false
- Pending sellers UI is displayed

**Postconditions (Success — Approve):**

- User.selling_approve = true
- Seller received approval email
- Seller can now create a store

**Postconditions (Success — Reject):**

- User.selling_approve remains false
- Seller received rejection email

### Main Success Scenario

1. AdminSellerUI -> AdminService : getPendingSellers(token)
2. AdminService -> AdminService : loadPendingSellers(), return pendingSellerList
3. AdminService -> AdminSellerUI : return pendingSellerList
4. AdminSellerUI -> Admin : display pending sellers table
5. Admin -> AdminSellerUI : clickApprove(userId)
6. AdminSellerUI -> AdminService : approveSeller(userId, approve=true)
7. AdminService -> /selected : User : load(userId)
8. /selected : User -> AdminService : return userData
9. AdminService -> /selected : User : getRole()
10. /selected : User -> AdminService : return role = "seller"
11. AdminService -> AdminService : verifyRole(role = "seller")
12. AdminService -> /selected : User : setSellingApprove(true)
13. /selected : User -> AdminService : return updated
14. AdminService -> /selected : User : save()
15. /selected : User -> AdminService : return saved
16. AdminService -> EmailService : sendApprovalEmail(user.email)
17. EmailService -> EmailService : composeAndSendEmail()
18. EmailService -> AdminService : return sent = true
19. AdminService -> AdminSellerUI : return 200
20. AdminSellerUI -> Admin : remove seller from pending list + display success

### alt — Approve or Reject (after step 4, sequence continues either way)

**[Admin clicks "Approve"]:**

1. Steps 5–20 proceed as main success scenario
2. /selected : User updated with selling_approve = true
3. Approval email sent

**[Admin clicks "Reject"]:**

1. Admin -> AdminSellerUI : clickReject(userId)
2. AdminSellerUI -> AdminService : approveSeller(userId, approve=false)
3. AdminService -> /selected : User : load(userId)
4. /selected : User -> AdminService : return userData
5. AdminService -> /selected : User : getRole()
6. /selected : User -> AdminService : return role = "seller"
7. AdminService -> AdminService : verifyRole(role = "seller")
8. AdminService -> /selected : User : setSellingApprove(false)
9. /selected : User -> AdminService : return updated
10. AdminService -> /selected : User : save()
11. /selected : User -> AdminService : return saved
12. AdminService -> EmailService : sendRejectionEmail(user.email)
13. EmailService -> EmailService : composeAndSendEmail()
14. EmailService -> AdminService : return sent = true
15. AdminService -> AdminSellerUI : return 200
16. AdminSellerUI -> Admin : remove seller from pending list + display "Rejected"

> Both paths achieve the admin's goal — making a decision on the application.

### alt — User is not a seller role (exceptional case, at step 11)

**[role = "seller"]:**

1. Steps 12–20 proceed normally

**[role ≠ "seller"]:**

1. AdminService -> AdminService : verifyRole fails
2. AdminService -> AdminSellerUI : return 400 "User is not a seller"
3. AdminSellerUI -> Admin : display error message
4. **Steps 12–20 never execute.**

---

## SD-15: View Order

**Use Case:** View Order

**Why Unique to Sellor:** Access control differs by role — a buyer views their own order while a seller views orders for their store — both using the same order entity but with different ownership checks and UI controls.

**Participating Objects:**

- `<<boundary>>` OrderDetailUI
- `<<control>>` OrderService
- `<<entity>>` /selected : Order

**Preconditions:**

- User is authenticated (buyer or seller)
- Order exists in the system
- Order detail UI is displayed; `orderId` is available from route or context

**Postconditions (Success):**

- User has viewed order details including items, total, status, and status history

### Main Success Scenario

1. OrderDetailUI -> OrderService : getOrder(orderId, token)
2. OrderService -> /selected : Order : load(orderId)
3. /selected : Order -> OrderService : return orderData
4. OrderService -> /selected : Order : getBuyerId()
5. /selected : Order -> OrderService : return buyerId
6. OrderService -> OrderService : verifyBuyerAccess(order.buyerId, currentUserId)
7. OrderService -> /selected : Order : getItems()
8. /selected : Order -> OrderService : return itemList with price snapshots
9. OrderService -> /selected : Order : getStatusHistory()
10. /selected : Order -> OrderService : return statusHistory
11. OrderService -> OrderDetailUI : return orderData + itemList + statusHistory
12. OrderDetailUI -> Buyer : display full order details with status timeline

### alt — Buyer viewing their order vs. seller viewing store order (after step 1, sequence continues either way)

**[buyer viewing own order]:**

1. Steps 2–12 proceed as main success scenario
2. OrderDetailUI -> Buyer : display order with "Track Order" buyer controls

**[seller viewing store order]:**

1. OrderService -> /selected : Order : load(orderId)
2. /selected : Order -> OrderService : return orderData
3. OrderService -> /selected : Order : getStoreId()
4. /selected : Order -> OrderService : return storeId
5. OrderService -> OrderService : verifySellerAccess(order.storeId, seller.storeId)
6. OrderService -> /selected : Order : getItems()
7. /selected : Order -> OrderService : return itemList
8. OrderService -> /selected : Order : getStatusHistory()
9. /selected : Order -> OrderService : return statusHistory
10. OrderService -> OrderDetailUI : return orderData + itemList + statusHistory
11. OrderDetailUI -> Seller : display full order details with "Update Status" seller controls

> Both paths achieve the goal. Order details are visible to the appropriate user.

### alt — Order not found (exceptional case, at step 2)

**[order exists]:**

1. Steps 3–12 proceed normally

**[order does not exist]:**

1. /selected : Order -> OrderService : return null
2. OrderService -> OrderDetailUI : return 404 "Order not found"
3. OrderDetailUI -> User : display "Order not found" page
4. **Steps 3–12 never execute.**

### alt — Unauthorized access (exceptional case, at step 6)

**[access is authorized]:**

1. Steps 7–12 proceed normally

**[user does not own order or store]:**

1. OrderService -> OrderService : verifyAccess fails
2. OrderService -> OrderDetailUI : return 403 "Forbidden"
3. OrderDetailUI -> User : display "Access denied" page
4. **Steps 7–12 never execute.**

---

## Summary Table

| # | Diagram | alt (condition-based, continues) | alt (exceptional, cannot proceed) |
|---|---------|----------------------------------|-----------------------------------|
| SD-04 | Create Store | Description provided or not | Seller not approved |
| SD-07 | Create Product | Category selected or not | Category not in seller's store |
| SD-09 | Edit Product | Category changed or unchanged | Product not in seller's store |
| SD-10 | Browse & View Store | Filter by category or view all | Store slug not found |
| SD-11 | Place Order | Checkout from cart vs. direct checkout | Stock insufficient or cart empty |
| SD-12 | View Product & Inquiry | Guest submission or logged-in buyer | Product is hidden / Email service unavailable |
| SD-13 | Manage Inquiries | Filter by status or view all | Inquiry not in seller's store |
| SD-14 | Admin Approve/Reject | Approve or reject decision | User is not a seller role |
| SD-15 | View Order | Buyer viewing vs. seller viewing | Order not found / Unauthorized access |

---

*End of Document*
