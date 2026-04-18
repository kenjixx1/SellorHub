# Sellor — Sequence Diagram Specifications

**Project:** Sellor Multi-Store E-Commerce Platform  
**Version:** 4.0  
**Date:** April 17, 2026  
**Notation:** Boundary-Control-Entity (BCE) with Combined Fragments (alt)

**Conventions:**

- `/name : Class` — accessing an **existing** entity instance (e.g., `/current : User`, `/selected : Store`)
- `/new : Class` — creating a **new** entity instance (e.g., `/new : Store`)
- Entity retrieval: service sends a direct `load(id)` message to the entity participant; entity returns its data
- Entity persistence: service sends `save()` or `delete()` directly to the entity participant
- Control objects self-loop for **business logic validation and existence/uniqueness checks**
- `alt` — used for both **alternative cases** (two valid condition-based flows) and **exceptional cases** (one normal path, one path where the system cannot proceed)

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

**Postconditions (Success):**

- New Product record exists linked to seller's store
- Product is visible to buyers if status = "active"

### Main Success Scenario

1. Seller -> CreateProductUI : openCreateProductPage()
2. CreateProductUI -> ProductService : getMyCategories(token)
3. ProductService -> /current : Store : load(userId)
4. /current : Store -> ProductService : return storeData
5. ProductService -> /current : Store : getProductGroups()
6. /current : Store -> ProductService : return categoryList
7. ProductService -> CreateProductUI : return categoryList
8. CreateProductUI -> Seller : display form with category dropdown
9. Seller -> CreateProductUI : fillForm(title, price, description, stock, status, group_id)
10. CreateProductUI -> ProductService : createProduct(productData)
11. ProductService -> ProductService : validateProductData(title, price)
12. ProductService -> /selected : ProductGroup : load(group_id)
13. /selected : ProductGroup -> ProductService : return groupData
14. ProductService -> /selected : ProductGroup : getStoreId()
15. /selected : ProductGroup -> ProductService : return storeId
16. ProductService -> ProductService : verifyGroupBelongsToStore(group.storeId, seller.storeId)
17. ProductService -> /new : Product : new Product(title, price, description, stock, status, group_id, storeId)
18. /new : Product -> ProductService : return productData
19. ProductService -> /new : Product : save()
20. /new : Product -> ProductService : return saved
21. ProductService -> CreateProductUI : return 201 + productData
22. CreateProductUI -> Seller : display "Product created"

### alt — Category selected or not (after step 9, sequence continues either way)

**[group_id provided]:**

1. Steps 10–22 proceed normally including steps 12–16 (category validation)

**[group_id is null]:**

1. CreateProductUI -> ProductService : createProduct(productData with group_id=null)
2. ProductService -> ProductService : validateProductData(title, price)
3. ProductService skips steps 12–16 (no category to validate)
4. ProductService -> /new : Product : new Product(title, price, description, stock, status, null, storeId)
5. /new : Product -> ProductService : return productData
6. ProductService -> /new : Product : save()
7. /new : Product -> ProductService : return saved
8. ProductService -> CreateProductUI : return 201 + productData
9. CreateProductUI -> Seller : display "Product created (uncategorized)"

> Both paths achieve the goal. Product is created either way.

### alt — Category does not belong to seller's store (exceptional case, at step 16)

**[group.storeId = seller.storeId]:**

1. Steps 17–22 proceed normally

**[group.storeId ≠ seller.storeId]:**

1. ProductService -> ProductService : verifyGroupBelongsToStore fails
2. ProductService -> CreateProductUI : return 400 "Invalid category"
3. CreateProductUI -> Seller : display error message
4. **Steps 17–22 never execute.**

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

**Postconditions (Success):**

- Product record updated with new field values
- Product remains linked to seller's store

### Main Success Scenario

1. Seller -> EditProductUI : openEditProductPage(productId)
2. EditProductUI -> ProductService : getProduct(productId)
3. ProductService -> /selected : Product : load(productId)
4. /selected : Product -> ProductService : return productData
5. ProductService -> /selected : Product : getStoreId()
6. /selected : Product -> ProductService : return storeId
7. ProductService -> ProductService : verifyOwnership(product.storeId, seller.storeId)
8. ProductService -> EditProductUI : return productData
9. EditProductUI -> Seller : display edit form pre-filled with current values
10. Seller -> EditProductUI : fillForm(title, price, description, stock, status, group_id)
11. EditProductUI -> ProductService : updateProduct(productId, updatedData)
12. ProductService -> ProductService : validateProductData(title, price)
13. ProductService -> /selected : ProductGroup : load(group_id)
14. /selected : ProductGroup -> ProductService : return groupData
15. ProductService -> /selected : ProductGroup : getStoreId()
16. /selected : ProductGroup -> ProductService : return storeId
17. ProductService -> ProductService : verifyGroupBelongsToStore(group.storeId, seller.storeId)
18. ProductService -> /selected : Product : setFields(title, price, description, stock, status, group_id)
19. /selected : Product -> ProductService : return updated
20. ProductService -> /selected : Product : save()
21. /selected : Product -> ProductService : return saved
22. ProductService -> EditProductUI : return 200 + updatedProductData
23. EditProductUI -> Seller : display "Product updated"

