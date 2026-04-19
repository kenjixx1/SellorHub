import sqlite3
import os

db_path = 'sellor.db'

if not os.path.exists(db_path):
    print(f"Database {db_path} not found.")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    print("Checking order_items table...")
    cursor.execute("PRAGMA table_info(order_items)")
    columns = cursor.fetchall()
    
    # Column info: (id, name, type, notnull, dflt_value, pk)
    # product_id is usually index 2 in our case (id=0, order_id=1, product_id=2)
    product_id_col = next((c for c in columns if c[1] == 'product_id'), None)
    
    if product_id_col and product_id_col[3] == 1: # 1 means NOT NULL
        print("Fixing order_items table to allow NULL product_id...")
        
        # 1. Get original schema for order_items but change NOT NULL to NULL
        # and add ON DELETE SET NULL to the foreign key
        
        # We'll recreate it manually to be sure
        cursor.execute("ALTER TABLE order_items RENAME TO order_items_old")
        
        cursor.execute("""
            CREATE TABLE order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                product_id INTEGER,
                product_title_snapshot VARCHAR(200) NOT NULL,
                unit_price_snapshot NUMERIC(10, 2) NOT NULL,
                quantity INTEGER NOT NULL,
                FOREIGN KEY(order_id) REFERENCES orders (id) ON DELETE CASCADE,
                FOREIGN KEY(product_id) REFERENCES products (id) ON DELETE SET NULL
            )
        """)
        
        cursor.execute("INSERT INTO order_items (id, order_id, product_id, product_title_snapshot, unit_price_snapshot, quantity) SELECT id, order_id, product_id, product_title_snapshot, unit_price_snapshot, quantity FROM order_items_old")
        
        cursor.execute("DROP TABLE order_items_old")
        conn.commit()
        print("Database fixed successfully!")
    else:
        print("order_items table already allows NULL product_id or column not found.")

except Exception as e:
    conn.rollback()
    print(f"Error fixing database: {e}")
finally:
    conn.close()
