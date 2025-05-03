
import os
import pymysql
import time

# Wait for the database to be ready
time.sleep(10)

try:
    conn = pymysql.connect(
        host=os.environ.get('MYSQL_HOST', 'database'),
        user=os.environ['MYSQL_USER'],
        password=os.environ['MYSQL_PASSWORD'],
        database=os.environ['MYSQL_DATABASE'],
        port=int(os.environ.get('MYSQL_PORT', 3306))
    )

    cursor = conn.cursor()

    statements = [
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
            MenuName VARCHAR(100) NOT NULL UNIQUE COMMENT 'ชื่อเมนู',
            MenuPrice DECIMAL(7, 2) NOT NULL COMMENT 'ราคาเมนู',
            MenuDescription VARCHAR(255) COMMENT 'คำอธิบายเมนู',
            MenuStatus VARCHAR(20) NOT NULL DEFAULT 'พร้อมขาย' COMMENT 'สถานะเมนู (เช่น พร้อมขาย, หมด, ไม่พร้อมขาย)',
            MenuURL VARCHAR(255) COMMENT 'URL รูปภาพเมนู',
            MenuCategory VARCHAR(10) NOT NULL COMMENT 'ประเภทของ menu',
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

    for stmt in statements:
        cursor.execute(stmt)

    conn.commit()
    print("✅ Tables created successfully.")

except pymysql.MySQLError as e:
    print(f"❌ Failed to connect or execute SQL: {e}")

finally:
    try:
        cursor.close()
        conn.close()
    except:
        pass