### alt — Category changed or unchanged (after step 10, sequence continues either way)

**[group_id changed or newly provided]:**

1. Steps 11–23 proceed normally including steps 13–17 (category validation)

**[group_id unchanged or null]:**

1. EditProductUI -> ProductService : updateProduct(productId, updatedData with no group_id change)
2. ProductService -> ProductService : validateProductData(title, price)
3. ProductService skips steps 13–17 (no category to validate)
4. ProductService -> /selected : Product : setFields(title, price, description, stock, status)
5. /selected : Product -> ProductService : return updated
6. ProductService -> /selected : Product : save()
7. /selected : Product -> ProductService : return saved
8. ProductService -> EditProductUI : return 200 + updatedProductData
9. EditProductUI -> Seller : display "Product updated"

> Both paths achieve the goal. Product is updated either way.

### alt — Product does not belong to seller's store (exceptional case, at step 7)

**[product.storeId = seller.storeId]:**

1. Steps 8–23 proceed normally

**[product.storeId ≠ seller.storeId]:**

1. ProductService -> ProductService : verifyOwnership fails
2. ProductService -> EditProductUI : return 403 "Forbidden"
3. EditProductUI -> Seller : display "Access denied"
4. **Steps 8–23 never execute.**

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

**Postconditions (Success):**

- Visitor sees paginated store listing
- Visitor sees specific store's active products with category sidebar

### Main Success Scenario

1. Visitor -> HomepageUI : openHomepage()
2. HomepageUI -> StoreService : listStores(page, limit)
3. StoreService -> StoreService : loadStoresPaginated(page, limit), return storeList
4. StoreService -> HomepageUI : return storeList
5. HomepageUI -> Visitor : display store card grid
6. Visitor -> HomepageUI : clickStoreCard(slug)
7. HomepageUI -> StorePageUI : navigate(/store/{slug})
8. StorePageUI -> StoreService : getStoreBySlug(slug)
9. StoreService -> /selected : Store : load(slug)
10. /selected : Store -> StoreService : return storeData
11. StoreService -> StorePageUI : return storeDetail
12. StorePageUI -> ProductService : getStoreProducts(storeId, page, limit)
13. ProductService -> /selected : Store : getActiveProducts(page, limit)
14. /selected : Store -> ProductService : return productList
15. ProductService -> StorePageUI : return productList
16. StorePageUI -> StoreService : getStoreGroups(storeId)
17. StoreService -> /selected : Store : getProductGroups()
18. /selected : Store -> StoreService : return groupList with counts
19. StoreService -> StorePageUI : return groupList
20. StorePageUI -> Visitor : display store header + product grid + category sidebar

### alt — Filter by category or view all (after step 20, sequence continues either way)

**[visitor clicks a category in sidebar]:**

1. Visitor -> StorePageUI : filterByCategory(group_id)
2. StorePageUI -> ProductService : getStoreProducts(storeId, group_id, page)
3. ProductService -> /selected : Store : getActiveProducts(group_id, page)
4. /selected : Store -> ProductService : return filteredProductList
5. ProductService -> StorePageUI : return filteredProductList
6. StorePageUI -> Visitor : display filtered product grid

**[visitor does not filter]:**

1. Visitor continues browsing the full product grid from step 20

> Both paths are valid. The page is already loaded.

### alt — Store slug not found (exceptional case, at step 9)

**[slug exists]:**

1. Steps 10–20 proceed normally

**[slug does not exist]:**

1. /selected : Store -> StoreService : return null
2. StoreService -> StorePageUI : return 404 "Store not found"
3. StorePageUI -> Visitor : display "Store not found" page
4. **Steps 11–20 never execute.**

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

**Postconditions (Success):**

- New Order record exists with status = "placed"
- Order items contain price and title snapshots
- Product stock decremented
- Cart is cleared

### Main Success Scenario

