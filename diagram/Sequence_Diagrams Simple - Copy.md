# Sellor — Sequence Diagram Specifications

**Project:** Sellor Multi-Store E-Commerce Platform  
**Version:** 2.0  
**Date:** April 3, 2026  
**Notation:** Boundary-Control-Entity (BCE) with Combined Fragments (alt / break)

**Conventions:**

- `/name : Class` — accessing an **existing** entity instance (e.g., `/current : User`)
- `: Class` — creating a **new** entity instance (e.g., `: Store`)
- `:Database` — separate participant for all persistence operations (save, update, delete, find)
- Control objects self-loop for **business logic validation** only
- Database queries for **data existence checks** (uniqueness, ownership, counts)

---

## Object Inventory

### Boundary Objects

| Object | Used In |
|--------|---------|
| CreateStoreUI | SD-04 |
| CreateProductUI | SD-07 |
| ProductImageUI | SD-08 |
| HomepageUI | SD-10 |
| StorePageUI | SD-10 |
| ProductDetailUI | SD-12 |
| InquiryFormUI | SD-12 |
| InquiryListUI | SD-13 |
| InquiryDetailUI | SD-13 |
| AdminSellerUI | SD-14 |
| CategoryUI | SD-16 |

### Control Objects

| Object | Used In |
|--------|---------|
| StoreService | SD-04, SD-10 |
| ProductService | SD-07, SD-08, SD-10, SD-12 |
| StorageService | SD-08 |
| InquiryService | SD-12, SD-13 |
| EmailService | SD-12, SD-14 |
| AdminService | SD-14 |
| ProductGroupService | SD-16 |

### Entity Objects

| Object | Used In |
|--------|---------|
| User | SD-04, SD-14 |
| Store | SD-04, SD-07, SD-10, SD-12, SD-13 |
| Product | SD-07, SD-08, SD-10, SD-12, SD-16 |
| ProductGroup | SD-07, SD-10, SD-16 |
| ProductImage | SD-08, SD-12 |
| Inquiry | SD-12, SD-13 |
| Database | All |

---

## SD-04: Create Store

**Use Case:** Create Store

**Why Unique to Sellor:** Store creation is gated behind admin approval check + one-store-per-seller constraint + slug uniqueness.

**Participating Objects:**

- `<<boundary>>` CreateStoreUI
- `<<control>>` StoreService
- `<<entity>>` /current : User
- `<<entity>>` : Store (new)
- `<<entity>>` :Database

**Preconditions:**

- Seller is authenticated with valid JWT
- Seller has role = "seller"

**Postconditions (Success):**

- New Store record exists linked to seller's userId
- Store is publicly accessible at /store/{slug}

### Main Success Scenario

1. Seller -> CreateStoreUI : fillForm(name, slug, description, logo_url)
2. CreateStoreUI -> StoreService : createStore(storeData)
3. StoreService -> :Database : findUserById(userId)
4. :Database -> StoreService : return /current : User
5. StoreService -> /current : User : getApprovalStatus()
6. /current : User -> StoreService : return approved = true
7. StoreService -> StoreService : validateSlugFormat(slug)
8. StoreService -> :Database : findStoreBySlug(slug)
9. :Database -> StoreService : return null (no duplicate)
10. StoreService -> :Database : findStoreByOwner(userId)
11. :Database -> StoreService : return null (no existing store)
12. StoreService -> : Store : new Store(name, slug, description, logo_url, userId)
13. : Store -> StoreService : return newStore
14. StoreService -> :Database : save(newStore)
15. :Database -> StoreService : return saved
16. StoreService -> CreateStoreUI : return 201 + storeData
17. CreateStoreUI -> Seller : display "Store created" + redirect to dashboard

### alt — Logo provided or not (after step 1, sequence continues either way)

**[logo_url provided]:**

1. Steps 2–17 proceed normally
2. Store is created with seller's logo

**[logo_url empty]:**

1. Steps 2–17 proceed normally with logo_url = null
2. CreateStoreUI -> Seller : display store page with default placeholder image

> Both paths achieve the goal. Store is created either way.

### break — Seller not approved (at step 6, sequence stops)

After step 5:

**[approved = false]:**

1. /current : User -> StoreService : return approved = false
2. StoreService -> CreateStoreUI : return 403 "Seller not approved"
3. CreateStoreUI -> Seller : display "Your account is pending approval"
4. **Sequence ends. Steps 7–17 never execute.**

