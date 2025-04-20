'use client';

import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  ingredients?: {
    name: string;
    amount: string;
  }[];
}

interface ProductGridProps {
  category: string;
  onAddToOrder: (product: Product) => void;
}

export default function ProductGrid({ category, onAddToOrder }: ProductGridProps) {
  const products: Product[] = [
    {
      id: 'espresso',
      name: 'Espresso',
      price: 55,
      image: '/images/coffee/espresso.jpg',
      ingredients: [
        { name: 'กาแฟคั่ว', amount: '1 oz' },
        { name: 'น้ำร้อน', amount: '2 oz' }
      ]
    },
    {
      id: 'americano',
      name: 'Americano',
      price: 25,
      image: '/images/coffee/americano.jpg',
      ingredients: [
        { name: 'กาแฟ', amount: '1 oz' },
        { name: 'น้ำร้อน', amount: '4 oz' }
      ]
    },
    {
      id: 'latte',
      name: 'Latte',
      price: 65,
      image: '/images/coffee/latte.jpg',
      ingredients: [
        { name: 'กาแฟ', amount: '1 oz' },
        { name: 'นมร้อน', amount: '4 oz' },
        { name: 'ฟองนม', amount: '1 oz' }
      ]
    },
    // Add more products as needed
  ];

  return (
    <div className="grid grid-cols-5 gap-4">
      {products.map((product) => (
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