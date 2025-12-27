"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
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
}

interface AddEditSupplierDialogProps {
  isOpen: boolean;
  onClose: () => void;
  supplier?: Supplier | null;
}

export default function AddEditSupplierDialog({
  isOpen,
  onClose,
  supplier,
}: AddEditSupplierDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    supplierName: "",
    contactPerson: "",
    phone: "",
    email: "",
    status: "Active" as "Active" | "Inactive",
    address: "",
    facebookPage: "",
    viber: "",
    telegram: "",
    instagram: "",
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        supplierName: supplier.supplier_name || "",
        contactPerson: supplier.contact_person || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        status: supplier.status || "Active",
        address: supplier.address || "",
        facebookPage: supplier.facebook_page || "",
        viber: supplier.viber || "",
        telegram: supplier.telegram || "",
        instagram: supplier.instagram || "",
      });
    } else {
      setFormData({
        supplierName: "",
        contactPerson: "",
        phone: "",
        email: "",
        status: "Active",
        address: "",
        facebookPage: "",
        viber: "",
        telegram: "",
        instagram: "",
      });
    }
  }, [supplier, isOpen]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.supplierName.trim()) {
      alert("Supplier name is required");
      return false;
    }
    if (!formData.contactPerson.trim()) {
      alert("Contact person is required");
      return false;
    }
    if (!formData.phone.trim()) {
      alert("Phone number is required");
      return false;
    }
    if (!formData.email.trim()) {
      alert("Email is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert("Invalid email format");
      return false;
    }
    if (!formData.address.trim()) {
      alert("Address is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const url = supplier ? "/api/suppliers" : "/api/suppliers";
      const method = supplier ? "PUT" : "POST";
      const body = supplier
        ? { id: supplier.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save supplier");
      }

      alert(supplier ? "Supplier updated successfully!" : "Supplier created successfully!");
      onClose();
    } catch (error: any) {
      console.error("Error saving supplier:", error);
      alert(error.message || "Failed to save supplier");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-2xl !w-[90vw] !max-h-[90vh] overflow-y-auto p-6 !bg-white/95 dark:!bg-gray-900/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {supplier ? "Edit Supplier" : "Add Supplier"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Required Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                Supplier Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.supplierName}
                onChange={(e) => handleChange("supplierName", e.target.value)}
                placeholder="Enter supplier name"
                className="h-12 text-base"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                Contact Person <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.contactPerson}
                onChange={(e) => handleChange("contactPerson", e.target.value)}
                placeholder="Enter contact person name"
                className="h-12 text-base"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="Enter phone number"
                className="h-12 text-base"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Enter email address"
                className="h-12 text-base"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                Status <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.status} onValueChange={(value: "Active" | "Inactive") => handleChange("status", value)}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Address <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Enter full address"
              rows={3}
              className="text-base resize-none"
              required
            />
          </div>

          {/* Social Media (Optional) */}
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Social Media Contacts (Optional)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Facebook Page</Label>
                <Input
                  value={formData.facebookPage}
                  onChange={(e) => handleChange("facebookPage", e.target.value)}
                  placeholder="Enter Facebook page URL"
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-base font-semibold">Viber</Label>
                <Input
                  value={formData.viber}
                  onChange={(e) => handleChange("viber", e.target.value)}
                  placeholder="Enter Viber contact"
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-base font-semibold">Telegram</Label>
                <Input
                  value={formData.telegram}
                  onChange={(e) => handleChange("telegram", e.target.value)}
                  placeholder="Enter Telegram contact"
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-base font-semibold">Instagram</Label>
                <Input
                  value={formData.instagram}
                  onChange={(e) => handleChange("instagram", e.target.value)}
                  placeholder="Enter Instagram handle"
                  className="h-12 text-base"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={onClose} className="px-6 py-3 text-base">
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 px-6 py-3 text-base" disabled={loading}>
              {loading ? "Saving..." : supplier ? "Update Supplier" : "Add Supplier"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

