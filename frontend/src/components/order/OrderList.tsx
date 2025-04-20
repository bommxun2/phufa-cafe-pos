'use client';

interface Order {
  orderId: string;
  dateTime: string;
  customer: string;
  employee: string;
  menuCount: number;
  total: number;
  items?: {
    name: string;
    quantity: number;
    price: number;
    ingredients: {
      name: string;
      amount: string;
    }[];
  }[];
}

interface OrderListProps {
  onSelectOrder: (order: Order | null) => void;
}

export default function OrderList({ onSelectOrder }: OrderListProps) {
  const orders: Order[] = [
    {
      orderId: 'O265980000',
      dateTime: '2024-03-21 00:18:00',
      customer: 'Yodchai Manmak',
      employee: 'Somchai Lorlao',
      menuCount: 6,
      total: 195.00,
      items: [
        {
          name: 'Espresso',
          quantity: 2,
          price: 55,
          ingredients: [
            { name: 'กาแฟคั่ว', amount: '1 oz' },
            { name: 'น้ำร้อน', amount: '2 oz' }
          ]
        },
        {
          name: 'Latte',
          quantity: 1,
          price: 85,
          ingredients: [
            { name: 'กาแฟ', amount: '1 oz' },
            { name: 'นมร้อน', amount: '4 oz' },
            { name: 'ฟองนม', amount: '1 oz' }
          ]
        }
      ]
    },
    {
      orderId: 'O265980001',
      dateTime: '2024-03-21 01:00:00',
      customer: 'Nattapong Suwan',
      employee: 'Apichat Chansri',
      menuCount: 4,
      total: 120.00,
      items: [
        {
          name: 'Americano',
          quantity: 2,
          price: 60,
          ingredients: [
            { name: 'กาแฟ', amount: '1 oz' },
            { name: 'น้ำร้อน', amount: '4 oz' }
          ]
        }
      ]
    },
    // Add more orders as needed
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">OrderID</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">DateTime</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Customer</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Employee</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Menu#</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {orders.map((order) => (
            <tr
              key={order.orderId}
              onClick={() => onSelectOrder(order)}
              className="hover:bg-gray-50 cursor-pointer"
            >
              <td className="px-6 py-4 text-sm text-gray-900">{order.orderId}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{order.dateTime}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{order.customer}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{order.employee}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{order.menuCount}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{order.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 