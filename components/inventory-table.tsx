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
        return "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800";
      case "Low Stock":
        return "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800";
      case "Out of Stock":
        return "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800";
      default:
        return "bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-600";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Inventory</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Latest products and their status</p>
          </div>
          <button className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            View All
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {items.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{item.product}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">{item.sku}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{item.quantity}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{item.price}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Delete">
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

