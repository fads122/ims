"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Upload, Edit, Search, Filter, X, CheckCircle, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import TopHeader from "@/components/top-header";
import Breadcrumbs from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface User {
  id: string;
  email: string;
  createdAt: string;
}

interface ExtractedItem {
  model: string;
  brand: string;
  supplier_cost: number;
  extracted_from: string;
  matched_equipment: Array<{
    id: string;
    name?: string;
    product_model?: string;
    product_brand?: string;
    supplier_cost: number;
    cost?: number;
    supplier?: string;
    equipment_type: "for-sale" | "package";
  }>;
  match_confidence: "high" | "medium" | "none";
}

interface Equipment {
  id: string;
  equipment_type: "for-sale" | "package";
  name: string;
  brand: string;
  model: string;
  category: string;
  supplier_cost: number;
  srp: number;
  supplier: string;
}

interface PreviewItem {
  equipment_id: string;
  equipment_type: string;
  current_data: {
    product_model?: string;
    product_brand?: string;
    name?: string;
    supplier_cost: number;
    srp?: number;
    supplier?: string;
  };
  new_data: {
    supplier_cost: number;
  };
  changes: {
    supplier_cost_change: number;
    supplier_cost_percentage: string;
  };
}

export default function CostUpdatePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isManualMode, setIsManualMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedItem[]>([]);
  const [selectedUpdates, setSelectedUpdates] = useState<Set<string>>(new Set());
  const [previewData, setPreviewData] = useState<PreviewItem[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [allEquipment, setAllEquipment] = useState<Equipment[]>([]);
  const [manualUpdateData, setManualUpdateData] = useState<Map<string, Equipment>>(new Map());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [showOnlyChanged, setShowOnlyChanged] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error parsing user:", e);
        router.push("/login");
      }
    } else {
      router.push("/login");
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (isManualMode) {
      loadAllEquipment();
    }
  }, [isManualMode]);

  const loadAllEquipment = async () => {
    try {
      const response = await fetch("/api/cost-update/equipment");
      if (!response.ok) throw new Error("Failed to fetch equipment");
      const result = await response.json();
      setAllEquipment(result.data || []);
      const dataMap = new Map<string, Equipment>();
      (result.data || []).forEach((eq: Equipment) => {
        dataMap.set(eq.id, { ...eq });
      });
      setManualUpdateData(dataMap);
    } catch (error) {
      console.error("Error loading equipment:", error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        alert("Please select a PDF file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setProcessing(true);
      const formData = new FormData();
      formData.append("pdf", selectedFile);

      const response = await fetch("/api/cost-update/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process PDF");
      }

      const result = await response.json();
      setExtractedData(result.data.matched_data || []);
      setSelectedUpdates(new Set());
    } catch (error) {
      console.error("Error uploading PDF:", error);
      alert(error instanceof Error ? error.message : "Failed to process PDF");
    } finally {
      setProcessing(false);
    }
  };

  const handlePreview = async () => {
    if (isManualMode) {
      const updates: Array<{ equipment_id: string; equipment_type: string; new_supplier_cost: number }> = [];
      selectedUpdates.forEach((id) => {
        const item = manualUpdateData.get(id);
        const original = allEquipment.find((eq) => eq.id === id);
        
        // Compare updated cost with original cost
        if (item && original && item.supplier_cost !== original.supplier_cost) {
          updates.push({
            equipment_id: id,
            equipment_type: item.equipment_type,
            new_supplier_cost: item.supplier_cost,
          });
        }
      });

      if (updates.length === 0) {
        alert("Please select items with changed costs. Make sure you've modified the cost values in the table.");
        return;
      }

      try {
        const response = await fetch("/api/cost-update/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ updates }),
        });

        if (!response.ok) throw new Error("Failed to preview updates");
        const result = await response.json();
        setPreviewData(result.data || []);
        setIsPreviewOpen(true);
      } catch (error) {
        console.error("Error previewing updates:", error);
        alert("Failed to preview updates");
      }
    } else {
      const updates: Array<{ equipment_id: string; equipment_type: string; new_supplier_cost: number }> = [];
      selectedUpdates.forEach((equipmentId) => {
        const matchedItem = extractedData.find((item) =>
          item.matched_equipment.some((eq) => eq.id === equipmentId)
        );
        if (matchedItem) {
          const equipment = matchedItem.matched_equipment.find((eq) => eq.id === equipmentId);
          if (equipment) {
            updates.push({
              equipment_id: equipmentId,
              equipment_type: equipment.equipment_type || "for-sale",
              new_supplier_cost: matchedItem.supplier_cost,
            });
          }
        }
      });

      if (updates.length === 0) {
        alert("Please select items to update");
        return;
      }

      try {
        const response = await fetch("/api/cost-update/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ updates }),
        });

        if (!response.ok) throw new Error("Failed to preview updates");
        const result = await response.json();
        setPreviewData(result.data || []);
        setIsPreviewOpen(true);
      } catch (error) {
        console.error("Error previewing updates:", error);
        alert("Failed to preview updates");
      }
    }
  };

  const handleApply = async () => {
    if (previewData.length === 0) return;

    try {
      setApplying(true);
      const updates = previewData.map((item) => ({
        equipment_id: item.equipment_id,
        equipment_type: item.equipment_type,
        new_supplier_cost: item.new_data.supplier_cost,
      }));

      const response = await fetch("/api/cost-update/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) throw new Error("Failed to apply updates");
      const result = await response.json();

      alert(`Successfully updated ${result.data.successful_updates} items`);
      setIsPreviewOpen(false);
      setSelectedUpdates(new Set());
      setExtractedData([]);
      setSelectedFile(null);
      if (isManualMode) {
        loadAllEquipment();
      }
    } catch (error) {
      console.error("Error applying updates:", error);
      alert("Failed to apply updates");
    } finally {
      setApplying(false);
    }
  };

  const filteredEquipment = useMemo(() => {
    let filtered = Array.from(manualUpdateData.values());

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name?.toLowerCase().includes(query) ||
          item.brand?.toLowerCase().includes(query) ||
          item.model?.toLowerCase().includes(query) ||
          item.category?.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    if (selectedBrand !== "all") {
      filtered = filtered.filter((item) =>
        item.brand?.toLowerCase().includes(selectedBrand.toLowerCase())
      );
    }

    if (showOnlyChanged) {
      filtered = filtered.filter((item) => {
        const original = allEquipment.find((eq) => eq.id === item.id);
        return original && original.supplier_cost !== item.supplier_cost;
      });
    }

    return filtered;
  }, [manualUpdateData, searchQuery, selectedCategory, selectedBrand, showOnlyChanged, allEquipment]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    allEquipment.forEach((eq) => {
      if (eq.category) cats.add(eq.category);
    });
    return Array.from(cats).sort();
  }, [allEquipment]);

  const brands = useMemo(() => {
    const brs = new Set<string>();
    allEquipment.forEach((eq) => {
      if (eq.brand) brs.add(eq.brand);
    });
    return Array.from(brs).sort();
  }, [allEquipment]);

  const updateManualCost = (id: string, newCost: number) => {
    const updated = new Map(manualUpdateData);
    const item = updated.get(id);
    if (item) {
      updated.set(id, { ...item, supplier_cost: newCost });
      setManualUpdateData(updated);
      if (!selectedUpdates.has(id)) {
        setSelectedUpdates(new Set([...selectedUpdates, id]));
      }
    }
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
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Cost Update
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Update equipment costs via PDF import or manual editing
                  </p>
                </div>
                <Button
                  onClick={() => setIsManualMode(!isManualMode)}
                  variant={isManualMode ? "default" : "outline"}
                >
                  {isManualMode ? <FileUp className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                  {isManualMode ? "PDF Import Mode" : "Manual Update Mode"}
                </Button>
              </div>

              {/* Mode Toggle Info */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    {isManualMode ? (
                      <>
                        <Edit className="w-4 h-4" />
                        <span>Manual Update Mode: Edit costs directly in the table below</span>
                      </>
                    ) : (
                      <>
                        <FileUp className="w-4 h-4" />
                        <span>PDF Import Mode: Upload a PDF price list to extract and match costs</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {!isManualMode ? (
                /* PDF Import Mode */
                <>
                  {/* Upload Section */}
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle>Upload PDF Price List</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileSelect}
                          className="flex-1"
                          disabled={processing}
                        />
                        <Button onClick={handleUpload} disabled={!selectedFile || processing}>
                          {processing ? "Processing..." : "Upload & Process"}
                        </Button>
                      </div>
                      {selectedFile && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Extracted Data */}
                  {extractedData.length > 0 && (
                    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>Extracted Data ({extractedData.length} items)</CardTitle>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const allIds = new Set<string>();
                                extractedData.forEach((item) => {
                                  item.matched_equipment.forEach((eq) => {
                                    if (item.match_confidence !== "none") {
                                      allIds.add(eq.id);
                                    }
                                  });
                                });
                                setSelectedUpdates(allIds);
                              }}
                            >
                              Select All Matched
                            </Button>
                            <Button onClick={handlePreview} disabled={selectedUpdates.size === 0}>
                              Preview Updates ({selectedUpdates.size})
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[600px]">
                          <div className="space-y-4">
                            {extractedData.map((item, idx) => (
                              <div
                                key={idx}
                                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <div className="font-medium text-gray-900 dark:text-white">
                                      {item.model}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      Brand: {item.brand} | Cost: ₱{item.supplier_cost.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                      From: {item.extracted_from}
                                    </div>
                                  </div>
                                  <Badge
                                    variant={
                                      item.match_confidence === "high"
                                        ? "default"
                                        : item.match_confidence === "medium"
                                        ? "secondary"
                                        : "outline"
                                    }
                                  >
                                    {item.match_confidence === "high"
                                      ? "High Match"
                                      : item.match_confidence === "medium"
                                      ? "Medium Match"
                                      : "No Match"}
                                  </Badge>
                                </div>
                                {item.matched_equipment.length > 0 && (
                                  <div className="mt-3 space-y-2">
                                    {item.matched_equipment.map((eq) => (
                                      <label
                                        key={eq.id}
                                        className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900/50 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={selectedUpdates.has(eq.id)}
                                          onChange={(e) => {
                                            const newSet = new Set(selectedUpdates);
                                            if (e.target.checked) {
                                              newSet.add(eq.id);
                                            } else {
                                              newSet.delete(eq.id);
                                            }
                                            setSelectedUpdates(newSet);
                                          }}
                                        />
                                        <div className="flex-1">
                                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {eq.name || eq.product_model || eq.product_brand}
                                          </div>
                                          <div className="text-xs text-gray-500 dark:text-gray-400">
                                            Type: {eq.equipment_type === "package" ? "Package" : "For Sale"} | Current: ₱
                                            {(eq.supplier_cost || eq.cost || 0).toFixed(2)} → New: ₱
                                            {item.supplier_cost.toFixed(2)}
                                          </div>
                                        </div>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                /* Manual Update Mode */
                <>
                  {/* Filters */}
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                          <SelectTrigger>
                            <SelectValue placeholder="Brand" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Brands</SelectItem>
                            {brands.map((brand) => (
                              <SelectItem key={brand} value={brand}>
                                {brand}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="showChanged"
                            checked={showOnlyChanged}
                            onChange={(e) => setShowOnlyChanged(e.target.checked)}
                            className="w-4 h-4"
                          />
                          <label htmlFor="showChanged" className="text-sm text-gray-600 dark:text-gray-400">
                            Show only changed
                          </label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Equipment Table */}
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Equipment ({filteredEquipment.length} items)</CardTitle>
                        <Button onClick={handlePreview} disabled={selectedUpdates.size === 0}>
                          Preview Updates ({selectedUpdates.size})
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[600px]">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">
                                  Select
                                </th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">
                                  Product
                                </th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">
                                  Current Cost
                                </th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">
                                  New Cost
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredEquipment.map((item) => {
                                const original = allEquipment.find((eq) => eq.id === item.id);
                                const hasChanged = original && original.supplier_cost !== item.supplier_cost;
                                return (
                                  <tr
                                    key={item.id}
                                    className={`border-b border-gray-200 dark:border-gray-700 ${
                                      hasChanged ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                                    }`}
                                  >
                                    <td className="px-4 py-3">
                                      <input
                                        type="checkbox"
                                        checked={selectedUpdates.has(item.id)}
                                        onChange={(e) => {
                                          const newSet = new Set(selectedUpdates);
                                          if (e.target.checked) {
                                            newSet.add(item.id);
                                          } else {
                                            newSet.delete(item.id);
                                          }
                                          setSelectedUpdates(newSet);
                                        }}
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {item.brand} {item.model && `• ${item.model}`}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                      ₱{original?.supplier_cost.toFixed(2) || "0.00"}
                                    </td>
                                    <td className="px-4 py-3">
                                      <Input
                                        type="number"
                                        value={item.supplier_cost || 0}
                                        onChange={(e) => {
                                          const newCost = parseFloat(e.target.value) || 0;
                                          updateManualCost(item.id, newCost);
                                        }}
                                        className="w-32"
                                        onFocus={() => {
                                          if (!selectedUpdates.has(item.id)) {
                                            setSelectedUpdates(new Set([...selectedUpdates, item.id]));
                                          }
                                        }}
                                      />
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Preview Dialog */}
              <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-5xl w-[95vw] max-h-[85vh] flex flex-col bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="text-gray-900 dark:text-white">Review Cost Updates</DialogTitle>
                    <DialogDescription className="text-gray-600 dark:text-gray-400">
                      Review the summary and detailed changes before applying updates.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {/* Summary Section */}
                    {(() => {
                      const totalItems = previewData.length;
                      const totalIncrease = previewData
                        .filter((item) => item.changes.supplier_cost_change > 0)
                        .reduce((sum, item) => sum + item.changes.supplier_cost_change, 0);
                      const totalDecrease = previewData
                        .filter((item) => item.changes.supplier_cost_change < 0)
                        .reduce((sum, item) => sum + Math.abs(item.changes.supplier_cost_change), 0);
                      const itemsIncreased = previewData.filter((item) => item.changes.supplier_cost_change > 0).length;
                      const itemsDecreased = previewData.filter((item) => item.changes.supplier_cost_change < 0).length;
                      const avgChange = previewData.reduce((sum, item) => sum + parseFloat(item.changes.supplier_cost_percentage), 0) / totalItems;

                      return (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 p-3 md:p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg mb-3 border border-gray-200 dark:border-gray-700 flex-shrink-0">
                          <div className="text-center md:text-left">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Items</div>
                            <div className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">{totalItems}</div>
                          </div>
                          <div className="text-center md:text-left">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cost Increases</div>
                            <div className="text-base md:text-lg font-semibold text-red-600 dark:text-red-400">
                              {itemsIncreased}
                              {totalIncrease > 0 && (
                                <div className="text-xs font-normal mt-0.5">
                                  +₱{totalIncrease.toFixed(2)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-center md:text-left">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cost Decreases</div>
                            <div className="text-base md:text-lg font-semibold text-green-600 dark:text-green-400">
                              {itemsDecreased}
                              {totalDecrease > 0 && (
                                <div className="text-xs font-normal mt-0.5">
                                  -₱{totalDecrease.toFixed(2)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-center md:text-left">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg Change</div>
                            <div className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                              {avgChange > 0 ? "+" : ""}{avgChange.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Equipment List - Scrollable */}
                    <div className="flex-1 flex flex-col min-h-0 mb-3">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex-shrink-0">
                        Equipment to Update ({previewData.length} items)
                      </div>
                      <ScrollArea className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-800">
                        <div className="space-y-2 md:space-y-3 pr-4">
                          {previewData.map((item) => {
                            const change = item.changes.supplier_cost_change;
                            const isIncrease = change > 0;
                            return (
                              <div
                                key={item.equipment_id}
                                className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                      {item.current_data.product_model ||
                                        item.current_data.product_brand ||
                                        item.current_data.name}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                      {item.current_data.product_brand || item.current_data.supplier || "N/A"}
                                    </div>
                                  </div>
                                  <div className="flex flex-col sm:items-end gap-1 text-xs">
                                    <div className="text-gray-500 dark:text-gray-400">
                                      Current: <span className="font-medium text-gray-700 dark:text-gray-300">₱{item.current_data.supplier_cost.toFixed(2)}</span>
                                    </div>
                                    <div className="font-medium text-gray-900 dark:text-white">
                                      New: ₱{item.new_data.supplier_cost.toFixed(2)}
                                    </div>
                                    <div
                                      className={`flex items-center gap-1 ${
                                        isIncrease
                                          ? "text-red-600 dark:text-red-400"
                                          : "text-green-600 dark:text-green-400"
                                      }`}
                                    >
                                      {isIncrease ? (
                                        <TrendingUp className="w-3 h-3" />
                                      ) : (
                                        <TrendingDown className="w-3 h-3" />
                                      )}
                                      <span className="font-medium">
                                        {isIncrease ? "+" : ""}₱{Math.abs(change).toFixed(2)} ({item.changes.supplier_cost_percentage}%)
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>

                    {/* Buttons - Always visible at bottom */}
                    <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsPreviewOpen(false)}
                        className="w-full sm:w-auto bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleApply} 
                        disabled={applying}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                      >
                        {applying ? "Applying..." : `Apply Updates (${previewData.length})`}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

