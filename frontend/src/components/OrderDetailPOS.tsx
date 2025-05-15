"use client";

import axios from "axios";
import { Ingredients } from "./ProductGrid";
import { useEffect, useState } from "react";
import { useToast } from "@/contexts/ToastContext";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  ingredients: Ingredients[];
}

export interface Order {
  orderId: string;
  items: OrderItem[];
  total: number;
}

interface OrderDetailProps {
  order: Order;
  onSetCurrentOrder: (order: Order) => void;
  updateQuantity: (index: number, action: "increase" | "decrease") => void;
  removeItem: (index: number) => void;
}

interface PlaceOrder {
  orderMakerEmpId: string;
  orderByCitizenId: string;
  items: Item[];
}

interface Item {
  menuId: string;
  quantity: number;
  note: string;
  customizations: Customizations[];
}

interface Customizations {
  ingredientId: string;
}

export default function OrderDetail({
  order,
  onSetCurrentOrder,
  updateQuantity,
  removeItem,
}: OrderDetailProps) {
  const { addToast } = useToast();
  const items = order?.items || [];
  const total = order?.total || 0;
  const [customerId, setCustomerId] = useState([]);
  const [chooseCustomerId, setChooseCustomerId] = useState({});
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [handlePlaceOrder, setHandlePlaceOrder] = useState(false);

  useEffect(() => {
    async function getCustomerId() {
      const customerId = await axios.get(`/api/customers`);
      setCustomerId(customerId.data);
    }

    getCustomerId();
  }, []);

  async function placeOrder() {
    try {
      const empId = localStorage.getItem("employeeId") || "";
      const item: Item[] = [];

      items.forEach((i: OrderItem) => {
        const custom: Customizations[] = i.ingredients.map((ing) => ({
          ingredientId: ing.default.id,
        }));

        item.push({
          menuId: i.id,
          quantity: i.quantity,
          note: "",
          customizations: custom,
        });
      });

      const placeOrder: PlaceOrder = {
        orderMakerEmpId: empId || "6609696969",
        orderByCitizenId: chooseCustomerId.citizenId,
        items: item,
      };

      await axios.post("/api/orders", placeOrder);
      if (Object.keys(chooseCustomerId).length !== 0) {
        await axios.post(
          `/api/customers/${chooseCustomerId.citizenId}/points`,
          {
            pointsToAdd: 1,
          }
        );
      }

      setHandlePlaceOrder(false);
      setError("");
      setPhone("");
      onSetCurrentOrder({ orderId: "", items: [], total: 0 });
      addToast("Order placed successfully!", "success");
    } catch (err) {
      setHandlePlaceOrder(true);

      setTimeout(() => setHandlePlaceOrder(false), 2000);
    }
  }

  const onConfirm = (phonenum) => {
    const customer = customerId.find((id) => id.phoneNum === phonenum);
    if (customer) {
      setChooseCustomerId(customer);
      setError("Have customer! customer have ");
    } else {
      setError("Customer not found!");
    }
  };

  const freeDrink = async () => {
    try {
      const res = await axios.post(
        `/api/customers/${chooseCustomerId.citizenId}/redeem`
      );

      setChooseCustomerId((prev) => ({
        ...prev,
        point: res.data.newPointBalance,
      }));
      addToast("Redeem success!", "success");
    } catch (error) {
      console.error("Redeem failed:", error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium">Order Detail</h2>
        <div className="mt-4">
          <div className="mt-4 relative">
            <button
              className="font-bold px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors border-2 border-green-700 disabled:opacity-50"
              onClick={freeDrink}
              disabled={
                Object.keys(chooseCustomerId).length === 0 ||
                chooseCustomerId.point < 10
              }
            >
              🥤 Exchange Free Drink!
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="font-medium">Order List</h3>
        {items.map((item, index) => (
          <div key={index} className="border-b border-gray-200 pb-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-start gap-2">
                <div className="flex flex-col justify-between h-full">
                  <div className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                    {item.quantity}x
                  </div>
                  <button
                    className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm mt-9"
                    onClick={() => removeItem(index)}
                  >
                    ลบ
                  </button>
                </div>
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-500">
                    {item.ingredients.map((ing) => (
                      <div
                        key={ing.default.name}
                        className="flex my-1.5 justify-between"
                      >
                        {ing.options.length > 0 ? (
                          <select
                            defaultValue={ing.default.name}
                            className="border rounded px-2 py-1"
                            onChange={(e) => {
                              const newName = e.target.value;
                              var newId = "";
                              var newAmount = "";
                              ing.options.map((opt) => {
                                if (opt.name === e.target.value) {
                                  newId = opt.id;
                                  newAmount = opt.amount;
                                  opt.name = ing.default.name;
                                  opt.id = ing.default.id;
                                  opt.amount = ing.default.amount;
                                }
                              });

                              ing.default.name = newName;
                              ing.default.id = newId;
                              ing.default.amount = newAmount;
                              console.log(order.items);
                            }}
                          >
                            <option
                              key={ing.default.name}
                              value={ing.default.name}
                            >
                              {ing.default.name}
                            </option>
                            {ing.options.map((eachIng) => (
                              <option key={eachIng.name} value={eachIng.name}>
                                {eachIng.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span>{ing.default.name}</span>
                        )}

                        <span className="ml-10">{ing.default.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="font-medium grid grid-cols-5">
                <div className="col-span-5 justify-end flex pl-6">
                  {item.price.toFixed(2)}
                </div>
                <button
                  className="col-span-2 text-white bg-primary rounded-lg mt-10 flex justify-center items-center py text-lg"
                  onClick={() => updateQuantity(index, "increase")}
                >
                  +
                </button>
                <button
                  className="col-span-2 col-start-4 text-white bg-red-700 rounded-lg mt-10 flex justify-center items-center py text-lg"
                  onClick={() => updateQuantity(index, "decrease")}
                >
                  -
                </button>
              </div>
            </div>
          </div>
        ))}

        <div className="pt-4">
          <h3 className="font-medium mb-4">Payment Detail</h3>
          <div className="flex justify-between items-center">
            <span className="font-medium">Total</span>
            <span className="text-xl font-medium">{total.toFixed(2)} THB</span>
          </div>
        </div>

        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
            Is the customer a member?
          </h2>

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter customer phone number:
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setError("");
            }}
            placeholder="e.g. 0851764770"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          />

          {error === "" ? (
            <button
              onClick={() => onConfirm(phone)}
              disabled={phone.length < 10}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Confirm
            </button>
          ) : error === "Have customer! customer have " ? (
            <span className="text-green-600 text-base block mb-2 font-bold">
              {error}
              <span className="text-red-600">{chooseCustomerId.point} </span>
              point!
            </span>
          ) : (
            <>
              <span className="text-red-600 text-base block mb-2 font-bold">
                {error}
              </span>
              <button
                onClick={() => onConfirm(phone)}
                disabled={phone.length < 9}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Confirm
              </button>
            </>
          )}
        </div>

        {handlePlaceOrder == true ? (
          <>
            <span className="text-red-600 text-base block font-bold">
              Error order!
            </span>
            <button
              className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              onClick={placeOrder}
            >
              Order now
            </button>
          </>
        ) : (
          <button
            className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            onClick={placeOrder}
          >
            Order now
          </button>
        )}
      </div>
    </div>
  );
}
