'use client';

interface MenuItem {
  menuId: string;
  status: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
}

interface MenuTableProps {
  onSelectMenu: (menu: MenuItem | null) => void;
}

export default function MenuTable({ onSelectMenu }: MenuTableProps) {
  const menuItems: MenuItem[] = [
    {
      menuId: 'M213560000',
      status: 'พร้อมขาย',
      name: 'Espresso',
      description: 'A bold espresso shot with rich crema, offering...',
      price: 20,
      category: 'Coffee',
      image: 'X'
    },
    // Add more menu items as needed
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">MenuID</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Status</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Name</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Description</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Price</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Category</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Image</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {menuItems.map((item) => (
            <tr
              key={item.menuId}
              onClick={() => onSelectMenu(item)}
              className="hover:bg-gray-50 cursor-pointer"
            >
              <td className="px-6 py-4 text-sm text-gray-900">{item.menuId}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{item.status}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{item.name}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{item.price}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{item.category}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{item.image}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 