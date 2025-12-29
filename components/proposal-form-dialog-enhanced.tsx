"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, X, Trash2, Upload, Search, Eye, Check, XCircle } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface ProposalItem {
  id?: string;
  equipment_id?: string;
  item_name: string;
  item_description?: string;
  brand?: string;
  model?: string;
  category?: string;
  quantity: number;
  unit_price: number;
  discount_amount?: number;
  discount_percentage?: number;
  line_total: number;
  supplier?: string;
  warranty_period?: string;
  delivery_time?: string;
  profit_margin?: number;
  actual_cost?: number;
  status?: "approved" | "rejected";
  available_stock?: number;
  brochure_url?: string;
}

interface Equipment {
  id: string;
  name?: string;
  product_model?: string;
  product_brand?: string;
  brand?: string;
  model?: string;
  category?: string;
  quantity?: number;
  srp?: number;
  supplier_cost?: number;
  supplier?: string;
  type: "operational" | "for-sale" | "package";
  brochure_url?: string;
}

interface ProjectProposal {
  id?: string;
  proposal_number?: string;
  title: string;
  description?: string;
  client_id?: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  project_id?: string;
  proposal_date: string;
  valid_until?: string;
  status: "draft" | "sent" | "approved" | "rejected" | "archived";
  subtotal: number;
  discount_amount?: number;
  discount_percentage?: number;
  tax_amount: number;
  tax_percentage: number;
  total_amount: number;
  currency: string;
  payment_terms?: string;
  delivery_terms?: string;
  notes?: string;
  terms_and_conditions?: string;
  items?: ProposalItem[];
  attachments?: string[];
}

interface ProposalFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  proposal?: ProjectProposal | null;
  onSuccess?: () => void;
}