1. Buyer -> CheckoutUI : openCheckoutPage()
2. CheckoutUI -> OrderService : getCartSummary(token)
3. OrderService -> OrderService : loadCartItems(buyerId), return cartSummary
4. OrderService -> CheckoutUI : return cartSummary + storeInfo
5. CheckoutUI -> Buyer : display order summary + address selection
6. Buyer -> CheckoutUI : selectAddress(addressId)
7. CheckoutUI -> OrderService : placeOrder(token, storeId, addressId)
8. OrderService -> OrderService : validateCart(buyerId, storeId) — non-empty, single store
9. OrderService -> OrderService : checkStockAvailability(cartItems), return sufficient
10. OrderService -> /selected : Address : load(addressId)
11. /selected : Address -> OrderService : return addressData
12. OrderService -> OrderService : verifyAddressBelongsToBuyer(address.userId, buyerId)
13. OrderService -> /new : Order : new Order(buyerId, storeId, addressId, items with price snapshot, status="placed")
14. /new : Order -> OrderService : return orderData
15. OrderService -> OrderService : decrementStock(cartItems)
16. OrderService -> /new : Order : save()
17. /new : Order -> OrderService : return saved
18. OrderService -> OrderService : clearCart(buyerId)
19. OrderService -> CheckoutUI : return 201 + orderData
20. CheckoutUI -> Buyer : display "Order placed" + order confirmation

### alt — Checkout from cart vs. direct item checkout (after step 1, sequence continues either way)

**[checkout from cart (standard)]:**

1. Steps 2–20 proceed normally, loading all items from the buyer's cart

**[direct item checkout (single product, no cart)]:**

1. CheckoutUI -> OrderService : placeOrderDirect(token, storeId, addressId, items)
2. Steps 8–20 proceed normally with provided items instead of cart items
3. CheckoutUI -> Buyer : display "Order placed" + order confirmation

> Both paths achieve the goal. Order is created either way.

### alt — Stock insufficient or cart empty (exceptional case, at step 9)

**[stock sufficient and cart non-empty]:**

1. Steps 10–20 proceed normally

**[stock insufficient or cart empty]:**

1. OrderService -> OrderService : validation fails
2. OrderService -> CheckoutUI : return 400 "Insufficient stock" or "Cart is empty"
3. CheckoutUI -> Buyer : display error message
4. **Steps 10–20 never execute.**

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

**Postconditions (Success):**

- Visitor has viewed full product details
- New Inquiry record exists with status = "new"
- Seller has received email notification

### Main Success Scenario

1. Visitor -> ProductDetailUI : clickProduct(productId)
2. ProductDetailUI -> ProductService : getProduct(productId)
3. ProductService -> /selected : Product : load(productId)
4. /selected : Product -> ProductService : return productData
5. ProductService -> /selected : Product : getStatus()
6. /selected : Product -> ProductService : return status = "active"
7. ProductService -> ProductService : verifyProductIsVisible(status ≠ "hidden")
8. ProductService -> /selected : Product : getImages()
9. /selected : Product -> ProductService : return imageList
10. ProductService -> ProductDetailUI : return productData + imageList + storeInfo
11. ProductDetailUI -> Visitor : display product page with gallery
12. Visitor -> InquiryFormUI : clickContactSeller()
13. Visitor -> InquiryFormUI : fillForm(name, email, message)
14. InquiryFormUI -> InquiryService : submitInquiry(productId, name, email, message)
15. InquiryService -> InquiryService : validateInquiryData(name, email, message)
16. InquiryService -> /selected : Product : getStoreId()
17. /selected : Product -> InquiryService : return storeId
18. InquiryService -> /selected : Store : load(storeId)
19. /selected : Store -> InquiryService : return storeData
20. InquiryService -> /new : Inquiry : new Inquiry(productId, storeId, name, email, message, status="new")
21. /new : Inquiry -> InquiryService : return inquiryData
22. InquiryService -> /new : Inquiry : save()
23. /new : Inquiry -> InquiryService : return saved
24. InquiryService -> EmailService : sendNotification(store.sellerEmail, productTitle, name, message)
25. EmailService -> EmailService : composeAndSendEmail()
26. EmailService -> InquiryService : return sent = true
27. InquiryService -> InquiryFormUI : return 201
28. InquiryFormUI -> Visitor : display "Inquiry sent successfully"

### alt — Guest submission or logged-in buyer (after step 12, sequence continues either way)

**[guest visitor]:**

1. Steps 13–28 proceed normally with name and email manually filled by the visitor

**[logged-in buyer]:**

1. InquiryFormUI pre-fills name and email from buyer's profile
2. Steps 14–28 proceed normally

