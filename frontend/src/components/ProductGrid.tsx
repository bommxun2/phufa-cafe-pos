"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import axios from "axios";

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  ingredients?: Ingredients[];
}

interface everyIngredients {
  id: string;
  name: string;
  amount: string;
}

export interface Ingredients {
  default: everyIngredients;
  options: everyIngredients[];
}

interface ProductGridProps {
  category: string;
  onAddToOrder: (product: Product) => void;
}

export default function ProductGrid({
  category,
  onAddToOrder,
}: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);

  async function getProducts(category: string) {
    try {
      const response = await axios.get(`/api/menu/category/${category}`);
      const ingredients = await axios.get("/api/ingredients");

      const getMenu: Product[] = [];
      for (const menu of response.data) {
        const ing: Ingredients[] = [];
        if (menu.MenuStatus == "พร้อมขาย") {
          const getRecipe = await axios.get(`/api/menu/${menu.MenuID}/recipe`);

          for (const re of getRecipe.data) {
            const getIngredients = await axios.get(
              `api/ingredients/${re.ingredientId}`
            );

            var everyIng: everyIngredients = {
              id: getIngredients.data.ingredientId,
              name: getIngredients.data.name,
              amount: re.quantity + " " + getIngredients.data.unit,
            };

            var everyIngs: everyIngredients[] = [];
            if (re.isReplaceable == true) {
              ingredients.data.forEach((ingredient: any) => {
                if (
                  ingredient.category == getIngredients.data.category &&
                  ingredient.name != getIngredients.data.name
                ) {
                  everyIngs.push({
                    id: ingredient.ingredientId,
                    name: ingredient.name,
                    amount: re.quantity + " " + ingredient.unit,
                  });
                }
              });
            }

            ing.push({
              default: everyIng,
              options: everyIngs,
            });
          }

          getMenu.push({
            id: menu.MenuID,
            name: menu.MenuName,
            price: Number(menu.MenuPrice),
            image: "",
            category: menu.MenuCategory,
            ingredients: ing,
          });
        }
      }

      setProducts(getMenu);
    } catch (error) {
      console.error("Error fetching menu/category/${category}:", error);
    }
  }

  useEffect(() => {
    if (category) {
      getProducts(category);
    }
  }, [category]);

  return (
    <div className="grid grid-cols-5 gap-4">
      {products.map((product: Product) => (
        <button
          key={product.id}
          onClick={() => onAddToOrder(product)}
          className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="relative h-32 w-full">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="p-4">
            <div className="font-medium mb-1">{product.name}</div>
            <div className="text-sm text-gray-900">{product.price} THB</div>
          </div>
        </button>
      ))}
    </div>
  );
}
