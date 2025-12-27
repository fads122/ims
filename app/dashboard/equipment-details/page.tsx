"use client";

import { useState, useEffect, useCallback, memo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, QrCode, Barcode, Package, DollarSign, MapPin, Calendar, Box, Tag, Building2, Hash, Edit, Save, X, TrendingUp } from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import TopHeader from "@/components/top-header";
import QRBarcodeModal from "@/components/qr-barcode-modal";
import PricingHistoryChart from "@/components/pricing-history-chart";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

interface User {
  id: string;
  email: string;
  createdAt: string;
}

const InfoCard = memo(({ 
  title, 
  icon: Icon, 
  section, 
  isEditing, 
  isSaving, 
  onEdit, 
  onCancel, 
  onSave, 
  children 
}: { 
  title: string; 
  icon: any; 
  section: string; 
  isEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  children: React.ReactNode;
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <Icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
        </div>
        {!isEditing ? (
          <button
            onClick={onEdit}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              disabled={isSaving}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              title="Cancel"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-red-600" />
            </button>
            <button
              onClick={onSave}
              disabled={isSaving}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              title="Save"
            >
              <Save className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-green-600" />
            </button>
          </div>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
});

InfoCard.displayName = "InfoCard";

const InfoItem = memo(({ 
  label, 
  field, 
  value, 
  type = "text", 
  section, 
  isEditing, 
  onUpdate 
}: { 
  label: string; 
  field?: string; 
  value: string | number | null | undefined; 
  type?: string; 
  section: string;
  isEditing: boolean;
  onUpdate: (field: string, value: any) => void;
}) => {
  if (isEditing && field) {
    return (
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{label}</p>
        {type === "textarea" ? (
          <textarea
            value={value || ""}
            onChange={(e) => onUpdate(field, e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        ) : type === "number" ? (
          <input
            type="number"
            value={value || ""}
            onChange={(e) => onUpdate(field, e.target.value ? Number(e.target.value) : "")}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        ) : type === "date" ? (
          <input
            type="date"
            value={value ? new Date(value).toISOString().split('T')[0] : ""}
            onChange={(e) => onUpdate(field, e.target.value || null)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        ) : (
          <input
            type="text"
            value={value || ""}
            onChange={(e) => onUpdate(field, e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )}
      </div>
    );
  }
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-gray-900 dark:text-white font-medium">{value || "N/A"}</p>
    </div>
  );
});

InfoItem.displayName = "InfoItem";

const PricingChart = ({ productId, supplierCost, cost, srp, productType }: { productId?: string; supplierCost?: number; cost?: number; srp?: number; productType: string }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!productId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/pricing-history?productId=${productId}&productType=${productType}`
        );
        if (!response.ok) throw new Error("Failed to fetch pricing history");

        const result = await response.json();
        setHistory(result.data || []);
      } catch (error) {
        console.error("Error fetching pricing history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [productId, productType]);

  // Format data for chart - show all historical prices chronologically
  let chartData: any[] = [];
  
  if (history.length === 0) {
    // If no history, show current prices as initial point
    const now = new Date();
    if (productType === "for-sale") {
      chartData = [{
        date: now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        "Supplier Cost": supplierCost || null,
        "SRP": srp || null,
        fullDate: now.toISOString(),
      }];
    } else {
      chartData = [{
        date: now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        "Cost": cost || null,
        "SRP": srp || null,
        fullDate: now.toISOString(),
      }];
    }
  } else {
    // Format all history data points chronologically
    chartData = history.map((item) => {
      const date = new Date(item.created_at);
      const formattedDate = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
      });

      if (productType === "for-sale") {
        return {
          date: formattedDate,
          "Supplier Cost": item.supplier_cost ? Number(item.supplier_cost) : null,
          "SRP": item.srp ? Number(item.srp) : null,
          fullDate: item.created_at,
        };
      } else {
        return {
          date: formattedDate,
          "Cost": item.cost ? Number(item.cost) : null,
          "SRP": item.srp ? Number(item.srp) : null,
          fullDate: item.created_at,
        };
      }
    });

    // Always add current prices as the latest point (even if same, to show current state)
    const lastEntry = history[history.length - 1];
    const currentDate = new Date();
    const currentFormattedDate = currentDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: currentDate.getFullYear() !== new Date(lastEntry.created_at).getFullYear() ? "numeric" : undefined,
    });
    
    // Check if current prices differ from last entry
    const pricesChanged = productType === "for-sale"
      ? (Number(lastEntry.supplier_cost) !== Number(supplierCost) || Number(lastEntry.srp) !== Number(srp))
      : (Number(lastEntry.cost) !== Number(cost) || Number(lastEntry.srp) !== Number(srp));

    // Add current prices as latest point if they changed, or if it's been more than a day
    const lastEntryDate = new Date(lastEntry.created_at);
    const daysSinceLastEntry = (currentDate.getTime() - lastEntryDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (pricesChanged || daysSinceLastEntry > 1) {
      if (productType === "for-sale") {
        chartData.push({
          date: currentFormattedDate,
          "Supplier Cost": supplierCost || null,
          "SRP": srp || null,
          fullDate: currentDate.toISOString(),
        });
      } else {
        chartData.push({
          date: currentFormattedDate,
          "Cost": cost || null,
          "SRP": srp || null,
          fullDate: currentDate.toISOString(),
        });
      }
    }
  }

  // Ensure data is sorted by date (chronological order, left to right)
  chartData.sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

  const maxValue = Math.max(
    ...chartData.flatMap(d => [
      productType === "for-sale" ? d["Supplier Cost"] || 0 : d["Cost"] || 0,
      d["SRP"] || 0
    ])
  );

  const hasSupplierCost = productType === "for-sale" && chartData.some((d: any) => d["Supplier Cost"] !== null);
  const hasCost = productType === "package" && chartData.some((d: any) => d["Cost"] !== null);
  const hasSRP = chartData.some((d: any) => d["SRP"] !== null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-gray-500 dark:text-gray-400">Loading pricing...</div>
      </div>
    );
  }

  // Chart configuration for shadcn
  const chartConfig: ChartConfig = {
    ...(hasSupplierCost && {
      "Supplier Cost": {
        label: "Supplier Cost",
        color: "#3b82f6",
      },
    }),
    ...(hasCost && {
      "Cost": {
        label: "Cost",
        color: "#10b981",
      },
    }),
    ...(hasSRP && {
      "SRP": {
        label: "SRP",
        color: "#f59e0b",
      },
    }),
  };

  return (
    <div className="space-y-4">
      <div className="h-64">
        <ChartContainer config={chartConfig} className="h-full">
          <LineChart 
            data={chartData} 
            margin={{ top: 5, right: 20, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `$${value}`}
              domain={[0, maxValue * 1.1 || 1000]}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent 
                formatter={(value: any) => value !== null ? `$${Number(value).toLocaleString()}` : "N/A"}
              />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            {hasSupplierCost && (
              <Line
                type="monotone"
                dataKey="Supplier Cost"
                stroke="var(--color-Supplier Cost)"
                strokeWidth={2}
                dot={{ r: 5, fill: "var(--color-Supplier Cost)" }}
                activeDot={{ r: 7 }}
                connectNulls={false}
              />
            )}
            {hasCost && (
              <Line
                type="monotone"
                dataKey="Cost"
                stroke="var(--color-Cost)"
                strokeWidth={2}
                dot={{ r: 5, fill: "var(--color-Cost)" }}
                activeDot={{ r: 7 }}
                connectNulls={false}
              />
            )}
            {hasSRP && (
              <Line
                type="monotone"
                dataKey="SRP"
                stroke="var(--color-SRP)"
                strokeWidth={2}
                dot={{ r: 5, fill: "var(--color-SRP)" }}
                activeDot={{ r: 7 }}
                connectNulls={false}
              />
            )}
          </LineChart>
        </ChartContainer>
      </div>
      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
        {productType === "for-sale" ? (
          <>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Supplier Cost</p>
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">${(supplierCost || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">SRP</p>
              <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">${(srp || 0).toLocaleString()}</p>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Cost</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">${(cost || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">SRP</p>
              <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">${(srp || 0).toLocaleString()}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

function EquipmentDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const type = searchParams.get("type") || "operational";

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<any>(null);
  const [editData, setEditData] = useState<any>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"qr" | "barcode">("qr");
  const [modalData, setModalData] = useState<string>("");
  const [storedCode, setStoredCode] = useState<string>("");

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
    if (user && id) {
      fetchEquipment();
    }
  }, [user, id, type]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch equipment");

      const result = await response.json();
      let items: any[] = [];
      
      if (type === "operational") {
        items = result.data?.operational || [];
      } else if (type === "for-sale") {
        items = result.data?.forSale || [];
      } else if (type === "package") {
        items = result.data?.packages || [];
      }
      
      const found = items.find((item: any) => item.id === id);
      
      if (found) {
        setEquipment(found);
        setEditData({ ...found });
      } else {
        alert("Equipment not found");
        router.push("/dashboard/product-list");
      }
    } catch (error) {
      console.error("Error fetching equipment:", error);
      alert("Failed to load equipment details");
      router.push("/dashboard/product-list");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (section: string) => {
    setEditingSection(section);
  };

  const handleCancel = () => {
    setEditingSection(null);
    setEditData({ ...equipment });
  };

  const handleSave = async (section: string) => {
    try {
      setSaving(section);
      
      // Prepare data based on type
      let updatePayload: any = {};
      
      if (type === "operational") {
        updatePayload = {
          type: "operational",
          id: id,
          data: {
            name: editData.name,
            productType: editData.product_type,
            brand: editData.brand,
            model: editData.model,
            serialNumber: editData.serial_number,
            quantity: editData.quantity,
            boxQuantity: editData.box_quantity,
            condition: editData.condition,
            damageStatus: editData.damage_status,
            dateAcquired: editData.date_acquired,
            images: editData.images || [],
            qr_code: editData.qr_code,
            barcode: editData.barcode,
            regenerateCodes: editData.serial_number !== equipment.serial_number || editData.name !== equipment.name,
          },
        };
      } else if (type === "for-sale") {
        updatePayload = {
          type: "for-sale",
          id: id,
          data: {
            category: editData.category,
            productModel: editData.product_model,
            productBrand: editData.product_brand,
            supplier: editData.supplier,
            supplierCost: editData.supplier_cost,
            srp: editData.srp,
            quantity: editData.quantity,
            boxQuantity: editData.box_quantity,
            location: editData.location,
            condition: editData.condition,
            description: editData.description,
            brochureUrl: editData.brochure_url,
            images: editData.images || [],
            qr_code: editData.qr_code,
            barcode: editData.barcode,
            regenerateCodes: editData.product_model !== equipment.product_model || editData.product_brand !== equipment.product_brand,
          },
        };
      } else if (type === "package") {
        updatePayload = {
          type: "package",
          id: id,
          data: {
            packageName: editData.package_name,
            packageCategory: editData.package_category,
            ownershipType: editData.ownership_type,
            supplier: editData.supplier,
            cost: editData.cost,
            srp: editData.srp,
            quantity: editData.quantity,
            location: editData.location,
            condition: editData.condition,
            packageDescription: editData.package_description,
            packageContents: editData.package_contents || [],
            images: editData.images || [],
            qr_code: editData.qr_code,
            barcode: editData.barcode,
            regenerateCodes: editData.package_name !== equipment.package_name,
          },
        };
      }

      const response = await fetch("/api/products", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update equipment");
      }

      const result = await response.json();
      setEquipment(result.data);
      setEditData(result.data);
      setEditingSection(null);
      alert("Equipment updated successfully!");
    } catch (error: any) {
      console.error("Error updating equipment:", error);
      alert(error.message || "Failed to update equipment. Please try again.");
    } finally {
      setSaving(null);
    }
  };

  const handleViewCode = (codeType: "qr" | "barcode") => {
    if (!equipment) return;
    
    const code = codeType === "qr" ? equipment.qr_code : equipment.barcode;
    const data = equipment.serial_number || equipment.id || equipment.package_name || "";
    
    setStoredCode(code || "");
    setModalData(data);
    setModalType(codeType);
    if (codeType === "qr") {
      setQrModalOpen(true);
    } else {
      setBarcodeModalOpen(true);
    }
  };

  const updateField = useCallback((field: string, value: any) => {
    setEditData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user || !equipment || !editData) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-900">
        <AppSidebar />
        <SidebarInset className="flex flex-col bg-transparent">
          <TopHeader userEmail={user.email} />
          <div className="flex-1 overflow-auto">
            <div className="p-6 lg:p-8 max-w-6xl mx-auto">
              {/* Header */}
              <div className="mb-6">
                <button
                  onClick={() => router.push("/dashboard/product-list")}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Product List
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {type === "operational" ? editData.name : type === "for-sale" ? editData.product_brand || editData.product_model : editData.package_name}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Equipment Details</p>
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information Card */}
                <InfoCard 
                  title="Basic Information" 
                  icon={Box} 
                  section="basic"
                  isEditing={editingSection === "basic"}
                  isSaving={saving === "basic"}
                  onEdit={() => handleEdit("basic")}
                  onCancel={handleCancel}
                  onSave={() => handleSave("basic")}
                >
                  {type === "operational" ? (
                    <>
                      <InfoItem label="Name" field="name" value={editData.name} section="basic" isEditing={editingSection === "basic"} onUpdate={updateField} />
                      <InfoItem label="Product Type" field="product_type" value={editData.product_type} section="basic" isEditing={editingSection === "basic"} onUpdate={updateField} />
                      <InfoItem label="Brand" field="brand" value={editData.brand} section="basic" isEditing={editingSection === "basic"} onUpdate={updateField} />
                      <InfoItem label="Model" field="model" value={editData.model} section="basic" isEditing={editingSection === "basic"} onUpdate={updateField} />
                      <InfoItem label="Serial Number" field="serial_number" value={editData.serial_number} section="basic" isEditing={editingSection === "basic"} onUpdate={updateField} />
                    </>
                  ) : type === "for-sale" ? (
                    <>
                      <InfoItem label="Product Brand" field="product_brand" value={editData.product_brand} section="basic" isEditing={editingSection === "basic"} onUpdate={updateField} />
                      <InfoItem label="Product Model" field="product_model" value={editData.product_model} section="basic" isEditing={editingSection === "basic"} onUpdate={updateField} />
                      <InfoItem label="Category" field="category" value={editData.category} section="basic" isEditing={editingSection === "basic"} onUpdate={updateField} />
                      <InfoItem label="Condition" field="condition" value={editData.condition} section="basic" isEditing={editingSection === "basic"} onUpdate={updateField} />
                    </>
                  ) : (
                    <>
                      <InfoItem label="Package Name" field="package_name" value={editData.package_name} section="basic" isEditing={editingSection === "basic"} onUpdate={updateField} />
                      <InfoItem label="Package Category" field="package_category" value={editData.package_category} section="basic" isEditing={editingSection === "basic"} onUpdate={updateField} />
                      <InfoItem label="Ownership Type" field="ownership_type" value={editData.ownership_type} section="basic" isEditing={editingSection === "basic"} onUpdate={updateField} />
                      <InfoItem label="Condition" field="condition" value={editData.condition} section="basic" isEditing={editingSection === "basic"} onUpdate={updateField} />
                    </>
                  )}
                </InfoCard>

                {/* Inventory & Status Card */}
                <InfoCard 
                  title="Inventory & Status" 
                  icon={Tag} 
                  section="inventory"
                  isEditing={editingSection === "inventory"}
                  isSaving={saving === "inventory"}
                  onEdit={() => handleEdit("inventory")}
                  onCancel={handleCancel}
                  onSave={() => handleSave("inventory")}
                >
                  <InfoItem label="Quantity" field="quantity" value={editData.quantity} type="number" section="inventory" isEditing={editingSection === "inventory"} onUpdate={updateField} />
                  {type === "operational" && <InfoItem label="Box Quantity" field="box_quantity" value={editData.box_quantity} type="number" section="inventory" isEditing={editingSection === "inventory"} onUpdate={updateField} />}
                  <InfoItem label="Condition" field="condition" value={editData.condition} section="inventory" isEditing={editingSection === "inventory"} onUpdate={updateField} />
                  {type === "operational" && <InfoItem label="Damage Status" field="damage_status" value={editData.damage_status} section="inventory" isEditing={editingSection === "inventory"} onUpdate={updateField} />}
                  {type !== "operational" && <InfoItem label="Location" field="location" value={editData.location} section="inventory" isEditing={editingSection === "inventory"} onUpdate={updateField} />}
                  {type === "operational" && (
                    <InfoItem 
                      label="Date Acquired" 
                      field="date_acquired" 
                      value={editData.date_acquired} 
                      type="date"
                      section="inventory"
                      isEditing={editingSection === "inventory"}
                      onUpdate={updateField}
                    />
                  )}
                </InfoCard>

                {/* Pricing Card (for-sale and package only) */}
                {(type === "for-sale" || type === "package") && (
                  <InfoCard 
                    title="Pricing Information" 
                    icon={DollarSign} 
                    section="pricing"
                    isEditing={editingSection === "pricing"}
                    isSaving={saving === "pricing"}
                    onEdit={() => handleEdit("pricing")}
                    onCancel={handleCancel}
                    onSave={() => handleSave("pricing")}
                  >
                    {editingSection === "pricing" ? (
                      type === "for-sale" ? (
                        <>
                          <InfoItem label="Supplier Cost" field="supplier_cost" value={editData.supplier_cost} type="number" section="pricing" isEditing={editingSection === "pricing"} onUpdate={updateField} />
                          <InfoItem label="SRP" field="srp" value={editData.srp} type="number" section="pricing" isEditing={editingSection === "pricing"} onUpdate={updateField} />
                        </>
                      ) : (
                        <>
                          <InfoItem label="Cost" field="cost" value={editData.cost} type="number" section="pricing" isEditing={editingSection === "pricing"} onUpdate={updateField} />
                          <InfoItem label="SRP" field="srp" value={editData.srp} type="number" section="pricing" isEditing={editingSection === "pricing"} onUpdate={updateField} />
                        </>
                      )
                    ) : (
                      <PricingChart 
                        productId={id || undefined}
                        supplierCost={type === "for-sale" ? editData.supplier_cost : undefined}
                        cost={type === "package" ? editData.cost : undefined}
                        srp={editData.srp}
                        productType={type}
                      />
                    )}
                  </InfoCard>
                )}

                {/* Pricing History Chart (for-sale and package only) */}
                {(type === "for-sale" || type === "package") && id && (
                  <div className="lg:col-span-2">
                    <InfoCard 
                      title="Pricing History" 
                      icon={TrendingUp} 
                      section="pricing-history"
                      isEditing={false}
                      isSaving={false}
                      onEdit={() => {}}
                      onCancel={() => {}}
                      onSave={() => {}}
                    >
                      <PricingHistoryChart productId={id} productType={type} />
                    </InfoCard>
                  </div>
                )}

                {/* Supplier Information Card (for-sale and package only) */}
                {(type === "for-sale" || type === "package") && (
                  <InfoCard 
                    title="Supplier Information" 
                    icon={Building2} 
                    section="supplier"
                    isEditing={editingSection === "supplier"}
                    isSaving={saving === "supplier"}
                    onEdit={() => handleEdit("supplier")}
                    onCancel={handleCancel}
                    onSave={() => handleSave("supplier")}
                  >
                    <InfoItem label="Supplier" field="supplier" value={editData.supplier} section="supplier" isEditing={editingSection === "supplier"} onUpdate={updateField} />
                    {editData.location && <InfoItem label="Location" field="location" value={editData.location} section="supplier" isEditing={editingSection === "supplier"} onUpdate={updateField} />}
                  </InfoCard>
                )}

                {/* Identification Card */}
                {(equipment.qr_code || equipment.barcode || equipment.serial_number) && (
                  <InfoCard 
                    title="Identification" 
                    icon={Hash} 
                    section="identification"
                    isEditing={false}
                    isSaving={false}
                    onEdit={() => {}}
                    onCancel={() => {}}
                    onSave={() => {}}
                  >
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => handleViewCode("qr")}
                        className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        <QrCode className="w-5 h-5" />
                        View QR Code
                      </button>
                      <button
                        onClick={() => handleViewCode("barcode")}
                        className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        <Barcode className="w-5 h-5" />
                        View Barcode
                      </button>
                    </div>
                  </InfoCard>
                )}

                {/* Description Card */}
                {((type === "for-sale" && editData.description) || (type === "package" && editData.package_description)) && (
                  <InfoCard 
                    title="Description" 
                    icon={Tag} 
                    section="description"
                    isEditing={editingSection === "description"}
                    isSaving={saving === "description"}
                    onEdit={() => handleEdit("description")}
                    onCancel={handleCancel}
                    onSave={() => handleSave("description")}
                  >
                    <InfoItem 
                      label="Description" 
                      field={type === "for-sale" ? "description" : "package_description"} 
                      value={type === "for-sale" ? editData.description : editData.package_description} 
                      type="textarea"
                      section="description"
                      isEditing={editingSection === "description"}
                      onUpdate={updateField}
                    />
                  </InfoCard>
                )}

                {/* Images Card */}
                {equipment.images && equipment.images.length > 0 && (
                  <div className="lg:col-span-2">
                    <InfoCard 
                      title="Images" 
                      icon={Box} 
                      section="images"
                      isEditing={false}
                      isSaving={false}
                      onEdit={() => {}}
                      onCancel={() => {}}
                      onSave={() => {}}
                    >
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {equipment.images.map((image: string, index: number) => (
                          <div key={index} className="relative group">
                            <img
                              src={image}
                              alt={`Equipment image ${index + 1}`}
                              className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm group-hover:shadow-md transition-shadow"
                            />
                          </div>
                        ))}
                      </div>
                    </InfoCard>
                  </div>
                )}

                {/* Package Contents Card */}
                {type === "package" && equipment.package_contents && equipment.package_contents.length > 0 && (
                  <div className="lg:col-span-2">
                    <InfoCard 
                      title="Package Contents" 
                      icon={Package} 
                      section="contents"
                      isEditing={false}
                      isSaving={false}
                      onEdit={() => {}}
                      onCancel={() => {}}
                      onSave={() => {}}
                    >
                      <div className="space-y-3">
                        {equipment.package_contents.map((item: any, index: number) => (
                          <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Category</p>
                                <p className="text-gray-900 dark:text-white font-medium">{item.item_category}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Brand & Model</p>
                                <p className="text-gray-900 dark:text-white font-medium">{item.item_brand} {item.item_model}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Quantity</p>
                                <p className="text-gray-900 dark:text-white font-medium">{item.item_quantity}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Condition</p>
                                <p className="text-gray-900 dark:text-white font-medium">{item.item_condition}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </InfoCard>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>

      {/* QR Code Modal */}
      <QRBarcodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        type="qr"
        data={modalData}
        storedCode={storedCode}
      />

      {/* Barcode Modal */}
      <QRBarcodeModal
        isOpen={barcodeModalOpen}
        onClose={() => setBarcodeModalOpen(false)}
        type="barcode"
        data={modalData}
        storedCode={storedCode}
      />
    </SidebarProvider>
  );
}

export default function EquipmentDetailsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    }>
      <EquipmentDetailsContent />
    </Suspense>
  );
}
