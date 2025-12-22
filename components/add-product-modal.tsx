"use client";

import { useState, useRef } from "react";
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
  const [products, setProducts] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [formKey, setFormKey] = useState(0); // Key to force form reset

  const handleAddProduct = () => {
    // Reset form to allow adding another product
    setFormKey((prev) => prev + 1);
    setProducts([...products, {}]);
  };

  const handleSubmit = async (formData: any) => {
    setLoading(true);
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: productType,
          data: formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save product");
      }

      await response.json();

      // Show success message
      alert("Product saved successfully!");

      // Reset form
      setFormKey((prev) => prev + 1);

      // Trigger refresh in parent component
      onProductAdded?.();

      // Optionally close modal or keep it open for adding more
      // onClose();
    } catch (error: any) {
      console.error("Error saving product:", error);
      alert(error.message || "Failed to save product. Please try again.");
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
        <div className="space-y-6" key={formKey}>
          {productType === "operational" && <OperationalEquipmentForm onSubmit={handleSubmit} loading={loading} />}
          {productType === "for-sale" && <ForSaleProductForm onSubmit={handleSubmit} loading={loading} />}
          {productType === "package" && <PackageBundleForm onSubmit={handleSubmit} loading={loading} />}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-8 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose} className="px-6 py-3 text-base">
            Cancel
          </Button>
          <Button onClick={handleAddProduct} className="bg-blue-600 hover:bg-blue-700 px-6 py-3 text-base">
            <Plus className="w-5 h-5 mr-2" />
            Add Another Equipment
          </Button>
          <Button type="submit" form={`${productType}-form`} className="bg-blue-600 hover:bg-blue-700 px-6 py-3 text-base" disabled={loading}>
            {loading ? "Saving..." : "Save Equipment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Operational Equipment Form
function OperationalEquipmentForm({ onSubmit, loading }: { onSubmit: (data: any) => void; loading: boolean }) {
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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.productType) {
      alert("Please select a product type");
      return;
    }
    if (!formData.name.trim()) {
      alert("Please enter a product name");
      return;
    }
    if (!formData.quantity || formData.quantity <= 0) {
      alert("Please enter a valid quantity");
      return;
    }
    if (!formData.serialNumber.trim()) {
      alert("Please enter a serial number");
      return;
    }
    if (!formData.condition) {
      alert("Please select a condition");
      return;
    }

    onSubmit(formData);
  };

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
    <form id="operational-form" onSubmit={handleFormSubmit}>
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
    </form>
  );
}

// For Sale Product Form
function ForSaleProductForm({ onSubmit, loading }: { onSubmit: (data: any) => void; loading: boolean }) {
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

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form id="for-sale-form" onSubmit={handleFormSubmit}>
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
                <SelectItem value="supplier1">Supplier 1</SelectItem>
                <SelectItem value="supplier2">Supplier 2</SelectItem>
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
          <Label className="text-base font-semibold text-foreground">Product Specifications/Description</Label>
          <div className="flex gap-2">
            <Textarea rows={4} placeholder="Enter description" className="text-base resize-none" value={formData.description} onChange={(e) => handleChange("description", e.target.value)} />
            <Button variant="outline" className="h-fit">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Generate
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-base font-semibold text-foreground">Upload Brochure</Label>
          <div className="border-2 border-dashed border-input rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer bg-muted/50">
            <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-base text-muted-foreground">Drag & drop brochure here or click to upload</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-base font-semibold text-foreground">Product Images</Label>
          <div className="border-2 border-dashed border-input rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer bg-muted/50">
            <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-base text-muted-foreground">Drag & drop images here or click to upload</p>
          </div>
        </div>
      </div>
    </form>
  );
}

// Package/Bundle Deal Form
function PackageBundleForm({ onSubmit, loading }: { onSubmit: (data: any) => void; loading: boolean }) {
  const [formData, setFormData] = useState({
    ownershipType: "",
    packageName: "",
    packageCategory: "",
    packageContents: [] as any[],
    packageDescription: "",
    supplier: "",
    cost: 0,
    srp: 0,
    quantity: 0,
    location: "",
    condition: "",
    brochureUrl: "",
    images: [] as string[],
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form id="package-form" onSubmit={handleFormSubmit}>
      <div className="space-y-8">
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="text-base font-semibold">Ownership Type</Label>
            <Select value={formData.ownershipType} onValueChange={(value) => handleChange("ownershipType", value)}>
              <SelectTrigger className="h-12 text-base w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="type1">Type 1</SelectItem>
                <SelectItem value="type2">Type 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Package Name <span className="text-red-500">*</span>
            </Label>
            <Input type="text" placeholder="Enter package name" className="h-12 text-base" value={formData.packageName} onChange={(e) => handleChange("packageName", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Package Category</Label>
            <Select value={formData.packageCategory} onValueChange={(value) => handleChange("packageCategory", value)}>
              <SelectTrigger className="h-12 text-base w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="category1">Category 1</SelectItem>
                <SelectItem value="category2">Category 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-base font-semibold text-foreground">Package Contents</Label>
          <div className="border border-input rounded-lg p-4 space-y-4 bg-muted/30">
            <div className="grid grid-cols-5 gap-4">
              <Input type="text" placeholder="Category" className="h-10" />
              <Input type="text" placeholder="Model" className="h-10" />
              <Input type="text" placeholder="Brand" className="h-10" />
              <Input type="number" placeholder="Quantity" className="h-10" />
              <Select>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-base font-semibold text-foreground">Package Description</Label>
          <div className="flex gap-2">
            <Textarea rows={4} placeholder="Enter description" className="text-base resize-none" value={formData.packageDescription} onChange={(e) => handleChange("packageDescription", e.target.value)} />
            <Button variant="outline" className="h-fit">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Generate
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-base font-semibold">Supplier</Label>
            <Select value={formData.supplier} onValueChange={(value) => handleChange("supplier", value)}>
              <SelectTrigger className="h-12 text-base w-full">
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="supplier1">Supplier 1</SelectItem>
                <SelectItem value="supplier2">Supplier 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Cost</Label>
            <Input type="number" step="0.01" placeholder="0.00" className="h-12 text-base" value={formData.cost} onChange={(e) => handleChange("cost", parseFloat(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">SRP</Label>
            <Input type="number" step="0.01" placeholder="0.00" className="h-12 text-base" value={formData.srp} onChange={(e) => handleChange("srp", parseFloat(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Quantity</Label>
            <Input type="number" placeholder="0" className="h-12 text-base" value={formData.quantity} onChange={(e) => handleChange("quantity", parseInt(e.target.value) || 0)} />
          </div>
        </div>
      </div>
    </form>
  );
}

