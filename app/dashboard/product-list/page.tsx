"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter } from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import TopHeader from "@/components/top-header";
import Breadcrumbs from "@/components/breadcrumbs";
import ProductTable from "@/components/product-table";
import AddProductModal from "@/components/add-product-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
      <div className="min-h-screen bg-[#FFFFFF] dark:bg-gray-900/95 transition-colors relative flex items-center justify-center">
        <div className="text-gray-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-[#FFFFFF] dark:bg-gray-900/95 transition-colors relative">
        <AppSidebar />
        <SidebarInset className="flex flex-col bg-transparent">
          <TopHeader userEmail={user.email} />
          <div className="flex-1 overflow-auto">
            <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
              {/* Breadcrumbs */}
              <Breadcrumbs />
              {/* Hero Header */}
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/50 backdrop-blur-md p-6">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-transparent blur-3xl"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-gradient-to-tr from-emerald-500/10 via-sky-500/10 to-transparent blur-3xl"
                />
                <div className="flex items-start justify-between gap-4 relative">
                  <div>
                    <div className="inline-flex items-center rounded-full border border-gray-200/70 dark:border-gray-700 bg-gray-50/90 dark:bg-gray-800/80 px-3 py-1 text-[11px] font-medium tracking-wider text-gray-600 dark:text-gray-300 uppercase">
                      Equipment & products
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white tracking-tight mt-4">
                      Product List
                    </h1>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 max-w-3xl">
                      Manage and view all your equipment and products in one place.
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                      Signed in as <span className="font-medium text-gray-700 dark:text-gray-200">{user.email}</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="hidden sm:flex flex-col items-end gap-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Today</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{todayLabel}</div>
                    </div>
                    <Button
                      onClick={() => setIsModalOpen(true)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Equipment
                    </Button>
                  </div>
                </div>
              </div>

              {/* Browse inventory */}
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
                  Browse inventory
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Search and filter equipment and products.
                </p>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-10 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="h-10 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>

              {/* Product Table */}
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
                  Equipment catalog
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-4">
                  All products and equipment. Click a row for details.
                </p>
                <ProductTable searchQuery={searchQuery} refreshTrigger={refreshTrigger} />
              </div>
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

