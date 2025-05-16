// src/components/OrderDetailPOS.tsx
"use client";

import axios from "axios";
import { useEffect, useState } // Removed: Ingredients from './ProductGrid' - use centralized types
from "react";
import { useToast } from "@/contexts/ToastContext";
import type {
  CurrentOrderInPOS, // Replaces 'Order'
  OrderItemInPOS,    // Replaces 'OrderItem'
  PlaceOrderPayload, // Replaces 'PlaceOrder'
  OrderItemPayload,  // Replaces 'Item'
  OrderItemCustomization, // Replaces 'Customizations'
} from "@/types/order";
import type { ProductCustomizableIngredient, ProductIngredientOption } from "@/types/menu"; // For ingredients structure
import { API_BASE_URL } from "@/lib/apiConfig";

interface OrderDetailProps {
  order: CurrentOrderInPOS; // Use centralized type
  onSetCurrentOrder: (order: CurrentOrderInPOS) => void; // Prop to update the entire order state in parent
  updateQuantity: (itemIndex: number, action: "increase" | "decrease") => void;
  removeItem: (itemIndex: number) => void;
}

export default function OrderDetail({
  order,
  onSetCurrentOrder, // This prop suggests parent manages the whole order object
  updateQuantity,
  removeItem,
}: OrderDetailProps) {
  const { addToast } = useToast();
  const items = order?.items || [];
  const total = order?.total || 0;

  // State for customer lookup
  const [customerSearchResults, setCustomerSearchResults] = useState<Array<{ citizenId: string; phoneNum: string; point?: number; firstname?: string; lastname?: string }>>([]); // Store customers found by phone
  const [selectedCustomerForOrder, setSelectedCustomerForOrder] = useState<{ citizenId: string; phoneNum: string; point?: number; } | null>(null);
  const [customerPhoneInput, setCustomerPhoneInput] = useState("");
  const [customerLookupError, setCustomerLookupError] = useState("");

  // State for placing order
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  // const [placeOrderError, setPlaceOrderError] = useState<string | null>(null); // For specific error messages from order placement

  // Fetch all customers once for phone lookup - this might be inefficient for many customers.
  // A dedicated API endpoint /api/customers/by-phone/{phoneNum} would be better.
  const [allCustomers, setAllCustomers] = useState<Array<{ citizenId: string; phoneNum: string; point: number; firstname: string; lastname: string }>>([]);
  useEffect(() => {
    async function fetchAllCustomers() {
      try {
        const response = await axios.get(`${API_BASE_URL}/customers`);
        setAllCustomers(response.data);
      } catch (err) {
        console.error("Failed to fetch customers for lookup:", err);
        addToast("Could not load customer data for lookup.", "error");
      }
    }
    fetchAllCustomers();
  }, []);


  const handlePlaceOrderSubmit = async () => {
    setIsPlacingOrder(true);
    // setPlaceOrderError(null);

    const empId = localStorage.getItem("employeeId");
    if (!empId) {
      addToast("Employee not logged in. Cannot place order.", "error");
      setIsPlacingOrder(false);
      return;
    }

    if (items.length === 0) {
      addToast("Cannot place an empty order.", "info");
      setIsPlacingOrder(false);
      return;
    }

    try {
      const orderItemsPayload: OrderItemPayload[] = items.map((item: OrderItemInPOS) => {
        const customizationsPayload: OrderItemCustomization[] = item.ingredients?.map((ing) => ({
          ingredientId: ing.default.id, // Assuming ing.default.id is the chosen ingredientId
        })) || [];

        return {
          menuId: item.id,
          quantity: item.quantity,
          note: "", // Placeholder for notes, consider adding a UI field for this
          customizations: customizationsPayload,
        };
      });

      const placeOrderPayload: PlaceOrderPayload = {
        orderMakerEmpId: empId, // Removed hardcoded fallback
        orderByCitizenId: selectedCustomerForOrder?.citizenId, // Optional
        items: orderItemsPayload,
      };

      // TODO: The backend should ideally handle points addition in the same transaction or via a webhook after successful order payment.
      // Calling two separate POSTs from the client for one logical operation (order + points) can lead to inconsistencies if one fails.
      await axios.post(`${API_BASE_URL}/orders`, placeOrderPayload);

      if (selectedCustomerForOrder?.citizenId) {
        try {
          await axios.post(
            `${API_BASE_URL}/customers/${selectedCustomerForOrder.citizenId}/points`,
            { pointsToAdd: 1 } // Assuming 1 point per order
          );
          // Optionally refresh customer points display if shown
        } catch (pointError) {
          console.error("Failed to add points for customer:", pointError);
          addToast("Order placed, but failed to add customer points.", "warning");
        }
      }

      addToast("Order placed successfully!", "success");
      // Resetting state
      onSetCurrentOrder({ orderId: "", items: [], total: 0 }); // Reset parent's order state
      setSelectedCustomerForOrder(null);
      setCustomerPhoneInput("");
      setCustomerLookupError("");

    } catch (err) {
      console.error("Error placing order:", err);
      const errorMessage = (axios.isAxiosError(err) && err.response?.data?.message) || "Failed to place order.";
      addToast(errorMessage, "error");
      // setPlaceOrderError(errorMessage);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleCustomerPhoneConfirm = () => {
    setCustomerLookupError("");
    setSelectedCustomerForOrder(null);
    const foundCustomer = allCustomers.find(c => c.phoneNum === customerPhoneInput);

    if (foundCustomer) {
      setSelectedCustomerForOrder({
        citizenId: foundCustomer.citizenId,
        phoneNum: foundCustomer.phoneNum,
        point: foundCustomer.point,
      });
      setCustomerLookupError(`ลูกค้า: ${foundCustomer.firstname}, แต้ม: ${foundCustomer.point}`); // Display customer info
    } else {
      setCustomerLookupError("ไม่พบข้อมูลลูกค้า!");
    }
  };

  const handleRedeemFreeDrink = async () => {
    if (!selectedCustomerForOrder || (selectedCustomerForOrder.point || 0) < 10) {
      addToast("Not enough points to redeem or no customer selected.", "warning");
      return;
    }
    try {
      const response = await axios.post(
        `${API_BASE_URL}/customers/${selectedCustomerForOrder.citizenId}/redeem`
      );
      // Update local customer points display after successful redemption
      setSelectedCustomerForOrder(prev => prev ? { ...prev, point: response.data.newPointBalance } : null);
      // Also update the message shown in customerLookupError
      if (allCustomers.length > 0) { // Check if allCustomers is populated
        const cust = allCustomers.find(c => c.citizenId === selectedCustomerForOrder.citizenId);
        if (cust) {
             setCustomerLookupError(`ลูกค้า: ${cust.firstname}, แต้ม: ${response.data.newPointBalance}`);
        }
      }
      addToast("แลกเครื่องดื่มฟรีสำเร็จ!", "success");
    } catch (err) {
      console.error("Redeem failed:", err);
      const errorMsg = (axios.isAxiosError(err) && err.response?.data?.message) || "แลกคะแนนล้มเหลว";
      addToast(errorMsg, "error");
    }
  };

  // Handler for changing ingredient selection within an item
  const handleIngredientChange = (
    itemIndex: number,
    ingredientGroupIndex: number, // Index of the ingredient group (e.g., milk, syrup) in item.ingredients
    newSelectedIngredientName: string
  ) => {
    const updatedOrder = { ...order, items: [...order.items] }; // Shallow copy order and items array
    const targetItem = { ...updatedOrder.items[itemIndex] }; // Shallow copy the specific item
    targetItem.ingredients = [...(targetItem.ingredients || [])]; // Shallow copy ingredients array for that item

    const customizableIngredientGroup = { ...(targetItem.ingredients[ingredientGroupIndex]) }; // Shallow copy the specific ingredient group

    const newDefaultOption = customizableIngredientGroup.options.find(opt => opt.name === newSelectedIngredientName);
    const oldDefaultOption = { ...customizableIngredientGroup.default }; // Copy old default

    if (newDefaultOption) {
      // Create new default and options array to maintain immutability as much as possible here
      customizableIngredientGroup.default = { ...newDefaultOption };
      customizableIngredientGroup.options = [
        oldDefaultOption, // Add the old default back to the options list
        ...customizableIngredientGroup.options.filter(opt => opt.name !== newSelectedIngredientName)
      ];

      targetItem.ingredients[ingredientGroupIndex] = customizableIngredientGroup;
      updatedOrder.items[itemIndex] = targetItem;
      onSetCurrentOrder(updatedOrder); // Notify parent with the updated order structure
    } else {
      console.warn("Selected ingredient option not found during change.");
    }
  };


  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium">Order Detail</h2>
        <button
          className="font-bold px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors border-2 border-green-700 disabled:opacity-50"
          onClick={handleRedeemFreeDrink}
          disabled={!selectedCustomerForOrder || (selectedCustomerForOrder.point || 0) < 10 || isPlacingOrder}
        >
          🥤 แลกเครื่องดื่มฟรี! (10 แต้ม)
        </button>
      </div>

      <div className="space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto pr-2 mb-4"> {/* Scrollable order items */}
        {items.length === 0 && <p className="text-gray-500 text-center">ไม่มีรายการในออเดอร์</p>}
        {items.map((item, itemIndex) => (
          <div key={`${item.id}-${itemIndex}`} className="border-b border-gray-200 pb-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-start gap-2 flex-grow">
                <div className="flex flex-col justify-between">
                  <div className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm self-start">
                    {item.quantity}x
                  </div>
                  <button
                    className="text-red-600 hover:text-red-800 text-xs mt-1 self-start"
                    onClick={() => removeItem(itemIndex)}
                    disabled={isPlacingOrder}
                  >
                    ลบ
                  </button>
                </div>
                <div className="flex-grow">
                  <div className="font-medium">{item.name}</div>
                  {item.ingredients && item.ingredients.length > 0 && (
                    <div className="text-sm text-gray-600 mt-1 space-y-1">
                      {item.ingredients.map((ingGroup, ingGroupIndex) => (
                        <div key={`${ingGroup.default.id}-${ingGroupIndex}`} className="flex items-center justify-between">
                          {ingGroup.options.length > 0 ? (
                            <select
                              value={ingGroup.default.name} // Controlled component: value is current default name
                              className="border rounded px-2 py-1 text-xs w-full max-w-[150px]" // Max width for select
                              onChange={(e) =>
                                handleIngredientChange(itemIndex, ingGroupIndex, e.target.value)
                              }
                              disabled={isPlacingOrder}
                            >
                              <option value={ingGroup.default.name} disabled={/* consider if default should be non-selectable after change */ false}>
                                {ingGroup.default.name}
                              </option>
                              {ingGroup.options.map((option) => (
                                <option key={option.id} value={option.name}>
                                  {option.name} (+ {/* Calculate price diff if any */})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-xs">{ingGroup.default.name}</span>
                          )}
                          <span className="text-xs ml-2">{ingGroup.default.amount}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className="font-medium">{(item.price * item.quantity).toFixed(2)}</div>
                <div className="flex items-center gap-1 mt-1">
                  <button
                    className="px-2 py-0.5 text-white bg-primary rounded hover:bg-primary-dark text-xs"
                    onClick={() => updateQuantity(itemIndex, "decrease")}
                    disabled={isPlacingOrder || item.quantity <=1}
                  >
                    -
                  </button>
                  <span className="text-xs w-5 text-center">{item.quantity}</span>
                  <button
                    className="px-2 py-0.5 text-white bg-primary rounded hover:bg-primary-dark text-xs"
                    onClick={() => updateQuantity(itemIndex, "increase")}
                    disabled={isPlacingOrder}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t">
        <h3 className="font-medium mb-2">Member</h3>
        <div className="flex items-end gap-2 mb-2">
          <input
            type="tel"
            value={customerPhoneInput}
            onChange={(e) => setCustomerPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="เบอร์โทรลูกค้า (ถ้ามี)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            disabled={isPlacingOrder}
            maxLength={10}
          />
          <button
            onClick={handleCustomerPhoneConfirm}
            disabled={customerPhoneInput.length < 10 || isPlacingOrder || allCustomers.length === 0}
            className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm whitespace-nowrap"
          >
            ค้นหา
          </button>
        </div>
        {customerLookupError && (
          <p className={`text-xs ${selectedCustomerForOrder ? 'text-green-600' : 'text-red-600'} mb-3`}>
            {customerLookupError}
          </p>
        )}

        <div className="flex justify-between items-center mb-4">
          <span className="font-medium">ยอดรวม</span>
          <span className="text-xl font-medium">{total.toFixed(2)} THB</span>
        </div>

        <button
          className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-70"
          onClick={handlePlaceOrderSubmit}
          disabled={isPlacingOrder || items.length === 0}
        >
          {isPlacingOrder ? "กำลังสั่งซื้อ..." : "สั่งซื้อเลย"}
        </button>
        {/* {placeOrderError && <p className="text-red-500 text-sm mt-2 text-center">{placeOrderError}</p>} */}
      </div>
    </div>
  );
}