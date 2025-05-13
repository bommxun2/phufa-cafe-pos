import os
import pymysql
import time
from datetime import datetime

# --- Database Connection Configuration ---
DB_HOST = os.environ.get('MYSQL_HOST', 'database')
DB_USER = os.environ.get('MYSQL_USER')
DB_PASSWORD = os.environ.get('MYSQL_PASSWORD')
DB_NAME = os.environ.get('MYSQL_DATABASE')
DB_PORT = int(os.environ.get('MYSQL_PORT', 3306))

MAX_RETRIES = 12 # Max 12 retries (12 * 5 seconds = 1 minute)
RETRY_DELAY = 5  # Seconds

def wait_for_db():
    """Waits for the database to be ready."""
    retries = 0
    while retries < MAX_RETRIES:
        try:
            print(f"⏳ Attempting to connect to database (Attempt {retries + 1}/{MAX_RETRIES})...")
            conn = pymysql.connect(
                host=DB_HOST,
                user=DB_USER,
                password=DB_PASSWORD,
                database=DB_NAME,
                port=DB_PORT,
                connect_timeout=5 # Add a connection timeout
            )
            print("✅ Database connection successful.")
            return conn
        except pymysql.MySQLError as e:
            print(f"❌ Database connection failed: {e}")
            retries += 1
            if retries < MAX_RETRIES:
                print(f"Retrying in {RETRY_DELAY} seconds...")
                time.sleep(RETRY_DELAY)
            else:
                print("❌ Max retries reached. Could not connect to the database.")
                return None

