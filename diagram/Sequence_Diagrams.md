# Sellor — Sequence Diagram Specifications

**Project:** Sellor Multi-Store E-Commerce Platform  
**Version:** 1.0  
**Date:** April 3, 2026  
**Notation:** Boundary-Control-Entity (BCE) with Combined Fragments (alt / break)

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

---

## SD-04: Create Store

**Use Case:** Create Store

**Why Unique to Sellor:** Store creation is gated behind admin approval check + one-store-per-seller constraint + slug uniqueness. This three-layer validation before creation is specific to Sellor's marketplace model.

**Participating Objects:**

- `<<boundary>>` CreateStoreUI
- `<<control>>` StoreService
- `<<entity>>` User
- `<<entity>>` Store

**Preconditions:**

- Seller is authenticated with valid JWT
- Seller has role = "seller"

**Postconditions (Success):**

- New Store record exists linked to seller's userId
- Store is publicly accessible at /store/{slug}

### Main Success Scenario

1. Seller -> CreateStoreUI : fillForm(name, slug, description, logo_url)
2. CreateStoreUI -> StoreService : createStore(token, storeData)
3. StoreService -> User : getSellerApprovalStatus(userId)
4. User -> StoreService : return approved = true
5. StoreService -> Store : findByOwner(userId)
6. Store -> StoreService : return null
7. StoreService -> Store : findBySlug(slug)
8. Store -> StoreService : return null
9. StoreService -> StoreService : validateStoreData(storeData)
10. StoreService -> Store : create(name, slug, description, logo_url, userId)
11. Store -> Store : new Store(name, slug, description, logo_url, userId)
12. Store -> StoreService : return newStore
13. StoreService -> CreateStoreUI : return 201 + storeData
14. CreateStoreUI -> Seller : display "Store created" + redirect to dashboard

### alt — Logo provided or not (after step 1, sequence continues either way)

**[logo_url provided]:**

1. Seller -> CreateStoreUI : fillForm(name, slug, description, logo_url)
2. Steps 2–14 proceed normally
3. Store is created with seller's logo

**[logo_url empty]:**

1. Seller -> CreateStoreUI : fillForm(name, slug, description, null)
2. Steps 2–14 proceed normally
3. Store is created with logo_url = null
4. CreateStoreUI -> Seller : display store page with default placeholder image

> Both paths achieve the goal. The sequence continues regardless.

### break — Seller not approved (at step 4, sequence stops)

After step 3:

**[approved = false]:**

1. User -> StoreService : return approved = false
2. StoreService -> CreateStoreUI : return 403 "Seller not approved"
3. CreateStoreUI -> Seller : display "Your account is pending approval"
4. **Sequence ends. Steps 5–14 never execute.**

---

## SD-07: Create Product

**Use Case:** Create Product

**Why Unique to Sellor:** Product creation is auto-linked to the seller's store, and the category (group_id) must be validated as belonging to that same store. Not a generic product CRUD.

**Participating Objects:**

- `<<boundary>>` CreateProductUI
- `<<control>>` ProductService
- `<<entity>>` Store
- `<<entity>>` Product
- `<<entity>>` ProductGroup

**Preconditions:**

- Seller is authenticated
- Seller has an existing store

**Postconditions (Success):**

- New Product record exists linked to seller's store
- Product is visible to buyers if status = "active"

### Main Success Scenario

1. Seller -> CreateProductUI : openCreateProductPage()
2. CreateProductUI -> ProductService : getMyCategories(token)
3. ProductService -> Store : findByOwner(userId)
4. Store -> ProductService : return store
5. ProductService -> ProductGroup : findByStore(storeId)
6. ProductGroup -> ProductService : return categoryList
7. ProductService -> CreateProductUI : return categoryList
8. CreateProductUI -> Seller : display form with category dropdown
9. Seller -> CreateProductUI : fillForm(title, price, description, stock, status, group_id)
10. CreateProductUI -> ProductService : createProduct(token, productData)
11. ProductService -> ProductService : validateProductData(productData)
12. ProductService -> ProductGroup : findById(group_id)
13. ProductGroup -> ProductService : return group
14. ProductService -> ProductService : verifyGroupBelongsToStore(group.storeId, storeId)
15. ProductService -> Product : create(title, price, description, stock, status, group_id, storeId)
16. Product -> Product : new Product(title, price, description, stock, status, group_id, storeId)
17. Product -> ProductService : return newProduct
18. ProductService -> CreateProductUI : return 201 + productData
19. CreateProductUI -> Seller : display "Product created" + redirect to product list

