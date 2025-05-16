"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import CategoryGrid from "@/components/CategoryGrid";
import ProductGrid from "@/components/ProductGrid";
import OrderDetail from "@/components/OrderDetailPOS";
import axios from "axios";

import { Category } from "@/components/CategoryGrid";
import { Product } from "@/components/ProductGrid";
import { Order } from "@/components/OrderDetailPOS";

export default function POS() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [menuCategory, setMenuCategory] = useState<Category[]>([]);

  useEffect(() => {
    async function getMenu() {
      try {
        const response = await axios.get("http://localhost/api/menu");
        const categories: Category[] = [];
        var categoryId = 1;
        response.data.forEach((menu: any) => {
          const exists = categories.find((c) => c.name === menu.menuCategory);
          if (!exists) {
            categories.push({
              id: categoryId,
              name: menu.menuCategory,
              itemCount: 1,
            });
            categoryId++;
          } else {
            exists.itemCount += 1;
          }
        });
        console.log(categories);
        setMenuCategory(categories);
      } catch (error) {
        console.error("Error fetching menu:", error);
      }
    }

    getMenu();
  }, []);

  useEffect(() => {
    if (menuCategory.length > 0 && !selectedCategory) {
      setSelectedCategory(menuCategory[0].name);
    }
  }, [menuCategory]);

  const [currentOrder, setCurrentOrder] = useState<Order>({
    orderId: "",
    items: [],
    total: 0,
  });

  const handleAddToOrder = (product: Product) => {
    setCurrentOrder((prev: Order) => {
      return {
        ...prev,
        items: [
          ...prev.items,
          {
            id: product.id,
            name: product.name,
            quantity: 1,
            price: product.price,
            ingredients: JSON.parse(JSON.stringify(product.ingredients)),
          },
        ],
        total: prev.total + product.price,
      };
    });
  };

  const handleQuantityChange = (
    index: number,
    action: "increase" | "decrease"
  ) => {
    setCurrentOrder((prevOrder) => {
      const updatedItems = [...prevOrder.items];
      const item = updatedItems[index];

      if (action === "increase") {
        item.quantity += 1;
      } else if (action === "decrease" && item.quantity > 1) {
        item.quantity -= 1;
      }

      const updatedTotal = updatedItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );

      return {
        ...prevOrder,
        items: updatedItems,
        total: updatedTotal,
      };
    });
  };

  const handleRemoveItem = (index: number) => {
    setCurrentOrder((prev) => {
      const updatedItems = [...prev.items];
      const removedItem = updatedItems.splice(index, 1)[0];
      const newTotal = prev.total - removedItem.price * removedItem.quantity;

      return {
        ...prev,
        items: updatedItems,
        total: newTotal,
      };
    });
  };

  return (
    <div className="min-h-screen bg-sage-100">
      <Header />
      <main className="container mx-auto p-6">
        <div className="flex gap-6">
          <div className="flex-1">
            <div className="mb-6">
              {/* <div className="relative">
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border-none shadow-sm"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div> */}
            </div>
            <CategoryGrid
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              menuCategory={menuCategory}
            />
            <ProductGrid
              category={selectedCategory}
              onAddToOrder={handleAddToOrder}
            />
          </div>
          <div className="w-[400px]">
            <OrderDetail
              order={currentOrder}
              onSetCurrentOrder={setCurrentOrder}
              updateQuantity={handleQuantityChange}
              removeItem={handleRemoveItem}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
