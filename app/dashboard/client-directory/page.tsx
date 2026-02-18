"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, Mail, Phone, MapPin, Eye, FileText, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import TopHeader from "@/components/top-header";
import Breadcrumbs from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

interface Proposal {
  id: string;
  proposal_number: string;
  title: string;
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  status: string;
  proposal_date: string | Date;
  created_at: string | Date;
}

interface Client {
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  client_address: string | null;
  proposals: Proposal[];
  _uid?: string; // Generated unique ID
}

function ClientDirectoryContent() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [displayedClients, setDisplayedClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [totalItems, setTotalItems] = useState(0);

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
      loadClients();
    }
  }, [user]);

  useEffect(() => {
    getFilteredClients();
  }, [clientSearchTerm, allClients]);

  useEffect(() => {
    getPaginatedClients();
  }, [filteredClients, pageIndex, pageSize]);

  const loadClients = async () => {
    try {
      const response = await fetch("/api/clients?limit=10000");
      if (!response.ok) throw new Error("Failed to fetch clients");

      const result = await response.json();
      const clients: Client[] = (result.data || []).map((client: Client, index: number) => ({
        ...client,
        _uid: `client-${index}-${client.client_name}`,
      }));

      setAllClients(clients);
      setTotalItems(clients.length);
    } catch (error: any) {
      console.error("Error loading clients:", error);
      alert("Failed to load clients: " + error.message);
    }
  };

  const getFilteredClients = () => {
    if (!clientSearchTerm.trim()) {
      setFilteredClients(allClients);
      setTotalItems(allClients.length);
      return;
    }

    const search = clientSearchTerm.toLowerCase();
    const filtered = allClients.filter(
      (client) =>
        client.client_name?.toLowerCase().includes(search) ||
        client.client_email?.toLowerCase().includes(search) ||
        client.client_phone?.toLowerCase().includes(search) ||
        client.client_address?.toLowerCase().includes(search)
    );

    setFilteredClients(filtered);
    setTotalItems(filtered.length);
    setPageIndex(0); // Reset to first page when filtering
  };

  const getPaginatedClients = () => {
    const start = pageIndex * pageSize;
    const end = start + pageSize;
    setDisplayedClients(filteredClients.slice(start, end));
  };

  const showClientDetails = (client: Client) => {
    setSelectedClient(client);
    setIsDetailsModalOpen(true);
  };

  const getTotalProjects = () => {
    return allClients.reduce((sum, client) => sum + client.proposals.length, 0);
  };

  const getTotalProjectValue = (client: Client) => {
    return client.proposals.reduce((sum, proposal) => sum + (proposal.total_amount || 0), 0);
  };

  const getAverageProjectValue = (client: Client) => {
    if (client.proposals.length === 0) return 0;
    return getTotalProjectValue(client) / client.proposals.length;
  };

  const getProjectCountBadgeColor = (count: number) => {
    if (count === 0) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    if (count <= 2) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    if (count <= 4) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      case "sent":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
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
      <div className="min-h-screen bg-[#FFFFFF] dark:bg-gray-900/95 transition-colors relative flex items-center justify-center">
        <div className="text-gray-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const totalPages = Math.ceil(totalItems / pageSize);
  const startRange = pageIndex * pageSize + 1;
  const endRange = Math.min((pageIndex + 1) * pageSize, totalItems);

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
              {/* Header Section */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Client Directory
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    View and manage all clients and their proposals
                  </p>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Clients</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                          {allClients.length}
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Projects</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                          {getTotalProjects()}
                        </p>
                      </div>
                      <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Search Bar */}
              <div className="flex items-center gap-4">
                <div className="flex-1 relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search clients by name, email, phone, or address..."
                    value={clientSearchTerm}
                    onChange={(e) => setClientSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Clients Table */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Client Information
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Projects
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {displayedClients.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                            {clientSearchTerm ? "No clients found matching your search" : "No clients found"}
                          </td>
                        </tr>
                      ) : (
                        displayedClients.map((client) => (
                          <tr
                            key={client._uid}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                                    {client.client_name?.charAt(0).toUpperCase() || "C"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {client.client_name || "Unknown Client"}
                                  </div>
                                  {client.client_email && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                                      <Mail className="w-3 h-3" />
                                      {client.client_email}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {client.client_phone ? (
                                <div className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-gray-400" />
                                  {client.client_phone}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400 dark:text-gray-500">N/A</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {client.client_address ? (
                                <div className="text-sm text-gray-900 dark:text-white flex items-start gap-2 max-w-xs">
                                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                  <span className="line-clamp-2">{client.client_address}</span>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400 dark:text-gray-500">N/A</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={getProjectCountBadgeColor(client.proposals.length)}>
                                {client.proposals.length} {client.proposals.length === 1 ? "project" : "projects"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => showClientDetails(client)}
                                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </Button>
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
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Showing {startRange} – {endRange} of {totalItems} clients
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Items per page:</span>
                        <Select
                          value={pageSize.toString()}
                          onValueChange={(value) => {
                            setPageSize(Number(value));
                            setPageIndex(0);
                          }}
                        >
                          <SelectTrigger className="w-20 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPageIndex(0)}
                        disabled={pageIndex === 0}
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                        disabled={pageIndex === 0}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-gray-500 dark:text-gray-400 px-2">
                        Page {pageIndex + 1} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={pageIndex >= totalPages - 1}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPageIndex(totalPages - 1)}
                        disabled={pageIndex >= totalPages - 1}
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>

      {/* Client Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="!max-w-[95vw] !w-[95vw] !max-h-[95vh] !h-[95vh] overflow-y-auto p-8 !m-0 !top-[2.5vh] !left-[2.5vw] !translate-x-0 !translate-y-0 !bg-white dark:!bg-slate-900 !text-foreground">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl font-bold text-gray-900 dark:text-white">
              Client Details
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600 dark:text-gray-400">
              {selectedClient?.client_name}
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-6">
              {/* Client Information */}
              <Card className="bg-white dark:bg-slate-800 border-border/50 shadow-md">
                <CardHeader className="border-b border-border/50">
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Client Name</p>
                      <p className="text-base text-gray-900 dark:text-white">{selectedClient.client_name}</p>
                    </div>
                    {selectedClient.client_email && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Email</p>
                        <p className="text-base text-gray-900 dark:text-white">{selectedClient.client_email}</p>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedClient.client_phone && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Phone</p>
                        <p className="text-base text-gray-900 dark:text-white">{selectedClient.client_phone}</p>
                      </div>
                    )}
                    {selectedClient.client_address && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Address</p>
                        <p className="text-base text-gray-900 dark:text-white">{selectedClient.client_address}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Financial Summary */}
              <Card className="bg-white dark:bg-slate-800 border-border/50 shadow-md">
                <CardHeader className="border-b border-border/50">
                  <CardTitle>Financial Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Total Projects</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedClient.proposals.length}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Total Value</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        ₱{getTotalProjectValue(selectedClient).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Average Project Value</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        ₱{getAverageProjectValue(selectedClient).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Projects List */}
              <Card className="bg-white dark:bg-slate-800 border-border/50 shadow-md">
                <CardHeader className="border-b border-border/50">
                  <CardTitle>All Projects ({selectedClient.proposals.length})</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {selectedClient.proposals.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                      No projects found for this client
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Proposal #</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Title</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {selectedClient.proposals.map((proposal) => (
                            <tr key={proposal.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                                {proposal.proposal_number}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                {proposal.title}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(proposal.proposal_date)}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <Badge className={getStatusColor(proposal.status)}>
                                  {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                ₱{proposal.total_amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

export default function ClientDirectoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ClientDirectoryContent />
    </Suspense>
  );
}