> Both paths achieve the goal. Inquiry is submitted either way.

### alt — Product is hidden (exceptional case, at step 7)

**[status = "active"]:**

1. Steps 8–28 proceed normally

**[status = "hidden"]:**

1. ProductService -> ProductService : verifyProductIsVisible fails
2. ProductService -> ProductDetailUI : return 404 "Product not found"
3. ProductDetailUI -> Visitor : display "Product not found" page
4. **Steps 8–28 never execute.**

### alt — Email service unavailable (exceptional case, at step 25)

**[email sends successfully]:**

1. EmailService -> EmailService : composeAndSendEmail()
2. EmailService -> InquiryService : return sent = true
3. InquiryService -> InquiryFormUI : return 201
4. InquiryFormUI -> Visitor : display "Inquiry sent successfully"

**[email service unavailable]:**

1. EmailService -> EmailService : composeAndSendEmail() fails
2. EmailService -> InquiryService : return sent = false
3. InquiryService -> InquiryService : logEmailFailure() (inquiry already saved at step 23)
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

**Postconditions (Success):**

- Seller has viewed inquiry details
- Inquiry status updated to "replied"

### Main Success Scenario

1. Seller -> InquiryListUI : openInquiriesPage()
2. InquiryListUI -> InquiryService : getInquiries(token, page, limit)
3. InquiryService -> /current : Store : load(userId)
4. /current : Store -> InquiryService : return storeData
5. InquiryService -> /current : Store : getInquiries(page, limit)
6. /current : Store -> InquiryService : return inquiryList
7. InquiryService -> InquiryListUI : return inquiryList
8. InquiryListUI -> Seller : display inquiry table
9. Seller -> InquiryListUI : clickInquiryRow(inquiryId)
10. InquiryListUI -> InquiryDetailUI : navigate(inquiryId)
11. InquiryDetailUI -> InquiryService : getInquiry(inquiryId)
12. InquiryService -> /selected : Inquiry : load(inquiryId)
13. /selected : Inquiry -> InquiryService : return inquiryData
14. InquiryService -> /selected : Inquiry : getStoreId()
15. /selected : Inquiry -> InquiryService : return storeId
16. InquiryService -> InquiryService : verifyBelongsToStore(inquiry.storeId, seller.storeId)
17. InquiryService -> InquiryDetailUI : return inquiryDetail
18. InquiryDetailUI -> Seller : display full inquiry (message, buyer email, product link)
19. Seller responds to buyer via external email
20. Seller -> InquiryDetailUI : clickMarkAsReplied(inquiryId)
21. InquiryDetailUI -> InquiryService : updateStatus(inquiryId, "replied")
22. InquiryService -> /selected : Inquiry : setStatus("replied")
23. /selected : Inquiry -> InquiryService : return updated
24. InquiryService -> /selected : Inquiry : save()
25. /selected : Inquiry -> InquiryService : return saved
26. InquiryService -> InquiryDetailUI : return 200
27. InquiryDetailUI -> Seller : display updated status badge

### alt — View all or filter by status (after step 2, sequence continues either way)

**[no filter applied]:**

1. Steps 2–8 proceed normally, all inquiries returned

**[seller selects status filter = "new"]:**

1. InquiryListUI -> InquiryService : getInquiries(token, status="new", page)
2. InquiryService -> /current : Store : load(userId)
3. /current : Store -> InquiryService : return storeData
4. InquiryService -> /current : Store : getInquiries(status="new", page, limit)
5. /current : Store -> InquiryService : return filteredInquiryList
6. InquiryService -> InquiryListUI : return filteredInquiryList
7. InquiryListUI -> Seller : display only new inquiries

> Both paths achieve the goal. Seller views inquiries either way.

### alt — Inquiry does not belong to seller's store (exceptional case, at step 16)

**[inquiry.storeId = seller.storeId]:**

1. Steps 17–27 proceed normally

**[inquiry.storeId ≠ seller.storeId]:**

1. InquiryService -> InquiryService : verifyBelongsToStore fails
2. InquiryService -> InquiryDetailUI : return 403 "Forbidden"
3. InquiryDetailUI -> Seller : display "Access denied"
4. **Steps 17–27 never execute.**

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

**Postconditions (Success — Approve):**

- User.selling_approve = true
- Seller received approval email
- Seller can now create a store

**Postconditions (Success — Reject):**

- User.selling_approve remains false
- Seller received rejection email

### Main Success Scenario