export default function ProposalFormDialog({
  isOpen,
  onClose,
  proposal,
  onSuccess,
}: ProposalFormDialogProps) {
  const isEditMode = !!proposal;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<ProjectProposal>>({
    title: "",
    description: "",
    client_name: "",
    client_email: "",
    client_phone: "",
    client_address: "",
    proposal_date: new Date().toISOString().split("T")[0],
    valid_until: "",
    status: "draft",
    subtotal: 0,
    discount_amount: 0,
    discount_percentage: 0,
    tax_percentage: 12,
    tax_amount: 0,
    total_amount: 0,
    currency: "PHP",
    payment_terms: "",
    delivery_terms: "",
    notes: "",
    terms_and_conditions: "",
    items: [],
    attachments: [],
  });

  const [items, setItems] = useState<ProposalItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [equipmentSearch, setEquipmentSearch] = useState("");
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load equipment on mount
  useEffect(() => {
    if (isOpen) {
      loadEquipment();
    }
  }, [isOpen]);

  // Filter equipment based on search
  useEffect(() => {
    if (equipmentSearch.trim()) {
      const search = equipmentSearch.toLowerCase();
      setFilteredEquipment(
        availableEquipment.filter(
          (eq) =>
            (eq.name || eq.product_model || "").toLowerCase().includes(search) ||
            (eq.brand || eq.product_brand || "").toLowerCase().includes(search) ||
            (eq.model || "").toLowerCase().includes(search) ||
            (eq.category || "").toLowerCase().includes(search)
        )
      );
    } else {
      setFilteredEquipment(availableEquipment);
    }
  }, [equipmentSearch, availableEquipment]);

  const loadEquipment = async () => {
    try {
      const response = await fetch("/api/products");
      if (!response.ok) return;
      const result = await response.json();
      const allEquipment: Equipment[] = [];

      // Add operational equipment
      if (result.data.operational) {
        result.data.operational.forEach((item: any) => {
          allEquipment.push({
            id: item.id,
            name: item.name,
            brand: item.brand,
            model: item.model,
            category: item.product_type,
            quantity: item.quantity,
            type: "operational",
          });
        });
      }

      // Add for-sale products
      if (result.data.forSale) {
        result.data.forSale.forEach((item: any) => {
          allEquipment.push({
            id: item.id,
            name: item.product_model,
            product_brand: item.product_brand,
            product_model: item.product_model,
            brand: item.product_brand,
            model: item.product_model,
            category: item.category,
            quantity: item.quantity,
            srp: item.srp,
            supplier_cost: item.supplier_cost,
            supplier: item.supplier,
            type: "for-sale",
            brochure_url: item.brochure_url,
          });
        });
      }

      // Add packages
      if (result.data.packages) {
        result.data.packages.forEach((item: any) => {
          allEquipment.push({
            id: item.id,
            name: item.package_name,
            brand: item.supplier,
            category: item.package_category,
            quantity: item.quantity,
            srp: item.srp,
            supplier_cost: item.cost,
            supplier: item.supplier,
            type: "package",
            brochure_url: item.brochure_url,
          });
        });
      }

      setAvailableEquipment(allEquipment);
      setFilteredEquipment(allEquipment);
    } catch (error) {
      console.error("Error loading equipment:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (proposal) {
        setFormData({
          title: proposal.title || "",
          description: proposal.description || "",
          client_name: proposal.client_name || "",
          client_email: proposal.client_email || "",
          client_phone: proposal.client_phone || "",
          client_address: proposal.client_address || "",
          proposal_date: proposal.proposal_date
            ? new Date(proposal.proposal_date).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          valid_until: proposal.valid_until
            ? new Date(proposal.valid_until).toISOString().split("T")[0]
            : "",
          status: proposal.status || "draft",
          subtotal: proposal.subtotal || 0,
          discount_amount: proposal.discount_amount || 0,
          discount_percentage: proposal.discount_percentage || 0,
          tax_percentage: proposal.tax_percentage || 12,
          tax_amount: proposal.tax_amount || 0,
          total_amount: proposal.total_amount || 0,
          currency: proposal.currency || "PHP",
          payment_terms: proposal.payment_terms || "",
          delivery_terms: proposal.delivery_terms || "",
          notes: proposal.notes || "",
          terms_and_conditions: proposal.terms_and_conditions || "",
          attachments: proposal.attachments || [],
        });
        setItems(proposal.items || []);
        if (proposal.attachments && proposal.attachments.length > 0) {
          // Note: In a real app, you'd need to convert base64 URLs back to File objects
          // For now, we'll just store the URLs
          setPreviewUrls(proposal.attachments);
        }
      } else {
        setFormData({
          title: "",
          description: "",
          client_name: "",
          client_email: "",
          client_phone: "",
          client_address: "",
          proposal_date: new Date().toISOString().split("T")[0],
          valid_until: "",
          status: "draft",
          subtotal: 0,
          discount_amount: 0,
          discount_percentage: 0,
          tax_percentage: 12,
          tax_amount: 0,
          total_amount: 0,
          currency: "PHP",
          payment_terms: "",
          delivery_terms: "",
          notes: "",
          terms_and_conditions: "",
          attachments: [],
        });
        setItems([]);
        setSelectedFiles([]);
        setPreviewUrls([]);
        setSelectedEquipmentIds(new Set());
      }
    }
  }, [isOpen, proposal]);

  useEffect(() => {
    calculateTotals();
  }, [items, formData.discount_amount, formData.discount_percentage, formData.tax_percentage]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // File handling
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
              attachments: [...(prev.attachments || []), reader.result as string],
            }));
          }
        };
        reader.readAsDataURL(file);
      });
    }
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
              attachments: [...(prev.attachments || []), reader.result as string],
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

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments?.filter((_, i) => i !== index) || [],
    }));
  };

  // Equipment selection
  const handleSelectEquipment = (equipment: Equipment) => {
    const newItem: ProposalItem = {
      equipment_id: equipment.id,
      item_name: equipment.name || equipment.product_model || "Unknown",
      brand: equipment.brand || equipment.product_brand || "",
      model: equipment.model || equipment.product_model || "",
      category: equipment.category || "",
      quantity: 1,
      unit_price: equipment.srp || 0,
      line_total: equipment.srp || 0,
      supplier: equipment.supplier || "",
      available_stock: equipment.quantity || 0,
      profit_margin: 20,
      actual_cost: (equipment.srp || 0) * 1.2,
      status: "approved",
      brochure_url: equipment.brochure_url,
    };

    setItems([...items, newItem]);
    setSelectedEquipmentIds(new Set([...selectedEquipmentIds, equipment.id]));
  };

  const removeItem = (index: number) => {
    const item = items[index];
    if (item.equipment_id) {
      const newSet = new Set(selectedEquipmentIds);
      newSet.delete(item.equipment_id);
      setSelectedEquipmentIds(newSet);
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Recalculate actual cost and line total
    const item = updatedItems[index];
    const quantity = item.quantity || 1;
    const unitPrice = item.unit_price || 0;
    const profitMargin = item.profit_margin || 20;
    const discount = item.discount_amount || 0;

    // Actual cost = (SRP × Quantity) × (1 + Profit Margin%)
    item.actual_cost = (unitPrice * quantity) * (1 + profitMargin / 100);
    // Line total = actual cost - discount
    item.line_total = item.actual_cost - discount;

    setItems(updatedItems);
  };

  const toggleItemStatus = (index: number) => {
    const updatedItems = [...items];
    updatedItems[index].status =
      updatedItems[index].status === "approved" ? "rejected" : "approved";
    setItems(updatedItems);
  };

  const calculateTotals = () => {
    // Only sum approved items
    const approvedItems = items.filter((item) => item.status !== "rejected");
    const subtotal = approvedItems.reduce((sum, item) => sum + (item.actual_cost || item.line_total || 0), 0);
    const discountAmount =
      formData.discount_amount || (subtotal * (formData.discount_percentage || 0)) / 100;
    const taxAmount = ((subtotal - discountAmount) * (formData.tax_percentage || 12)) / 100;
    const totalAmount = subtotal - discountAmount + taxAmount;

    setFormData((prev) => ({
      ...prev,
      subtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
    }));
  };

  const validateForm = () => {
    if (!formData.title?.trim()) {
      alert("Proposal title is required");
      return false;
    }
    if (!formData.client_name?.trim()) {
      alert("Client name is required");
      return false;
    }
    if (!formData.proposal_date) {
      alert("Proposal date is required");
      return false;
    }
    if (!formData.description?.trim()) {
      alert("Project description is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const url = "/api/proposals";
      const method = isEditMode ? "PUT" : "POST";
      const body = isEditMode
        ? { id: proposal?.id, proposal: formData, items }
        : { proposal: formData, items };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save proposal");
      }

      alert(isEditMode ? "Proposal updated successfully!" : "Proposal created successfully!");
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Error saving proposal:", error);
      alert(error.message || "Failed to save proposal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Proposal" : "Create New Proposal"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the proposal details below"
              : "Fill in the details to create a new project proposal"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Project Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Proposal Title *</Label>
                <Input
                  id="title"
                  value={formData.title || ""}
                  onChange={(e) => handleChange("title", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="proposal_date">Proposal Date *</Label>
                <Input
                  id="proposal_date"
                  type="date"
                  value={formData.proposal_date || ""}
                  onChange={(e) => handleChange("proposal_date", e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Project Description *</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="valid_until">Valid Until</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={formData.valid_until || ""}
                  onChange={(e) => handleChange("valid_until", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status || "draft"}
                  onValueChange={(value) => handleChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Client Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_name">Client Name *</Label>
                <Input
                  id="client_name"
                  value={formData.client_name || ""}
                  onChange={(e) => handleChange("client_name", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="client_phone">Client Phone</Label>
                <Input
                  id="client_phone"
                  type="tel"
                  maxLength={11}
                  value={formData.client_phone || ""}
                  onChange={(e) => handleChange("client_phone", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_email">Client Email</Label>
                <Input
                  id="client_email"
                  type="email"
                  value={formData.client_email || ""}
                  onChange={(e) => handleChange("client_email", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="client_address">Client Address</Label>
                <Input
                  id="client_address"
                  value={formData.client_address || ""}
                  onChange={(e) => handleChange("client_address", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* File Attachments */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">File Attachments</h3>
            <div
              className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Drag & drop files here, or click to select
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Supports images, PDFs, and documents
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx"
              />
            </div>
            {previewUrls.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    {url.startsWith("data:image") ? (
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                        <span className="text-xs text-gray-500">File {index + 1}</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Materials */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Available Materials</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search equipment..."
                value={equipmentSearch}
                onChange={(e) => setEquipmentSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="grid grid-cols-3 gap-4 max-h-64 overflow-y-auto">
              {filteredEquipment
                .filter((eq) => !selectedEquipmentIds.has(eq.id))
                .map((equipment) => (
                  <div
                    key={equipment.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer"
                    onClick={() => handleSelectEquipment(equipment)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                        {equipment.name || equipment.product_model || "Unknown"}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {equipment.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {equipment.brand || equipment.product_brand} {equipment.model || equipment.product_model}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Stock: {equipment.quantity || 0} | SRP: ₱{equipment.srp?.toLocaleString() || "0"}
                    </p>
                  </div>
                ))}
            </div>
          </div>

          {/* Selected Materials */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Selected Materials</h3>
            {items.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No materials selected. Select equipment from Available Materials above.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left text-xs font-medium text-gray-900 dark:text-white">
                        Brand
                      </th>
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left text-xs font-medium text-gray-900 dark:text-white">
                        Model
                      </th>
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left text-xs font-medium text-gray-900 dark:text-white">
                        Supplier
                      </th>
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left text-xs font-medium text-gray-900 dark:text-white">
                        Cost (SRP)
                      </th>
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left text-xs font-medium text-gray-900 dark:text-white">
                        Quantity
                      </th>
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left text-xs font-medium text-gray-900 dark:text-white">
                        Profit Margin %
                      </th>
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left text-xs font-medium text-gray-900 dark:text-white">
                        Actual Cost
                      </th>
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left text-xs font-medium text-gray-900 dark:text-white">
                        Status
                      </th>
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left text-xs font-medium text-gray-900 dark:text-white">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-white">
                          {item.brand || "-"}
                        </td>
                        <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-white">
                          {item.model || "-"}
                        </td>
                        <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-white">
                          {item.supplier || "-"}
                        </td>
                        <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-white">
                          ₱{item.unit_price.toLocaleString()}
                        </td>
                        <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">
                          <Input
                            type="number"
                            min="1"
                            max={item.available_stock}
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(index, "quantity", parseInt(e.target.value) || 1)
                            }
                            className="w-20 h-8 text-sm"
                          />
                        </td>
                        <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            value={item.profit_margin || 20}
                            onChange={(e) =>
                              updateItem(index, "profit_margin", parseFloat(e.target.value) || 20)
                            }
                            className="w-20 h-8 text-sm"
                          />
                        </td>
                        <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">
                          ₱{(item.actual_cost || item.line_total || 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">
                          <Badge
                            className={
                              item.status === "approved"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }
                          >
                            {item.status === "approved" ? "Approved" : "Rejected"}
                          </Badge>
                        </td>
                        <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleItemStatus(index)}
                            >
                              {item.status === "approved" ? (
                                <XCircle className="w-4 h-4 text-red-600" />
                              ) : (
                                <Check className="w-4 h-4 text-green-600" />
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Financial Summary */}
          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Financial Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Subtotal (Approved Items Only)</Label>
                <Input
                  type="number"
                  value={formData.subtotal || 0}
                  disabled
                  className="bg-gray-50 dark:bg-gray-800"
                />
              </div>
              <div>
                <Label>Discount Percentage</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.discount_percentage || 0}
                  onChange={(e) =>
                    handleChange("discount_percentage", parseFloat(e.target.value) || 0)
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Discount Amount</Label>
                <Input
                  type="number"
                  value={formData.discount_amount || 0}
                  disabled
                  className="bg-gray-50 dark:bg-gray-800"
                />
              </div>
              <div>
                <Label>VAT (12%)</Label>
                <Input
                  type="number"
                  value={formData.tax_amount || 0}
                  disabled
                  className="bg-gray-50 dark:bg-gray-800"
                />
              </div>
            </div>
            <div>
              <Label>Total Cost</Label>
              <Input
                type="number"
                value={formData.total_amount || 0}
                disabled
                className="bg-gray-50 dark:bg-gray-800 font-semibold text-lg"
              />
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Terms and Conditions</h3>
            <div>
              <Label htmlFor="payment_terms">Payment Terms</Label>
              <Textarea
                id="payment_terms"
                value={formData.payment_terms || ""}
                onChange={(e) => handleChange("payment_terms", e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="delivery_terms">Delivery Terms</Label>
              <Textarea
                id="delivery_terms"
                value={formData.delivery_terms || ""}
                onChange={(e) => handleChange("delivery_terms", e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="terms_and_conditions">Terms and Conditions</Label>
              <Textarea
                id="terms_and_conditions"
                value={formData.terms_and_conditions || ""}
                onChange={(e) => handleChange("terms_and_conditions", e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ""}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEditMode ? "Update Proposal" : "Create Proposal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

