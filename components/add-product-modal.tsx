"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, Upload, Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded?: () => void;
}

type ProductType = "operational" | "for-sale" | "package";

export default function AddProductModal({ isOpen, onClose, onProductAdded }: AddProductModalProps) {
  const [productType, setProductType] = useState<ProductType>("operational");
  const [formInstances, setFormInstances] = useState<number[]>([0]); // Array of form IDs
  const [loading, setLoading] = useState(false);
  const [formDataMap, setFormDataMap] = useState<Map<number, any>>(new Map());

  // Reset when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormInstances([0]);
      setFormDataMap(new Map());
    }
  }, [isOpen]);

  const handleAddForm = () => {
    const newId = Math.max(...formInstances, -1) + 1;
    setFormInstances([...formInstances, newId]);
  };

  const handleRemoveForm = (id: number) => {
    if (formInstances.length === 1) {
      alert("You must have at least one form");
      return;
    }
    setFormInstances(formInstances.filter((formId) => formId !== id));
    const newMap = new Map(formDataMap);
    newMap.delete(id);
    setFormDataMap(newMap);
  };

  const handleFormDataChange = useCallback((id: number, data: any) => {
    setFormDataMap((prevMap) => {
      const newMap = new Map(prevMap);
      newMap.set(id, data);
      return newMap;
    });
  }, []);

  const validateFormData = (formData: any, index: number): boolean => {
    if (productType === "operational") {
      if (!formData.productType) {
        alert(`Form #${index + 1}: Please select a product type`);
        return false;
      }
      if (!formData.name?.trim()) {
        alert(`Form #${index + 1}: Please enter a product name`);
        return false;
      }
      if (!formData.quantity || formData.quantity <= 0) {
        alert(`Form #${index + 1}: Please enter a valid quantity`);
        return false;
      }
      if (!formData.serialNumber?.trim()) {
        alert(`Form #${index + 1}: Please enter a serial number`);
        return false;
      }
      if (!formData.condition) {
        alert(`Form #${index + 1}: Please select a condition`);
        return false;
      }
    } else if (productType === "for-sale") {
      if (!formData.supplier) {
        alert(`Form #${index + 1}: Please select a supplier`);
        return false;
      }
      if (!formData.location?.trim()) {
        alert(`Form #${index + 1}: Please enter a location`);
        return false;
      }
      if (!formData.condition) {
        alert(`Form #${index + 1}: Please select a condition`);
        return false;
      }
    } else if (productType === "package") {
      if (!formData.packageName?.trim()) {
        alert(`Form #${index + 1}: Package Name is required`);
        return false;
      }
      if (!formData.ownershipType) {
        alert(`Form #${index + 1}: Ownership Type is required`);
        return false;
      }
      if (!formData.packageItems || formData.packageItems.length === 0) {
        alert(`Form #${index + 1}: Please add at least one item to the package`);
        return false;
      }
      if (!formData.supplier) {
        alert(`Form #${index + 1}: Supplier is required`);
        return false;
      }
      if (!formData.location?.trim()) {
        alert(`Form #${index + 1}: Location is required`);
        return false;
      }
      if (!formData.condition) {
        alert(`Form #${index + 1}: Condition is required`);
        return false;
      }
    }
    return true;
  };

  const handleSubmitAll = async () => {
    // Validate all forms
    const formsToSubmit: any[] = [];
    for (let i = 0; i < formInstances.length; i++) {
      const id = formInstances[i];
      const formData = formDataMap.get(id);
      if (!formData) {
        alert(`Please fill in form #${i + 1}`);
        return;
      }
      if (!validateFormData(formData, i)) {
        return;
      }
      formsToSubmit.push(formData);
    }

    if (formsToSubmit.length === 0) {
      alert("Please fill in at least one form");
      return;
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Submit all forms sequentially
      for (let i = 0; i < formsToSubmit.length; i++) {
        try {
          const response = await fetch("/api/products", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: productType,
              data: formsToSubmit[i],
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to save product");
          }

          successCount++;
        } catch (error: any) {
          console.error(`Error saving product ${i + 1}:`, error);
          errorCount++;
        }
      }

      // Show results
      if (errorCount === 0) {
        alert(`Successfully saved ${successCount} product(s)!`);
        // Reset forms
        setFormInstances([0]);
        setFormDataMap(new Map());
        onProductAdded?.();
        onClose();
      } else {
        alert(`Saved ${successCount} product(s), but ${errorCount} failed. Please check the console for details.`);
        if (successCount > 0) {
          onProductAdded?.();
        }
      }
    } catch (error: any) {
      console.error("Error saving products:", error);
      alert(error.message || "Failed to save products. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[95vw] !w-[95vw] !max-h-[95vh] !h-[95vh] overflow-y-auto p-8 !m-0 !top-[2.5vh] !left-[2.5vw] !translate-x-0 !translate-y-0 !bg-white/95 dark:!bg-gray-900/95 backdrop-blur-md">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-3xl font-bold text-gray-900 dark:text-white">Add Equipment</DialogTitle>
          <DialogDescription className="text-base text-gray-600 dark:text-gray-400">Add new equipment or products to your inventory</DialogDescription>
        </DialogHeader>

        {/* Product Type Selector */}
        <div className="flex gap-4 mb-8 border-b-2 border-gray-200 dark:border-gray-700 pb-6">
          <button
            onClick={() => setProductType("operational")}
            className={`px-6 py-3 rounded-lg font-semibold text-base transition-all ${productType === "operational"
              ? "bg-blue-600 text-white shadow-lg"
              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
          >
            Operational Equipment
          </button>
          <button
            onClick={() => setProductType("for-sale")}
            className={`px-6 py-3 rounded-lg font-semibold text-base transition-all ${productType === "for-sale"
              ? "bg-blue-600 text-white shadow-lg"
              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
          >
            For Sale
          </button>
          <button
            onClick={() => setProductType("package")}
            className={`px-6 py-3 rounded-lg font-semibold text-base transition-all ${productType === "package"
              ? "bg-blue-600 text-white shadow-lg"
              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
          >
            Package/Bundle Deal
          </button>
        </div>

        {/* Form Content */}
        <div className="space-y-8">
          {formInstances.map((formId, index) => (
            <div key={formId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Equipment #{index + 1}
                </h3>
                {formInstances.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveForm(formId)}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border-red-300 dark:border-red-700"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
              <div className="space-y-6">
                {productType === "operational" && (
                  <OperationalEquipmentForm
                    formId={formId}
                    onDataChange={handleFormDataChange}
                    loading={loading}
                  />
                )}
                {productType === "for-sale" && (
                  <ForSaleProductForm
                    formId={formId}
                    onDataChange={handleFormDataChange}
                    loading={loading}
                  />
                )}
                {productType === "package" && (
                  <PackageBundleForm
                    formId={formId}
                    onDataChange={handleFormDataChange}
                    loading={loading}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center gap-4 mt-8 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={handleAddForm}
            className="px-6 py-3 text-base"
            disabled={loading}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Another Equipment
          </Button>
          <div className="flex gap-4">
            <Button variant="outline" onClick={onClose} className="px-6 py-3 text-base" disabled={loading}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmitAll}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 text-base"
              disabled={loading}
            >
              {loading ? `Saving ${formInstances.length} Equipment...` : `Save All (${formInstances.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Operational Equipment Form
function OperationalEquipmentForm({
  formId,
  onDataChange,
  loading,
}: {
  formId: number;
  onDataChange: (id: number, data: any) => void;
  loading: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    productType: "",
    name: "",
    brand: "",
    model: "",
    quantity: 0,
    boxQuantity: 0,
    serialNumber: "",
    dateAcquired: "",
    condition: "",
    damageStatus: "Not Damaged",
    images: [] as string[],
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Update parent whenever form data changes
  useEffect(() => {
    onDataChange(formId, formData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, formId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);

      // Create preview URLs
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newPreviews]);

      // Convert files to base64 for storage (or you can upload to a storage service)
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setFormData((prev) => ({
              ...prev,
              images: [...prev.images, reader.result as string],
            }));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);

      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newPreviews]);

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setFormData((prev) => ({
              ...prev,
              images: [...prev.images, reader.result as string],
            }));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div>
      <div className="space-y-8">
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="product-type" className="text-base font-semibold">
              Product Type <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.productType} onValueChange={(value) => handleChange("productType", value)}>
              <SelectTrigger id="product-type" className="h-12 text-base">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="computer">Computer</SelectItem>
                <SelectItem value="printer">Printer</SelectItem>
                <SelectItem value="monitor">Monitor</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-semibold">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input id="name" type="text" placeholder="Enter product name" className="h-12 text-base" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand" className="text-base font-semibold">Brand</Label>
            <Input id="brand" type="text" placeholder="Enter brand" className="h-12 text-base" value={formData.brand} onChange={(e) => handleChange("brand", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model" className="text-base font-semibold">Model</Label>
            <Input id="model" type="text" placeholder="Enter model" className="h-12 text-base" value={formData.model} onChange={(e) => handleChange("model", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-base font-semibold">
              Quantity <span className="text-red-500">*</span>
            </Label>
            <Input id="quantity" type="number" placeholder="0" className="h-12 text-base" value={formData.quantity} onChange={(e) => handleChange("quantity", parseInt(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="box-quantity" className="text-base font-semibold">Box Quantity</Label>
            <Input id="box-quantity" type="number" placeholder="0" className="h-12 text-base" value={formData.boxQuantity} onChange={(e) => handleChange("boxQuantity", parseInt(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="serial-number" className="text-base font-semibold">
              Serial Number <span className="text-red-500">*</span>
            </Label>
            <Input id="serial-number" type="text" placeholder="Auto-generates QR code and barcode" className="h-12 text-base" value={formData.serialNumber} onChange={(e) => handleChange("serialNumber", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date-acquired" className="text-base font-semibold">Date Acquired</Label>
            <Input id="date-acquired" type="date" className="h-12 text-base" value={formData.dateAcquired} onChange={(e) => handleChange("dateAcquired", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="condition" className="text-base font-semibold">
              Condition <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.condition} onValueChange={(value) => handleChange("condition", value)}>
              <SelectTrigger id="condition" className="h-12 text-base">
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="working">Working</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="damage-status" className="text-base font-semibold">Damage Status</Label>
            <Select value={formData.damageStatus} onValueChange={(value) => handleChange("damageStatus", value)}>
              <SelectTrigger id="damage-status" className="h-12 text-base">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Not Damaged">Not Damaged</SelectItem>
                <SelectItem value="Damaged">Damaged</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-base font-semibold text-foreground">Upload Images</Label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            multiple
            className="hidden"
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-input rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer bg-muted/50"
          >
            <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-base text-muted-foreground">Drag & drop images here or click to upload</p>
          </div>

          {previewUrls.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-4">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-input"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// For Sale Product Form
function ForSaleProductForm({
  formId,
  onDataChange,
  loading,
}: {
  formId: number;
  onDataChange: (id: number, data: any) => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState({
    category: "",
    productModel: "",
    productBrand: "",
    supplier: "",
    supplierCost: 0,
    srp: 0,
    quantity: 0,
    boxQuantity: 0,
    location: "",
    condition: "",
    description: "",
    brochureUrl: "",
    images: [] as string[],
  });
  const [suppliers, setSuppliers] = useState<{ id: string; supplier_name: string }[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const brochureInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch suppliers from API
    const fetchSuppliers = async () => {
      try {
        const response = await fetch("/api/suppliers?limit=1000");
        if (response.ok) {
          const result = await response.json();
          setSuppliers(result.data || []);
        }
      } catch (error) {
        console.error("Error fetching suppliers:", error);
      }
    };
    fetchSuppliers();
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Update parent whenever form data changes
  useEffect(() => {
    onDataChange(formId, formData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, formId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);

      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newPreviews]);

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setFormData((prev) => ({
              ...prev,
              images: [...prev.images, reader.result as string],
            }));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleBrochureSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBrochureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setFormData((prev) => ({
            ...prev,
            brochureUrl: reader.result as string,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);

      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newPreviews]);

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setFormData((prev) => ({
              ...prev,
              images: [...prev.images, reader.result as string],
            }));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div>
      <div className="space-y-8">
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="text-base font-semibold">Category</Label>
            <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
              <SelectTrigger className="h-12 text-base w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pc-parts">PC Parts</SelectItem>
                <SelectItem value="peripherals">Peripherals</SelectItem>
                <SelectItem value="accessories">Accessories</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Product Model</Label>
            <Input type="text" placeholder="Enter model" className="h-12 text-base" value={formData.productModel} onChange={(e) => handleChange("productModel", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Product Brand/Name</Label>
            <Input type="text" placeholder="Enter brand/name" className="h-12 text-base" value={formData.productBrand} onChange={(e) => handleChange("productBrand", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Supplier <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.supplier} onValueChange={(value) => handleChange("supplier", value)}>
              <SelectTrigger className="h-12 text-base w-full">
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">No suppliers available. Add suppliers first.</div>
                ) : (
                  suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.supplier_name}>
                      {supplier.supplier_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Supplier Cost <span className="text-red-500">*</span>
            </Label>
            <Input type="number" step="0.01" placeholder="0.00" className="h-12 text-base" value={formData.supplierCost} onChange={(e) => handleChange("supplierCost", parseFloat(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              SRP <span className="text-red-500">*</span>
            </Label>
            <Input type="number" step="0.01" placeholder="0.00" className="h-12 text-base" value={formData.srp} onChange={(e) => handleChange("srp", parseFloat(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Quantity <span className="text-red-500">*</span>
            </Label>
            <Input type="number" placeholder="0" className="h-12 text-base" value={formData.quantity} onChange={(e) => handleChange("quantity", parseInt(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Box Quantity</Label>
            <Input type="number" placeholder="0" className="h-12 text-base" value={formData.boxQuantity} onChange={(e) => handleChange("boxQuantity", parseInt(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Location <span className="text-red-500">*</span>
            </Label>
            <Input type="text" placeholder="Enter location" className="h-12 text-base" value={formData.location} onChange={(e) => handleChange("location", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Condition <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.condition} onValueChange={(value) => handleChange("condition", value)}>
              <SelectTrigger className="h-12 text-base w-full">
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="used">Used</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-base font-semibold text-gray-900 dark:text-gray-100">Product Specifications/Description</Label>
          <div className="flex gap-2">
            <Textarea
              rows={4}
              placeholder="Enter description"
              className="text-base resize-none text-gray-900 dark:text-gray-100"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
            <Button variant="outline" className="h-fit text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Generate
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-base font-semibold text-gray-900 dark:text-gray-100">Upload Brochure</Label>
          <input
            type="file"
            ref={brochureInputRef}
            onChange={handleBrochureSelect}
            accept=".pdf,.doc,.docx"
            className="hidden"
          />
          <div
            onClick={() => brochureInputRef.current?.click()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  if (reader.result) {
                    setFormData((prev) => ({
                      ...prev,
                      brochureUrl: reader.result as string,
                    }));
                  }
                };
                reader.readAsDataURL(file);
              }
            }}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-input rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer bg-muted/50"
          >
            <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-base text-muted-foreground">Drag & drop brochure here or click to upload</p>
            {brochureFile && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Selected: {brochureFile.name}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-base font-semibold text-gray-900 dark:text-gray-100">Product Images</Label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            multiple
            className="hidden"
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-input rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer bg-muted/50"
          >
            <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-base text-muted-foreground">Drag & drop images here or click to upload</p>
          </div>

          {previewUrls.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-4">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-input"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Package/Bundle Deal Form
function PackageBundleForm({
  formId,
  onDataChange,
  loading,
}: {
  formId: number;
  onDataChange: (id: number, data: any) => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState({
    packageName: "",
    packageCategory: "Package/Bundle",
    packageDescription: "",
    ownershipType: "",
    packageItems: [] as Array<{
      itemCategory: string;
      itemModel: string;
      itemBrand: string;
      itemQuantity: number;
      itemCondition: string;
    }>,
    supplier: "",
    packageCost: 0,
    packageSrp: 0,
    packageQuantity: 0,
    location: "",
    condition: "",
    boxQuantity: 0,
    brochureUrl: "",
    images: [] as string[],
  });
  const [suppliers, setSuppliers] = useState<{ id: string; supplier_name: string }[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const brochureInputRef = useRef<HTMLInputElement>(null);
  const [currentItem, setCurrentItem] = useState({
    itemCategory: "",
    itemModel: "",
    itemBrand: "",
    itemQuantity: 1,
    itemCondition: "New",
  });

  useEffect(() => {
    // Fetch suppliers from API
    const fetchSuppliers = async () => {
      try {
        const response = await fetch("/api/suppliers?limit=1000");
        if (response.ok) {
          const result = await response.json();
          setSuppliers(result.data || []);
        }
      } catch (error) {
        console.error("Error fetching suppliers:", error);
      }
    };
    fetchSuppliers();
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (field: string, value: any) => {
    setCurrentItem((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddItem = () => {
    if (!currentItem.itemCategory || !currentItem.itemModel || !currentItem.itemBrand) {
      alert("Please fill in Category, Model, and Brand for the item");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      packageItems: [...prev.packageItems, { ...currentItem }],
    }));
    setCurrentItem({
      itemCategory: "",
      itemModel: "",
      itemBrand: "",
      itemQuantity: 1,
      itemCondition: "New",
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      packageItems: prev.packageItems.filter((_, i) => i !== index),
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);

      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newPreviews]);

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setFormData((prev) => ({
              ...prev,
              images: [...prev.images, reader.result as string],
            }));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleBrochureSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Brochure file size must be less than 10MB");
        return;
      }
      setBrochureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setFormData((prev) => ({
            ...prev,
            brochureUrl: reader.result as string,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));
      if (imageFiles.length !== files.length) {
        alert("Please only upload image files");
        return;
      }
      imageFiles.forEach((file) => {
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} is larger than 5MB. Please choose a smaller file.`);
          return;
        }
      });

      setSelectedFiles((prev) => [...prev, ...imageFiles]);

      const newPreviews = imageFiles.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newPreviews]);

      imageFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setFormData((prev) => ({
              ...prev,
              images: [...prev.images, reader.result as string],
            }));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Update parent whenever form data changes
  useEffect(() => {
    onDataChange(formId, formData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, formId]);

  return (
    <div>
      <div className="space-y-8">
        {/* Package Information */}
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Package Name <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              placeholder="e.g., AMD Ryzen AM4 Bundle"
              className="h-12 text-base"
              value={formData.packageName}
              onChange={(e) => handleChange("packageName", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Package Category</Label>
            <Select value={formData.packageCategory} onValueChange={(value) => handleChange("packageCategory", value)}>
              <SelectTrigger className="h-12 text-base w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Package/Bundle">Package/Bundle</SelectItem>
                <SelectItem value="Combo Deal">Combo Deal</SelectItem>
                <SelectItem value="Complete Set">Complete Set</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Ownership Type <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.ownershipType} onValueChange={(value) => handleChange("ownershipType", value)}>
              <SelectTrigger className="h-12 text-base w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Government">Government</SelectItem>
                <SelectItem value="Private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Package Description */}
        <div className="space-y-2">
          <Label className="text-base font-semibold text-gray-900 dark:text-gray-100">Package Description</Label>
          <div className="flex gap-2">
            <Textarea
              rows={4}
              placeholder="Enter description"
              className="text-base resize-none text-gray-900 dark:text-gray-100 flex-1"
              value={formData.packageDescription}
              onChange={(e) => handleChange("packageDescription", e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              className="h-fit text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              disabled={formData.packageItems.length === 0}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI Generate
            </Button>
          </div>
        </div>

        {/* Package Contents */}
        <div className="space-y-2">
          <Label className="text-base font-semibold text-gray-900 dark:text-gray-100">Package Contents</Label>
          <div className="border border-input rounded-lg p-4 space-y-4 bg-muted/30">
            {/* Add Item Form */}
            <div className="grid grid-cols-5 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-gray-600 dark:text-gray-400">Category <span className="text-red-500">*</span></Label>
                <Select value={currentItem.itemCategory} onValueChange={(value) => handleItemChange("itemCategory", value)}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CPU">CPU</SelectItem>
                    <SelectItem value="Motherboard">Motherboard</SelectItem>
                    <SelectItem value="RAM">RAM</SelectItem>
                    <SelectItem value="GPU">GPU</SelectItem>
                    <SelectItem value="Storage">Storage</SelectItem>
                    <SelectItem value="PSU">PSU</SelectItem>
                    <SelectItem value="Case">Case</SelectItem>
                    <SelectItem value="Cooling">Cooling</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-600 dark:text-gray-400">Model <span className="text-red-500">*</span></Label>
                <Input
                  type="text"
                  placeholder="Model"
                  className="h-10 text-gray-900 dark:text-gray-100"
                  value={currentItem.itemModel}
                  onChange={(e) => handleItemChange("itemModel", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-600 dark:text-gray-400">Brand <span className="text-red-500">*</span></Label>
                <Input
                  type="text"
                  placeholder="Brand"
                  className="h-10 text-gray-900 dark:text-gray-100"
                  value={currentItem.itemBrand}
                  onChange={(e) => handleItemChange("itemBrand", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-600 dark:text-gray-400">Quantity</Label>
                <Input
                  type="number"
                  placeholder="1"
                  className="h-10 text-gray-900 dark:text-gray-100"
                  value={currentItem.itemQuantity}
                  onChange={(e) => handleItemChange("itemQuantity", parseInt(e.target.value) || 1)}
                  min="1"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-600 dark:text-gray-400">Condition</Label>
                <Select value={currentItem.itemCondition} onValueChange={(value) => handleItemChange("itemCondition", value)}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Used">Used</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-gray-900 dark:text-gray-100"
              onClick={handleAddItem}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>

            {/* Added Items List */}
            {formData.packageItems.length > 0 && (
              <div className="mt-4 space-y-2">
                <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Items in Package:</Label>
                <div className="space-y-2">
                  {formData.packageItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-input rounded-lg"
                    >
                      <div className="flex-1 grid grid-cols-5 gap-4 text-sm">
                        <span className="text-gray-900 dark:text-gray-100">{item.itemCategory}</span>
                        <span className="text-gray-900 dark:text-gray-100">{item.itemModel}</span>
                        <span className="text-gray-900 dark:text-gray-100">{item.itemBrand}</span>
                        <span className="text-gray-900 dark:text-gray-100">Qty: {item.itemQuantity}</span>
                        <span className="text-gray-900 dark:text-gray-100">{item.itemCondition}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pricing and Supplier */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Supplier <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.supplier} onValueChange={(value) => handleChange("supplier", value)}>
              <SelectTrigger className="h-12 text-base w-full">
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">No suppliers available. Add suppliers first.</div>
                ) : (
                  suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.supplier_name}>
                      {supplier.supplier_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Package Cost <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              className="h-12 text-base"
              value={formData.packageCost}
              onChange={(e) => handleChange("packageCost", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Package SRP <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              className="h-12 text-base"
              value={formData.packageSrp}
              onChange={(e) => handleChange("packageSrp", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Package Quantity <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              placeholder="0"
              className="h-12 text-base"
              value={formData.packageQuantity}
              onChange={(e) => handleChange("packageQuantity", parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Location and Condition */}
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Location <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              placeholder="Enter location"
              className="h-12 text-base"
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Condition <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.condition} onValueChange={(value) => handleChange("condition", value)}>
              <SelectTrigger className="h-12 text-base w-full">
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Used">Used</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Box Quantity</Label>
            <Input
              type="number"
              placeholder="0"
              className="h-12 text-base"
              value={formData.boxQuantity}
              onChange={(e) => handleChange("boxQuantity", parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Upload Brochure */}
        <div className="space-y-2">
          <Label className="text-base font-semibold text-gray-900 dark:text-gray-100">Upload Brochure (PDF, DOC, DOCX, PPT, PPTX - max 10MB)</Label>
          <input
            type="file"
            ref={brochureInputRef}
            onChange={handleBrochureSelect}
            accept=".pdf,.doc,.docx,.ppt,.pptx"
            className="hidden"
          />
          <div
            onClick={() => brochureInputRef.current?.click()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) {
                if (file.size > 10 * 1024 * 1024) {
                  alert("File size must be less than 10MB");
                  return;
                }
                const reader = new FileReader();
                reader.onloadend = () => {
                  if (reader.result) {
                    setFormData((prev) => ({
                      ...prev,
                      brochureUrl: reader.result as string,
                    }));
                  }
                };
                reader.readAsDataURL(file);
              }
            }}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-input rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer bg-muted/50"
          >
            <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-base text-muted-foreground">Drag & drop brochure here or click to upload</p>
            {brochureFile && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Selected: {brochureFile.name}</p>
            )}
          </div>
        </div>

        {/* Upload Package Images */}
        <div className="space-y-2">
          <Label className="text-base font-semibold text-gray-900 dark:text-gray-100">Upload Package Images (JPG, PNG, GIF - max 5MB each)</Label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            multiple
            className="hidden"
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-input rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer bg-muted/50"
          >
            <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-base text-muted-foreground">Drag & drop images here or click to upload</p>
          </div>

          {previewUrls.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-4">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-input"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