### alt — Category selected or not (after step 9, sequence continues either way)

**[group_id provided]:**

1. Steps 10–19 proceed normally including steps 12–14 (category validation)

**[group_id is null]:**

1. CreateProductUI -> ProductService : createProduct(token, productData with group_id=null)
2. ProductService -> ProductService : validateProductData(productData)
3. ProductService skips steps 12–14 (no category to validate)
4. ProductService -> Product : create(title, price, description, stock, status, null, storeId)
5. Product -> Product : new Product(... group_id=null ...)
6. Product -> ProductService : return newProduct
7. ProductService -> CreateProductUI : return 201 + productData
8. CreateProductUI -> Seller : display "Product created (uncategorized)"

> Both paths achieve the goal. Product is created either way.

### break — Category does not belong to seller's store (at step 14, sequence stops)

After step 13:

**[group.storeId ≠ seller's storeId]:**

1. ProductService -> ProductService : verifyGroupBelongsToStore fails
2. ProductService -> CreateProductUI : return 400 "Invalid category"
3. CreateProductUI -> Seller : display error message
4. **Sequence ends. Steps 15–19 never execute.**

---

## SD-08: Upload Product Image

**Use Case:** Upload Product Image

**Why Unique to Sellor:** Ownership verification chain (user → store → product), combined with a 5-image limit per product, position-based ordering, and position-0-as-thumbnail convention.

**Participating Objects:**

- `<<boundary>>` ProductImageUI
- `<<control>>` ProductService
- `<<control>>` StorageService
- `<<entity>>` Product
- `<<entity>>` ProductImage

**Preconditions:**

- Seller is authenticated
- Product exists and belongs to seller's store
- Product has fewer than 5 images

**Postconditions (Success):**

- New ProductImage record exists linked to the product
- Image file saved in storage with UUID filename

### Main Success Scenario

1. Seller -> ProductImageUI : selectFile(file, position)
2. ProductImageUI -> ProductService : uploadImage(token, productId, file, position)
3. ProductService -> Product : findById(productId)
4. Product -> ProductService : return product
5. ProductService -> ProductService : verifyOwnership(product.storeId, seller.storeId)
6. ProductService -> ProductImage : countByProduct(productId)
7. ProductImage -> ProductService : return count = 3
8. ProductService -> ProductService : validateImageCount(count < 5)
9. ProductService -> StorageService : saveFile(file)
10. StorageService -> StorageService : validateMimeType(file)
11. StorageService -> StorageService : validateFileSize(file, maxSize=5MB)
12. StorageService -> StorageService : generateUUIDFilename()
13. StorageService -> StorageService : writeFileToDisk(file, uuidFilename)
14. StorageService -> ProductService : return fileUrl
15. ProductService -> ProductImage : create(productId, fileUrl, position)
16. ProductImage -> ProductImage : new ProductImage(productId, fileUrl, position)
17. ProductImage -> ProductService : return newImage
18. ProductService -> ProductImageUI : return 201 + imageData
19. ProductImageUI -> Seller : display updated image gallery

### alt — First image or additional image (after step 15, sequence continues either way)

**[position = 0 (first image)]:**

1. Steps 15–19 proceed normally
2. ProductImageUI -> ProductImageUI : markAsThumbnail(position=0)
3. ProductImageUI -> Seller : display thumbnail indicator on first image

**[position > 0 (additional image)]:**

1. Steps 15–19 proceed normally
2. ProductImageUI -> Seller : display image in gallery without thumbnail indicator

> Both paths achieve the goal. Image is uploaded either way.

### break — Maximum images reached (at step 8, sequence stops)

After step 7:

**[count = 5]:**

1. ProductService -> ProductService : validateImageCount fails
2. ProductService -> ProductImageUI : return 400 "Maximum 5 images per product"
3. ProductImageUI -> Seller : display error message
4. **Sequence ends. Steps 9–19 never execute.**

---

## SD-10: Browse Stores & View Store Page

**Use Case:** Browse Stores and View Store Page

**Why Unique to Sellor:** Core marketplace browsing — visitor goes from homepage store grid → individual store page → store's products filtered by that store's own categories. Slug-based public URL and store-scoped category sidebar are Sellor-specific.

**Participating Objects:**

- `<<boundary>>` HomepageUI
- `<<boundary>>` StorePageUI
- `<<control>>` StoreService
- `<<control>>` ProductService
- `<<entity>>` Store
- `<<entity>>` Product
- `<<entity>>` ProductGroup

**Preconditions:**

- None (public access)

**Postconditions (Success):**

- Visitor sees paginated store listing
- Visitor sees specific store's active products with category sidebar

### Main Success Scenario

1. Visitor -> HomepageUI : openHomepage()
2. HomepageUI -> StoreService : listStores(page=1, limit=20)
3. StoreService -> Store : findAllPaginated(page, limit)
4. Store -> StoreService : return storeList + totalCount
5. StoreService -> HomepageUI : return storeList
6. HomepageUI -> Visitor : display store card grid
7. Visitor -> HomepageUI : clickStoreCard(slug)
8. HomepageUI -> StorePageUI : navigate(/store/{slug})
9. StorePageUI -> StoreService : getStoreBySlug(slug)
10. StoreService -> Store : findBySlug(slug)
11. Store -> StoreService : return storeDetail
12. StoreService -> StorePageUI : return storeDetail
13. StorePageUI -> ProductService : getStoreProducts(storeId, page=1, limit=20)
14. ProductService -> Product : findActiveByStore(storeId, page, limit)
15. Product -> ProductService : return productList
16. ProductService -> StorePageUI : return productList
17. StorePageUI -> StoreService : getStoreGroups(storeId)
18. StoreService -> ProductGroup : findByStore(storeId)
19. ProductGroup -> StoreService : return groupList with counts
20. StoreService -> StorePageUI : return groupList
21. StorePageUI -> Visitor : display store header + product grid + category sidebar

### alt — Visitor filters by category or views all (after step 21, sequence continues either way)

**[visitor clicks a category in sidebar]:**

1. Visitor -> StorePageUI : filterByCategory(group_id)
2. StorePageUI -> ProductService : getStoreProducts(storeId, group_id, page=1)
3. ProductService -> ProductService : buildFilterQuery(storeId, group_id)
4. ProductService -> Product : findActiveByStore(storeId, group_id)
5. Product -> ProductService : return filteredProductList
6. ProductService -> StorePageUI : return filteredProductList
7. StorePageUI -> Visitor : display filtered product grid

**[visitor does not filter]:**

1. Visitor continues browsing the full product grid from step 21

> Both paths are valid browsing experiences. The page is already loaded.

### break — Store slug not found (at step 11, sequence stops)

After step 10:

**[slug does not exist]:**

1. Store -> StoreService : return null
2. StoreService -> StorePageUI : return 404 "Store not found"
3. StorePageUI -> Visitor : display "Store not found" page
4. **Sequence ends. Steps 12–21 never execute.**

---

## SD-12: View Product Detail & Submit Inquiry

**Use Case:** View Product Detail and Submit Inquiry

**Why Unique to Sellor:** Core buyer-seller connection flow. A public visitor (no account needed) submits an inquiry tied to a specific product, creating a record linked to the store and triggering an email to the seller. The no-auth-required inquiry submission is a deliberate Sellor design choice.

**Participating Objects:**

- `<<boundary>>` ProductDetailUI
- `<<boundary>>` InquiryFormUI
- `<<control>>` ProductService
- `<<control>>` InquiryService
- `<<control>>` EmailService
- `<<entity>>` Product
- `<<entity>>` ProductImage
- `<<entity>>` Inquiry
- `<<entity>>` Store

**Preconditions:**

- None (public access, no authentication required)

**Postconditions (Success):**

- Visitor has viewed full product details with images
- New Inquiry record exists with status = "new"
- Seller has received email notification

### Main Success Scenario

1. Visitor -> ProductDetailUI : clickProduct(productId)
2. ProductDetailUI -> ProductService : getProduct(productId)
3. ProductService -> Product : findById(productId)
4. Product -> ProductService : return productData
5. ProductService -> ProductService : verifyProductIsVisible(status ≠ "hidden")
6. ProductService -> ProductImage : findByProduct(productId)
7. ProductImage -> ProductService : return imageList
8. ProductService -> ProductDetailUI : return productData + imageList + storeInfo
9. ProductDetailUI -> Visitor : display product page with gallery
10. Visitor -> InquiryFormUI : clickContactSeller()
11. Visitor -> InquiryFormUI : fillForm(name, email, message)
12. InquiryFormUI -> InquiryService : submitInquiry(productId, name, email, message)
13. InquiryService -> InquiryService : validateInquiryData(name, email, message)
14. InquiryService -> Product : findById(productId)
15. Product -> InquiryService : return product
16. InquiryService -> Store : findById(product.storeId)
17. Store -> InquiryService : return store
18. InquiryService -> Inquiry : create(productId, storeId, name, email, message, status="new")
19. Inquiry -> Inquiry : new Inquiry(productId, storeId, name, email, message, status="new")
20. Inquiry -> InquiryService : return newInquiry
21. InquiryService -> EmailService : sendNotification(store.sellerEmail, productTitle, name, message)
22. EmailService -> EmailService : composeAndSendEmail()
23. EmailService -> InquiryService : return sent = true
24. InquiryService -> InquiryFormUI : return 201
25. InquiryFormUI -> Visitor : display "Inquiry sent successfully"

### alt — Email sends or fails (after step 20, sequence continues either way)

**[email sends successfully]:**

1. InquiryService -> EmailService : sendNotification(store.sellerEmail, productTitle, name, message)
2. EmailService -> EmailService : composeAndSendEmail()
3. EmailService -> InquiryService : return sent = true
4. InquiryService -> InquiryFormUI : return 201
5. InquiryFormUI -> Visitor : display "Inquiry sent successfully"

**[email service unavailable]:**

1. InquiryService -> EmailService : sendNotification(store.sellerEmail, productTitle, name, message)
2. EmailService -> EmailService : composeAndSendEmail() fails
3. EmailService -> InquiryService : return sent = false
4. InquiryService -> InquiryService : logEmailFailure() (inquiry already saved at step 20)
5. InquiryService -> InquiryFormUI : return 201
6. InquiryFormUI -> Visitor : display "Inquiry sent successfully"

> Both paths achieve the goal. The inquiry is saved regardless. Seller sees it in dashboard later if email fails.

### break — Product is hidden (at step 5, sequence stops)

After step 4:

**[status = "hidden"]:**

1. ProductService -> ProductService : verifyProductIsVisible fails
2. ProductService -> ProductDetailUI : return 404 "Product not found"
3. ProductDetailUI -> Visitor : display "Product not found" page
4. **Sequence ends. Steps 6–25 never execute.**

---

## SD-13: Seller Manages Inquiries

**Use Case:** Manage Inquiries

**Why Unique to Sellor:** The inquiry lifecycle (new → replied → closed) with manual status tracking is Sellor's workaround for not having an in-platform messaging system. The seller responds externally via email then manually updates status.

**Participating Objects:**

- `<<boundary>>` InquiryListUI
- `<<boundary>>` InquiryDetailUI
- `<<control>>` InquiryService
- `<<entity>>` Store
- `<<entity>>` Inquiry

**Preconditions:**

- Seller is authenticated
- Seller has an existing store with inquiries

**Postconditions (Success):**

- Seller has viewed inquiry details
- Inquiry status updated to "replied"

### Main Success Scenario

1. Seller -> InquiryListUI : openInquiriesPage()
2. InquiryListUI -> InquiryService : getInquiries(token, page=1, limit=20)
3. InquiryService -> Store : findByOwner(userId)
4. Store -> InquiryService : return store
5. InquiryService -> Inquiry : findByStore(storeId, page, limit)
6. Inquiry -> InquiryService : return inquiryList
7. InquiryService -> InquiryListUI : return inquiryList
8. InquiryListUI -> Seller : display inquiry table
9. Seller -> InquiryListUI : clickInquiryRow(inquiryId)
10. InquiryListUI -> InquiryDetailUI : navigate(inquiryId)
11. InquiryDetailUI -> InquiryService : getInquiry(token, inquiryId)
12. InquiryService -> Inquiry : findById(inquiryId)
13. Inquiry -> InquiryService : return inquiryDetail
14. InquiryService -> InquiryService : verifyBelongsToStore(inquiry.storeId, seller.storeId)
15. InquiryService -> InquiryDetailUI : return inquiryDetail
16. InquiryDetailUI -> Seller : display full inquiry (message, buyer email, product link)
17. Seller responds to buyer via external email
18. Seller -> InquiryDetailUI : clickMarkAsReplied(inquiryId)
19. InquiryDetailUI -> InquiryService : updateStatus(token, inquiryId, "replied")
20. InquiryService -> InquiryService : validateStatusTransition("new" -> "replied")
21. InquiryService -> Inquiry : update(inquiryId, status="replied")
22. Inquiry -> InquiryService : return updatedInquiry
23. InquiryService -> InquiryDetailUI : return 200
24. InquiryDetailUI -> Seller : display updated status badge

### alt — View all inquiries or filter by status (after step 2, sequence continues either way)

**[no filter applied]:**

1. Steps 2–8 proceed normally, all inquiries returned

**[seller selects status filter = "new"]:**

1. InquiryListUI -> InquiryService : getInquiries(token, status="new", page=1)
2. InquiryService -> Store : findByOwner(userId)
3. Store -> InquiryService : return store
4. InquiryService -> Inquiry : findByStore(storeId, status="new", page, limit)
5. Inquiry -> InquiryService : return filteredInquiryList
6. InquiryService -> InquiryListUI : return filteredInquiryList
7. InquiryListUI -> Seller : display only new inquiries

> Both paths achieve the goal. Seller views inquiries either way.

### break — Inquiry does not belong to seller's store (at step 14, sequence stops)

After step 13:

**[inquiry.storeId ≠ seller.storeId]:**

1. InquiryService -> InquiryService : verifyBelongsToStore fails
2. InquiryService -> InquiryDetailUI : return 403 "Forbidden"
3. InquiryDetailUI -> Seller : display "Access denied"
4. **Sequence ends. Steps 15–24 never execute.**

---

## SD-14: Admin Approves / Rejects Sellers

**Use Case:** Approve or Reject Seller Application

**Why Unique to Sellor:** The seller approval workflow is the trust mechanism for the marketplace. It gates store creation behind human review — central to Sellor's quality control strategy.

**Participating Objects:**

- `<<boundary>>` AdminSellerUI
- `<<control>>` AdminService
- `<<control>>` EmailService
- `<<entity>>` User

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
3. AdminService -> User : findSellersWhereApproved(false)
4. User -> AdminService : return pendingSellerList
5. AdminService -> AdminSellerUI : return pendingSellerList
6. AdminSellerUI -> Admin : display pending sellers table
7. Admin -> AdminSellerUI : clickApprove(userId)
8. AdminSellerUI -> AdminService : approveSeller(token, userId, approve=true)
9. AdminService -> User : findById(userId)
10. User -> AdminService : return userRecord
11. AdminService -> AdminService : verifyRole(userRecord.role = "seller")
12. AdminService -> User : update(userId, selling_approve=true)
13. User -> AdminService : return updatedUser
14. AdminService -> EmailService : sendApprovalEmail(userRecord.email)
15. EmailService -> EmailService : composeAndSendEmail()
16. EmailService -> AdminService : return sent = true
17. AdminService -> AdminSellerUI : return 200
18. AdminSellerUI -> Admin : remove seller from pending list + display success

### alt — Approve or Reject (after step 6, sequence continues either way)

**[Admin clicks "Approve"]:**

1. Steps 7–18 proceed as main success scenario
2. AdminService -> User : update(userId, selling_approve=true)
3. AdminService -> EmailService : sendApprovalEmail(userRecord.email)

**[Admin clicks "Reject"]:**

1. Admin -> AdminSellerUI : clickReject(userId)
2. AdminSellerUI -> AdminService : approveSeller(token, userId, approve=false)
3. AdminService -> User : findById(userId)
4. User -> AdminService : return userRecord
5. AdminService -> AdminService : verifyRole(userRecord.role = "seller")
6. AdminService -> User : update(userId, selling_approve=false)
7. User -> AdminService : return updatedUser
8. AdminService -> EmailService : sendRejectionEmail(userRecord.email)
9. EmailService -> EmailService : composeAndSendEmail()
10. EmailService -> AdminService : return sent = true
11. AdminService -> AdminSellerUI : return 200
12. AdminSellerUI -> Admin : remove seller from pending list + display "Rejected"

> Both paths achieve the admin's goal — making a decision on the application.

### break — User is not a seller role (at step 11, sequence stops)

After step 10:

**[userRecord.role ≠ "seller"]:**

1. AdminService -> AdminService : verifyRole fails
2. AdminService -> AdminSellerUI : return 400 "User is not a seller"
3. AdminSellerUI -> Admin : display error message
4. **Sequence ends. Steps 12–18 never execute.**

---

## SD-16: Seller Manages Product Categories

**Use Case:** Manage Product Categories

**Why Unique to Sellor:** Categories are store-scoped (not platform-wide), each seller creates their own taxonomy. Deletion cascades to uncategorize products rather than deleting them. Uniqueness constraint is per-store, not global.

**Participating Objects:**

- `<<boundary>>` CategoryUI
- `<<control>>` ProductGroupService
- `<<entity>>` ProductGroup
- `<<entity>>` Product

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
3. ProductGroupService -> ProductGroup : findByStore(storeId)
4. ProductGroup -> ProductGroupService : return groupList with product counts
5. ProductGroupService -> CategoryUI : return groupList
6. CategoryUI -> Seller : display category list
7. Seller -> CategoryUI : clickAddCategory()
8. Seller -> CategoryUI : enterName("Bracelets")
9. CategoryUI -> ProductGroupService : createCategory(token, "Bracelets")
10. ProductGroupService -> ProductGroupService : validateName("Bracelets")
11. ProductGroupService -> ProductGroup : findByStoreAndName(storeId, "Bracelets")
12. ProductGroup -> ProductGroupService : return null (no duplicate)
13. ProductGroupService -> ProductGroup : create(storeId, "Bracelets")
14. ProductGroup -> ProductGroup : new ProductGroup(storeId, "Bracelets")
15. ProductGroup -> ProductGroupService : return newGroup
16. ProductGroupService -> CategoryUI : return 201 + groupData
17. CategoryUI -> Seller : add new category to list

### alt — Create or Delete category (after step 6, sequence continues either way)

**[Seller clicks "Add Category"]:**

1. Steps 7–17 proceed as main success scenario

**[Seller clicks "Delete" on existing category]:**

1. Seller -> CategoryUI : clickDelete(groupId)
2. CategoryUI -> ProductGroupService : deleteCategory(token, groupId)
3. ProductGroupService -> ProductGroup : findById(groupId)
4. ProductGroup -> ProductGroupService : return group
5. ProductGroupService -> ProductGroupService : verifyBelongsToStore(group.storeId, seller.storeId)
6. ProductGroupService -> Product : updateByGroup(groupId, group_id=null)
7. Product -> ProductGroupService : return updated (products now uncategorized)
8. ProductGroupService -> ProductGroup : delete(groupId)
9. ProductGroup -> ProductGroupService : return deleted = true
10. ProductGroupService -> CategoryUI : return 204
11. CategoryUI -> Seller : remove category from list

> Both paths achieve the goal. Category is either created or deleted successfully.

### break — Duplicate category name (at step 12, sequence stops)

After step 11:

**[same name exists in store]:**

1. ProductGroup -> ProductGroupService : return existingGroup
2. ProductGroupService -> CategoryUI : return 400 "Category name already exists"
3. CategoryUI -> Seller : display error message
4. **Sequence ends. Steps 13–17 never execute.**

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