1. Admin -> AdminSellerUI : openPendingSellers()
2. AdminSellerUI -> AdminService : getPendingSellers(token)
3. AdminService -> AdminService : loadPendingSellers(), return pendingSellerList
4. AdminService -> AdminSellerUI : return pendingSellerList
5. AdminSellerUI -> Admin : display pending sellers table
6. Admin -> AdminSellerUI : clickApprove(userId)
7. AdminSellerUI -> AdminService : approveSeller(userId, approve=true)
8. AdminService -> /selected : User : load(userId)
9. /selected : User -> AdminService : return userData
10. AdminService -> /selected : User : getRole()
11. /selected : User -> AdminService : return role = "seller"
12. AdminService -> AdminService : verifyRole(role = "seller")
13. AdminService -> /selected : User : setSellingApprove(true)
14. /selected : User -> AdminService : return updated
15. AdminService -> /selected : User : save()
16. /selected : User -> AdminService : return saved
17. AdminService -> EmailService : sendApprovalEmail(user.email)
18. EmailService -> EmailService : composeAndSendEmail()
19. EmailService -> AdminService : return sent = true
20. AdminService -> AdminSellerUI : return 200
21. AdminSellerUI -> Admin : remove seller from pending list + display success

### alt — Approve or Reject (after step 5, sequence continues either way)

**[Admin clicks "Approve"]:**

1. Steps 6–21 proceed as main success scenario
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

### alt — User is not a seller role (exceptional case, at step 12)

**[role = "seller"]:**

1. Steps 13–21 proceed normally

**[role ≠ "seller"]:**

1. AdminService -> AdminService : verifyRole fails
2. AdminService -> AdminSellerUI : return 400 "User is not a seller"
3. AdminSellerUI -> Admin : display error message
4. **Steps 13–21 never execute.**

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

**Postconditions (Success):**

- User has viewed order details including items, total, status, and status history

### Main Success Scenario

1. Buyer -> OrderDetailUI : openOrderPage(orderId)
2. OrderDetailUI -> OrderService : getOrder(orderId, token)
3. OrderService -> /selected : Order : load(orderId)
4. /selected : Order -> OrderService : return orderData
5. OrderService -> /selected : Order : getBuyerId()
6. /selected : Order -> OrderService : return buyerId
7. OrderService -> OrderService : verifyBuyerAccess(order.buyerId, currentUserId)
8. OrderService -> /selected : Order : getItems()
9. /selected : Order -> OrderService : return itemList with price snapshots
10. OrderService -> /selected : Order : getStatusHistory()
11. /selected : Order -> OrderService : return statusHistory
12. OrderService -> OrderDetailUI : return orderData + itemList + statusHistory
13. OrderDetailUI -> Buyer : display full order details with status timeline

### alt — Buyer viewing their order vs. seller viewing store order (after step 2, sequence continues either way)

**[buyer viewing own order]:**

1. Steps 3–13 proceed as main success scenario
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

### alt — Order not found (exceptional case, at step 3)

**[order exists]:**

1. Steps 4–13 proceed normally

**[order does not exist]:**

1. /selected : Order -> OrderService : return null
2. OrderService -> OrderDetailUI : return 404 "Order not found"
3. OrderDetailUI -> User : display "Order not found" page
4. **Steps 4–13 never execute.**

### alt — Unauthorized access (exceptional case, at step 7)

**[access is authorized]:**

1. Steps 8–13 proceed normally

**[user does not own order or store]:**

1. OrderService -> OrderService : verifyAccess fails
2. OrderService -> OrderDetailUI : return 403 "Forbidden"
3. OrderDetailUI -> User : display "Access denied" page
4. **Steps 8–13 never execute.**

---

## Summary Table

| # | Diagram | alt (condition-based, continues) | alt (exceptional, cannot proceed) |
|---|---------|----------------------------------|-----------------------------------|
| SD-04 | Create Store | Description provided or not | Seller not approved |                            XX
| SD-07 | Create Product | Category selected or not | Category not in seller's store |                  XX
| SD-09 | Edit Product | Category changed or unchanged | Product not in seller's store |                xx
| SD-10 | Browse & View Store | Filter by category or view all | Store slug not found |                 xx
| SD-11 | Place Order | Checkout from cart vs. direct checkout | Stock insufficient or cart empty |     xx
| SD-12 | View Product & Inquiry | Guest submission or logged-in buyer | Product is hidden / Email service unavailable |
| SD-13 | Manage Inquiries | Filter by status or view all | Inquiry not in seller's store |
| SD-14 | Admin Approve/Reject | Approve or reject decision | User is not a seller role |
| SD-15 | View Order | Buyer viewing vs. seller viewing | Order not found / Unauthorized access |

---

*End of Document*
