"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Box,
  ShoppingCart,
  Download,
  Save,
  X,
  Plus,
  Minus,
  Eye,
  Trash2,
  Package,
} from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import TopHeader from "@/components/top-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface User {
  id: string;
  email: string;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  model: string;
  brand: string;
  supplier: string;
  supplier_cost: number;
  price: number;
  srp: number;
  quantity: number;
  image: string | null;
  is_package: boolean;
  package_category?: string;
  description?: string;
  category: string;
  type: "operational" | "for-sale" | "package";
  condition?: string;
  similarity?: number;
  compatible?: boolean;
}

interface SelectedProduct extends Product {
  selectedQuantity: number;
}

function PartsPickerContent() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [parts, setParts] = useState<Product[]>([]);
  const [filteredParts, setFilteredParts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isViewSelectedOpen, setIsViewSelectedOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [searchMode, setSearchMode] = useState<"text" | "semantic">("text");

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
      loadParts();
    }
  }, [user]);

  useEffect(() => {
    filterParts();
  }, [searchQuery, selectedCategory, parts]);

  const loadParts = async () => {
    try {
      const response = await fetch("/api/parts/pc-parts");
      if (!response.ok) throw new Error("Failed to fetch parts");
      const result = await response.json();
      setParts(result.data || []);
    } catch (error: any) {
      console.error("Error loading parts:", error);
      alert("Failed to load parts: " + error.message);
    }
  };

  const filterParts = () => {
    let filtered = [...parts];

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((part) => part.category === selectedCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const search = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (part) =>
          part.name.toLowerCase().includes(search) ||
          part.model.toLowerCase().includes(search) ||
          part.brand.toLowerCase().includes(search) ||
          part.supplier.toLowerCase().includes(search) ||
          part.description?.toLowerCase().includes(search)
      );
    }

    setFilteredParts(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const toggleProductSelection = (product: Product) => {
    const existingIndex = selectedProducts.findIndex((p) => p.id === product.id);
    if (existingIndex !== -1) {
      // Remove from selection
      setSelectedProducts(selectedProducts.filter((_, i) => i !== existingIndex));
    } else {
      // Add to selection
      setSelectedProducts([
        ...selectedProducts,
        { ...product, selectedQuantity: 1 },
      ]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setSelectedProducts(
      selectedProducts.map((p) => {
        if (p.id === productId) {
          const currentQuantity = p.selectedQuantity;
          const newQuantity = Math.max(1, currentQuantity + delta);
          const availableStock = p.quantity || 0;

          // Validate quantity doesn't exceed available stock
          if (newQuantity > availableStock) {
            alert(`Quantity cannot exceed available stock (${availableStock}). Please reduce the quantity.`);
            return p; // Don't update if quantity exceeds stock
          }

          return { ...p, selectedQuantity: newQuantity };
        }
        return p;
      })
    );
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    const product = selectedProducts.find((p) => p.id === productId);
    if (!product) return;

    const availableStock = product.quantity || 0;

    // Validate quantity
    if (newQuantity < 1) {
      alert("Quantity must be at least 1");
      return;
    }

    if (newQuantity > availableStock) {
      alert(`Quantity cannot exceed available stock (${availableStock}). Please reduce the quantity.`);
      return;
    }

    setSelectedProducts(
      selectedProducts.map((p) => {
        if (p.id === productId) {
          return { ...p, selectedQuantity: newQuantity };
        }
        return p;
      })
    );
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== productId));
  };

  const getTotalPrice = () => {
    return selectedProducts.reduce(
      (total, product) => total + product.price * product.selectedQuantity,
      0
    );
  };

  const getCategories = () => {
    const categories = new Set<string>();
    parts.forEach((part) => {
      if (part.category) categories.add(part.category);
    });
    return Array.from(categories).sort();
  };

  const handleSave = async () => {
    if (!saveTitle.trim()) {
      alert("Please enter a title for your saved equipment list");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const response = await fetch("/api/parts/saved-equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: saveTitle,
          items: selectedProducts,
          user_id: user.id || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save equipment");
      }

      alert("Equipment list saved successfully!");
      setIsSaveModalOpen(false);
      setSaveTitle("");
      setSelectedProducts([]);
    } catch (error: any) {
      console.error("Error saving equipment:", error);
      alert("Failed to save equipment: " + error.message);
    }
  };

  const handleExportPDF = async () => {
    try {
      const [{ jsPDF }, { autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;

      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Selected Equipment List", pageWidth / 2, y, { align: "center" });
      y += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, y, {
        align: "center",
      });
      y += 15;

      // Table data
      const tableData = selectedProducts.map((product) => [
        product.name,
        product.brand,
        product.model,
        product.selectedQuantity.toString(),
        `₱${product.price.toLocaleString()}`,
        `₱${(product.price * product.selectedQuantity).toLocaleString()}`,
      ]);

      autoTable(doc, {
        head: [["Name", "Brand", "Model", "Quantity", "Unit Price", "Total"]],
        body: tableData,
        startY: y,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });

      const finalY = (doc as any).lastAutoTable.finalY || y;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(
        `Grand Total: ₱${getTotalPrice().toLocaleString()}`,
        pageWidth / 2,
        finalY + 15,
        { align: "center" }
      );

      doc.save(`selected-equipment-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error: any) {
      console.error("Error exporting PDF:", error);
      alert("Failed to export PDF: " + error.message);
    }
  };

  const paginatedParts = filteredParts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredParts.length / itemsPerPage);

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
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Parts Picker
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Search, select, and save equipment for your projects
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsViewSelectedOpen(true)}
                    disabled={selectedProducts.length === 0}
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Selected ({selectedProducts.length})
                  </Button>
                </div>
              </div>

              {/* Search and Filters */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search by name, model, brand, or supplier..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={searchMode === "text" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSearchMode("text")}
                        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Text Search
                      </Button>
                      <Button
                        variant={searchMode === "semantic" ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setSearchMode("semantic");
                          alert("Semantic search coming soon!");
                        }}
                        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        AI Search
                      </Button>
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant={selectedCategory === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory("all")}
                        className={selectedCategory === "all" 
                          ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200"
                          : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }
                      >
                        All
                      </Button>
                      {getCategories().map((category) => {
                        const count = parts.filter((p) => p.category === category).length;
                        return (
                          <Button
                            key={category}
                            variant={selectedCategory === category ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedCategory(category)}
                            className={selectedCategory === category
                              ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200"
                              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                            }
                          >
                            {category}
                            {count > 0 && (
                              <Badge 
                                variant="secondary" 
                                className={`ml-1.5 text-xs px-1.5 py-0 ${
                                  selectedCategory === category
                                    ? "bg-white/20 dark:bg-gray-900/20 text-white dark:text-gray-900"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                }`}
                              >
                                {count}
                              </Badge>
                            )}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Results Count and Total Price Bar */}
              <div className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-6 py-3">
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing <span className="font-medium text-gray-900 dark:text-white">{paginatedParts.length}</span> of{" "}
                    <span className="font-medium text-gray-900 dark:text-white">{filteredParts.length}</span> parts
                  </div>
                  {selectedCategory !== "all" && (
                    <Badge variant="outline" className="text-xs">
                      {selectedCategory}
                    </Badge>
                  )}
                </div>
                {selectedProducts.length > 0 && (
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-gray-900 dark:text-white">{selectedProducts.length}</span> item{selectedProducts.length !== 1 ? "s" : ""} selected
                    </div>
                    <div className="text-base font-semibold text-gray-900 dark:text-white">
                      Total: <span className="text-blue-600 dark:text-blue-400">₱{getTotalPrice().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Parts Grid */}
              {paginatedParts.length === 0 ? (
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardContent className="py-12 text-center">
                    <Box className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No parts found. Try adjusting your search or filters.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {paginatedParts.map((part) => {
                    const isSelected = selectedProducts.some((p) => p.id === part.id);
                    const stockStatus = part.quantity === 0 ? "out" : part.quantity < 10 ? "low" : "in";
                    
                    return (
                      <Card
                        key={part.id}
                        className={`bg-white dark:bg-gray-800 border transition-colors ${
                          isSelected 
                            ? "border-blue-500 dark:border-blue-400" 
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        <CardContent className="p-0">
                          {/* Product Image Section */}
                          <div className="relative h-40 bg-gray-50 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                            {part.image ? (
                              <img
                                src={part.image}
                                alt={part.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Box className="w-12 h-12 text-gray-300 dark:text-gray-700" />
                            )}
                            {part.is_package && (
                              <Badge 
                                variant="secondary" 
                                className="absolute top-2 right-2 text-xs"
                              >
                                <Package className="w-3 h-3 mr-1" />
                                Package
                              </Badge>
                            )}
                            {isSelected && (
                              <div className="absolute top-2 left-2">
                                <Badge className="bg-blue-600 text-white">
                                  <ShoppingCart className="w-3 h-3 mr-1" />
                                  Selected
                                </Badge>
                              </div>
                            )}
                          </div>

                          {/* Product Info Section */}
                          <div className="p-4 space-y-3">
                            {/* Title and Brand */}
                            <div>
                              <h3 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2 mb-1">
                                {part.name}
                              </h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                {part.brand} {part.model && `• ${part.model}`}
                              </p>
                            </div>

                            {/* Price */}
                            <div>
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                ₱{part.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>

                            {/* Stock and Supplier */}
                            <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100 dark:border-gray-700">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500 dark:text-gray-400">Stock:</span>
                                <Badge
                                  variant={
                                    stockStatus === "out" ? "destructive" :
                                    stockStatus === "low" ? "secondary" : "default"
                                  }
                                  className="text-xs"
                                >
                                  {part.quantity}
                                </Badge>
                              </div>
                              {part.supplier && (
                                <span className="text-gray-500 dark:text-gray-400 truncate max-w-[50%]">
                                  {part.supplier}
                                </span>
                              )}
                            </div>

                            {/* Action Button */}
                            <Button
                              variant={isSelected ? "destructive" : "default"}
                              className="w-full"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleProductSelection(part);
                              }}
                            >
                              {isSelected ? (
                                <>
                                  <X className="w-4 h-4 mr-2" />
                                  Remove
                                </>
                              ) : (
                                <>
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Items per page:
                    </span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SidebarInset>
      </div>

      {/* View Selected Modal */}
      <Dialog open={isViewSelectedOpen} onOpenChange={setIsViewSelectedOpen}>
        <DialogContent className="!max-w-4xl !max-h-[90vh] overflow-y-auto !bg-white dark:!bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Selected Equipment ({selectedProducts.length})</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Review your selected equipment and adjust quantities
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              {selectedProducts.map((product) => (
                <Card
                  key={product.id}
                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {product.brand} {product.model}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Price: </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              ₱{product.price.toLocaleString()}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Total: </span>
                            <span className={`font-medium ${
                              product.selectedQuantity > (product.quantity || 0)
                                ? "text-red-600 dark:text-red-400"
                                : "text-blue-600 dark:text-blue-400"
                            }`}>
                              ₱{(product.price * product.selectedQuantity).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Stock: </span>
                            <Badge
                              variant={
                                product.quantity === 0 ? "destructive" :
                                product.selectedQuantity > product.quantity ? "destructive" :
                                product.quantity < 10 ? "secondary" : "default"
                              }
                              className="text-xs"
                            >
                              {product.quantity}
                            </Badge>
                          </div>
                        </div>
                        {product.selectedQuantity > (product.quantity || 0) && (
                          <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">
                            ⚠️ Quantity exceeds available stock
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(product.id, -1)}
                          className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <div className="flex flex-col items-center gap-1">
                          <Input
                            type="number"
                            min="1"
                            max={product.quantity || 999999}
                            value={product.selectedQuantity}
                            onChange={(e) => {
                              const newQuantity = parseInt(e.target.value) || 1;
                              handleQuantityChange(product.id, newQuantity);
                            }}
                            className={`w-16 h-9 text-center text-sm font-medium ${
                              product.selectedQuantity > (product.quantity || 0)
                                ? "border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-500"
                                : "border-gray-200 dark:border-gray-700"
                            }`}
                          />
                          {product.quantity !== undefined && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Max: {product.quantity}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(product.id, 1)}
                          disabled={product.selectedQuantity >= (product.quantity || 0)}
                          className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProduct(product.id)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                Grand Total:
              </span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                ₱{getTotalPrice().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleExportPDF}
                className="flex items-center gap-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </Button>
              <Button
                onClick={() => setIsSaveModalOpen(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
              >
                <Save className="w-4 h-4" />
                Save Equipment List
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Modal */}
      <Dialog open={isSaveModalOpen} onOpenChange={setIsSaveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Equipment List</DialogTitle>
            <DialogDescription>
              Enter a title for your saved equipment list
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="save-title">Title</Label>
              <Input
                id="save-title"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="e.g., Gaming PC Build 2024"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsSaveModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

export default function PartsPickerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PartsPickerContent />
    </Suspense>
  );
}

