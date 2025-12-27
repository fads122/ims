"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter } from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import TopHeader from "@/components/top-header";
import ProductTable from "@/components/product-table";
import AddProductModal from "@/components/add-product-modal";

interface User {
  id: string;
  email: string;
  createdAt: string;
}

export default function ProductListPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white/95 dark:bg-gray-900/95 transition-colors relative flex items-center justify-center">
        <div className="text-gray-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-white/95 dark:bg-gray-900/95 transition-colors relative">
        <AppSidebar />
        <SidebarInset className="flex flex-col bg-transparent">
          <TopHeader userEmail={user.email} />
          <div className="flex-1 overflow-auto">
            <div className="p-6 lg:p-8 space-y-6">
              {/* Header Section */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Product List
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Manage and view all your equipment and products
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add Equipment
                </button>
              </div>

              {/* Search and Filter Bar */}
              <div className="flex items-center gap-4">
                <div className="flex-1 relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Filter className="w-5 h-5" />
                  Filter
                </button>
              </div>

              {/* Product Table */}
              <ProductTable searchQuery={searchQuery} refreshTrigger={refreshTrigger} />
            </div>
          </div>
        </SidebarInset>
      </div>

      {/* Add Product Modal */}
      <AddProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onProductAdded={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </SidebarProvider>
  );
}

