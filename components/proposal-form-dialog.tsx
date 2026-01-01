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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logProposalActivity } from "@/lib/activity-logger";

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
  status: "draft" | "sent" | "approved" | "delivering" | "delivered" | "rejected" | "archived";
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
      if (!response.ok) {
        console.error("Failed to fetch equipment:", response.status, response.statusText);
        return;
      }
      const result = await response.json();

      if (!result || !result.data) {
        console.error("Invalid response format from /api/products");
        return;
      }

      const allEquipment: Equipment[] = [];

      // Add operational equipment
      if (result.data.operational && Array.isArray(result.data.operational)) {
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
      if (result.data.forSale && Array.isArray(result.data.forSale)) {
        result.data.forSale.forEach((item: Record<string, unknown>) => {
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
      if (result.data.packages && Array.isArray(result.data.packages)) {
        result.data.packages.forEach((item: Record<string, unknown>) => {
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
      // Don't throw - just log the error so the form can still be used
    }
  };

  // Fetch full proposal with items when editing
  useEffect(() => {
    const fetchFullProposal = async () => {
      if (isOpen && proposal?.id) {
        try {
          const response = await fetch(`/api/proposals?id=${proposal.id}`);
          if (!response.ok) {
            console.error("Failed to fetch full proposal");
            return;
          }
          const result = await response.json();
          const fullProposal = result.data;

          if (fullProposal) {
            setFormData({
              title: fullProposal.title || "",
              description: fullProposal.description || "",
              client_name: fullProposal.client_name || "",
              client_email: fullProposal.client_email || "",
              client_phone: fullProposal.client_phone || "",
              client_address: fullProposal.client_address || "",
              proposal_date: fullProposal.proposal_date
                ? new Date(fullProposal.proposal_date).toISOString().split("T")[0]
                : new Date().toISOString().split("T")[0],
              valid_until: fullProposal.valid_until
                ? new Date(fullProposal.valid_until).toISOString().split("T")[0]
                : "",
              status: fullProposal.status || "draft",
              subtotal: fullProposal.subtotal || 0,
              discount_amount: fullProposal.discount_amount || 0,
              discount_percentage: fullProposal.discount_percentage || 0,
              tax_percentage: fullProposal.tax_percentage || 12,
              tax_amount: fullProposal.tax_amount || 0,
              total_amount: fullProposal.total_amount || 0,
              currency: fullProposal.currency || "PHP",
              payment_terms: fullProposal.payment_terms || "",
              delivery_terms: fullProposal.delivery_terms || "",
              notes: fullProposal.notes || "",
              terms_and_conditions: fullProposal.terms_and_conditions || "",
              attachments: fullProposal.attachments || [],
            });
            setItems(fullProposal.items || []);

            // Set selected equipment IDs for items that have equipment_id
            if (fullProposal.items && fullProposal.items.length > 0) {
              const equipmentIds = new Set<string>(
                fullProposal.items
                  .map((item: ProposalItem) => item.equipment_id)
                  .filter((id): id is string => !!id)
              );
              setSelectedEquipmentIds(equipmentIds);
            }

            if (fullProposal.attachments && fullProposal.attachments.length > 0) {
              setPreviewUrls(fullProposal.attachments);
            }
          }
        } catch (error) {
          console.error("Error fetching full proposal:", error);
        }
      }
    };

    fetchFullProposal();
  }, [isOpen, proposal?.id]);

  useEffect(() => {
    if (isOpen && !proposal) {
      // Reset form for new proposal
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
    const currentItem = updatedItems[index];

    // Validate quantity doesn't exceed available stock
    if (field === "quantity") {
      const requestedQuantity = parseInt(value) || 1;
      const availableStock = currentItem.available_stock || 0;

      if (requestedQuantity > availableStock) {
        alert(`Quantity cannot exceed available stock (${availableStock}). Please reduce the quantity.`);
        return; // Don't update if quantity exceeds stock
      }

      if (requestedQuantity < 1) {
        alert("Quantity must be at least 1");
        return;
      }
    }

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

    // Validate stock availability for approved items
    for (const item of items) {
      if (item.status === "approved" && item.equipment_id) {
        if (item.quantity > (item.available_stock || 0)) {
          alert(
            `Insufficient stock for ${item.item_name}. Available: ${item.available_stock}, Requested: ${item.quantity}`
          );
          return false;
        }
      }
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

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save proposal");
      }

      alert(isEditMode ? "Proposal updated successfully!" : "Proposal created successfully!");

      // Log activity
      if (result.data) {
        if (isEditMode) {
          await logProposalActivity("update", result.data.id, result.data.proposal_number, result.data.title);
        } else {
          await logProposalActivity("create", result.data.id, result.data.proposal_number, result.data.title);
        }
      }

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
      <DialogContent className="!max-w-[95vw] !w-[95vw] !max-h-[95vh] !h-[95vh] overflow-y-auto p-8 !m-0 !top-[2.5vh] !left-[2.5vw] !translate-x-0 !translate-y-0 !bg-white dark:!bg-slate-900 !text-foreground backdrop-blur-md">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-3xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? "Edit Proposal" : "Create New Proposal"}
          </DialogTitle>
          <DialogDescription className="text-base text-gray-600 dark:text-gray-400">
            {isEditMode
              ? "Update the proposal details below"
              : "Fill in the details to create a new project proposal"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Information */}
          <Card className="border-border/50 shadow-md bg-white dark:bg-slate-800">
            <CardHeader className="border-b border-border/50">
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Proposal Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title || ""}
                    onChange={(e) => handleChange("title", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proposal_date">
                    Proposal Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="proposal_date"
                    type="date"
                    value={formData.proposal_date || ""}
                    onChange={(e) => handleChange("proposal_date", e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">
                  Project Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valid_until">Valid Until</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until || ""}
                    onChange={(e) => handleChange("valid_until", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
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
                      <SelectItem value="delivering">Delivering</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Information */}
          <Card className="border-border/50 shadow-md bg-white dark:bg-slate-800">
            <CardHeader className="border-b border-border/50">
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_name">
                    Client Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="client_name"
                    value={formData.client_name || ""}
                    onChange={(e) => handleChange("client_name", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
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
                <div className="space-y-2">
                  <Label htmlFor="client_email">Client Email</Label>
                  <Input
                    id="client_email"
                    type="email"
                    value={formData.client_email || ""}
                    onChange={(e) => handleChange("client_email", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_address">Client Address</Label>
                  <Input
                    id="client_address"
                    value={formData.client_address || ""}
                    onChange={(e) => handleChange("client_address", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Attachments */}
          <Card className="border-border/50 shadow-md bg-white dark:bg-slate-800">
            <CardHeader className="border-b border-border/50">
              <CardTitle>File Attachments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-muted/30 transition-all bg-muted/50"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-1">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-xs text-muted-foreground">
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
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                      ) : (
                        <div className="w-full h-32 bg-muted rounded-lg border flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">File {index + 1}</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Materials */}
          <Card className="border-border/50 shadow-md bg-white dark:bg-slate-800">
            <CardHeader className="border-b border-border/50">
              <CardTitle>Available Materials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search equipment..."
                  value={equipmentSearch}
                  onChange={(e) => setEquipmentSearch(e.target.value)}
                  className="pl-10 text-sm sm:text-base"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-h-64 overflow-y-auto">
                {filteredEquipment
                  .filter((eq) => !selectedEquipmentIds.has(eq.id))
                  .map((equipment) => (
                    <div
                      key={equipment.id}
                      className="border border-border/50 rounded-lg p-3 sm:p-4 hover:border-primary hover:shadow-md transition-all cursor-pointer bg-white dark:bg-slate-700"
                      onClick={() => handleSelectEquipment(equipment)}
                    >
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <h4 className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white break-words flex-1 min-w-0">
                          {equipment.name || equipment.product_model || "Unknown"}
                        </h4>
                        <Badge variant="outline" className="text-[10px] sm:text-xs flex-shrink-0 whitespace-nowrap">
                          {equipment.type}
                        </Badge>
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 break-words">
                        {equipment.brand || equipment.product_brand} {equipment.model || equipment.product_model}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground break-words">
                        Stock: {equipment.quantity || 0} | SRP: ₱{equipment.srp?.toLocaleString() || "0"}
                      </p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Selected Materials */}
          <Card className="border-border/50 shadow-md bg-white dark:bg-slate-800">
            <CardHeader className="border-b border-border/50">
              <CardTitle>Selected Materials</CardTitle>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No materials selected. Select equipment from Available Materials above.
                </p>
              ) : (
                <div className="rounded-md border border-border/50 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle font-medium text-sm">
                          Brand
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-sm">
                          Model
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-sm">
                          Supplier
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-sm">
                          Cost (SRP)
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-sm">
                          Quantity
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-sm">
                          Profit Margin %
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-sm">
                          Actual Cost
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-sm">
                          Status
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-sm">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={index} className="border-b border-border/50 transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle text-sm">
                            {item.brand || "-"}
                          </td>
                          <td className="p-4 align-middle text-sm">
                            {item.model || "-"}
                          </td>
                          <td className="p-4 align-middle text-sm">
                            {item.supplier || "-"}
                          </td>
                          <td className="p-4 align-middle text-sm font-medium">
                            ₱{item.unit_price.toLocaleString()}
                          </td>
                          <td className="p-4 align-middle">
                            <div className="flex flex-col gap-1.5 items-start">
                              <Input
                                type="number"
                                min="1"
                                max={item.available_stock || 999999}
                                value={item.quantity}
                                onChange={(e) =>
                                  updateItem(index, "quantity", parseInt(e.target.value) || 1)
                                }
                                className={`w-20 h-9 text-sm ${item.quantity > (item.available_stock || 0)
                                  ? "border-destructive focus-visible:ring-destructive"
                                  : ""
                                  }`}
                              />
                              {item.available_stock !== undefined && (
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  Max: {item.available_stock}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="flex items-center">
                              <Input
                                type="number"
                                min="0"
                                step="0.1"
                                value={item.profit_margin || 20}
                                onChange={(e) =>
                                  updateItem(index, "profit_margin", parseFloat(e.target.value) || 20)
                                }
                                className="w-20 h-9 text-sm"
                              />
                            </div>
                          </td>
                          <td className="p-4 align-middle text-sm font-medium">
                            ₱{(item.actual_cost || item.line_total || 0).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="p-4 align-middle">
                            <div className="flex items-center">
                              <Badge
                                variant={item.status === "approved" ? "default" : "destructive"}
                              >
                                {item.status === "approved" ? "Approved" : "Rejected"}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleItemStatus(index)}
                                className="h-8 w-8 p-0"
                              >
                                {item.status === "approved" ? (
                                  <XCircle className="w-4 h-4" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(index)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card className="border-border/50 shadow-md bg-white dark:bg-slate-800">
            <CardHeader className="border-b border-border/50">
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subtotal (Approved Items Only)</Label>
                  <Input
                    type="number"
                    value={formData.subtotal || 0}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
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
                <div className="space-y-2">
                  <Label>Discount Amount</Label>
                  <Input
                    type="number"
                    value={formData.discount_amount || 0}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label>VAT (12%)</Label>
                  <Input
                    type="number"
                    value={formData.tax_amount || 0}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Total Cost</Label>
                <Input
                  type="number"
                  value={formData.total_amount || 0}
                  disabled
                  className="bg-muted font-semibold"
                />
              </div>
            </CardContent>
          </Card>

          {/* Terms and Conditions */}
          <Card className="border-border/50 shadow-md bg-white dark:bg-slate-800">
            <CardHeader className="border-b border-border/50">
              <CardTitle>Terms and Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payment_terms">Payment Terms</Label>
                <Textarea
                  id="payment_terms"
                  value={formData.payment_terms || ""}
                  onChange={(e) => handleChange("payment_terms", e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery_terms">Delivery Terms</Label>
                <Textarea
                  id="delivery_terms"
                  value={formData.delivery_terms || ""}
                  onChange={(e) => handleChange("delivery_terms", e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="terms_and_conditions">Terms and Conditions</Label>
                <Textarea
                  id="terms_and_conditions"
                  value={formData.terms_and_conditions || ""}
                  onChange={(e) => handleChange("terms_and_conditions", e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ""}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-border/50">
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

