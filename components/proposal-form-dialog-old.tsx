"use client";

import { useState, useEffect } from "react";
import { Plus, X, Trash2 } from "lucide-react";
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
  });

  const [items, setItems] = useState<ProposalItem[]>([]);

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
        });
        setItems(proposal.items || []);
      } else {
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
        });
        setItems([]);
      }
    }
  }, [isOpen, proposal]);

  useEffect(() => {
    calculateTotals();
  }, [items, formData.discount_amount, formData.discount_percentage, formData.tax_percentage]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        item_name: "",
        quantity: 1,
        unit_price: 0,
        line_total: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate line total
    const quantity = updatedItems[index].quantity || 1;
    const unitPrice = updatedItems[index].unit_price || 0;
    const discount = updatedItems[index].discount_amount || 0;
    updatedItems[index].line_total = quantity * unitPrice - discount;
    
    setItems(updatedItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.line_total || 0), 0);
    const discountAmount =
      formData.discount_amount ||
      (subtotal * (formData.discount_percentage || 0)) / 100;
    const taxAmount =
      ((subtotal - discountAmount) * (formData.tax_percentage || 12)) / 100;
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Proposal" : "Create New Proposal"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the proposal details below"
              : "Fill in the details to create a new project proposal"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h3>
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
              />
            </div>
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
                <Label htmlFor="client_email">Client Email</Label>
                <Input
                  id="client_email"
                  type="email"
                  value={formData.client_email || ""}
                  onChange={(e) => handleChange("client_email", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_phone">Client Phone</Label>
                <Input
                  id="client_phone"
                  value={formData.client_phone || ""}
                  onChange={(e) => handleChange("client_phone", e.target.value)}
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

          {/* Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Items</h3>
              <Button type="button" onClick={addItem} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No items added. Click "Add Item" to add items to this proposal.
              </p>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 dark:text-white">Item {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Item Name *</Label>
                        <Input
                          value={item.item_name || ""}
                          onChange={(e) => updateItem(index, "item_name", e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label>Brand</Label>
                        <Input
                          value={item.brand || ""}
                          onChange={(e) => updateItem(index, "brand", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Model</Label>
                        <Input
                          value={item.model || ""}
                          onChange={(e) => updateItem(index, "model", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Input
                          value={item.category || ""}
                          onChange={(e) => updateItem(index, "category", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity || 1}
                          onChange={(e) =>
                            updateItem(index, "quantity", parseInt(e.target.value) || 1)
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label>Unit Price *</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price || 0}
                          onChange={(e) =>
                            updateItem(index, "unit_price", parseFloat(e.target.value) || 0)
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label>Discount Amount</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.discount_amount || 0}
                          onChange={(e) =>
                            updateItem(index, "discount_amount", parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div>
                        <Label>Line Total</Label>
                        <Input
                          type="number"
                          value={item.line_total || 0}
                          disabled
                          className="bg-gray-50 dark:bg-gray-800"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={item.item_description || ""}
                        onChange={(e) => updateItem(index, "item_description", e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Financial Summary */}
          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Financial Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Subtotal</Label>
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
                <Label>Tax Percentage</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.tax_percentage || 12}
                  onChange={(e) => handleChange("tax_percentage", parseFloat(e.target.value) || 12)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tax Amount</Label>
                <Input
                  type="number"
                  value={formData.tax_amount || 0}
                  disabled
                  className="bg-gray-50 dark:bg-gray-800"
                />
              </div>
              <div>
                <Label>Total Amount</Label>
                <Input
                  type="number"
                  value={formData.total_amount || 0}
                  disabled
                  className="bg-gray-50 dark:bg-gray-800 font-semibold"
                />
              </div>
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

