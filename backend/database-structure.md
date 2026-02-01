// Use DBML to define your database structure
// Docs: https://dbml.dbdiagram.io/docs



// Sellor - DBML (MVP)
// Multi-store marketplace with product groups, images, inquiries


Table users {
id integer [primary key, increment]
username varchar [unique, not null]
email varchar [unique, not null]
password_hash varchar [not null]
role varchar [not null, note: "buyer | seller | admin"]
created_at timestamp [not null]
phone_number integer [unique]
selling_approve bool [not null]




Note: "Accounts for buyers, sellers, admins"
}


Table stores {
id integer [primary key, increment]
owner_id integer [not null, unique] // 1 store per seller (change if you want multiple stores)
slug varchar [not null, unique, note: "public URL e.g. /ShoeSeller101"]
name varchar [not null]
description text
logo_url varchar
created_at timestamp [not null]


Note: "Seller store profile + public storefront"
}


Table product_groups {
id integer [primary key, increment]
store_id integer [not null]
name varchar [not null]
created_at timestamp [not null]


Indexes {
(store_id, name) [unique]
}


Note: "Categories inside a store"
}


Table products {
id integer [primary key, increment]
store_id integer [not null]
group_id integer // nullable: product can be uncategorized


title varchar [not null]
description text


price decimal [not null]
stock integer
status varchar [not null, note: "active | sold | hidden"]


created_at timestamp [not null]
updated_at timestamp [not null]


Note: "Product listings"
}



Table product_images {
id integer [primary key, increment]
product_id integer [not null]
image_url varchar [not null]
position integer [not null, note: "0,1,2... display order"]
created_at timestamp [not null]


Indexes {
(product_id, position) [unique]
}


Note: "Multiple images per product"
}


Table inquiries {
id integer [primary key, increment]
store_id integer [not null]
product_id integer [not null]


buyer_name varchar [not null]
buyer_email varchar [not null]
message text [not null]


status varchar [not null, note: "new | replied | closed"]
created_at timestamp [not null]


Note: "MVP contact/inquiry system (no checkout yet)"
}

Table orders {
id integer [primary key, increment]
order_number varchar [not null, unique, note: "human-friendly e.g. ORD-2026-000123"]


buyer_id integer [not null]
store_id integer [not null]


status varchar [not null, note: "placed | paid | packing | shipped | delivered | cancelled | refunded"]
total_amount decimal [not null]
currency varchar [not null, default: "THB"]

shipping_address_id integer [not null]

created_at timestamp [not null]
updated_at timestamp [not null]


Note: "One checkout result. Used for buyer purchase history."
}


Table order_items {
id integer [primary key, increment]
order_id integer [not null]
product_id integer [not null]


product_title_snapshot varchar [not null]
unit_price_snapshot decimal [not null]
quantity integer [not null, default: 1]


Note: "Line items for an order. Snapshots keep history even if product changes later."
}


Table order_status_history {
id integer [primary key, increment]
order_id integer [not null]


status varchar [not null, note: "placed | paid | packing | shipped | delivered | cancelled | refunded"]
note text
changed_by_user_id integer
created_at timestamp [not null]


Note: "Tracking log. Shows timeline: packing -> shipped -> delivered."
}


Table shipments {
id integer [primary key, increment]
order_id integer [not null, unique]


carrier varchar [not null, note: "e.g. Thailand Post, J&T, Kerry"]
tracking_number varchar [not null]
shipped_at timestamp
delivered_at timestamp


Note: "Optional but nice: stores tracking number + carrier."
}


Table addresses {
  id integer [primary key, increment]

  user_id integer [not null]
  label varchar [note: "Home, Work, etc."]

  recipient_name varchar [not null]
  phone varchar [not null]

  address_line1 varchar [not null]
  address_line2 varchar

  city varchar [not null]
  province varchar [not null]
  postal_code varchar [not null]
  country varchar [not null, default: "Thailand"]

  is_default boolean [not null, default: false]
  created_at timestamp [not null]

  Note: "Saved user shipping addresses"
}


/* Relationships */
Ref: stores.owner_id > users.id


Ref: product_groups.store_id > stores.id


Ref: products.store_id > stores.id
Ref: products.group_id > product_groups.id


Ref: product_images.product_id > products.id


Ref: inquiries.store_id > stores.id
Ref: inquiries.product_id > products.id

Ref: orders.buyer_id > users.id
Ref: orders.store_id > stores.id


Ref: order_items.order_id > orders.id
Ref: order_items.product_id > products.id


Ref: order_status_history.order_id > orders.id
Ref: order_status_history.changed_by_user_id > users.id


Ref: shipments.order_id > orders.id

Ref: addresses.user_id > users.id
Ref: orders.shipping_address_id > addresses.id