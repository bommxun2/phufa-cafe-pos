'use client';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  ingredients: {
    name: string;
    amount: string;
  }[];
}

interface Order {
  orderId: string;
  items: OrderItem[];
  total: number;
}

interface OrderDetailProps {
  order: Order;
}

export default function OrderDetail({ order }: OrderDetailProps) {
  // Ensure items array exists with a default empty array
  const items = order?.items || [];
  const total = order?.total || 0;
  const orderId = order?.orderId || '';

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium">Order Detail</h2>
        <div className="text-sm text-gray-500">#{orderId}</div>
      </div>

      <div className="space-y-6">
        <h3 className="font-medium">Order List</h3>
        {items.map((item, index) => (
          <div key={index} className="border-b border-gray-200 pb-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                  {item.quantity}x
                </div>
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-500">
                    {item.ingredients.map((ing) => (
                      <div key={ing.name} className="flex justify-between">
                        <span>{ing.name}</span>
                        <span>{ing.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="font-medium">{item.price.toFixed(2)}</div>
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

        <button className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
          Place Order
        </button>
      </div>
    </div>
  );
}