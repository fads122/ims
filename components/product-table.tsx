"use client";

import { useState, useEffect } from "react";
import { Edit2, Trash2, Eye } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  type: "operational" | "for-sale" | "package";
  quantity: number;
  condition: string;
  location: string;
  status: string;
}

interface ProductTableProps {
  searchQuery: string;
  refreshTrigger?: number;
}

export default function ProductTable({ searchQuery, refreshTrigger = 0 }: ProductTableProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/products");
        
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const result = await response.json();
        const allProducts: Product[] = [];

        // Transform operational equipment
        if (result.data.operational) {
          result.data.operational.forEach((item: any) => {
            allProducts.push({
              id: item.id,
              name: item.name || "Unnamed Equipment",
              category: item.product_type || "Equipment",
              type: "operational",
              quantity: item.quantity || 0,
              condition: item.condition || "Unknown",
              location: "N/A", // Operational equipment might not have location
              status: item.condition === "inactive" ? "Inactive" : "Active",
            });
          });
        }

        // Transform for-sale products
        if (result.data.forSale) {
          result.data.forSale.forEach((item: any) => {
            allProducts.push({
              id: item.id,
              name: item.product_brand || item.product_model || "Unnamed Product",
              category: item.category || "Product",
              type: "for-sale",
              quantity: item.quantity || 0,
              condition: item.condition || "Unknown",
              location: item.location || "N/A",
              status: item.quantity > 0 ? "In Stock" : "Out of Stock",
            });
          });
        }

        // Transform package bundles
        if (result.data.packages) {
          result.data.packages.forEach((item: any) => {
            allProducts.push({
              id: item.id,
              name: item.package_name || "Unnamed Package",
              category: item.package_category || "Package",
              type: "package",
              quantity: item.quantity || 0,
              condition: item.condition || "Unknown",
              location: item.location || "N/A",
              status: item.quantity > 0 ? "Available" : "Unavailable",
            });
          });
        }

        setProducts(allProducts);
      } catch (err: any) {
        console.error("Error fetching products:", err);
        setError(err.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [refreshTrigger]);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeBadge = (type: string) => {
    const styles = {
      operational: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
      "for-sale": "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
      package: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    };
    return styles[type as keyof typeof styles] || "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400";
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      Active: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
      "In Stock": "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
      Available: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400";
  };

  if (loading) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
        <div className="text-gray-600 dark:text-gray-400">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
        <div className="text-red-600 dark:text-red-400">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Product Name</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Category</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Type</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Quantity</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Condition</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Location</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  {products.length === 0 ? "No products found. Add your first product!" : "No products match your search"}
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-4 py-4 font-medium text-gray-900 dark:text-white">{product.name}</td>
                  <td className="px-4 py-4 text-gray-600 dark:text-gray-400">{product.category}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getTypeBadge(product.type)}`}>
                      {product.type.replace("-", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-semibold text-gray-900 dark:text-white">{product.quantity}</td>
                  <td className="px-4 py-4 text-gray-600 dark:text-gray-400">{product.condition}</td>
                  <td className="px-4 py-4 text-gray-600 dark:text-gray-400">{product.location}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(product.status)}`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

