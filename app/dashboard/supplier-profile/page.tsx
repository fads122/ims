"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Building2, Phone, Mail, MapPin, User, Star, Facebook, MessageCircle, Instagram, Send, Edit, CheckCircle, XCircle, Save, X } from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import TopHeader from "@/components/top-header";
import Breadcrumbs from "@/components/breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  created_at?: string;
  updated_at?: string;
}

function SupplierProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
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
    rating: 0,
  });

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
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchSupplier();
    }
  }, [user, searchParams]);

  const fetchSupplier = async () => {
    const id = searchParams.get("id");
    if (!id) {
      setError("Supplier ID is required");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/suppliers?id=${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch supplier");
      }

      const result = await response.json();
      const supplierData = result.data;
      setSupplier(supplierData);
      // Initialize form data
      setFormData({
        supplierName: supplierData.supplier_name || "",
        contactPerson: supplierData.contact_person || "",
        phone: supplierData.phone || "",
        email: supplierData.email || "",
        status: supplierData.status || "Active",
        address: supplierData.address || "",
        facebookPage: supplierData.facebook_page || "",
        viber: supplierData.viber || "",
        telegram: supplierData.telegram || "",
        instagram: supplierData.instagram || "",
        rating: supplierData.rating || 0,
      });
    } catch (error: any) {
      console.error("Error fetching supplier:", error);
      setError(error.message || "Failed to load supplier details");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
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
        rating: supplier.rating || 0,
      });
    }
    setIsEditing(false);
  };

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

  const handleSave = async () => {
    if (!validateForm() || !supplier) return;

    setSaving(true);
    try {
      const response = await fetch("/api/suppliers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: supplier.id,
          supplierName: formData.supplierName,
          contactPerson: formData.contactPerson,
          phone: formData.phone,
          email: formData.email,
          status: formData.status,
          address: formData.address,
          facebookPage: formData.facebookPage,
          viber: formData.viber,
          telegram: formData.telegram,
          instagram: formData.instagram,
          rating: formData.rating || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update supplier");
      }

      const result = await response.json();
      setSupplier(result.data);
      setIsEditing(false);
      alert("Supplier updated successfully!");
    } catch (error: any) {
      console.error("Error updating supplier:", error);
      alert(error.message || "Failed to update supplier");
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] dark:bg-gray-900/95 transition-colors relative flex items-center justify-center">
        <div className="text-gray-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error || !supplier) {
    return (
      <SidebarProvider>
        <div className="flex h-screen w-full bg-[#FFFFFF] dark:bg-gray-900/95 transition-colors relative">
          <AppSidebar />
          <SidebarInset className="flex flex-col bg-transparent">
            <TopHeader userEmail={user.email} />
            <div className="flex-1 overflow-auto">
              <div className="p-6 lg:p-8">
                <Button
                  onClick={() => router.push("/dashboard/supplier-list")}
                  variant="outline"
                  className="mb-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Supplier List
                </Button>
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardContent className="p-8 text-center">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Supplier Not Found
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {error || "The supplier you're looking for doesn't exist or has been removed."}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-[#FFFFFF] dark:bg-gray-900/95 transition-colors relative">
        <AppSidebar />
        <SidebarInset className="flex flex-col bg-transparent">
          <TopHeader userEmail={user.email} />
          <div className="flex-1 overflow-auto">
            <div className="p-6 lg:p-8 space-y-6">
              {/* Breadcrumbs */}
              <Breadcrumbs />
              {/* Header with Back Button */}
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => router.push("/dashboard/supplier-list")}
                  variant="outline"
                  size="sm"
                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>

              {/* Supplier Header */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white text-xl font-bold">
                      {getInitials(isEditing ? formData.supplierName : supplier.supplier_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      {isEditing ? (
                        <Input
                          value={formData.supplierName}
                          onChange={(e) => handleChange("supplierName", e.target.value)}
                          className="text-2xl font-bold h-12 flex-1 min-w-[200px]"
                          placeholder="Supplier Name"
                        />
                      ) : (
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">
                          {supplier.supplier_name}
                        </h1>
                      )}
                      {!isEditing ? (
                        <Button
                          onClick={handleEdit}
                          variant="outline"
                          size="sm"
                          className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Supplier
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={handleSave}
                            disabled={saving}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? "Saving..." : "Save"}
                          </Button>
                          <Button
                            onClick={handleCancel}
                            disabled={saving}
                            variant="outline"
                            size="sm"
                            className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {isEditing ? (
                        <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge
                          variant="outline"
                          className={`${supplier.status === "Active"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-600"
                            }`}
                        >
                          {supplier.status === "Active" ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {supplier.status}
                        </Badge>
                      )}
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={formData.rating}
                            onChange={(e) => handleChange("rating", parseFloat(e.target.value) || 0)}
                            className="w-20 h-8"
                            placeholder="0.0"
                            min="0"
                            max="5"
                            step="0.1"
                          />
                          <Star className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
                        </div>
                      ) : (
                        supplier.rating && (
                          <div className="flex items-center gap-1.5 text-sm">
                            <Star className="w-4 h-4 text-yellow-500 dark:text-yellow-400 fill-yellow-500 dark:fill-yellow-400" />
                            <span className="text-gray-600 dark:text-gray-400 font-medium">
                              {supplier.rating.toFixed(1)}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Info */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Contact Information */}
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                        <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Contact Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                              Contact Person
                            </p>
                            {isEditing ? (
                              <Input
                                value={formData.contactPerson}
                                onChange={(e) => handleChange("contactPerson", e.target.value)}
                                className="text-sm"
                                placeholder="Contact Person"
                              />
                            ) : (
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {supplier.contact_person}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                              Phone
                            </p>
                            {isEditing ? (
                              <Input
                                value={formData.phone}
                                onChange={(e) => handleChange("phone", e.target.value)}
                                className="text-sm"
                                placeholder="Phone Number"
                              />
                            ) : (
                              <a
                                href={`tel:${supplier.phone}`}
                                className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              >
                                {supplier.phone}
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                              Email
                            </p>
                            {isEditing ? (
                              <Input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleChange("email", e.target.value)}
                                className="text-sm"
                                placeholder="Email Address"
                              />
                            ) : (
                              <a
                                href={`mailto:${supplier.email}`}
                                className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors break-all"
                              >
                                {supplier.email}
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <MapPin className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                              Address
                            </p>
                            {isEditing ? (
                              <Input
                                value={formData.address}
                                onChange={(e) => handleChange("address", e.target.value)}
                                className="text-sm"
                                placeholder="Address"
                              />
                            ) : (
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {supplier.address || "N/A"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Social Media & Communication */}
                  {(isEditing || supplier.facebook_page || supplier.viber || supplier.telegram || supplier.instagram) && (
                    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                          <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          Social Media & Communication
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(isEditing || supplier.facebook_page) && (
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Facebook className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                  Facebook Page
                                </p>
                                {isEditing ? (
                                  <Input
                                    value={formData.facebookPage}
                                    onChange={(e) => handleChange("facebookPage", e.target.value)}
                                    className="text-sm"
                                    placeholder="Facebook Page URL"
                                  />
                                ) : supplier.facebook_page ? (
                                  <a
                                    href={supplier.facebook_page}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate block"
                                  >
                                    {supplier.facebook_page}
                                  </a>
                                ) : (
                                  <p className="text-sm text-gray-400 dark:text-gray-500">N/A</p>
                                )}
                              </div>
                            </div>
                          )}

                          {(isEditing || supplier.viber) && (
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <MessageCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                  Viber
                                </p>
                                {isEditing ? (
                                  <Input
                                    value={formData.viber}
                                    onChange={(e) => handleChange("viber", e.target.value)}
                                    className="text-sm"
                                    placeholder="Viber"
                                  />
                                ) : (
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {supplier.viber || "N/A"}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {(isEditing || supplier.telegram) && (
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                  Telegram
                                </p>
                                {isEditing ? (
                                  <Input
                                    value={formData.telegram}
                                    onChange={(e) => handleChange("telegram", e.target.value)}
                                    className="text-sm"
                                    placeholder="Telegram"
                                  />
                                ) : (
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {supplier.telegram || "N/A"}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {(isEditing || supplier.instagram) && (
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                              <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                                <Instagram className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                  Instagram
                                </p>
                                {isEditing ? (
                                  <Input
                                    value={formData.instagram}
                                    onChange={(e) => handleChange("instagram", e.target.value)}
                                    className="text-sm"
                                    placeholder="Instagram URL"
                                  />
                                ) : supplier.instagram ? (
                                  <a
                                    href={supplier.instagram}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate block"
                                  >
                                    {supplier.instagram}
                                  </a>
                                ) : (
                                  <p className="text-sm text-gray-400 dark:text-gray-500">N/A</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Right Column - Additional Info */}
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-gray-900 dark:text-white">Supplier Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                          Supplier ID
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                          {supplier.id}
                        </p>
                      </div>
                      <Separator className="bg-gray-200 dark:bg-gray-700" />
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                          Status
                        </p>
                        {isEditing ? (
                          <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge
                            variant="outline"
                            className={`${supplier.status === "Active"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-600"
                              }`}
                          >
                            {supplier.status === "Active" ? (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <XCircle className="w-3 h-3 mr-1" />
                            )}
                            {supplier.status}
                          </Badge>
                        )}
                      </div>
                      {(isEditing || supplier.rating) && (
                        <>
                          <Separator className="bg-gray-200 dark:bg-gray-700" />
                          <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                              Rating
                            </p>
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={formData.rating}
                                  onChange={(e) => handleChange("rating", parseFloat(e.target.value) || 0)}
                                  className="w-24"
                                  placeholder="0.0"
                                  min="0"
                                  max="5"
                                  step="0.1"
                                />
                                <Star className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
                              </div>
                            ) : supplier.rating ? (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${i < Math.floor(supplier.rating!)
                                        ? "text-yellow-400 fill-yellow-400"
                                        : "text-gray-300 dark:text-gray-600"
                                        }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {supplier.rating.toFixed(1)}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        </>
                      )}
                      {supplier.created_at && (
                        <>
                          <Separator className="bg-gray-200 dark:bg-gray-700" />
                          <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                              Created At
                            </p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatDate(supplier.created_at)}
                            </p>
                          </div>
                        </>
                      )}
                      {supplier.updated_at && (
                        <>
                          <Separator className="bg-gray-200 dark:bg-gray-700" />
                          <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                              Last Updated
                            </p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatDate(supplier.updated_at)}
                            </p>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export default function SupplierProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FFFFFF] dark:bg-gray-900/95 transition-colors relative flex items-center justify-center">
        <div className="text-gray-900 dark:text-white">Loading...</div>
      </div>
    }>
      <SupplierProfileContent />
    </Suspense>
  );
}