# --- SQL Statements for Table Creation ---
create_table_statements = [
    """CREATE TABLE IF NOT EXISTS Person (
        CitizenID VARCHAR(13) NOT NULL COMMENT 'รหัสบัตรประจำตัวประชาชน',
        FirstName VARCHAR(50) NOT NULL COMMENT 'ชื่อจริง',
        LastName VARCHAR(50) NOT NULL COMMENT 'นามสกุล',
        Gender CHAR(1) COMMENT 'เพศ (M=ชาย, F=หญิง, O=อื่นๆ)',
        PhoneNum VARCHAR(15) UNIQUE COMMENT 'หมายเลขโทรศัพท์มือถือ',
        Address VARCHAR(255) COMMENT 'ที่อยู่',
        ProfileURL VARCHAR(255) COMMENT 'URL รูปภาพโปรไฟล์',
        PRIMARY KEY (CitizenID)
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'ข้อมูลบุคคลพื้นฐาน';""",

    """CREATE TABLE IF NOT EXISTS Employee (
        EmpID VARCHAR(10) NOT NULL COMMENT 'รหัสพนักงาน',
        CitizenID VARCHAR(13) NOT NULL UNIQUE COMMENT 'FK อ้างอิง Person',
        EmpPasswordHash VARCHAR(255) NOT NULL COMMENT 'ค่าแฮชของรหัสผ่าน',
        EmpRole VARCHAR(50) NOT NULL COMMENT 'ตำแหน่งงาน (เช่น แคชเชียร์, ผู้จัดการ)',
        EmpSalary DECIMAL(10, 2) COMMENT 'เงินเดือน',
        PRIMARY KEY (EmpID),
        CONSTRAINT fk_employee_person FOREIGN KEY (CitizenID) REFERENCES Person(CitizenID)
            ON DELETE RESTRICT ON UPDATE CASCADE
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'ข้อมูลพนักงาน';""",

    """CREATE TABLE IF NOT EXISTS Customer (
        CitizenID VARCHAR(13) NOT NULL COMMENT 'FK อ้างอิง Person, PK ของ Customer',
        Point INT NOT NULL DEFAULT 0 COMMENT 'คะแนนสะสม',
        PRIMARY KEY (CitizenID),
        CONSTRAINT fk_customer_person FOREIGN KEY (CitizenID) REFERENCES Person(CitizenID)
            ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'ข้อมูลลูกค้าและคะแนนสะสม';""",

    """CREATE TABLE IF NOT EXISTS Menu (
        MenuID VARCHAR(10) NOT NULL COMMENT 'รหัสเมนู',
        MenuName VARCHAR(100) NOT NULL COMMENT 'ชื่อเมนู',
        MenuPrice DECIMAL(7, 2) NOT NULL COMMENT 'ราคาเมนู',
        MenuDescription VARCHAR(255) COMMENT 'คำอธิบายเมนู',
        MenuStatus VARCHAR(20) NOT NULL DEFAULT 'พร้อมขาย' COMMENT 'สถานะเมนู (เช่น พร้อมขาย, หมด, ไม่พร้อมขาย)',
        MenuURL VARCHAR(255) COMMENT 'URL รูปภาพเมนู',
        MenuCategory VARCHAR(50) NOT NULL COMMENT 'ประเภทของ menu (VARCHAR(10) in original, increased for flexibility)',
        PRIMARY KEY (MenuID)
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'รายการอาหารและเครื่องดื่ม';""",

    """CREATE TABLE IF NOT EXISTS IngredientCategory (
        IngredientCategoryID VARCHAR(10) NOT NULL COMMENT 'รหัสประเภทวัตถุดิบ',
        Name VARCHAR(50) NOT NULL UNIQUE COMMENT 'ชื่อประเภทวัตถุดิบ (เช่น นม, ไซรัป, ผงกาแฟ)',
        AllowMultipleSelection BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'อนุญาตให้เลือกหลายรายการในหมวดนี้หรือไม่ (สำหรับการปรับแต่ง)',
        IsCustomizable BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'วัตถุดิบในหมวดนี้ปรับแต่งได้หรือไม่',
        PRIMARY KEY (IngredientCategoryID)
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'หมวดหมู่ของวัตถุดิบ';""",

    """CREATE TABLE IF NOT EXISTS Ingredient (
        IngredientID VARCHAR(10) NOT NULL COMMENT 'รหัสวัตถุดิบ',
        Name VARCHAR(100) NOT NULL UNIQUE COMMENT 'ชื่อวัตถุดิบ',
        Quantity DECIMAL(10, 2) NOT NULL DEFAULT 0 COMMENT 'จำนวนคงเหลือในสต็อก',
        Unit VARCHAR(20) NOT NULL COMMENT 'หน่วยนับ (เช่น กรัม, มิลลิลิตร, ชิ้น)',
        CostPerUnit DECIMAL(10, 2) NOT NULL DEFAULT 0 COMMENT 'ราคาต้นทุนต่อหน่วย',
        AdjustmentPrice DECIMAL(7, 2) NOT NULL DEFAULT 0 COMMENT 'ราคาเพิ่มเติมเมื่อใช้ปรับแต่ง (ถ้ามี)',
        IngredientCategoryID VARCHAR(10) NOT NULL COMMENT 'FK อ้างอิง IngredientCategory',
        PRIMARY KEY (IngredientID),
        CONSTRAINT fk_ingredient_ingredientcategory FOREIGN KEY (IngredientCategoryID) REFERENCES IngredientCategory(IngredientCategoryID)
            ON DELETE RESTRICT ON UPDATE CASCADE,
        INDEX idx_ingredient_category (IngredientCategoryID)
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'รายการวัตถุดิบและสต็อก';""",

    """CREATE TABLE IF NOT EXISTS DefaultRecipe (
        MenuID VARCHAR(10) NOT NULL COMMENT 'FK อ้างอิง Menu',
        IngredientID VARCHAR(10) NOT NULL COMMENT 'FK อ้างอิง Ingredient',
        Quantity DECIMAL(8, 2) NOT NULL COMMENT 'ปริมาณวัตถุดิบที่ใช้ในสูตร',
        IsBaseIngredient BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'เป็นวัตถุดิบหลักหรือไม่',
        IsReplaceable BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'สามารถเปลี่ยนวัตถุดิบนี้ได้หรือไม่',
        PRIMARY KEY (MenuID, IngredientID),
        CONSTRAINT fk_defaultrecipe_menu FOREIGN KEY (MenuID) REFERENCES Menu(MenuID)
            ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_defaultrecipe_ingredient FOREIGN KEY (IngredientID) REFERENCES Ingredient(IngredientID)
            ON DELETE RESTRICT ON UPDATE CASCADE
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'ส่วนประกอบและปริมาณมาตรฐานสำหรับแต่ละเมนู';""",

    """CREATE TABLE IF NOT EXISTS `Order` (
        OrderID VARCHAR(10) NOT NULL COMMENT 'รหัสคำสั่งซื้อ',
        OrderDateTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'วันเวลาที่สั่งซื้อ',
        OrderStatus BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'สถานะคำสั่งซื้อ (0=รอชำระเงิน, 1=ชำระเงินแล้ว/เสร็จสิ้น)',
        OrderPrice DECIMAL(10, 2) NOT NULL DEFAULT 0 COMMENT 'ราคารวมของคำสั่งซื้อ',
        EmpID VARCHAR(10) NOT NULL COMMENT 'FK อ้างอิง Employee (พนักงานที่รับออเดอร์)',
        CitizenID VARCHAR(13) NULL COMMENT 'FK อ้างอิง Customer (ลูกค้าที่สั่ง, อาจเป็น NULL)',
        PRIMARY KEY (OrderID),
        CONSTRAINT fk_order_employee FOREIGN KEY (EmpID) REFERENCES Employee(EmpID)
            ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT fk_order_customer FOREIGN KEY (CitizenID) REFERENCES Customer(CitizenID)
            ON DELETE SET NULL ON UPDATE CASCADE,
        INDEX idx_order_datetime (OrderDateTime),
        INDEX idx_order_employee (EmpID),
        INDEX idx_order_customer (CitizenID)
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'ข้อมูลคำสั่งซื้อหลัก';""",

    """CREATE TABLE IF NOT EXISTS OrderItem (
        OrderItemID VARCHAR(15) NOT NULL COMMENT 'รหัสรายการในคำสั่งซื้อ (ควร Unique)',
        OrderID VARCHAR(10) NOT NULL COMMENT 'FK อ้างอิง Order',
        MenuID VARCHAR(10) NOT NULL COMMENT 'FK อ้างอิง Menu',
        Quantity INT NOT NULL COMMENT 'จำนวนที่สั่ง',
        Note VARCHAR(255) COMMENT 'หมายเหตุเพิ่มเติมสำหรับรายการนี้',
        ItemBasePrice DECIMAL(7, 2) NOT NULL COMMENT 'ราคาพื้นฐานของเมนู ณ เวลาที่สั่ง',
        CustomizeCost DECIMAL(7, 2) NOT NULL DEFAULT 0 COMMENT 'ค่าใช้จ่ายเพิ่มเติมจากการปรับแต่ง',
        ItemTotalPrice DECIMAL(10, 2) NOT NULL DEFAULT 0 COMMENT 'ราคารวมของรายการนี้',
        PRIMARY KEY (OrderItemID),
        CONSTRAINT fk_orderitem_order FOREIGN KEY (OrderID) REFERENCES `Order`(OrderID)
            ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_orderitem_menu FOREIGN KEY (MenuID) REFERENCES Menu(MenuID)
            ON DELETE RESTRICT ON UPDATE CASCADE,
        INDEX idx_orderitem_order (OrderID),
        INDEX idx_orderitem_menu (MenuID)
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'รายการสินค้าแต่ละอย่างในคำสั่งซื้อ';""",

    """CREATE TABLE IF NOT EXISTS CustomIngredient (
        OrderItemID VARCHAR(15) NOT NULL COMMENT 'FK อ้างอิง OrderItem',
        IngredientID VARCHAR(10) NOT NULL COMMENT 'FK อ้างอิง Ingredient ที่ใช้ปรับแต่ง',
        Quantity DECIMAL(8, 2) NOT NULL COMMENT 'ปริมาณวัตถุดิบที่ปรับแต่ง (เพิ่ม/ลด)',
        CustomizationCost DECIMAL(7, 2) NOT NULL DEFAULT 0 COMMENT 'ต้นทุนของการปรับแต่งรายการนี้',
        PRIMARY KEY (OrderItemID, IngredientID),
        CONSTRAINT fk_customingredient_orderitem FOREIGN KEY (OrderItemID) REFERENCES OrderItem(OrderItemID)
            ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_customingredient_ingredient FOREIGN KEY (IngredientID) REFERENCES Ingredient(IngredientID)
            ON DELETE RESTRICT ON UPDATE CASCADE
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'บันทึกการปรับแต่งวัตถุดิบสำหรับแต่ละ OrderItem';"""
]