---

## SD-07: Create Product

**Use Case:** Create Product

**Why Unique to Sellor:** Product creation is auto-linked to the seller's store, and the category (group_id) must be validated as belonging to that same store.

**Participating Objects:**

- `<<boundary>>` CreateProductUI
- `<<control>>` ProductService
- `<<entity>>` /current : Store
- `<<entity>>` /selected : ProductGroup
- `<<entity>>` : Product (new)
- `<<entity>>` :Database

**Preconditions:**

- Seller is authenticated
- Seller has an existing store

**Postconditions (Success):**

- New Product record exists linked to seller's store
- Product is visible to buyers if status = "active"

### Main Success Scenario

1. Seller -> CreateProductUI : openCreateProductPage()
2. CreateProductUI -> ProductService : getMyCategories(token)
3. ProductService -> :Database : findStoreByOwner(userId)
4. :Database -> ProductService : return /current : Store
5. ProductService -> :Database : findGroupsByStore(storeId)
6. :Database -> ProductService : return categoryList
7. ProductService -> CreateProductUI : return categoryList
8. CreateProductUI -> Seller : display form with category dropdown
9. Seller -> CreateProductUI : fillForm(title, price, description, stock, status, group_id)
10. CreateProductUI -> ProductService : createProduct(productData)
11. ProductService -> ProductService : validateProductData(title, price)
12. ProductService -> :Database : findGroupById(group_id)
13. :Database -> ProductService : return /selected : ProductGroup
14. ProductService -> /selected : ProductGroup : getStoreId()
15. /selected : ProductGroup -> ProductService : return storeId
16. ProductService -> ProductService : verifyGroupBelongsToStore(group.storeId, seller.storeId)
17. ProductService -> : Product : new Product(title, price, description, stock, status, group_id, storeId)
18. : Product -> ProductService : return newProduct
19. ProductService -> :Database : save(newProduct)
20. :Database -> ProductService : return saved
21. ProductService -> CreateProductUI : return 201 + productData
22. CreateProductUI -> Seller : display "Product created"

### alt — Category selected or not (after step 9, sequence continues either way)

**[group_id provided]:**

1. Steps 10–22 proceed normally including steps 12–16 (category validation)

**[group_id is null]:**

1. CreateProductUI -> ProductService : createProduct(productData with group_id=null)
2. ProductService -> ProductService : validateProductData(title, price)
3. ProductService skips steps 12–16 (no category to validate)
4. ProductService -> : Product : new Product(title, price, description, stock, status, null, storeId)
5. : Product -> ProductService : return newProduct
6. ProductService -> :Database : save(newProduct)
7. :Database -> ProductService : return saved
8. ProductService -> CreateProductUI : return 201 + productData
9. CreateProductUI -> Seller : display "Product created (uncategorized)"

> Both paths achieve the goal. Product is created either way.

### break — Category does not belong to seller's store (at step 16, sequence stops)

After step 15:

**[group.storeId ≠ seller's storeId]:**

1. ProductService -> ProductService : verifyGroupBelongsToStore fails
2. ProductService -> CreateProductUI : return 400 "Invalid category"
3. CreateProductUI -> Seller : display error message
4. **Sequence ends. Steps 17–22 never execute.**

---

## SD-08: Upload Product Image

**Use Case:** Upload Product Image

**Why Unique to Sellor:** Ownership verification chain (user → store → product), 5-image limit per product, position-0-as-thumbnail convention.

**Participating Objects:**

- `<<boundary>>` ProductImageUI
- `<<control>>` ProductService
- `<<control>>` StorageService
- `<<entity>>` /selected : Product
- `<<entity>>` : ProductImage (new)
- `<<entity>>` :Database

**Preconditions:**

- Seller is authenticated
- Product exists and belongs to seller's store

**Postconditions (Success):**

- New ProductImage record exists linked to the product
- Image file saved in storage with UUID filename

### Main Success Scenario

1. Seller -> ProductImageUI : selectFile(file, position)
2. ProductImageUI -> ProductService : uploadImage(productId, file, position)
3. ProductService -> :Database : findProductById(productId)
4. :Database -> ProductService : return /selected : Product
5. ProductService -> /selected : Product : getStoreId()
6. /selected : Product -> ProductService : return storeId
7. ProductService -> ProductService : verifyOwnership(product.storeId, seller.storeId)
8. ProductService -> :Database : countImagesByProduct(productId)
9. :Database -> ProductService : return count = 3
10. ProductService -> ProductService : validateImageCount(count < 5)
11. ProductService -> StorageService : saveFile(file)
12. StorageService -> StorageService : validateFileAndGenerateUUID(file)
13. StorageService -> ProductService : return fileUrl
14. ProductService -> : ProductImage : new ProductImage(productId, fileUrl, position)
15. : ProductImage -> ProductService : return newImage
16. ProductService -> :Database : save(newImage)
17. :Database -> ProductService : return saved
18. ProductService -> ProductImageUI : return 201 + imageData
19. ProductImageUI -> Seller : display updated image gallery

### alt — First image or additional image (after step 14, sequence continues either way)

**[position = 0 (first image)]:**

1. Steps 14–19 proceed normally
2. ProductImageUI -> Seller : display thumbnail indicator on first image

**[position > 0 (additional image)]:**

1. Steps 14–19 proceed normally
2. ProductImageUI -> Seller : display image in gallery without thumbnail indicator

> Both paths achieve the goal. Image is uploaded either way.

### break — Maximum images reached (at step 10, sequence stops)

After step 9:

**[count = 5]:**

1. ProductService -> ProductService : validateImageCount fails
2. ProductService -> ProductImageUI : return 400 "Maximum 5 images per product"
3. ProductImageUI -> Seller : display error message
4. **Sequence ends. Steps 11–19 never execute.**

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
- `<<entity>>` :Database

**Preconditions:**

- None (public access)

**Postconditions (Success):**

- Visitor sees paginated store listing
- Visitor sees specific store's active products with category sidebar

### Main Success Scenario

1. Visitor -> HomepageUI : openHomepage()
2. HomepageUI -> StoreService : listStores(page, limit)
3. StoreService -> :Database : findAllStoresPaginated(page, limit)
4. :Database -> StoreService : return storeList
5. StoreService -> HomepageUI : return storeList
6. HomepageUI -> Visitor : display store card grid
7. Visitor -> HomepageUI : clickStoreCard(slug)
8. HomepageUI -> StorePageUI : navigate(/store/{slug})
9. StorePageUI -> StoreService : getStoreBySlug(slug)
10. StoreService -> :Database : findStoreBySlug(slug)
11. :Database -> StoreService : return /selected : Store
12. StoreService -> StorePageUI : return storeDetail
13. StorePageUI -> ProductService : getStoreProducts(storeId, page, limit)
14. ProductService -> :Database : findActiveProductsByStore(storeId, page, limit)
15. :Database -> ProductService : return productList
16. ProductService -> StorePageUI : return productList
17. StorePageUI -> StoreService : getStoreGroups(storeId)
18. StoreService -> :Database : findGroupsByStore(storeId)
19. :Database -> StoreService : return groupList with counts
20. StoreService -> StorePageUI : return groupList
21. StorePageUI -> Visitor : display store header + product grid + category sidebar

### alt — Filter by category or view all (after step 21, sequence continues either way)

**[visitor clicks a category in sidebar]:**

1. Visitor -> StorePageUI : filterByCategory(group_id)
2. StorePageUI -> ProductService : getStoreProducts(storeId, group_id, page)
3. ProductService -> :Database : findActiveProductsByStore(storeId, group_id)
4. :Database -> ProductService : return filteredProductList
5. ProductService -> StorePageUI : return filteredProductList
6. StorePageUI -> Visitor : display filtered product grid

**[visitor does not filter]:**

1. Visitor continues browsing the full product grid from step 21

> Both paths are valid. The page is already loaded.

### break — Store slug not found (at step 11, sequence stops)

After step 10:

**[slug does not exist]:**

1. :Database -> StoreService : return null
2. StoreService -> StorePageUI : return 404 "Store not found"
3. StorePageUI -> Visitor : display "Store not found" page
4. **Sequence ends. Steps 12–21 never execute.**

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
- `<<entity>>` : Inquiry (new)
- `<<entity>>` :Database

**Preconditions:**

- None (public access, no authentication required)

**Postconditions (Success):**

- Visitor has viewed full product details
- New Inquiry record exists with status = "new"
- Seller has received email notification

### Main Success Scenario

1. Visitor -> ProductDetailUI : clickProduct(productId)
2. ProductDetailUI -> ProductService : getProduct(productId)
3. ProductService -> :Database : findProductById(productId)
4. :Database -> ProductService : return /selected : Product
5. ProductService -> /selected : Product : getStatus()
6. /selected : Product -> ProductService : return status = "active"
7. ProductService -> ProductService : verifyProductIsVisible(status ≠ "hidden")
8. ProductService -> :Database : findImagesByProduct(productId)
9. :Database -> ProductService : return imageList
10. ProductService -> ProductDetailUI : return productData + imageList + storeInfo
11. ProductDetailUI -> Visitor : display product page with gallery
12. Visitor -> InquiryFormUI : clickContactSeller()
13. Visitor -> InquiryFormUI : fillForm(name, email, message)
14. InquiryFormUI -> InquiryService : submitInquiry(productId, name, email, message)
15. InquiryService -> InquiryService : validateInquiryData(name, email, message)
16. InquiryService -> :Database : findProductById(productId)
17. :Database -> InquiryService : return /selected : Product
18. InquiryService -> :Database : findStoreById(product.storeId)
19. :Database -> InquiryService : return /selected : Store
20. InquiryService -> : Inquiry : new Inquiry(productId, storeId, name, email, message, status="new")
21. : Inquiry -> InquiryService : return newInquiry
22. InquiryService -> :Database : save(newInquiry)
23. :Database -> InquiryService : return saved
24. InquiryService -> EmailService : sendNotification(store.sellerEmail, productTitle, name, message)
25. EmailService -> EmailService : composeAndSendEmail()
26. EmailService -> InquiryService : return sent = true
27. InquiryService -> InquiryFormUI : return 201
28. InquiryFormUI -> Visitor : display "Inquiry sent successfully"

### alt — Email sends or fails (after step 23, sequence continues either way)

**[email sends successfully]:**

1. InquiryService -> EmailService : sendNotification(sellerEmail, productTitle, name, message)
2. EmailService -> EmailService : composeAndSendEmail()
3. EmailService -> InquiryService : return sent = true
4. InquiryService -> InquiryFormUI : return 201
5. InquiryFormUI -> Visitor : display "Inquiry sent successfully"

**[email service unavailable]:**

1. InquiryService -> EmailService : sendNotification(sellerEmail, productTitle, name, message)
2. EmailService -> EmailService : composeAndSendEmail() fails
3. EmailService -> InquiryService : return sent = false
4. InquiryService -> InquiryService : logEmailFailure() (inquiry already saved at step 23)
5. InquiryService -> InquiryFormUI : return 201
6. InquiryFormUI -> Visitor : display "Inquiry sent successfully"

> Both paths achieve the goal. Inquiry is saved regardless.

### break — Product is hidden (at step 7, sequence stops)

After step 6:

**[status = "hidden"]:**

1. ProductService -> ProductService : verifyProductIsVisible fails
2. ProductService -> ProductDetailUI : return 404 "Product not found"
3. ProductDetailUI -> Visitor : display "Product not found" page
4. **Sequence ends. Steps 8–28 never execute.**

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
- `<<entity>>` :Database

**Preconditions:**

- Seller is authenticated
- Seller has an existing store with inquiries

**Postconditions (Success):**

- Seller has viewed inquiry details
- Inquiry status updated to "replied"

### Main Success Scenario

1. Seller -> InquiryListUI : openInquiriesPage()
2. InquiryListUI -> InquiryService : getInquiries(token, page, limit)
3. InquiryService -> :Database : findStoreByOwner(userId)
4. :Database -> InquiryService : return /current : Store
5. InquiryService -> :Database : findInquiriesByStore(storeId, page, limit)
6. :Database -> InquiryService : return inquiryList
7. InquiryService -> InquiryListUI : return inquiryList
8. InquiryListUI -> Seller : display inquiry table
9. Seller -> InquiryListUI : clickInquiryRow(inquiryId)
10. InquiryListUI -> InquiryDetailUI : navigate(inquiryId)
11. InquiryDetailUI -> InquiryService : getInquiry(inquiryId)
12. InquiryService -> :Database : findInquiryById(inquiryId)
13. :Database -> InquiryService : return /selected : Inquiry
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
24. InquiryService -> :Database : update(/selected : Inquiry)
25. :Database -> InquiryService : return saved
26. InquiryService -> InquiryDetailUI : return 200
27. InquiryDetailUI -> Seller : display updated status badge

### alt — View all or filter by status (after step 2, sequence continues either way)

**[no filter applied]:**

1. Steps 2–8 proceed normally, all inquiries returned

**[seller selects status filter = "new"]:**

1. InquiryListUI -> InquiryService : getInquiries(token, status="new", page)
2. InquiryService -> :Database : findStoreByOwner(userId)
3. :Database -> InquiryService : return /current : Store
4. InquiryService -> :Database : findInquiriesByStore(storeId, status="new", page, limit)
5. :Database -> InquiryService : return filteredInquiryList
6. InquiryService -> InquiryListUI : return filteredInquiryList
7. InquiryListUI -> Seller : display only new inquiries

> Both paths achieve the goal. Seller views inquiries either way.

### break — Inquiry does not belong to seller's store (at step 16, sequence stops)

After step 15:

**[inquiry.storeId ≠ seller.storeId]:**

1. InquiryService -> InquiryService : verifyBelongsToStore fails
2. InquiryService -> InquiryDetailUI : return 403 "Forbidden"
3. InquiryDetailUI -> Seller : display "Access denied"
4. **Sequence ends. Steps 17–27 never execute.**

---

## SD-14: Admin Approves / Rejects Sellers

**Use Case:** Approve or Reject Seller Application

**Why Unique to Sellor:** Seller approval workflow is the trust mechanism for the marketplace, gating store creation behind human review.

**Participating Objects:**

- `<<boundary>>` AdminSellerUI
- `<<control>>` AdminService
- `<<control>>` EmailService
- `<<entity>>` /selected : User
- `<<entity>>` :Database

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
3. AdminService -> :Database : findSellersWhereApproved(false)
4. :Database -> AdminService : return pendingSellerList
5. AdminService -> AdminSellerUI : return pendingSellerList
6. AdminSellerUI -> Admin : display pending sellers table
7. Admin -> AdminSellerUI : clickApprove(userId)
8. AdminSellerUI -> AdminService : approveSeller(userId, approve=true)
9. AdminService -> :Database : findUserById(userId)
10. :Database -> AdminService : return /selected : User
11. AdminService -> /selected : User : getRole()
12. /selected : User -> AdminService : return role = "seller"
13. AdminService -> AdminService : verifyRole(role = "seller")
14. AdminService -> /selected : User : setSellingApprove(true)
15. /selected : User -> AdminService : return updated
16. AdminService -> :Database : update(/selected : User)
17. :Database -> AdminService : return saved
18. AdminService -> EmailService : sendApprovalEmail(user.email)
19. EmailService -> EmailService : composeAndSendEmail()
20. EmailService -> AdminService : return sent = true
21. AdminService -> AdminSellerUI : return 200
22. AdminSellerUI -> Admin : remove seller from pending list + display success

### alt — Approve or Reject (after step 6, sequence continues either way)

**[Admin clicks "Approve"]:**

1. Steps 7–22 proceed as main success scenario
2. /selected : User is updated with selling_approve = true
3. Approval email sent

**[Admin clicks "Reject"]:**

1. Admin -> AdminSellerUI : clickReject(userId)
2. AdminSellerUI -> AdminService : approveSeller(userId, approve=false)
3. AdminService -> :Database : findUserById(userId)
4. :Database -> AdminService : return /selected : User
5. AdminService -> /selected : User : getRole()
6. /selected : User -> AdminService : return role = "seller"
7. AdminService -> AdminService : verifyRole(role = "seller")
8. AdminService -> /selected : User : setSellingApprove(false)
9. /selected : User -> AdminService : return updated
10. AdminService -> :Database : update(/selected : User)
11. :Database -> AdminService : return saved
12. AdminService -> EmailService : sendRejectionEmail(user.email)
13. EmailService -> EmailService : composeAndSendEmail()
14. EmailService -> AdminService : return sent = true
15. AdminService -> AdminSellerUI : return 200
16. AdminSellerUI -> Admin : remove seller from pending list + display "Rejected"

> Both paths achieve the admin's goal — making a decision on the application.

### break — User is not a seller role (at step 13, sequence stops)

After step 12:

**[role ≠ "seller"]:**

1. AdminService -> AdminService : verifyRole fails
2. AdminService -> AdminSellerUI : return 400 "User is not a seller"
3. AdminSellerUI -> Admin : display error message
4. **Sequence ends. Steps 14–22 never execute.**

---

## SD-16: Seller Manages Product Categories

**Use Case:** Manage Product Categories

**Why Unique to Sellor:** Categories are store-scoped (not platform-wide). Deletion cascades to uncategorize products. Uniqueness constraint is per-store, not global.

**Participating Objects:**

- `<<boundary>>` CategoryUI
- `<<control>>` ProductGroupService
- `<<entity>>` : ProductGroup (new)
- `<<entity>>` /selected : ProductGroup
- `<<entity>>` :Database

**Preconditions:**

- Seller is authenticated
- Seller has an existing store

**Postconditions (Success — Create):**

- New ProductGroup record exists linked to seller's store
- Category name is unique within the store

**Postconditions (Success — Delete):**

- ProductGroup record removed
- All products in that category have group_id set to null

### Main Success Scenario

1. Seller -> CategoryUI : openCategoriesPage()
2. CategoryUI -> ProductGroupService : getMyCategories(token)
3. ProductGroupService -> :Database : findGroupsByStore(storeId)
4. :Database -> ProductGroupService : return groupList with product counts
5. ProductGroupService -> CategoryUI : return groupList
6. CategoryUI -> Seller : display category list
7. Seller -> CategoryUI : clickAddCategory()
8. Seller -> CategoryUI : enterName("Bracelets")
9. CategoryUI -> ProductGroupService : createCategory("Bracelets")
10. ProductGroupService -> ProductGroupService : validateName("Bracelets")
11. ProductGroupService -> :Database : findGroupByStoreAndName(storeId, "Bracelets")
12. :Database -> ProductGroupService : return null (no duplicate)
13. ProductGroupService -> : ProductGroup : new ProductGroup(storeId, "Bracelets")
14. : ProductGroup -> ProductGroupService : return newGroup
15. ProductGroupService -> :Database : save(newGroup)
16. :Database -> ProductGroupService : return saved
17. ProductGroupService -> CategoryUI : return 201 + groupData
18. CategoryUI -> Seller : add new category to list

### alt — Create or Delete category (after step 6, sequence continues either way)

**[Seller clicks "Add Category"]:**

1. Steps 7–18 proceed as main success scenario

**[Seller clicks "Delete" on existing category]:**

1. Seller -> CategoryUI : clickDelete(groupId)
2. CategoryUI -> ProductGroupService : deleteCategory(groupId)
3. ProductGroupService -> :Database : findGroupById(groupId)
4. :Database -> ProductGroupService : return /selected : ProductGroup
5. ProductGroupService -> /selected : ProductGroup : getStoreId()
6. /selected : ProductGroup -> ProductGroupService : return storeId
7. ProductGroupService -> ProductGroupService : verifyBelongsToStore(group.storeId, seller.storeId)
8. ProductGroupService -> :Database : setGroupNullOnProducts(groupId)
9. :Database -> ProductGroupService : return updated
10. ProductGroupService -> :Database : delete(/selected : ProductGroup)
11. :Database -> ProductGroupService : return deleted
12. ProductGroupService -> CategoryUI : return 204
13. CategoryUI -> Seller : remove category from list

> Both paths achieve the goal. Category is either created or deleted successfully.

### break — Duplicate category name (at step 12, sequence stops)

After step 11:

**[same name exists in store]:**

1. :Database -> ProductGroupService : return existingGroup
2. ProductGroupService -> CategoryUI : return 400 "Category name already exists"
3. CategoryUI -> Seller : display error message
4. **Sequence ends. Steps 13–18 never execute.**

---

## Summary Table

| # | Diagram | alt (if-else, continues) | break (stops) |
|---|---------|--------------------------|---------------|
| SD-04 | Create Store | Logo provided or not | Seller not approved |
| SD-07 | Create Product | Category selected or not | Category not in seller's store |
| SD-08 | Upload Product Image | First image (thumbnail) or additional | Maximum 5 images reached |
| SD-10 | Browse & View Store | Filter by category or view all | Store slug not found |
| SD-12 | View Product & Inquiry | Email sends or fails | Product is hidden |
| SD-13 | Manage Inquiries | Filter by status or view all | Inquiry not in seller's store |
| SD-14 | Admin Approve/Reject | Approve or reject decision | User is not a seller role |
| SD-16 | Manage Categories | Create or delete category | Duplicate category name |

---

*End of Document*
