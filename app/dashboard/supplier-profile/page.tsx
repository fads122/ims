"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Edit, Save, X, Plus, Building2, Phone, Mail, MapPin, Star, Facebook, MessageCircle, Send, Instagram, Search } from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import TopHeader from "@/components/top-header";
import AddProductModal from "@/components/add-product-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

interface Product {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  category?: string;
  cost?: number;
  quantity: number;
  images?: string[];
  type: "operational" | "for-sale" | "package";
}

export default function SupplierProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supplierId = searchParams.get("id");

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"individual" | "package">("individual");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [editData, setEditData] = useState<Partial<Supplier>>({});

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
    if (user && supplierId) {
      fetchSupplier();
      fetchProducts();
    }
  }, [user, supplierId]);

  const fetchSupplier = async () => {
    try {
      const response = await fetch(`/api/suppliers?id=${supplierId}`);
      if (!response.ok) throw new Error("Failed to fetch supplier");

      const result = await response.json();
      const supplierData = result.data?.[0] || result.data;
      setSupplier(supplierData);
      setEditData(supplierData);
    } catch (error) {
      console.error("Error fetching supplier:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");

      const result = await response.json();
      const allProducts: Product[] = [];

      // Get products from all types and filter by supplier
      if (result.data.operational) {
        result.data.operational.forEach((item: any) => {
          allProducts.push({
            id: item.id,
            name: item.name,
            brand: item.brand,
            model: item.model,
            category: item.product_type,
            quantity: item.quantity || 0,
            images: item.images || [],
            type: "operational",
          });
        });
      }

      if (result.data.forSale) {
        result.data.forSale.forEach((item: any) => {
          if (item.supplier === supplier?.supplier_name) {
            allProducts.push({
              id: item.id,
              name: item.product_brand || item.product_model,
              brand: item.product_brand,
              model: item.product_model,
              category: item.category,
              cost: parseFloat(item.supplier_cost) || 0,
              quantity: item.quantity || 0,
              images: item.images || [],
              type: "for-sale",
            });
          }
        });
      }

      if (result.data.packages) {
        result.data.packages.forEach((item: any) => {
          if (item.supplier === supplier?.supplier_name) {
            allProducts.push({
              id: item.id,
              name: item.package_name,
              category: item.package_category,
              quantity: item.quantity || 0,
              cost: parseFloat(item.cost) || 0,
              images: item.images || [],
              type: "package",
            });
          }
        });
      }

      setProducts(allProducts);

      // Extract unique brands
      const uniqueBrands = Array.from(
        new Set(allProducts.map((p) => p.brand).filter((b) => b))
      ) as string[];
      setBrands(uniqueBrands);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch("/api/suppliers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: supplierId, ...editData }),
      });

      if (!response.ok) throw new Error("Failed to update supplier");

      await fetchSupplier();
      setIsEditMode(false);
      alert("Supplier updated successfully!");
    } catch (error) {
      console.error("Error updating supplier:", error);
      alert("Failed to update supplier");
    }
  };

  const handleCancel = () => {
    setEditData(supplier || {});
    setIsEditMode(false);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.model?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = activeTab === "individual" ? product.type !== "package" : product.type === "package";
    const matchesBrand = !selectedBrand || product.brand === selectedBrand;

    return matchesSearch && matchesTab && matchesBrand;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white/95 dark:bg-gray-900/95 transition-colors relative flex items-center justify-center">
        <div className="text-gray-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  if (!user || !supplier) {
    return null;
  }

  const individualProducts = filteredProducts.filter((p) => p.type !== "package");
  const packageProducts = filteredProducts.filter((p) => p.type === "package");

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-white/95 dark:bg-gray-900/95 transition-colors relative">
        <AppSidebar />
        <SidebarInset className="flex flex-col bg-transparent">
          <TopHeader userEmail={user.email} />
          <div className="flex-1 overflow-auto">
            <div className="p-6 lg:p-8 space-y-6">
              {/* Header Actions */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => router.push("/dashboard/supplier-list")}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  ← Back to Supplier List
                </button>
                <div className="flex gap-2">
                  {isEditMode ? (
                    <>
                      <Button variant="outline" onClick={handleCancel}>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" onClick={() => setIsEditMode(true)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button onClick={() => setIsProductModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Product
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Supplier Profile Card */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      {isEditMode ? (
                        <Input
                          value={editData.supplier_name || ""}
                          onChange={(e) => setEditData({ ...editData, supplier_name: e.target.value })}
                          className="text-2xl font-bold mb-2"
                        />
                      ) : (
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{supplier.supplier_name}</h1>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        {isEditMode ? (
                          <Input
                            value={editData.address || ""}
                            onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                            className="flex-1"
                          />
                        ) : (
                          <span className="text-gray-600 dark:text-gray-400">{supplier.address}</span>
                        )}
                      </div>
                      {isEditMode ? (
                        <div className="flex items-center gap-2 mt-2">
                          <Label>Rating:</Label>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="5"
                            value={editData.rating || 0}
                            onChange={(e) => setEditData({ ...editData, rating: parseFloat(e.target.value) })}
                            className="w-20"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 mt-2">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-gray-600 dark:text-gray-400">
                            {supplier.rating?.toFixed(1) || "0.0"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        {isEditMode ? (
                          <Input
                            value={editData.phone || ""}
                            onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                            className="flex-1"
                          />
                        ) : (
                          <span className="text-gray-600 dark:text-gray-400">{supplier.phone}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        {isEditMode ? (
                          <Input
                            type="email"
                            value={editData.email || ""}
                            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                            className="flex-1"
                          />
                        ) : (
                          <span className="text-gray-600 dark:text-gray-400">{supplier.email}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 dark:text-gray-400">Contact Person:</span>
                        {isEditMode ? (
                          <Input
                            value={editData.contact_person || ""}
                            onChange={(e) => setEditData({ ...editData, contact_person: e.target.value })}
                            className="flex-1"
                          />
                        ) : (
                          <span className="text-gray-600 dark:text-gray-400">{supplier.contact_person}</span>
                        )}
                      </div>
                    </div>

                    {/* Social Media */}
                    <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      {supplier.facebook_page && (
                        <a
                          href={supplier.facebook_page}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <Facebook className="w-5 h-5" />
                          {isEditMode ? (
                            <Input
                              value={editData.facebook_page || ""}
                              onChange={(e) => setEditData({ ...editData, facebook_page: e.target.value })}
                              placeholder="Facebook URL"
                              className="w-48"
                            />
                          ) : (
                            <span>Facebook</span>
                          )}
                        </a>
                      )}
                      {supplier.viber && (
                        <a
                          href={`viber://contact?number=${supplier.viber}`}
                          className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:underline"
                        >
                          <MessageCircle className="w-5 h-5" />
                          {isEditMode ? (
                            <Input
                              value={editData.viber || ""}
                              onChange={(e) => setEditData({ ...editData, viber: e.target.value })}
                              placeholder="Viber"
                              className="w-48"
                            />
                          ) : (
                            <span>Viber</span>
                          )}
                        </a>
                      )}
                      {supplier.telegram && (
                        <a
                          href={`https://t.me/${supplier.telegram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-500 dark:text-blue-400 hover:underline"
                        >
                          <Send className="w-5 h-5" />
                          {isEditMode ? (
                            <Input
                              value={editData.telegram || ""}
                              onChange={(e) => setEditData({ ...editData, telegram: e.target.value })}
                              placeholder="Telegram"
                              className="w-48"
                            />
                          ) : (
                            <span>Telegram</span>
                          )}
                        </a>
                      )}
                      {supplier.instagram && (
                        <a
                          href={`https://instagram.com/${supplier.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-pink-600 dark:text-pink-400 hover:underline"
                        >
                          <Instagram className="w-5 h-5" />
                          {isEditMode ? (
                            <Input
                              value={editData.instagram || ""}
                              onChange={(e) => setEditData({ ...editData, instagram: e.target.value })}
                              placeholder="Instagram"
                              className="w-48"
                            />
                          ) : (
                            <span>Instagram</span>
                          )}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Products</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{products.length}</div>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Brands</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{brands.length}</div>
                </div>
              </div>

              {/* Brands Offered */}
              {brands.length > 0 && (
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Brands Offered</h3>
                  <div className="flex flex-wrap gap-2">
                    {brands.map((brand) => (
                      <button
                        key={brand}
                        onClick={() => setSelectedBrand(selectedBrand === brand ? null : brand)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          selectedBrand === brand
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {brand}
                        <span className="ml-2 text-xs">
                          ({products.filter((p) => p.brand === brand).length})
                        </span>
                      </button>
                    ))}
                    {selectedBrand && (
                      <button
                        onClick={() => setSelectedBrand(null)}
                        className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                      >
                        Clear Filter
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Search */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab("individual")}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === "individual"
                      ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Individual Equipment ({individualProducts.length})
                </button>
                <button
                  onClick={() => setActiveTab("package")}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === "package"
                      ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Package Equipment ({packageProducts.length})
                </button>
              </div>

              {/* Products Table */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        {activeTab === "individual" ? (
                          <>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Brand</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Model</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Category</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Cost</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Stock</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Images</th>
                          </>
                        ) : (
                          <>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Package Name</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Category</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Items</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Cost</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Stock</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Images</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {(activeTab === "individual" ? individualProducts : packageProducts).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                            No products found
                          </td>
                        </tr>
                      ) : (
                        (activeTab === "individual" ? individualProducts : packageProducts).map((product) => (
                          <tr
                            key={product.id}
                            className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            {activeTab === "individual" ? (
                              <>
                                <td className="px-4 py-4 text-gray-600 dark:text-gray-400">{product.brand || "N/A"}</td>
                                <td className="px-4 py-4 text-gray-600 dark:text-gray-400">{product.model || "N/A"}</td>
                                <td className="px-4 py-4 text-gray-600 dark:text-gray-400">{product.category || "N/A"}</td>
                                <td className="px-4 py-4 text-gray-600 dark:text-gray-400">
                                  {product.cost ? `$${product.cost.toFixed(2)}` : "N/A"}
                                </td>
                                <td className="px-4 py-4">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      product.quantity < 5
                                        ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                        : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                    }`}
                                  >
                                    {product.quantity}
                                  </span>
                                </td>
                                <td className="px-4 py-4">
                                  {product.images && product.images.length > 0 ? (
                                    <div className="flex gap-2">
                                      {product.images.slice(0, 2).map((img, idx) => (
                                        <img
                                          key={idx}
                                          src={img}
                                          alt={`Product ${idx + 1}`}
                                          className="w-10 h-10 object-cover rounded border border-gray-200 dark:border-gray-700 cursor-pointer"
                                          onClick={() => window.open(img, "_blank")}
                                        />
                                      ))}
                                      {product.images.length > 2 && (
                                        <div className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
                                          +{product.images.length - 2}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">No images</span>
                                  )}
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-4 py-4 font-medium text-gray-900 dark:text-white">{product.name}</td>
                                <td className="px-4 py-4 text-gray-600 dark:text-gray-400">{product.category || "N/A"}</td>
                                <td className="px-4 py-4 text-gray-600 dark:text-gray-400">Package contents</td>
                                <td className="px-4 py-4 text-gray-600 dark:text-gray-400">
                                  {product.cost ? `$${product.cost.toFixed(2)}` : "N/A"}
                                </td>
                                <td className="px-4 py-4">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      product.quantity === 0
                                        ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                        : product.quantity < 5
                                        ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
                                        : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                    }`}
                                  >
                                    {product.quantity === 0 ? "No Stock" : product.quantity < 5 ? "Low Stock" : "High Stock"}
                                  </span>
                                </td>
                                <td className="px-4 py-4">
                                  {product.images && product.images.length > 0 ? (
                                    <div className="flex gap-2">
                                      {product.images.slice(0, 2).map((img, idx) => (
                                        <img
                                          key={idx}
                                          src={img}
                                          alt={`Product ${idx + 1}`}
                                          className="w-10 h-10 object-cover rounded border border-gray-200 dark:border-gray-700 cursor-pointer"
                                          onClick={() => window.open(img, "_blank")}
                                        />
                                      ))}
                                      {product.images.length > 2 && (
                                        <div className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
                                          +{product.images.length - 2}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">No images</span>
                                  )}
                                </td>
                              </>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>

      <AddProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onProductAdded={() => {
          fetchProducts();
          setIsProductModalOpen(false);
        }}
      />
    </SidebarProvider>
  );
}

