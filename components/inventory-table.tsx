"use client";

import { Edit2, Trash2 } from "lucide-react";

export default function InventoryTable() {
  const items = [
    {
      id: 1,
      product: "Wireless Headphones",
      sku: "WH-001",
      quantity: 124,
      status: "In Stock",
      price: "$89.99",
    },
    {
      id: 2,
      product: "USB-C Cable",
      sku: "USB-C-2m",
      quantity: 8,
      status: "Low Stock",
      price: "$12.99",
    },
    {
      id: 3,
      product: "Laptop Stand",
      sku: "LS-AL-01",
      quantity: 45,
      status: "In Stock",
      price: "$45.00",
    },
    {
      id: 4,
      product: "Mechanical Keyboard",
      sku: "KB-MECH-RGB",
      quantity: 0,
      status: "Out of Stock",
      price: "$156.00",
    },
    {
      id: 5,
      product: "4K Webcam",
      sku: "WC-4K-30",
      quantity: 32,
      status: "In Stock",
      price: "$129.99",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Stock":
        return "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400";
      case "Low Stock":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400";
      case "Out of Stock":
        return "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400";
    }
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="p-6 pb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Inventory</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Latest products and their status</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Product</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">SKU</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Quantity</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Price</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr
                key={item.id}
                className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                  index === items.length - 1 ? "border-b-0" : ""
                }`}
              >
                <td className="px-4 py-4 font-medium text-gray-900 dark:text-white">{item.product}</td>
                <td className="px-4 py-4 text-gray-600 dark:text-gray-400">{item.sku}</td>
                <td className="px-4 py-4 font-semibold text-gray-900 dark:text-white">{item.quantity}</td>
                <td className="px-4 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-4 font-semibold text-gray-900 dark:text-white">{item.price}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

