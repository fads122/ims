"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, MoreVertical, Edit, Trash2, Building2, Eye } from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import TopHeader from "@/components/top-header";
import Breadcrumbs from "@/components/breadcrumbs";
import AddEditSupplierDialog from "@/components/add-edit-supplier-dialog";
import DeleteConfirmDialog from "@/components/delete-confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface User {
  id: string;
  email: string;
  createdAt: string;
}

interface Supplier {
  id: string;
  supplier_name: string;
  contact_person: string;
  phone: string;
  email: string;
  status: "Active" | "Inactive";
  address: string;
  facebook_page?: string;
  viber?: string;
  telegram?: string;
  instagram?: string;
  rating?: number;
}

export default function SupplierListPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "current">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteSupplier, setDeleteSupplier] = useState<Supplier | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState({ total: 0, active: 0 });

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

  useEffect(() => {
    if (user) {
      fetchSuppliers();
      fetchStats();
    }
  }, [user, searchQuery, activeTab, page, limit]);

  const fetchSuppliers = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      if (activeTab === "current") {
        // For now, show all. Later you can filter by current user
        params.append("status", "Active");
      }

      const response = await fetch(`/api/suppliers?${params}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to fetch suppliers: ${response.status} ${response.statusText}`;
        
        // If table doesn't exist, show helpful message
        if (errorMessage.includes("table") || errorMessage.includes("schema cache") || response.status === 404) {
          console.error("Suppliers table not found. Please create it in Supabase.");
          setSuppliers([]);
          setTotal(0);
          setTotalPages(0);
          return; // Don't show alert, just show empty state
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setSuppliers(result.data || []);
      setTotal(result.pagination?.total || 0);
      setTotalPages(result.pagination?.totalPages || 0);
    } catch (error: any) {
      console.error("Error fetching suppliers:", error);
      setSuppliers([]);
      setTotal(0);
      setTotalPages(0);
    }
  };

  const fetchStats = async () => {
    try {
      const [allResponse, activeResponse] = await Promise.all([
        fetch("/api/suppliers?limit=1"),
        fetch("/api/suppliers?status=Active&limit=1"),
      ]);

      const allData = await allResponse.json();
      const activeData = await activeResponse.json();

      setStats({
        total: allData.pagination?.total || 0,
        active: activeData.pagination?.total || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleAdd = () => {
    setEditingSupplier(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsDialogOpen(true);
  };

  const handleDelete = (supplier: Supplier) => {
    setDeleteSupplier(supplier);
  };

  const handleView = (supplier: Supplier) => {
    router.push(`/dashboard/supplier-profile?id=${supplier.id}`);
  };

  const confirmDelete = async () => {
    if (!deleteSupplier) return;

    try {
      const response = await fetch(`/api/suppliers?id=${deleteSupplier.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete supplier");

      await fetchSuppliers();
      await fetchStats();
      setDeleteSupplier(null);
    } catch (error) {
      console.error("Error deleting supplier:", error);
      alert("Failed to delete supplier");
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingSupplier(null);
    fetchSuppliers();
    fetchStats();
  };

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

  const currentSuppliersCount = suppliers.filter((s) => s.status === "Active").length;

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-white/95 dark:bg-gray-900/95 transition-colors relative">
        <AppSidebar />
        <SidebarInset className="flex flex-col bg-transparent">
          <TopHeader userEmail={user.email} />
          <div className="flex-1 overflow-auto">
            <div className="p-6 lg:p-8 space-y-6">
              {/* Breadcrumbs */}
              <Breadcrumbs />
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Supplier List</h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and view all your suppliers</p>
                </div>
                <button
                  onClick={handleAdd}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add Supplier
                </button>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Suppliers</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</div>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Active Suppliers</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.active}</div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab("current")}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === "current"
                      ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Current Supplier ({currentSuppliersCount})
                </button>
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === "all"
                      ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  All Suppliers ({stats.total})
                </button>
              </div>

              {/* Search */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search suppliers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Table */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Supplier Information</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Contact Person</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Phone</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Email</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suppliers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                            <div className="space-y-2">
                              <p>No suppliers found</p>
                              <p className="text-xs">
                                {total === 0 && "If you just created the table, try refreshing the page."}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        suppliers.map((supplier) => (
                          <tr
                            key={supplier.id}
                            className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                  <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">{supplier.supplier_name}</div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">{supplier.address}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-gray-600 dark:text-gray-400">{supplier.contact_person}</td>
                            <td className="px-4 py-4 text-gray-600 dark:text-gray-400">{supplier.phone}</td>
                            <td className="px-4 py-4 text-gray-600 dark:text-gray-400">{supplier.email}</td>
                            <td className="px-4 py-4">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  supplier.status === "Active"
                                    ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                                }`}
                              >
                                {supplier.status}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <DropdownMenu>
                                <DropdownMenuTrigger className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                                  <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleView(supplier)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEdit(supplier)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDelete(supplier)} className="text-red-600 dark:text-red-400">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Items per page:</span>
                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(1);
                      }}
                      className="px-3 py-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {((page - 1) * limit + 1)} – {Math.min(page * limit, total)} of {total}
                    </span>
                    <button
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                      className="px-3 py-1 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      « First
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ‹ Prev
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next ›
                    </button>
                    <button
                      onClick={() => setPage(totalPages)}
                      disabled={page === totalPages}
                      className="px-3 py-1 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Last »
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SidebarInset>
      </div>

      {/* Add/Edit Dialog */}
      <AddEditSupplierDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        supplier={editingSupplier}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        isOpen={!!deleteSupplier}
        onClose={() => setDeleteSupplier(null)}
        onConfirm={confirmDelete}
        title="Delete Supplier"
        message="Are you sure you want to delete this supplier? This action cannot be undone."
      />
    </SidebarProvider>
  );
}

