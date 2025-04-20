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

interface MenuDetailProps {
  menu: MenuItem;
}

export default function MenuDetail({ menu }: MenuDetailProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium">Menu #{menu.menuId}</h2>
        <button className="p-2 hover:bg-gray-100 rounded-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <input
            type="text"
            value={menu.status}
            readOnly
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={menu.name}
            readOnly
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={menu.description}
            readOnly
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Price</label>
          <input
            type="number"
            value={menu.price}
            readOnly
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <input
            type="text"
            value={menu.category}
            readOnly
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Image</label>
          <input
            type="text"
            value={menu.image}
            readOnly
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 sm:text-sm"
          />
        </div>
      </div>

      <button className="mt-6 w-full py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
        Save
      </button>
    </div>
  );
} 