# --- Sample Data ---
persons_data = [
    ('1266985663999', 'สมชาย', 'หล่อเหลา', 'M', '0699696999', '99 ม.18 ถ.พหลโยธิน ต.คลองหนึ่ง อ.คลองหลวง จ.ปทุมธานี 12121', 'https://example.com/image/person_somchai.jpg'),
    ('9876543210123', 'สมหญิง', 'ใจดี', 'F', '0812345678', '12/34 หมู่ 5 ต.บางพลี อ.บางพลี จ.สมุทรปราการ 10540', 'https://example.com/image/person_somying.jpg'),
    ('1112223334445', 'พรเทพ', 'รักไทย', 'M', '0987654321', '555 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110', 'https://example.com/image/person_pornthep.jpg')
]

employees_data = [
    # EmpID, CitizenID, EmpPasswordHash, EmpRole, EmpSalary
    ('6609696969', '1266985663999', '$argon2d$v=19$m=5120,t=2,p=1$Vywsq7mUYyfDFveHaaZNLg$7cZFHlwHw9YbPKrHOTjemtjrfL5zUSmK0Vc3ZedL3nY', 'แคชเชียร์', 25000.00),
    ('6609696970', '9876543210123', '$argon2d$v=19$m=5120,t=2,p=1$anotherplaceholderhash$anotherplaceholdersaltvalue', 'ผู้จัดการ', 45000.00)
]

