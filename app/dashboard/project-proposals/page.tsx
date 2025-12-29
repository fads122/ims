"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, FileText, Eye, Edit, Trash2, Download, Calendar, MoreHorizontal, CheckCircle } from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import TopHeader from "@/components/top-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import ProposalFormDialog from "@/components/proposal-form-dialog";
import { logProposalActivity } from "@/lib/activity-logger";
// Date formatting helper
const formatDate = (date: string | Date) => {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

interface User {
  id: string;
  email: string;
  createdAt: string;
}

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
  display_order?: number;
  supplier?: string;
  warranty_period?: string;
  delivery_time?: string;
}

interface ProjectProposal {
  id?: string;
  proposal_number: string;
  title: string;
  description?: string;
  client_id?: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  project_id?: string;
  proposal_date: string | Date;
  valid_until?: string | Date;
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
  created_by?: string;
  sent_at?: string | Date;
  approved_at?: string | Date;
  rejected_at?: string | Date;
  rejection_reason?: string;
  attachments?: string[];
  items?: ProposalItem[];
  created_at?: string | Date;
  updated_at?: string | Date;
}

function ProjectProposalsContent() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<ProjectProposal[]>([]);
  const [filteredProposals, setFilteredProposals] = useState<ProjectProposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<ProjectProposal | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewProposalDetails, setViewProposalDetails] = useState<ProjectProposal | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
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
      loadProposals();
    }
  }, [user, page, statusFilter]);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, proposals]);

  const loadProposals = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/proposals?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || "Failed to fetch proposals";
        
        // If table doesn't exist, show helpful message
        if (errorMessage.includes("does not exist")) {
          console.error("Database tables not found. Please run the SQL schema in Supabase.");
          alert("Database tables not found. Please run the SQL schema (create-project-proposals-tables.sql) in your Supabase dashboard.");
          return;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Check if result has error
      if (result.error) {
        throw new Error(result.error);
      }
      
      setProposals(result.data || []);
      setFilteredProposals(result.data || []);
      setTotalPages(result.pagination?.totalPages || 1);
      setTotalItems(result.pagination?.total || 0);
    } catch (error: any) {
      console.error("Error loading proposals:", error);
      // Show user-friendly error
      if (error.message) {
        alert(`Error: ${error.message}`);
      }
    }
  };

  const applyFilters = () => {
    if (!searchQuery.trim()) {
      setFilteredProposals(proposals);
      return;
    }

    const search = searchQuery.toLowerCase();
    const filtered = proposals.filter(
      (p) =>
        p.proposal_number.toLowerCase().includes(search) ||
        p.title.toLowerCase().includes(search) ||
        p.client_name?.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search)
    );
    setFilteredProposals(filtered);
  };

  const handleMarkAsDelivered = async (proposal: Proposal) => {
    if (!confirm(`Mark proposal "${proposal.title}" as Delivered? This will also create a delivery receipt if one doesn't exist.`)) {
      return;
    }

    try {
      const response = await fetch("/api/proposals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: proposal.id,
          proposal: {
            ...proposal,
            status: "delivered",
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update proposal status");
      }

      await logProposalActivity("update", proposal.id, proposal.proposal_number, proposal.title, { status: "delivered" });
      alert("Proposal marked as Delivered successfully!");
      loadProposals();
    } catch (error: any) {
      console.error("Error updating proposal status:", error);
      alert("Failed to update proposal status: " + error.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedProposal?.id) return;

    try {
      const response = await fetch(`/api/proposals?id=${selectedProposal.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete proposal");

      setIsDeleteModalOpen(false);
      
      // Log activity
      if (selectedProposal?.id) {
        await logProposalActivity("delete", selectedProposal.id, selectedProposal.proposal_number, selectedProposal.title);
      }
      
      setSelectedProposal(null);
      loadProposals();
    } catch (error: any) {
      console.error("Error deleting proposal:", error);
      alert("Failed to delete proposal: " + error.message);
    }
  };

  const handleExportPDF = async (proposal: ProjectProposal) => {
    try {
      // Load full proposal with items
      const response = await fetch(`/api/proposals?id=${proposal.id}`);
      if (!response.ok) throw new Error("Failed to fetch proposal details");

      const result = await response.json();
      const fullProposal = result.data;

      // Dynamic import for PDF generation
      const [{ jsPDF }, { autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const doc = new jsPDF();

      // Color definitions
      const primaryColor = [56, 111, 164]; // #386FA4
      const accentColor = [252, 202, 70]; // #FCCA46
      const darkGray = [51, 51, 51];
      const lightGray = [245, 245, 245];
      const borderGray = [200, 200, 200];

      let y = 20;

      // Header with colored background
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

      // Proposal Title Section with accent background
      doc.setFillColor(...accentColor);
      doc.rect(0, y - 5, 210, 15, "F");
      
      doc.setTextColor(...darkGray);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("PROJECT PROPOSAL", 105, y + 5, { align: "center" });
      
      y += 20;

      // Proposal Details Box
      doc.setDrawColor(...borderGray);
      doc.setFillColor(...lightGray);
      doc.roundedRect(14, y, 182, 30, 3, 3, "FD");
      
      doc.setTextColor(...darkGray);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Proposal Details", 20, y + 8);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Proposal #: ${fullProposal.proposal_number}`, 20, y + 15);
      doc.text(`Date: ${formatDate(fullProposal.proposal_date)}`, 110, y + 15);
      
      if (fullProposal.valid_until) {
        doc.text(`Valid Until: ${formatDate(fullProposal.valid_until)}`, 20, y + 22);
      }
      
      // Status badge
      const statusColors: { [key: string]: number[] } = {
        draft: [128, 128, 128],
        sent: [59, 130, 246],
        approved: [34, 197, 94],
        rejected: [239, 68, 68],
        archived: [107, 114, 128],
      };
      const statusColor = statusColors[fullProposal.status] || [128, 128, 128];
      doc.setFillColor(...statusColor);
      doc.roundedRect(150, y + 18, 40, 8, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(
        fullProposal.status.toUpperCase(),
        170,
        y + 23,
        { align: "center" }
      );
      
      y += 35;

      // Client Information Box
      doc.setTextColor(...darkGray);
      doc.setFillColor(...lightGray);
      doc.roundedRect(14, y, 88, 40, 3, 3, "FD");
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Client Information", 20, y + 8);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      let clientY = y + 15;
      doc.text(`Name: ${fullProposal.client_name || "N/A"}`, 20, clientY);
      clientY += 6;
      if (fullProposal.client_email) {
        doc.text(`Email: ${fullProposal.client_email}`, 20, clientY);
        clientY += 6;
      }
      if (fullProposal.client_phone) {
        doc.text(`Phone: ${fullProposal.client_phone}`, 20, clientY);
        clientY += 6;
      }
      if (fullProposal.client_address) {
        const addressLines = doc.splitTextToSize(
          fullProposal.client_address,
          75
        );
        doc.text(`Address:`, 20, clientY);
        clientY += 5;
        doc.text(addressLines, 20, clientY);
      }

      // Description Box (right side)
      if (fullProposal.description) {
        doc.setFillColor(...lightGray);
        doc.roundedRect(108, y, 88, 40, 3, 3, "FD");
        
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Description", 114, y + 8);
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        const descLines = doc.splitTextToSize(fullProposal.description, 80);
        doc.text(descLines, 114, y + 15);
      }
      
      y += 45;

      // Items Table with autoTable
      if (fullProposal.items && fullProposal.items.length > 0) {
        const approvedItems = fullProposal.items.filter((item: ProposalItem) => item.status !== "rejected");
        
        if (approvedItems.length > 0) {
          const tableData = approvedItems.map((item: ProposalItem) => [
            item.item_name || "N/A",
            item.brand || "-",
            item.model || "-",
            item.quantity.toString(),
            `₱${(item.unit_price || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            `₱${((item.actual_cost || item.line_total || 0)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          ]);

          autoTable(doc, {
            startY: y,
            head: [["Item Name", "Brand", "Model", "Qty", "Unit Price", "Total"]],
            body: tableData,
            theme: "striped",
            headStyles: {
              fillColor: primaryColor,
              textColor: [255, 255, 255],
              fontStyle: "bold",
              fontSize: 10,
            },
            bodyStyles: {
              textColor: darkGray,
              fontSize: 9,
            },
            alternateRowStyles: {
              fillColor: lightGray,
            },
            columnStyles: {
              0: { cellWidth: 50 },
              1: { cellWidth: 35 },
              2: { cellWidth: 35 },
              3: { cellWidth: 20, halign: "center" },
              4: { cellWidth: 30, halign: "right" },
              5: { cellWidth: 30, halign: "right", fontStyle: "bold" },
            },
            margin: { left: 14, right: 14 },
          });
          
          y = (doc as any).lastAutoTable.finalY + 15;
        }
      }

      // Financial Summary Box
      doc.setFillColor(...lightGray);
      doc.roundedRect(14, y, 182, 50, 3, 3, "FD");
      
      doc.setTextColor(...darkGray);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Financial Summary", 20, y + 10);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const rightAlign = 180;
      let finY = y + 18;
      
      doc.text("Subtotal:", 20, finY);
      doc.text(
        `₱${fullProposal.subtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        rightAlign,
        finY,
        { align: "right" }
      );
      finY += 7;

      if (fullProposal.discount_amount && fullProposal.discount_amount > 0) {
        doc.text(
          `Discount (${fullProposal.discount_percentage || 0}%):`,
          20,
          finY
        );
        doc.text(
          `-₱${fullProposal.discount_amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          rightAlign,
          finY,
          { align: "right" }
        );
        finY += 7;
      }

      doc.text(`Tax (${fullProposal.tax_percentage || 0}%):`, 20, finY);
      doc.text(
        `₱${fullProposal.tax_amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        rightAlign,
        finY,
        { align: "right" }
      );
      finY += 10;

      // Total Amount with accent background
      doc.setFillColor(...accentColor);
      doc.roundedRect(14, finY - 5, 182, 12, 3, 3, "F");
      
      doc.setTextColor(...darkGray);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Total Amount:", 20, finY + 5);
      doc.text(
        `₱${fullProposal.total_amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        rightAlign,
        finY + 5,
        { align: "right" }
      );
      
      y = finY + 20;

      // Terms and Conditions
      if (
        fullProposal.payment_terms ||
        fullProposal.delivery_terms ||
        fullProposal.terms_and_conditions ||
        fullProposal.notes
      ) {
        // Check if we need a new page
        if (y > 250) {
          doc.addPage();
          y = 20;
        }

        doc.setFillColor(...lightGray);
        doc.roundedRect(14, y, 182, 60, 3, 3, "FD");
        
        doc.setTextColor(...darkGray);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Terms and Conditions", 20, y + 10);
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        let termsY = y + 18;

        if (fullProposal.payment_terms) {
          doc.setFont("helvetica", "bold");
          doc.text("Payment Terms:", 20, termsY);
          termsY += 5;
          doc.setFont("helvetica", "normal");
          const paymentLines = doc.splitTextToSize(fullProposal.payment_terms, 170);
          doc.text(paymentLines, 20, termsY);
          termsY += paymentLines.length * 5 + 3;
        }

        if (fullProposal.delivery_terms) {
          doc.setFont("helvetica", "bold");
          doc.text("Delivery Terms:", 20, termsY);
          termsY += 5;
          doc.setFont("helvetica", "normal");
          const deliveryLines = doc.splitTextToSize(fullProposal.delivery_terms, 170);
          doc.text(deliveryLines, 20, termsY);
          termsY += deliveryLines.length * 5 + 3;
        }

        if (fullProposal.terms_and_conditions) {
          doc.setFont("helvetica", "bold");
          doc.text("General Terms:", 20, termsY);
          termsY += 5;
          doc.setFont("helvetica", "normal");
          const termsLines = doc.splitTextToSize(fullProposal.terms_and_conditions, 170);
          doc.text(termsLines, 20, termsY);
          termsY += termsLines.length * 5 + 3;
        }

        if (fullProposal.notes) {
          doc.setFont("helvetica", "bold");
          doc.text("Notes:", 20, termsY);
          termsY += 5;
          doc.setFont("helvetica", "normal");
          const notesLines = doc.splitTextToSize(fullProposal.notes, 170);
          doc.text(notesLines, 20, termsY);
        }
      }

      // Footer on all pages
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(...borderGray);
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

      doc.save(`Proposal-${fullProposal.proposal_number}.pdf`);
      
      // Log activity
      await logProposalActivity("export", proposal.id, fullProposal.proposal_number, fullProposal.title);
    } catch (error: any) {
      console.error("Error exporting PDF:", error);
      alert("Failed to export PDF: " + error.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      case "sent":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "delivering":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "delivered":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "archived":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
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
              {/* Header Section */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Project Proposals
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Create, manage, and track project proposals
                  </p>
                </div>
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Proposal
                </Button>
              </div>

              {/* Search and Filter Bar */}
              <div className="flex items-center gap-4">
                <div className="flex-1 relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search proposals..."
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
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="delivering">Delivering</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Proposals Grid */}
              {filteredProposals.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-12 text-center">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg">No proposals found</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                    {searchQuery || statusFilter !== "all" 
                      ? "Try adjusting your search or filters" 
                      : "Create your first proposal to get started"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProposals.map((proposal) => (
                    <Card
                      key={proposal.id}
                      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 hover:border-primary/50"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                              {proposal.title}
                            </CardTitle>
                            <p className="text-xs font-mono text-gray-500 dark:text-gray-400">
                              {proposal.proposal_number}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 flex-shrink-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={async () => {
                                  setSelectedProposal(proposal);
                                  setIsViewModalOpen(true);
                                  setLoadingDetails(true);
                                  try {
                                    const response = await fetch(`/api/proposals?id=${proposal.id}`);
                                    if (response.ok) {
                                      const result = await response.json();
                                      setViewProposalDetails(result.data);
                                    }
                                  } catch (error) {
                                    console.error("Error loading proposal details:", error);
                                  } finally {
                                    setLoadingDetails(false);
                                  }
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedProposal(proposal);
                                  setIsEditModalOpen(true);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleExportPDF(proposal)}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download PDF
                              </DropdownMenuItem>
                              {proposal.status !== "delivered" && (
                                <DropdownMenuItem onClick={() => handleMarkAsDelivered(proposal)}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mark as Delivered
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedProposal(proposal);
                                  setIsDeleteModalOpen(true);
                                }}
                                className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Client Info */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {proposal.client_name || "No Client"}
                            </p>
                          </div>
                          {proposal.client_email && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 ml-4">
                              {proposal.client_email}
                            </p>
                          )}
                        </div>

                        {/* Date and Status */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(proposal.proposal_date)}</span>
                          </div>
                          <Badge className={getStatusColor(proposal.status)}>
                            {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                          </Badge>
                        </div>

                        {/* Total Amount */}
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-baseline justify-between">
                            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Amount</span>
                            <span className="text-xl font-bold text-gray-900 dark:text-white">
                              ₱{proposal.total_amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        {/* Description Preview */}
                        {proposal.description && (
                          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                              {proposal.description}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-6 py-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalItems)} of {totalItems} proposals
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
        </SidebarInset>
      </div>

      {/* Create/Edit Modal */}
      <ProposalFormDialog
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedProposal(null);
        }}
        proposal={isEditModalOpen ? selectedProposal : null}
        onSuccess={() => {
          loadProposals();
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedProposal(null);
        }}
      />

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={(open) => {
        setIsViewModalOpen(open);
        if (!open) {
          setViewProposalDetails(null);
          setSelectedProposal(null);
        }
      }}>
        <DialogContent className="!max-w-[95vw] !w-[95vw] !max-h-[95vh] !h-[95vh] overflow-y-auto p-8 !m-0 !top-[2.5vh] !left-[2.5vw] !translate-x-0 !translate-y-0 bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Proposal Details
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600 dark:text-gray-400">
              {viewProposalDetails?.proposal_number || selectedProposal?.proposal_number}
            </DialogDescription>
          </DialogHeader>
          {loadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600 dark:text-gray-400">Loading details...</div>
            </div>
          ) : viewProposalDetails ? (
            <div className="space-y-6">
              {/* Project Information */}
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                  Project Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      Proposal Title
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">{viewProposalDetails.title}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      Proposal Date
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">{formatDate(viewProposalDetails.proposal_date)}</p>
                  </div>
                  {viewProposalDetails.valid_until && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Valid Until
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">{formatDate(viewProposalDetails.valid_until)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      Status
                    </p>
                    <Badge className={getStatusColor(viewProposalDetails.status)}>
                      {viewProposalDetails.status.charAt(0).toUpperCase() + viewProposalDetails.status.slice(1)}
                    </Badge>
                  </div>
                  {viewProposalDetails.description && (
                    <div className="md:col-span-2">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Description
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">{viewProposalDetails.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Client Information */}
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                  Client Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      Client Name
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">{viewProposalDetails.client_name || "N/A"}</p>
                  </div>
                  {viewProposalDetails.client_email && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Email
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">{viewProposalDetails.client_email}</p>
                    </div>
                  )}
                  {viewProposalDetails.client_phone && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Phone
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">{viewProposalDetails.client_phone}</p>
                    </div>
                  )}
                  {viewProposalDetails.client_address && (
                    <div className="md:col-span-2">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Address
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">{viewProposalDetails.client_address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              {viewProposalDetails.items && viewProposalDetails.items.length > 0 && (
                <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                    Selected Materials
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Item
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Brand/Model
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Unit Price
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Total
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {viewProposalDetails.items.map((item, index) => {
                          const isRejected = item.status === "rejected";
                          return (
                            <tr 
                              key={index} 
                              className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                                isRejected ? "opacity-60" : ""
                              }`}
                            >
                              <td className={`px-4 py-3 text-sm ${isRejected ? "text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white"}`}>
                                <span className={isRejected ? "line-through" : ""}>{item.item_name}</span>
                              </td>
                              <td className={`px-4 py-3 text-sm ${isRejected ? "text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white"}`}>
                                <span className={isRejected ? "line-through" : ""}>
                                  {item.brand || "-"} {item.model ? `/ ${item.model}` : ""}
                                </span>
                              </td>
                              <td className={`px-4 py-3 text-sm ${isRejected ? "text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white"}`}>
                                <span className={isRejected ? "line-through" : ""}>{item.quantity}</span>
                              </td>
                              <td className={`px-4 py-3 text-sm ${isRejected ? "text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white"}`}>
                                <span className={isRejected ? "line-through" : ""}>
                                  ₱{item.unit_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </td>
                              <td className={`px-4 py-3 text-sm font-medium ${isRejected ? "text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white"}`}>
                                <span className={isRejected ? "line-through" : ""}>
                                  ₱{item.line_total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <Badge variant={item.status === "approved" ? "default" : "destructive"}>
                                  {item.status || "approved"}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Financial Summary */}
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                  Financial Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Subtotal</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      ₱{viewProposalDetails.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  {viewProposalDetails.discount_amount && viewProposalDetails.discount_amount > 0 && (
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Discount ({viewProposalDetails.discount_percentage || 0}%)
                      </p>
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">
                        -₱{viewProposalDetails.discount_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      VAT ({viewProposalDetails.tax_percentage || 0}%)
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      ₱{viewProposalDetails.tax_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-base font-semibold text-gray-900 dark:text-white">Total Amount</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      ₱{viewProposalDetails.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              {(viewProposalDetails.payment_terms || viewProposalDetails.delivery_terms || viewProposalDetails.terms_and_conditions || viewProposalDetails.notes) && (
                <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                    Terms and Conditions
                  </h3>
                  <div className="space-y-4">
                    {viewProposalDetails.payment_terms && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                          Payment Terms
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">{viewProposalDetails.payment_terms}</p>
                      </div>
                    )}
                    {viewProposalDetails.delivery_terms && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                          Delivery Terms
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">{viewProposalDetails.delivery_terms}</p>
                      </div>
                    )}
                    {viewProposalDetails.terms_and_conditions && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                          Terms and Conditions
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{viewProposalDetails.terms_and_conditions}</p>
                      </div>
                    )}
                    {viewProposalDetails.notes && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                          Notes
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{viewProposalDetails.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : selectedProposal ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Loading proposal details...
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Proposal</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete proposal {selectedProposal?.proposal_number}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
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

export default function ProjectProposalsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProjectProposalsContent />
    </Suspense>
  );
}

