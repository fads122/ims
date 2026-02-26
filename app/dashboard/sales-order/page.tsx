"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, Truck, CheckCircle, Calendar, Eye, Edit, Trash2, Download, Printer, MoreHorizontal, FileText, Upload, X } from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import TopHeader from "@/components/top-header";
import Breadcrumbs from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { logGenericActivity } from "@/lib/activity-logger";

// Date formatting helper
const formatDate = (date: string | Date) => {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatTime = (time: string) => {
  if (!time) return "N/A";
  return time.substring(0, 5); // Format HH:MM
};

interface User {
  id: string;
  email: string;
  createdAt: string;
}

interface DeliveryReceipt {
  id: string;
  proposal_id?: string;
  project_name: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  delivery_date: string | Date;
  delivered_date?: string | Date;
  delivered_time?: string;
  received_by?: string;
  status: "Delivering" | "Delivered";
  attached_file?: string;
  created_at?: string | Date;
  updated_at?: string | Date;
}

function SalesOrderContent() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [receipts, setReceipts] = useState<DeliveryReceipt[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<DeliveryReceipt[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<DeliveryReceipt | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [editFormData, setEditFormData] = useState({
    received_by: "",
    delivered_date: "",
    delivered_time: "",
    attached_file: "",
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const limit = 10;

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
    if (user) {
      loadReceipts();
    }
  }, [user, page, statusFilter]);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, receipts]);

  const loadReceipts = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/delivery-receipts?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch delivery receipts");
      }

      const result = await response.json();
      setReceipts(result.data || []);
      setFilteredReceipts(result.data || []);
      setTotalPages(result.pagination?.totalPages || 1);
      setTotalItems(result.pagination?.total || 0);
    } catch (error: any) {
      console.error("Error loading receipts:", error);
      if (error.message?.includes("does not exist")) {
        alert("Delivery receipts table not found. Please run create-delivery-receipts-table.sql in your Supabase dashboard.");
      }
    }
  };

  const applyFilters = () => {
    if (!searchQuery.trim()) {
      setFilteredReceipts(receipts);
      return;
    }

    const search = searchQuery.toLowerCase();
    const filtered = receipts.filter(
      (r) =>
        r.project_name.toLowerCase().includes(search) ||
        r.client_name.toLowerCase().includes(search)
    );
    setFilteredReceipts(filtered);
  };

  const handleView = async (receipt: DeliveryReceipt) => {
    try {
      const response = await fetch(`/api/delivery-receipts?id=${receipt.id}`);
      if (response.ok) {
        const result = await response.json();
        setSelectedReceipt(result.data);
        setIsViewModalOpen(true);
      }
    } catch (error) {
      console.error("Error loading receipt details:", error);
    }
  };

  const handleEdit = (receipt: DeliveryReceipt) => {
    setSelectedReceipt(receipt);
    setEditFormData({
      received_by: receipt.received_by || "",
      delivered_date: receipt.delivered_date
        ? new Date(receipt.delivered_date).toISOString().split("T")[0]
        : "",
      delivered_time: receipt.delivered_time || "",
      attached_file: receipt.attached_file || "",
    });
    setUploadedFile(null);
    setFilePreview(receipt.attached_file || null);
    setIsEditModalOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File size must be less than 2MB");
        return;
      }
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setFilePreview(reader.result as string);
          setEditFormData((prev) => ({
            ...prev,
            attached_file: reader.result as string,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedReceipt) return;

    try {
      const updateData: any = {
        received_by: editFormData.received_by,
        delivered_date: editFormData.delivered_date || null,
        delivered_time: editFormData.delivered_time || null,
        attached_file: editFormData.attached_file || null,
      };

      // If all delivery fields are filled, mark as Delivered
      if (editFormData.received_by && editFormData.delivered_date && editFormData.delivered_time) {
        updateData.status = "Delivered";
      }

      const response = await fetch(`/api/delivery-receipts`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedReceipt.id, ...updateData }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update receipt");
      }

      // Log activity
      await logGenericActivity(
        "update",
        "delivery-receipt",
        `Updated delivery receipt: ${selectedReceipt.project_name}`,
        selectedReceipt.id,
        { status: updateData.status }
      );

      alert("Delivery receipt updated successfully!");
      setIsEditModalOpen(false);
      setSelectedReceipt(null);
      loadReceipts();
    } catch (error: any) {
      console.error("Error updating receipt:", error);
      alert("Failed to update receipt: " + error.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedReceipt?.id) return;

    try {
      const response = await fetch(`/api/delivery-receipts?id=${selectedReceipt.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete receipt");

      // Log activity
      await logGenericActivity(
        "delete",
        "delivery-receipt",
        `Deleted delivery receipt: ${selectedReceipt.project_name}`,
        selectedReceipt.id
      );

      setIsDeleteModalOpen(false);
      setSelectedReceipt(null);
      loadReceipts();
    } catch (error: any) {
      console.error("Error deleting receipt:", error);
      alert("Failed to delete receipt: " + error.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async (receipt: DeliveryReceipt) => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      // Color definitions
      const primaryColor = [56, 111, 164]; // #386FA4
      const accentColor = [252, 202, 70]; // #FCCA46
      const darkGray = [51, 51, 51];
      const lightGray = [245, 245, 245];

      let y = 20;

      // Header
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 40, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("QUANBY SOLUTIONS", 105, 18, { align: "center" });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("123 Business St, Makati City, Philippines", 105, 26, { align: "center" });
      doc.text("Email: info@quanby.com | Phone: +63 2 1234 5678", 105, 32, { align: "center" });

      y = 50;

      // Receipt Title
      doc.setFillColor(...accentColor);
      doc.rect(0, y - 5, 210, 15, "F");

      doc.setTextColor(...darkGray);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("DELIVERY RECEIPT", 105, y + 5, { align: "center" });

      y += 20;

      // Receipt Details
      doc.setFillColor(...lightGray);
      doc.roundedRect(14, y, 182, 30, 3, 3, "FD");

      doc.setTextColor(...darkGray);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Receipt Details", 20, y + 8);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Receipt ID: ${receipt.id.substring(0, 8).toUpperCase()}`, 20, y + 15);
      doc.text(`Date: ${formatDate(receipt.delivery_date)}`, 110, y + 15);

      // Status badge
      const statusColor = receipt.status === "Delivered" ? [34, 197, 94] : [251, 191, 36];
      doc.setFillColor(...statusColor);
      doc.roundedRect(150, y + 18, 40, 8, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(receipt.status.toUpperCase(), 170, y + 23, { align: "center" });

      y += 35;

      // Project Information
      doc.setFillColor(...lightGray);
      doc.roundedRect(14, y, 88, 40, 3, 3, "FD");

      doc.setTextColor(...darkGray);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Project Information", 20, y + 8);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Project: ${receipt.project_name}`, 20, y + 15);
      doc.text(`Client: ${receipt.client_name}`, 20, y + 22);
      if (receipt.client_email) {
        doc.text(`Email: ${receipt.client_email}`, 20, y + 29);
      }
      if (receipt.client_phone) {
        doc.text(`Phone: ${receipt.client_phone}`, 20, y + 36);
      }

      // Delivery Information
      doc.setFillColor(...lightGray);
      doc.roundedRect(108, y, 88, 40, 3, 3, "FD");

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Delivery Information", 114, y + 8);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Expected: ${formatDate(receipt.delivery_date)}`, 114, y + 15);
      if (receipt.delivered_date) {
        doc.text(`Delivered: ${formatDate(receipt.delivered_date)}`, 114, y + 22);
      }
      if (receipt.delivered_time) {
        doc.text(`Time: ${formatTime(receipt.delivered_time)}`, 114, y + 29);
      }
      if (receipt.received_by) {
        doc.text(`Received by: ${receipt.received_by}`, 114, y + 36);
      }

      y += 45;

      // Signature Line
      doc.setDrawColor(200, 200, 200);
      doc.line(14, y, 196, y);
      y += 10;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Received by:", 14, y);
      doc.line(60, y - 5, 196, y - 5);
      y += 15;
      doc.text("Signature", 60, y, { align: "center" });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(200, 200, 200);
        doc.line(14, 280, 196, 280);

        doc.setTextColor(128, 128, 128);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.text(
          `Page ${i} of ${pageCount} | Generated on ${new Date().toLocaleDateString()}`,
          105,
          287,
          { align: "center" }
        );
      }

      doc.save(`Delivery-Receipt-${receipt.id.substring(0, 8)}.pdf`);

      // Log activity
      await logGenericActivity(
        "export",
        "delivery-receipt",
        `Exported delivery receipt PDF: ${receipt.project_name}`,
        receipt.id
      );
    } catch (error: any) {
      console.error("Error exporting PDF:", error);
      alert("Failed to export PDF: " + error.message);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "Delivered") {
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    }
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
  };

  const getTotalReceipts = () => receipts.length;
  const getDeliveredCount = () => receipts.filter((r) => r.status === "Delivered").length;

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

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-[#FFFFFF] dark:bg-gray-900/95 transition-colors relative">
        <AppSidebar />
        <SidebarInset className="flex flex-col bg-transparent">
          <TopHeader userEmail={user.email} />
          <div className="flex-1 overflow-auto">
            <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
              <Breadcrumbs />
              {user && (() => {
                const todayLabel = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
                return (
                  <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/50 backdrop-blur-md p-6">
                    <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-transparent blur-3xl" />
                    <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-gradient-to-tr from-emerald-500/10 via-sky-500/10 to-transparent blur-3xl" />
                    <div className="flex items-start justify-between gap-4 relative">
                      <div>
                        <div className="inline-flex items-center rounded-full border border-gray-200/70 dark:border-gray-700 bg-gray-50/90 dark:bg-gray-800/80 px-3 py-1 text-[11px] font-medium tracking-wider text-gray-600 dark:text-gray-300 uppercase">Sales</div>
                        <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white tracking-tight mt-4">Sales Order</h1>
                        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 max-w-3xl">Manage delivery receipts and track deliveries.</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">Signed in as <span className="font-medium text-gray-700 dark:text-gray-200">{user.email}</span></p>
                      </div>
                      <div className="hidden sm:flex flex-col items-end gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Today</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{todayLabel}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Receipts</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                          {getTotalReceipts()}
                        </p>
                      </div>
                      <ShoppingCart className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Delivered</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                          {getDeliveredCount()}
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-400 dark:text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Search and Filter Bar */}
              <div className="flex items-center gap-4">
                <div className="flex-1 relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by project name or client..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Delivering">Delivering</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Receipts Table */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Project Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Client
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Delivery Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Attachment
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredReceipts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                            No delivery receipts found
                          </td>
                        </tr>
                      ) : (
                        filteredReceipts.map((receipt) => (
                          <tr
                            key={receipt.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {receipt.project_name}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant="outline" className="text-xs">
                                {receipt.client_name}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDate(receipt.delivery_date)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={getStatusColor(receipt.status)}>
                                <div className="flex items-center gap-1">
                                  {receipt.status === "Delivered" ? (
                                    <CheckCircle className="w-3 h-3" />
                                  ) : (
                                    <Truck className="w-3 h-3" />
                                  )}
                                  {receipt.status}
                                </div>
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {receipt.attached_file ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(receipt.attached_file, "_blank")}
                                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                >
                                  <FileText className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                              ) : (
                                <span className="text-xs text-gray-400 dark:text-gray-500">No file</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
                                    <MoreHorizontal className="h-5 w-5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleView(receipt)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEdit(receipt)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleExportPDF(receipt)}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download PDF
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedReceipt(receipt);
                                      setIsDeleteModalOpen(true);
                                    }}
                                    className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalItems)} of {totalItems} receipts
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>

      {/* View Details Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="!max-w-[95vw] !w-[95vw] !max-h-[95vh] !h-[95vh] overflow-y-auto p-8 !m-0 !top-[2.5vh] !left-[2.5vw] !translate-x-0 !translate-y-0 !bg-white dark:!bg-slate-900 !text-foreground">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl font-bold text-gray-900 dark:text-white">Delivery Receipt Details</DialogTitle>
            <DialogDescription className="text-base text-gray-600 dark:text-gray-400">
              {selectedReceipt?.project_name}
            </DialogDescription>
          </DialogHeader>
          {selectedReceipt && (
            <div className="space-y-6">
              {/* Project Information */}
              <Card className="bg-white dark:bg-slate-800 border-border/50 shadow-md">
                <CardHeader className="border-b border-border/50">
                  <CardTitle>Project Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Project Name</p>
                      <p className="text-base text-gray-900 dark:text-white">{selectedReceipt.project_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Status</p>
                      <Badge className={getStatusColor(selectedReceipt.status)}>
                        {selectedReceipt.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Client Information */}
              <Card className="bg-white dark:bg-slate-800 border-border/50 shadow-md">
                <CardHeader className="border-b border-border/50">
                  <CardTitle>Client Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Client Name</p>
                      <p className="text-base text-gray-900 dark:text-white">{selectedReceipt.client_name}</p>
                    </div>
                    {selectedReceipt.client_email && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Email</p>
                        <p className="text-base text-gray-900 dark:text-white">{selectedReceipt.client_email}</p>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedReceipt.client_phone && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Phone</p>
                        <p className="text-base text-gray-900 dark:text-white">{selectedReceipt.client_phone}</p>
                      </div>
                    )}
                    {selectedReceipt.client_address && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Address</p>
                        <p className="text-base text-gray-900 dark:text-white">{selectedReceipt.client_address}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Details */}
              <Card className="bg-white dark:bg-slate-800 border-border/50 shadow-md">
                <CardHeader className="border-b border-border/50">
                  <CardTitle>Delivery Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Expected Delivery Date</p>
                      <p className="text-base text-gray-900 dark:text-white">{formatDate(selectedReceipt.delivery_date)}</p>
                    </div>
                    {selectedReceipt.delivered_date && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Delivered Date</p>
                        <p className="text-base text-gray-900 dark:text-white">{formatDate(selectedReceipt.delivered_date)}</p>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedReceipt.delivered_time && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Delivered Time</p>
                        <p className="text-base text-gray-900 dark:text-white">{formatTime(selectedReceipt.delivered_time)}</p>
                      </div>
                    )}
                    {selectedReceipt.received_by && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Received By</p>
                        <p className="text-base text-gray-900 dark:text-white">{selectedReceipt.received_by}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Attachment */}
              {selectedReceipt.attached_file && (
                <Card className="bg-white dark:bg-slate-800 border-border/50 shadow-md">
                  <CardHeader className="border-b border-border/50">
                    <CardTitle>Attachment</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {selectedReceipt.attached_file.match(/\.(jpeg|jpg|png|gif)$/i) ? (
                      <img
                        src={selectedReceipt.attached_file}
                        alt="Delivery receipt attachment"
                        className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                      />
                    ) : (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
                        <FileText className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                        <Button
                          variant="outline"
                          onClick={() => window.open(selectedReceipt.attached_file, "_blank")}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Attachment
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="!max-w-2xl !bg-white dark:!bg-slate-900 !text-foreground">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">Update Delivery Receipt</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              {selectedReceipt?.project_name}
            </DialogDescription>
          </DialogHeader>
          {selectedReceipt && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="received_by">Received By *</Label>
                <Input
                  id="received_by"
                  value={editFormData.received_by}
                  onChange={(e) => setEditFormData({ ...editFormData, received_by: e.target.value })}
                  placeholder="Name of person who received the delivery"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delivered_date">Delivered Date *</Label>
                  <Input
                    id="delivered_date"
                    type="date"
                    value={editFormData.delivered_date}
                    onChange={(e) => setEditFormData({ ...editFormData, delivered_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivered_time">Delivered Time *</Label>
                  <Input
                    id="delivered_time"
                    type="time"
                    value={editFormData.delivered_time}
                    onChange={(e) => setEditFormData({ ...editFormData, delivered_time: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="attached_file">Upload Delivery Document</Label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="attached_file"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label htmlFor="attached_file" className="cursor-pointer">
                    <Upload className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Images or PDF (max 2MB)
                    </p>
                  </label>
                  {filePreview && (
                    <div className="mt-4 relative">
                      {filePreview.startsWith("data:image") ? (
                        <img
                          src={filePreview}
                          alt="Preview"
                          className="max-w-full h-32 object-contain mx-auto rounded border"
                        />
                      ) : (
                        <div className="text-center p-4 bg-gray-100 dark:bg-gray-700 rounded">
                          <FileText className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-xs text-gray-600 dark:text-gray-400">PDF Document</p>
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFilePreview(null);
                          setUploadedFile(null);
                          setEditFormData({ ...editFormData, attached_file: "" });
                        }}
                        className="absolute top-0 right-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="!bg-white dark:!bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Delete Delivery Receipt</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete the delivery receipt for "{selectedReceipt?.project_name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

export default function SalesOrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SalesOrderContent />
    </Suspense>
  );
}