customers_data = [
    # CitizenID, Point
    ('1266985663999', 9), # สมชาย
    ('1112223334445', 15) # พรเทพ
]

ingredient_categories_data = [
    # IngredientCategoryID, Name, AllowMultipleSelection, IsCustomizable
    ('IC98563000', 'นม', False, True), # Example: นม
    ('IC98563001', 'ไซรัป', False, True),
    ('IC98563002', 'ผงกาแฟ', False, False), # Coffee powder itself might not be customizable in quantity for a recipe
    ('IC98563003', 'ท็อปปิ้ง', True, True), # Toppings can be multiple
    ('IC98563004', 'ชา', False, False)
]

ingredients_data = [
    # IngredientID, Name, Quantity, Unit, CostPerUnit, AdjustmentPrice, IngredientCategoryID
    ('I985630000', 'นมอัลมอนด์', 9632.23, 'มิลลิลิตร', 0.10, 10.00, 'IC98563000'), # Example from dictionary
    ('I985630001', 'นมสด', 10000.00, 'มิลลิลิตร', 0.05, 0.00, 'IC98563000'),
    ('I985630002', 'ไซรัปคาราเมล', 5000.00, 'มิลลิลิตร', 0.07, 7.00, 'IC98563001'),
    ('I985630003', 'เมล็ดกาแฟอาราบิก้า', 2000.00, 'กรัม', 0.50, 0.00, 'IC98563002'),
    ('I985630004', 'วิปครีม', 1000.00, 'กรัม', 0.20, 15.00, 'IC98563003'),
    ('I985630005', 'ผงชาเขียวมัทฉะ', 500.00, 'กรัม', 1.20, 0.00, 'IC98563004')
]

menus_data = [
    # MenuID, MenuName, MenuPrice, MenuDescription, MenuStatus, MenuURL, MenuCategory
    ('M213560000', 'ลาเต้', 55.00, 'เย็น', 'พร้อมขาย', 'https://example.com/image/latte.jpg', 'กาแฟ'), # Example from dictionary
    ('M213560001', 'เอสเปรสโซ่', 45.00, 'ร้อน เข้มข้น', 'พร้อมขาย', 'https://example.com/image/espresso.jpg', 'กาแฟ'),
    ('M213560002', 'มัทฉะลาเต้', 65.00, 'ชาเขียวมัทฉะผสมนม', 'พร้อมขาย', 'https://example.com/image/matcha_latte.jpg', 'ชา'),
    ('M213560003', 'คาราเมลมัคคิอาโต้', 70.00, 'กาแฟนมราดคาราเมล', 'ไม่พร้อมขาย', 'https://example.com/image/caramel_macchiato.jpg', 'กาแฟ')
]

