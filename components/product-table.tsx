"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Eye, QrCode, Barcode, Package, AlertTriangle, Building2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import QRBarcodeModal from "@/components/qr-barcode-modal";

interface ProductTableProps {
  searchQuery: string;
  refreshTrigger?: number;
}

interface GroupedProduct {
  groupName: string;
  totalQuantity: number;
  variantCount: number;
  lastUpdated: string;
  status: string;
  items: any[];
  suppliers?: string[];
}

export default function ProductTable({ searchQuery, refreshTrigger = 0 }: ProductTableProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"for-sale" | "operational">("for-sale");
  const [forSaleProducts, setForSaleProducts] = useState<any[]>([]);
  const [operationalProducts, setOperationalProducts] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"qr" | "barcode">("qr");
  const [modalData, setModalData] = useState<string>("");
  const [storedCode, setStoredCode] = useState<string>("");

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
        setForSaleProducts(result.data.forSale || []);
        setOperationalProducts(result.data.operational || []);
        setPackages(result.data.packages || []);
      } catch (err: any) {
        console.error("Error fetching products:", err);
        setError(err.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [refreshTrigger]);

  // Group products
  const groupedForSale = useMemo(() => {
    const groups = new Map<string, any[]>();
    
    forSaleProducts.forEach((item) => {
      const model = item.product_model || "Unknown Model";
      if (!groups.has(model)) {
        groups.set(model, []);
      }
      groups.get(model)!.push(item);
    });

    const grouped: GroupedProduct[] = [];
    groups.forEach((items, model) => {
      const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const lastUpdated = items.reduce((latest, item) => {
        const itemDate = new Date(item.updated_at || item.created_at || 0);
        const latestDate = new Date(latest);
        return itemDate > latestDate ? item.updated_at || item.created_at : latest;
      }, items[0]?.updated_at || items[0]?.created_at || "");

      // Get unique suppliers for this group
      const uniqueSuppliers = Array.from(new Set(items.map((item: any) => item.supplier).filter(Boolean)));

      grouped.push({
        groupName: model,
        totalQuantity,
        variantCount: items.length,
        lastUpdated,
        status: totalQuantity > 5 ? "Available" : totalQuantity > 0 ? "Low Stock" : "Out of Stock",
        items,
        suppliers: uniqueSuppliers,
      });
    });

    return grouped.sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated));
  }, [forSaleProducts]);

  const groupedOperational = useMemo(() => {
    const groups = new Map<string, any[]>();
    
    operationalProducts.forEach((item) => {
      const productType = item.product_type || "Other";
      if (!groups.has(productType)) {
        groups.set(productType, []);
      }
      groups.get(productType)!.push(item);
    });

    const grouped: GroupedProduct[] = [];
    groups.forEach((items, productType) => {
      const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const lastUpdated = items.reduce((latest, item) => {
        const itemDate = new Date(item.updated_at || item.created_at || 0);
        const latestDate = new Date(latest);
        return itemDate > latestDate ? item.updated_at || item.created_at : latest;
      }, items[0]?.updated_at || items[0]?.created_at || "");

      // Determine status based on condition
      const status = items.some((item) => item.condition === "inactive") 
        ? "Inactive" 
        : items.some((item) => item.damage_status === "Damaged")
        ? "Damaged"
        : "Available";

      grouped.push({
        groupName: productType,
        totalQuantity,
        variantCount: items.length,
        lastUpdated,
        status,
        items,
      });
    });

    return grouped.sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated));
  }, [operationalProducts]);

  // Filter groups by search query
  const filteredForSale = useMemo(() => {
    if (!searchQuery) return groupedForSale;
    const query = searchQuery.toLowerCase();
    return groupedForSale.filter((group) => {
      return (
        group.groupName.toLowerCase().includes(query) ||
        group.items.some((item: any) =>
          (item.product_brand || "").toLowerCase().includes(query) ||
          (item.product_model || "").toLowerCase().includes(query) ||
          (item.serial_number || "").toLowerCase().includes(query)
        )
      );
    });
  }, [groupedForSale, searchQuery]);

  const filteredOperational = useMemo(() => {
    if (!searchQuery) return groupedOperational;
    const query = searchQuery.toLowerCase();
    return groupedOperational.filter((group) => {
      return (
        group.groupName.toLowerCase().includes(query) ||
        group.items.some((item: any) =>
          (item.name || "").toLowerCase().includes(query) ||
          (item.brand || "").toLowerCase().includes(query) ||
          (item.model || "").toLowerCase().includes(query) ||
          (item.serial_number || "").toLowerCase().includes(query)
        )
      );
    });
  }, [groupedOperational, searchQuery]);

  // Pagination for For Sale
  const paginatedForSale = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredForSale.slice(start, start + itemsPerPage);
  }, [filteredForSale, currentPage]);

  const totalPages = Math.ceil(filteredForSale.length / itemsPerPage);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  const handleViewCode = (type: "qr" | "barcode", item: any) => {
    // Extract data: prefer serial_number, then id, then group name, then a default
    let codeData = "";
    let stored = "";
    
    // Check for stored code first
    if (type === "qr" && item.qr_code) {
      stored = item.qr_code;
    } else if (type === "barcode" && item.barcode) {
      stored = item.barcode;
    }
    
    if (item.serial_number) {
      codeData = item.serial_number;
    } else if (item.package_name) {
      // For packages, use package name
      codeData = item.package_name;
    } else if (item.id) {
      codeData = item.id;
    } else if (item.groupName) {
      // For group rows, use group name
      codeData = item.groupName;
    } else if (item.product_model) {
      codeData = item.product_model;
    } else if (item.product_brand) {
      codeData = item.product_brand;
    } else if (item.name) {
      codeData = item.name;
    } else {
      codeData = "NO_DATA";
    }
    
    if (!codeData || codeData === "NO_DATA") {
      alert("No data available to generate code. Please ensure the item has a serial number or ID.");
      return;
    }
    
    setModalData(codeData);
    setModalType(type);
    setStoredCode(stored);
    setModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Available: "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800",
      "Low Stock": "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
      "Out of Stock": "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800",
      Inactive: "bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-600",
      Damaged: "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800",
    };
    return styles[status] || "bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-600";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
        <div className="text-gray-600 dark:text-gray-400">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
        <div className="text-red-600 dark:text-red-400">Error: {error}</div>
      </div>
    );
  }

  const displayGroups = activeTab === "for-sale" ? paginatedForSale : filteredOperational;
  const allGroups = activeTab === "for-sale" ? filteredForSale : filteredOperational;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => {
            setActiveTab("for-sale");
            setCurrentPage(1);
            setExpandedGroups(new Set());
          }}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "for-sale"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          For Sale ({filteredForSale.length} groups)
        </button>
        <button
          onClick={() => {
            setActiveTab("operational");
            setExpandedGroups(new Set());
          }}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "operational"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Operational ({filteredOperational.length} groups)
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-12"></th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  {activeTab === "for-sale" ? "Model" : "Product Type"}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Total Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Variants</th>
                {activeTab === "for-sale" && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Suppliers</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Last Updated</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {displayGroups.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === "for-sale" ? 8 : 7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    {allGroups.length === 0 
                      ? `No ${activeTab === "for-sale" ? "for sale" : "operational"} products found. Add your first product!` 
                      : "No products match your search"}
                  </td>
                </tr>
              ) : (
                displayGroups.map((group) => {
                  const isExpanded = expandedGroups.has(group.groupName);
                  const isLowStock = group.totalQuantity <= 5 && group.totalQuantity > 0;
                  const isPackage = packages.some((pkg) => 
                    activeTab === "for-sale" 
                      ? group.items.some((item: any) => item.id === pkg.id)
                      : false
                  );

                  return (
                    <Fragment key={group.groupName}>
                      {/* Group Row */}
                      <tr
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors cursor-pointer"
                        onClick={() => toggleGroup(group.groupName)}
                      >
                        <td className="px-6 py-4">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {isPackage && (
                              <Package className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            )}
                            <span className="font-semibold text-gray-900 dark:text-white">{group.groupName}</span>
                            {isLowStock && (
                              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-semibold ${isLowStock ? "text-amber-600 dark:text-amber-400" : "text-gray-900 dark:text-white"}`}>
                            {group.totalQuantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{group.variantCount}</td>
                        {activeTab === "for-sale" && (
                          <td className="px-6 py-4">
                            {group.suppliers && group.suppliers.length > 0 ? (
                              group.suppliers.length === 1 ? (
                                <span className="text-gray-900 dark:text-white font-medium">{group.suppliers[0]}</span>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <Building2 className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-900 dark:text-white font-medium">
                                    {group.suppliers.length} Suppliers
                                  </span>
                                </div>
                              )
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        )}
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{formatDate(group.lastUpdated)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ${getStatusBadge(group.status)}`}>
                            {group.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <Eye className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                if (group.items.length > 0) {
                                  const firstItem = group.items[0];
                                  const isPackage = packages.some((pkg) => pkg.id === firstItem.id);
                                  const itemType = isPackage ? "package" : activeTab;
                                  router.push(`/dashboard/equipment-details?id=${firstItem.id}&type=${itemType}`);
                                }
                              }}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleViewCode("qr", group);
                              }}>
                                <QrCode className="w-4 h-4 mr-2" />
                                View QR Code
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleViewCode("barcode", group);
                              }}>
                                <Barcode className="w-4 h-4 mr-2" />
                                View Barcode
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>

                      {/* Expanded Items */}
                      {isExpanded && group.items.map((item: any, index: number) => (
                        <tr
                          key={`${group.groupName}-${item.id}-${index}`}
                          className="bg-gray-50/50 dark:bg-gray-900/30 hover:bg-gray-100 dark:hover:bg-gray-900/50"
                        >
                          <td className="px-6 py-3"></td>
                          <td className="px-6 py-3 pl-12">
                            <div className="space-y-1">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {activeTab === "for-sale" 
                                  ? item.product_brand || item.product_model 
                                  : item.name}
                              </div>
                              {activeTab === "for-sale" && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Brand: {item.product_brand || "N/A"}
                                </div>
                              )}
                              {item.serial_number && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                  SN: {item.serial_number}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <span className="font-medium text-gray-900 dark:text-white">{item.quantity || 0}</span>
                          </td>
                          <td className="px-6 py-3 text-gray-600 dark:text-gray-400">-</td>
                          {activeTab === "for-sale" && (
                            <td className="px-6 py-3">
                              {item.supplier ? (
                                <div className="flex items-center gap-1.5">
                                  <Building2 className="w-3.5 h-3.5 text-gray-400" />
                                  <span className="text-gray-900 dark:text-white font-medium">{item.supplier}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          )}
                          <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                            {formatDate(item.updated_at || item.created_at)}
                          </td>
                          <td className="px-6 py-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ${
                              activeTab === "for-sale"
                                ? item.quantity > 0 ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                                : item.condition === "inactive" ? "bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-600" : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                            }`}>
                              {activeTab === "for-sale" 
                                ? item.quantity > 0 ? "In Stock" : "Out of Stock"
                                : item.condition === "inactive" ? "Inactive" : "Active"}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                  <Eye className="w-4 h-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  const isPackage = packages.some((pkg) => pkg.id === item.id);
                                  const itemType = isPackage ? "package" : activeTab;
                                  router.push(`/dashboard/equipment-details?id=${item.id}&type=${itemType}`);
                                }}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewCode("qr", item)}>
                                  <QrCode className="w-4 h-4 mr-2" />
                                  View QR Code
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewCode("barcode", item)}>
                                  <Barcode className="w-4 h-4 mr-2" />
                                  View Barcode
                                </DropdownMenuItem>
                                {activeTab === "for-sale" && item.supplier && (
                                  <DropdownMenuItem>
                                    <Building2 className="w-4 h-4 mr-2" />
                                    Supplier: {item.supplier}
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination for For Sale */}
      {activeTab === "for-sale" && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredForSale.length)} of {filteredForSale.length} groups
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* QR Code / Barcode Modal */}
      <QRBarcodeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={modalType}
        data={modalData}
        storedCode={storedCode}
      />
    </div>
  );
}
