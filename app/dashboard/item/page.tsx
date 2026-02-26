"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Eye, MoreHorizontal, CheckCircle, Calendar, User, Phone, Mail, Package } from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import TopHeader from "@/components/top-header";
import Breadcrumbs from "@/components/breadcrumbs";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

interface EquipmentItem {
  id: string;
  equipment_id: string;
  equipment_type: string;
  quantity: number;
  equipment_details?: {
    id: string;
    name?: string;
    product_model?: string;
    package_name?: string;
    brand?: string;
    product_brand?: string;
    model?: string;
    images?: string[];
    quantity?: number;
  };
}

interface BorrowRequest {
  id: string;
  user_id?: string;
  borrower_name: string;
  borrower_department?: string;
  borrower_contact?: string;
  borrower_email?: string;
  borrow_date: string;
  return_date: string;
  actual_return_date?: string;
  purpose?: string;
  status: string;
  created_at?: string;
  equipmentList?: EquipmentItem[];
}

function ItemContent() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [borrowRequests, setBorrowRequests] = useState<BorrowRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<BorrowRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<BorrowRequest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalRequests, setTotalRequests] = useState(0);
  const [activeRequests, setActiveRequests] = useState(0);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error parsing user:", e);
      }
    }
    loadBorrowRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, statusFilter]);

  useEffect(() => {
    filterRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, borrowRequests]);

  const loadBorrowRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/borrow-requests?page=${currentPage}&limit=${itemsPerPage}&status=${statusFilter === "all" ? "" : statusFilter}`);
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error?.includes("does not exist")) {
          console.warn("Borrow requests table does not exist yet");
          setBorrowRequests([]);
          setFilteredRequests([]);
          return;
        }
        throw new Error(errorData.error || "Failed to fetch borrow requests");
      }
      const result = await response.json();
      setBorrowRequests(result.data || []);
      setFilteredRequests(result.data || []);
      setTotalRequests(result.pagination?.total || 0);

      // Calculate active requests
      const active = (result.data || []).filter((r: BorrowRequest) =>
        r.status !== "Returned" && r.status !== "returned"
      ).length;
      setActiveRequests(active);
    } catch (error: unknown) {
      console.error("Error loading borrow requests:", error);
      setBorrowRequests([]);
      setFilteredRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...borrowRequests];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((request) => request.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (request) =>
          request.borrower_name?.toLowerCase().includes(search) ||
          request.borrower_department?.toLowerCase().includes(search) ||
          request.borrower_contact?.toLowerCase().includes(search) ||
          request.borrower_email?.toLowerCase().includes(search)
      );
    }

    setFilteredRequests(filtered);
  };

  const handleViewDetails = async (request: BorrowRequest) => {
    // Fetch full details with equipment
    try {
      const response = await fetch(`/api/borrow-requests?page=1&limit=1`);
      if (response.ok) {
        const result = await response.json();
        const fullRequest = result.data?.find((r: BorrowRequest) => r.id === request.id);
        setSelectedRequest(fullRequest || request);
      } else {
        setSelectedRequest(request);
      }
    } catch (error) {
      console.error("Error fetching request details:", error);
      setSelectedRequest(request);
    }
    setIsDetailsOpen(true);
  };

  const handleReturn = async (request: BorrowRequest) => {
    if (!request.id) return;

    // Check if user is the borrower
    if (user && request.user_id && user.id !== request.user_id) {
      alert("Only the borrower can return this equipment.");
      return;
    }

    if (!confirm(`Are you sure you want to mark this borrow request as returned?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/borrow-requests`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: request.id,
          status: "Returned",
          actual_return_date: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to return equipment");
      }

      alert("Equipment returned successfully!");
      loadBorrowRequests();
      setIsDetailsOpen(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to return equipment";
      console.error("Error returning equipment:", error);
      alert("Failed to return equipment: " + errorMessage);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "Returned" || status === "returned") {
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    }
    return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
  };

  const getStatusLabel = (status: string) => {
    if (status === "Returned" || status === "returned") {
      return "Returned";
    }
    return "Active";
  };

  const isCurrentUserBorrower = (request: BorrowRequest): boolean => {
    if (!user || !request.user_id) return false;
    return user.id === request.user_id;
  };

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex h-screen w-full bg-[#FFFFFF] dark:bg-gray-900/95 transition-colors relative">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex flex-col bg-transparent">
          <TopHeader />
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
                        <div className="inline-flex items-center rounded-full border border-gray-200/70 dark:border-gray-700 bg-gray-50/90 dark:bg-gray-800/80 px-3 py-1 text-[11px] font-medium tracking-wider text-gray-600 dark:text-gray-300 uppercase">Borrowing</div>
                        <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white tracking-tight mt-4">Items</h1>
                        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 max-w-3xl">Manage equipment borrowing requests.</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">Signed in as <span className="font-medium text-gray-700 dark:text-gray-200">{user.email}</span></p>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <div className="hidden sm:flex flex-col items-end gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Today</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{todayLabel}</span>
                        </div>
                        <Button onClick={() => router.push("/dashboard/item/borrow-form")} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200">
                          <Plus className="w-4 h-4 mr-2" />
                          New Borrow Request
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {totalRequests}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Active Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {activeRequests}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Search and Filters */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search by borrower name, department, contact, or email..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[180px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="borrowed">Active</SelectItem>
                        <SelectItem value="Returned">Returned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Table */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-0">
                  {loading ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      Loading borrow requests...
                    </div>
                  ) : filteredRequests.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      No borrow requests found.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Borrower
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Department
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Borrow Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Return Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {paginatedRequests.map((request) => (
                            <tr
                              key={request.id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <Avatar className="h-8 w-8 mr-3">
                                    <AvatarFallback className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                      {request.borrower_name?.charAt(0).toUpperCase() || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {request.borrower_name}
                                    </div>
                                    {request.borrower_contact && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {request.borrower_contact}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {request.borrower_department ? (
                                  <Badge variant="outline" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700">
                                    {request.borrower_department}
                                  </Badge>
                                ) : (
                                  <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {formatDate(request.borrow_date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {formatDate(request.return_date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge className={getStatusColor(request.status)}>
                                  {getStatusLabel(request.status)}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                                    >
                                      <MoreHorizontal className="h-5 w-5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                    <DropdownMenuItem
                                      onClick={() => handleViewDetails(request)}
                                      className="text-gray-900 dark:text-gray-100 focus:text-gray-900 dark:focus:text-gray-100"
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Details
                                    </DropdownMenuItem>
                                    {request.status !== "Returned" && request.status !== "returned" && (
                                      <>
                                        <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                                        <DropdownMenuItem
                                          onClick={() => handleReturn(request)}
                                          disabled={!isCurrentUserBorrower(request)}
                                          className={`${isCurrentUserBorrower(request)
                                            ? "text-emerald-600 focus:text-emerald-600 dark:text-emerald-400 dark:focus:text-emerald-400"
                                            : "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                                            }`}
                                        >
                                          <CheckCircle className="mr-2 h-4 w-4" />
                                          Return
                                          {!isCurrentUserBorrower(request) && " (Only borrower)"}
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Items per page:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}

              {/* Details Modal */}
              <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="!max-w-4xl !max-h-[90vh] overflow-y-auto !bg-white dark:!bg-gray-900">
                  <DialogHeader>
                    <DialogTitle className="text-gray-900 dark:text-white">
                      Borrow Request Details
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 dark:text-gray-400">
                      View complete information about this borrow request
                    </DialogDescription>
                  </DialogHeader>

                  {selectedRequest && (
                    <ScrollArea className="max-h-[70vh] pr-4">
                      <div className="space-y-6">
                        {/* Borrower Information */}
                        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                          <CardHeader>
                            <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                              <User className="w-5 h-5" />
                              Borrower Information
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Name:</span>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {selectedRequest.borrower_name}
                                </p>
                              </div>
                              <div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Department:</span>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {selectedRequest.borrower_department || "-"}
                                </p>
                              </div>
                              <div>
                                <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  Contact:
                                </span>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {selectedRequest.borrower_contact || "-"}
                                </p>
                              </div>
                              <div>
                                <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  Email:
                                </span>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {selectedRequest.borrower_email || "-"}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Request Details */}
                        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                          <CardHeader>
                            <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                              <Calendar className="w-5 h-5" />
                              Request Details
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Borrow Date:</span>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {formatDate(selectedRequest.borrow_date)}
                                </p>
                              </div>
                              <div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Expected Return Date:</span>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {formatDate(selectedRequest.return_date)}
                                </p>
                              </div>
                              {selectedRequest.actual_return_date && (
                                <div>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">Actual Return Date:</span>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {formatDate(selectedRequest.actual_return_date)}
                                  </p>
                                </div>
                              )}
                              <div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                                <div className="mt-1">
                                  <Badge className={getStatusColor(selectedRequest.status)}>
                                    {getStatusLabel(selectedRequest.status)}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Purpose */}
                        {selectedRequest.purpose && (
                          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            <CardHeader>
                              <CardTitle className="text-lg text-gray-900 dark:text-white">Purpose</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {selectedRequest.purpose}
                              </p>
                            </CardContent>
                          </Card>
                        )}

                        {/* Borrowed Equipment */}
                        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                          <CardHeader>
                            <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                              <Package className="w-5 h-5" />
                              Borrowed Equipment ({selectedRequest.equipmentList?.length || 0})
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {selectedRequest.equipmentList && selectedRequest.equipmentList.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {selectedRequest.equipmentList.map((item, index) => {
                                  const equipment = item.equipment_details;
                                  const name = equipment?.name || equipment?.product_model || equipment?.package_name || "Unknown";
                                  const image = equipment?.images?.[0];
                                  return (
                                    <Card
                                      key={item.id || index}
                                      className="bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                                    >
                                      <CardContent className="p-4">
                                        <div className="space-y-3">
                                          {image ? (
                                            <img
                                              src={image}
                                              alt={name}
                                              className="w-full h-32 object-contain rounded-lg bg-white dark:bg-gray-800"
                                            />
                                          ) : (
                                            <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                              <Package className="w-12 h-12 text-gray-400 dark:text-gray-600" />
                                            </div>
                                          )}
                                          <div>
                                            <h4 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2">
                                              {name}
                                            </h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                              Quantity: {item.quantity}
                                            </p>
                                            {equipment?.brand && (
                                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Brand: {equipment.brand || equipment.product_brand}
                                              </p>
                                            )}
                                            {equipment?.model && (
                                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Model: {equipment.model}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 dark:text-gray-400">No equipment items found.</p>
                            )}
                          </CardContent>
                        </Card>

                        {/* Return Button */}
                        {selectedRequest.status !== "Returned" && selectedRequest.status !== "returned" && (
                          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <Button
                              variant="outline"
                              onClick={() => setIsDetailsOpen(false)}
                              className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                            >
                              Close
                            </Button>
                            <Button
                              onClick={() => handleReturn(selectedRequest)}
                              disabled={!isCurrentUserBorrower(selectedRequest)}
                              className={`${isCurrentUserBorrower(selectedRequest)
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                }`}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Return Equipment
                              {!isCurrentUserBorrower(selectedRequest) && " (Only borrower)"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

export default function ItemPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ItemContent />
    </Suspense>
  );
}