default_recipes_data = [
    # MenuID, IngredientID, Quantity, IsBaseIngredient, IsReplaceable
    ('M213560000', 'I985630001', 150.00, True, True),   # ลาเต้: นมสด
    ('M213560000', 'I985630003', 20.00, True, False),  # ลาเต้: เมล็ดกาแฟอาราบิก้า
    ('M213560001', 'I985630003', 18.00, True, False),  # เอสเปรสโซ่: เมล็ดกาแฟอาราบิก้า
    ('M213560002', 'I985630005', 10.00, True, False),  # มัทฉะลาเต้: ผงชาเขียว
    ('M213560002', 'I985630001', 120.00, True, True)   # มัทฉะลาเต้: นมสด
]

orders_data = [
    # OrderID, OrderDateTime, OrderStatus, OrderPrice, EmpID, CitizenID
    ('O265980000', datetime(2024, 3, 21, 0, 18, 0), False, 1500.00, '6609696969', '1112223334445'), # Example from dictionary, status adjusted
    ('O265980001', datetime(2024, 7, 20, 10, 30, 0), True, 120.00, '6609696969', '1266985663999'),
    ('O265980002', datetime(2024, 7, 20, 11, 5, 0), True, 45.00, '6609696970', None) # Order by non-member
]

order_items_data = [
    # OrderItemID, OrderID, MenuID, Quantity, Note, ItemBasePrice, CustomizeCost, ItemTotalPrice
    # For O265980000
    ('OI26598000', 'O265980000', 'M213560000', 1, 'เปลี่ยนเป็นนมอัลมอนด์', 55.00, 10.00, 65.00), # Example from dictionary (Latte with almond milk)
    # For O265980001
    ('OI26598001', 'O265980001', 'M213560002', 1, 'หวานน้อย', 65.00, 0.00, 65.00), # Matcha Latte
    ('OI26598002', 'O265980001', 'M213560000', 1, None, 55.00, 0.00, 55.00),        # Latte
    # For O265980002
    ('OI26598003', 'O265980002', 'M213560001', 1, 'เข้มๆ', 45.00, 0.00, 45.00)      # Espresso
]

custom_ingredients_data = [
    # OrderItemID, IngredientID, Quantity (e.g. 1 for replacement), CustomizationCost
    ('OI26598000', 'I985630000', 150.00, 10.00) # ลาเต้รายการแรก เปลี่ยนเป็นนมอัลมอนด์ (150ml), ต้นทุนเพิ่ม 10
]


