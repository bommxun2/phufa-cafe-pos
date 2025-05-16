// src/types/order.ts
import type { ProductCustomizableIngredient } from "./menu"; // Re-using from menu types

// From components/OrderDetailPOS.tsx
export interface OrderItemCustomization {
  // Was 'Customizations' in OrderDetailPOS
  ingredientId: string;
}

export interface OrderItemPayload {
  // Was 'Item' in OrderDetailPOS (for placing order)
  menuId: string;
  quantity: number;
  note: string;
  customizations: OrderItemCustomization[];
}

export interface PlaceOrderPayload {
  // Was 'PlaceOrder' in OrderDetailPOS
  orderMakerEmpId: string;
  orderByCitizenId?: string; // Optional if customer is not a member
  items: OrderItemPayload[];
}

export interface OrderItemInPOS {
  // Was 'OrderItem' in OrderDetailPOS (for displaying in current order)
  id: string; // menuId
  name: string;
  quantity: number;
  price: number;
  ingredients: ProductCustomizableIngredient[]; // Deep-cloned from Product
}

export interface CurrentOrderInPOS {
  // Was 'Order' in OrderDetailPOS
  orderId: string; // Could be temporary or empty before placing
  items: OrderItemInPOS[];
  total: number;
}

// From components/OrderList.tsx (for displaying historical orders)
export interface HistoricalOrderItemIngredient {
  name: string;
  amount: string;
}

export interface HistoricalOrderItem {
  name: string; // Menu name
  quantity: number;
  price: number; // Item total price
  ingredients: HistoricalOrderItemIngredient[]; // Could be derived from customizations
}

export interface HistoricalOrder {
  orderId: string;
  dateTime: string; // ISO string
  customer: string; // Customer display name or ID
  employee: string; // Employee display name or ID
  menuCount: number;
  total: number; // orderPrice
  items?: HistoricalOrderItem[]; // Detailed items for selected order
  // Fields directly from API:
  orderDateTime: string;
  orderStatus: boolean;
  orderPrice: number;
  orderMakerEmpId: string;
  orderByCitizenId?: string | null;
  orderItems: any[]; // Define more strictly based on API response for orderItems if possible
}

// From components/OrderDetailFromOrder.tsx - similar to HistoricalOrder but focused on one
export interface DisplayOrderDetail {
  orderId: string;
  orderDateTime: string;
  orderStatus: boolean;
  orderPrice: number;
  orderMakerEmpId: string;
  orderByCitizenId?: string | null;
  orderItems: Array<{
    orderItemId: string;
    quantity: number;
    menuName: string;
    itemTotalPrice: number;
    customizations: Array<{
      ingredientId: string;
      ingredientName: string;
      customizationCostApplied: number;
    }>;
  }>;
}
