"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X, Search, Package } from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import TopHeader from "@/components/top-header";
import Breadcrumbs from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface User {
  id: string;
  email: string;
  createdAt: string;
}

interface Equipment {
  id: string;
  name?: string;
  product_model?: string;
  package_name?: string;
  brand?: string;
  product_brand?: string;
  model?: string;
  quantity: number;
  images?: string[];
  equipment_type: "operational" | "for-sale" | "package";
}

interface SelectedEquipment extends Equipment {
  selectedQuantity: number;
}

function BorrowFormContent() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [borrowerName, setBorrowerName] = useState("");
  const [borrowerDepartment, setBorrowerDepartment] = useState("");
  const [borrowerContact, setBorrowerContact] = useState("");
  const [borrowerEmail, setBorrowerEmail] = useState("");
  const [borrowDate, setBorrowDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [purpose, setPurpose] = useState("");

  // Equipment selection
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<SelectedEquipment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setBorrowerEmail(parsedUser.email || "");
      } catch (e) {
        console.error("Error parsing user:", e);
      }
    }
    loadAvailableEquipment();
  }, []);

  const loadAvailableEquipment = async () => {
    try {
      setLoading(true);
      // Fetch all available equipment
      const [operationalRes, forSaleRes, packageRes] = await Promise.all([
        fetch("/api/products?type=operational"),
        fetch("/api/products?type=for-sale"),
        fetch("/api/products?type=package"),
      ]);

      const operational = operationalRes.ok ? (await operationalRes.json()).data || [] : [];
      const forSale = forSaleRes.ok ? (await forSaleRes.json()).data || [] : [];
      const packages = packageRes.ok ? (await packageRes.json()).data || [] : [];

      const allEquipment: Equipment[] = [
        ...operational.map((item: any) => ({
          id: item.id,
          name: item.name,
          brand: item.brand,
          model: item.model,
          quantity: item.quantity || 0,
          images: item.images || [],
          equipment_type: "operational" as const,
        })),
        ...forSale.map((item: any) => ({
          id: item.id,
          name: item.product_model,
          product_model: item.product_model,
          product_brand: item.product_brand,
          brand: item.product_brand,
          quantity: item.quantity || 0,
          images: item.images || [],
          equipment_type: "for-sale" as const,
        })),
        ...packages.map((item: any) => ({
          id: item.id,
          name: item.package_name,
          package_name: item.package_name,
          quantity: item.quantity || 0,
          images: item.images || [],
          equipment_type: "package" as const,
        })),
      ].filter((item) => item.quantity > 0); // Only show items with available stock

      setAvailableEquipment(allEquipment);
    } catch (error) {
      console.error("Error loading equipment:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEquipment = availableEquipment.filter((item) => {
    const search = searchTerm.toLowerCase();
    const name = item.name || item.product_model || item.package_name || "";
    return (
      name.toLowerCase().includes(search) ||
      item.brand?.toLowerCase().includes(search) ||
      item.model?.toLowerCase().includes(search)
    );
  });

  const toggleEquipmentSelection = (equipment: Equipment) => {
    const existingIndex = selectedEquipment.findIndex((e) => e.id === equipment.id);
    if (existingIndex !== -1) {
      setSelectedEquipment(selectedEquipment.filter((_, i) => i !== existingIndex));
    } else {
      setSelectedEquipment([
        ...selectedEquipment,
        { ...equipment, selectedQuantity: 1 },
      ]);
    }
  };

  const updateQuantity = (equipmentId: string, delta: number) => {
    setSelectedEquipment(
      selectedEquipment.map((item) => {
        if (item.id === equipmentId) {
          const newQuantity = Math.max(1, Math.min(item.selectedQuantity + delta, item.quantity));
          return { ...item, selectedQuantity: newQuantity };
        }
        return item;
      })
    );
  };

  const handleQuantityChange = (equipmentId: string, newQuantity: number) => {
    const item = selectedEquipment.find((e) => e.id === equipmentId);
    if (!item) return;

    const validQuantity = Math.max(1, Math.min(newQuantity, item.quantity));
    setSelectedEquipment(
      selectedEquipment.map((e) =>
        e.id === equipmentId ? { ...e, selectedQuantity: validQuantity } : e
      )
    );
  };

  const removeEquipment = (equipmentId: string) => {
    setSelectedEquipment(selectedEquipment.filter((e) => e.id !== equipmentId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!borrowerName || !borrowDate || !returnDate || selectedEquipment.length === 0) {
      alert("Please fill in all required fields and select at least one equipment item.");
      return;
    }

    // Validate stock availability before submission
    for (const item of selectedEquipment) {
      if (item.selectedQuantity > item.quantity) {
        alert(
          `Insufficient stock for ${item.name || item.product_model || item.package_name || "equipment"}. Available: ${item.quantity}, Requested: ${item.selectedQuantity}`
        );
        return;
      }
    }

    try {
      setSubmitting(true);

      const equipmentItems = selectedEquipment.map((item) => ({
        equipment_id: item.id,
        equipment_type: item.equipment_type,
        quantity: item.selectedQuantity,
      }));

      const response = await fetch("/api/borrow-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.id || null,
          borrower_name: borrowerName,
          borrower_department: borrowerDepartment,
          borrower_contact: borrowerContact,
          borrower_email: borrowerEmail,
          borrow_date: borrowDate,
          return_date: returnDate,
          purpose: purpose,
          equipment_items: equipmentItems,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create borrow request");
      }

      alert("Borrow request created successfully!");
      router.push("/dashboard/item");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create borrow request";
      console.error("Error creating borrow request:", error);
      alert("Failed to create borrow request: " + errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-white/95 dark:bg-gray-900/95 transition-colors relative">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex flex-col bg-transparent">
          <TopHeader />
          <div className="flex-1 overflow-auto">
            <div className="p-6 space-y-6">
            {/* Breadcrumbs */}
            <Breadcrumbs />
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/dashboard/item")}
                  className="text-gray-600 dark:text-gray-400"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">New Borrow Request</h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Create a new equipment borrowing request
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Borrower Information */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Borrower Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="borrowerName" className="text-gray-700 dark:text-gray-300">
                        Borrower Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="borrowerName"
                        value={borrowerName}
                        onChange={(e) => setBorrowerName(e.target.value)}
                        required
                        className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="borrowerDepartment" className="text-gray-700 dark:text-gray-300">
                        Department
                      </Label>
                      <Input
                        id="borrowerDepartment"
                        value={borrowerDepartment}
                        onChange={(e) => setBorrowerDepartment(e.target.value)}
                        className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="borrowerContact" className="text-gray-700 dark:text-gray-300">
                        Contact
                      </Label>
                      <Input
                        id="borrowerContact"
                        value={borrowerContact}
                        onChange={(e) => setBorrowerContact(e.target.value)}
                        className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="borrowerEmail" className="text-gray-700 dark:text-gray-300">
                        Email
                      </Label>
                      <Input
                        id="borrowerEmail"
                        type="email"
                        value={borrowerEmail}
                        onChange={(e) => setBorrowerEmail(e.target.value)}
                        className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dates */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Dates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="borrowDate" className="text-gray-700 dark:text-gray-300">
                        Borrow Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="borrowDate"
                        type="date"
                        value={borrowDate}
                        onChange={(e) => setBorrowDate(e.target.value)}
                        required
                        className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="returnDate" className="text-gray-700 dark:text-gray-300">
                        Return Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="returnDate"
                        type="date"
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        required
                        min={borrowDate}
                        className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Purpose */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Purpose</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Enter the purpose for borrowing this equipment..."
                    rows={4}
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                  />
                </CardContent>
              </Card>

              {/* Selected Equipment */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-gray-900 dark:text-white">
                      Selected Equipment ({selectedEquipment.length})
                    </CardTitle>
                    <Button
                      type="button"
                      onClick={() => setIsEquipmentModalOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Equipment
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedEquipment.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No equipment selected. Click "Add Equipment" to select items.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {selectedEquipment.map((item) => {
                        const name = item.name || item.product_model || item.package_name || "Unknown";
                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {item.images?.[0] ? (
                                <img
                                  src={item.images[0]}
                                  alt={name}
                                  className="w-12 h-12 object-contain rounded bg-white dark:bg-gray-800"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                                  <Package className="w-6 h-6 text-gray-400 dark:text-gray-600" />
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Stock: {item.quantity} | Type: {item.equipment_type}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.id, -1)}
                                className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                              >
                                -
                              </Button>
                              <Input
                                type="number"
                                min="1"
                                max={item.quantity}
                                value={item.selectedQuantity}
                                onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                                className="w-16 h-9 text-center text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.id, 1)}
                                disabled={item.selectedQuantity >= item.quantity}
                                className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                              >
                                +
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeEquipment(item.id)}
                                className="text-red-600 hover:text-red-700 dark:text-red-400"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Submit */}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/item")}
                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || selectedEquipment.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Create Borrow Request"}
                </Button>
              </div>
            </form>

            {/* Equipment Selection Modal */}
            <Dialog open={isEquipmentModalOpen} onOpenChange={setIsEquipmentModalOpen}>
              <DialogContent className="!max-w-4xl !max-h-[90vh] overflow-y-auto !bg-white dark:!bg-gray-900">
                <DialogHeader>
                  <DialogTitle className="text-gray-900 dark:text-white">Select Equipment</DialogTitle>
                  <DialogDescription className="text-gray-600 dark:text-gray-400">
                    Choose equipment items to borrow
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search equipment..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <ScrollArea className="max-h-[60vh]">
                    {loading ? (
                      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        Loading equipment...
                      </div>
                    ) : filteredEquipment.length === 0 ? (
                      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        No equipment available.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredEquipment.map((equipment) => {
                          const name = equipment.name || equipment.product_model || equipment.package_name || "Unknown";
                          const isSelected = selectedEquipment.some((e) => e.id === equipment.id);
                          return (
                            <Card
                              key={equipment.id}
                              className={`cursor-pointer transition-all ${
                                isSelected
                                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600"
                              }`}
                              onClick={() => toggleEquipmentSelection(equipment)}
                            >
                              <CardContent className="p-4">
                                <div className="space-y-2">
                                  {equipment.images?.[0] ? (
                                    <img
                                      src={equipment.images[0]}
                                      alt={name}
                                      className="w-full h-24 object-contain rounded bg-white dark:bg-gray-900"
                                    />
                                  ) : (
                                    <div className="w-full h-24 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                                      <Package className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                                      {name}
                                    </p>
                                    <div className="flex items-center justify-between mt-1">
                                      <Badge
                                        variant={equipment.quantity === 0 ? "destructive" : "default"}
                                        className="text-xs"
                                      >
                                        Stock: {equipment.quantity}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        {equipment.equipment_type}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>

                  <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      type="button"
                      onClick={() => setIsEquipmentModalOpen(false)}
                      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

export default function BorrowFormPage() {
  return <BorrowFormContent />;
}