def main():
    conn = wait_for_db()
    if not conn:
        return # Exit if DB connection failed

    cursor = None # Initialize cursor to None
    try:
        cursor = conn.cursor()

        # --- Create Tables ---
        print("\nℹ️ Creating tables...")
        for stmt in create_table_statements:
            # print(f"Executing: {stmt[:100]}...") # Print first 100 chars for brevity
            cursor.execute(stmt)
        conn.commit()
        print("✅ All tables created/verified successfully.")

        # --- Insert Sample Data (Order matters due to Foreign Keys) ---
        print("\nℹ️ Inserting sample data...")

        # Person
        print("Inserting into Person...")
        sql_insert_person = "INSERT INTO Person (CitizenID, FirstName, LastName, Gender, PhoneNum, Address, ProfileURL) VALUES (%s, %s, %s, %s, %s, %s, %s)"
        cursor.executemany(sql_insert_person, persons_data)
        print(f"✅ {cursor.rowcount} records inserted into Person.")

        # Employee
        print("Inserting into Employee...")
        sql_insert_employee = "INSERT INTO Employee (EmpID, CitizenID, EmpPasswordHash, EmpRole, EmpSalary) VALUES (%s, %s, %s, %s, %s)"
        cursor.executemany(sql_insert_employee, employees_data)
        print(f"✅ {cursor.rowcount} records inserted into Employee.")

        # Customer
        print("Inserting into Customer...")
        sql_insert_customer = "INSERT INTO Customer (CitizenID, Point) VALUES (%s, %s)"
        cursor.executemany(sql_insert_customer, customers_data)
        print(f"✅ {cursor.rowcount} records inserted into Customer.")

        # IngredientCategory
        print("Inserting into IngredientCategory...")
        sql_insert_ing_cat = "INSERT INTO IngredientCategory (IngredientCategoryID, Name, AllowMultipleSelection, IsCustomizable) VALUES (%s, %s, %s, %s)"
        cursor.executemany(sql_insert_ing_cat, ingredient_categories_data)
        print(f"✅ {cursor.rowcount} records inserted into IngredientCategory.")

        # Ingredient
        print("Inserting into Ingredient...")
        sql_insert_ingredient = "INSERT INTO Ingredient (IngredientID, Name, Quantity, Unit, CostPerUnit, AdjustmentPrice, IngredientCategoryID) VALUES (%s, %s, %s, %s, %s, %s, %s)"
        cursor.executemany(sql_insert_ingredient, ingredients_data)
        print(f"✅ {cursor.rowcount} records inserted into Ingredient.")

        # Menu
        print("Inserting into Menu...")
        sql_insert_menu = "INSERT INTO Menu (MenuID, MenuName, MenuPrice, MenuDescription, MenuStatus, MenuURL, MenuCategory) VALUES (%s, %s, %s, %s, %s, %s, %s)"
        cursor.executemany(sql_insert_menu, menus_data)
        print(f"✅ {cursor.rowcount} records inserted into Menu.")

        # DefaultRecipe
        print("Inserting into DefaultRecipe...")
        sql_insert_def_recipe = "INSERT INTO DefaultRecipe (MenuID, IngredientID, Quantity, IsBaseIngredient, IsReplaceable) VALUES (%s, %s, %s, %s, %s)"
        cursor.executemany(sql_insert_def_recipe, default_recipes_data)
        print(f"✅ {cursor.rowcount} records inserted into DefaultRecipe.")

        # Order
        print("Inserting into `Order`...")
        sql_insert_order = "INSERT INTO `Order` (OrderID, OrderDateTime, OrderStatus, OrderPrice, EmpID, CitizenID) VALUES (%s, %s, %s, %s, %s, %s)"
        cursor.executemany(sql_insert_order, orders_data)
        print(f"✅ {cursor.rowcount} records inserted into `Order`.")

        # OrderItem
        print("Inserting into OrderItem...")
        sql_insert_order_item = "INSERT INTO OrderItem (OrderItemID, OrderID, MenuID, Quantity, Note, ItemBasePrice, CustomizeCost, ItemTotalPrice) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"
        cursor.executemany(sql_insert_order_item, order_items_data)
        print(f"✅ {cursor.rowcount} records inserted into OrderItem.")

        # CustomIngredient
        print("Inserting into CustomIngredient...")
        sql_insert_custom_ing = "INSERT INTO CustomIngredient (OrderItemID, IngredientID, Quantity, CustomizationCost) VALUES (%s, %s, %s, %s)"
        cursor.executemany(sql_insert_custom_ing, custom_ingredients_data)
        print(f"✅ {cursor.rowcount} records inserted into CustomIngredient.")

        conn.commit()
        print("\n🎉 Database setup and seeding complete!")

    except pymysql.MySQLError as e:
        print(f"❌ SQL Error during setup/seeding: {e}")
        if conn: # Attempt to rollback if an error occurs after connection
            try:
                conn.rollback()
                print("ℹ️ Transaction rolled back.")
            except pymysql.MySQLError as rb_err:
                print(f"❌ Error during rollback: {rb_err}")
    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")
    finally:
        if cursor:
            try:
                cursor.close()
            except:
                pass # Ignore errors during cursor close
        if conn:
            try:
                conn.close()
                print("ℹ️ Database connection closed.")
            except:
                pass # Ignore errors during connection close

if __name__ == "__main__":
    if not all([DB_USER, DB_PASSWORD, DB_NAME]):
        print("❌ Error: MYSQL_USER, MYSQL_PASSWORD, and MYSQL_DATABASE environment variables must be set.")
    else:
        main()