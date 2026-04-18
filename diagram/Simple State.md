Sellor State Diagrams Plan

File to create

[diagram/State_Diagram.md](diagram/State_Diagram.md)

Objects to diagram

Ten objects in the backend have meaningful state lifecycles:

1. Order (OrderStatus enum)

8 states — the most complex lifecycle.





States: Placed, Paid, Packing, Shipped, DeliveredPendingConfirm, Delivered, Cancelled, Refunded



Transitions:





[*] → Placed : buyer completes checkout



Placed → Paid : payment confirmed



Placed → Cancelled : buyer or seller cancels



Paid → Packing : seller starts packing



Paid → Cancelled : seller / admin cancels



Packing → Shipped : seller ships order



Shipped → DeliveredPendingConfirm : order arrives at destination



DeliveredPendingConfirm → Delivered : buyer confirms receipt



Delivered → Refunded : buyer requests refund



Cancelled → [*] : end of lifecycle



Delivered → [*] : end of lifecycle



Refunded → [*] : end of lifecycle

2. Product (ProductStatus enum)

3 states — seller and admin control visibility.





States: Active, Sold, Hidden



Transitions:





[*] → Active : product created with status = active



[*] → Hidden : product created with status = hidden



Active → Sold : seller marks as sold (stock depleted or manual)



Active → Hidden : seller hides / admin hides product



Sold → Active : seller relists the product



Hidden → Active : seller or admin restores product

3. Inquiry (InquiryStatus enum)

3 states — buyer-to-seller communication lifecycle.





States: New, Replied, Closed



Transitions:





[*] → New : buyer submits inquiry



New → Replied : seller marks as replied



New → Closed : seller closes without reply



Replied → Closed : seller closes inquiry



Closed → [*] : end of lifecycle

4. Seller — Approval Lifecycle (selling_approve + ban_user)

4 states — trust gating mechanism for the marketplace.





States: PendingApproval, Approved, Rejected, Banned



Transitions:





[*] → PendingApproval : seller registers (selling_approve = false)



PendingApproval → Approved : admin approves (approve_seller, approve=true)



PendingApproval → Rejected : admin rejects (approve_seller, approve=false)



Rejected → PendingApproval : seller reapplies / admin reconsiders



Approved → Banned : admin bans user (ban_user)



Approved → PendingApproval : admin revokes approval



Banned → [*] : account suspended — end of lifecycle

5. Cart (CartItem aggregate)

4 states — buyer shopping session lifecycle.





States: Empty, Active, CheckingOut, Ordered, Abandoned



Transitions:





[*] → Empty : buyer session starts



Empty → Active : buyer adds first item



Active → Active : buyer adds / updates / removes items (stays active while items remain)



Active → Empty : buyer removes all items / cart is cleared



Active → CheckingOut : buyer initiates checkout



CheckingOut → Ordered : payment succeeds, order created



CheckingOut → Active : buyer cancels checkout / goes back



CheckingOut → Abandoned : session timeout or buyer leaves



Ordered → [*] : cart cleared after order placed



Abandoned → [*] : end of lifecycle

6. Store

4 states — seller store visibility lifecycle.





States: Created, Active, Hidden, Deleted



Transitions:





[*] → Created : seller creates store (pending initial setup)



Created → Active : store is live and publicly accessible



Active → Hidden : admin hides store (hide_store)



Hidden → Active : admin restores store (hide_store, hide=false)



Active → Deleted : seller or admin deletes store



Hidden → Deleted : admin deletes hidden store



Deleted → [*] : end of lifecycle

7. Shipment

3 states — physical delivery tracking lifecycle.





States: Pending, Shipped, Delivered



Transitions:





[*] → Pending : shipment record created (tracking number assigned by seller)



Pending → Shipped : seller marks as shipped (shipped_at set)



Shipped → Delivered : delivery confirmed (delivered_at set)



Delivered → [*] : end of lifecycle

8. ProductImage

3 states — image role within a product gallery.





States: Uploaded, Thumbnail, Gallery



Transitions:





[*] → Thumbnail : first image uploaded (position = 0)



[*] → Gallery : additional image uploaded (position > 0)



Gallery → Thumbnail : seller reorders image to position = 0



Thumbnail → Gallery : seller reorders, another image takes position = 0



Thumbnail → [*] : seller deletes thumbnail image



Gallery → [*] : seller deletes gallery image

9. StoreRating

3 states — buyer review lifecycle.





States: Submitted, Updated, Deleted



Transitions:





[*] → Submitted : buyer submits rating (requires delivered order)



Submitted → Updated : buyer edits score or comment



Updated → Updated : buyer edits again



Submitted → Deleted : buyer or admin removes rating



Updated → Deleted : buyer or admin removes rating



Deleted → [*] : end of lifecycle

10. Address

3 states — buyer shipping address lifecycle.





States: Saved, Default, Deleted



Transitions:





[*] → Saved : buyer creates address (is_default = false)



[*] → Default : buyer creates first address (auto-set as default)



Saved → Default : buyer sets as default address



Default → Saved : buyer sets a different address as default



Saved → Deleted : buyer deletes address



Default → Deleted : buyer deletes default address (system clears default)



Deleted → [*] : end of lifecycle

11. ProductGroup (Category)

3 states — store category lifecycle with cascade behavior.





States: Empty, Populated, Deleted



Transitions:





[*] → Empty : seller creates category (no products yet)



Empty → Populated : seller assigns a product to the category



Populated → Empty : all products removed or reassigned from category



Empty → Deleted : seller deletes empty category



Populated → Deleted : seller deletes category (all products set to group_id = null)



Deleted → [*] : end of lifecycle

12. User (Buyer)

3 states — buyer account lifecycle (separate from seller approval flow).





States: Registered, Active, Banned



Transitions:





[*] → Registered : buyer creates account



Registered → Active : buyer logs in and begins using the platform



Active → Banned : admin bans user (ban_user)



Banned → [*] : account suspended — end of lifecycle

Document structure per object

Each section includes:





Object name, source model/enum, and one-line purpose



States table: state name + what it means



Transitions list: From State --[event / condition]--> To State



Initial state and final state(s) called out explicitly

Format (plain textbook style)

States:
  - Active       : product is visible to buyers
  - Sold         : product is marked as sold
  - Hidden       : product is not visible to buyers

Initial State: Active (or Hidden)
Final State:   none (product remains in last state until deleted)

Transitions:
  Active  --[seller marks as sold]-->   Sold
  Active  --[seller / admin hides]-->   Hidden
  Sold    --[seller relists]-->          Active
  Hidden  --[seller / admin restores]--> Active

