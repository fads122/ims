"use client";

import { useState, useEffect } from "react";
import { Activity, Clock, User, FileText, Box, Users, ShoppingCart, Tag, Download, Filter, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface ActivityLog {
  id: string;
  user_email: string;
  activity_type: string;
  entity_type: string;
  entity_id?: string;
  description: string;
  action_details?: Record<string, unknown>;
  created_at: string;
}

interface RecentActivitiesProps {
  limit?: number;
}

export default function RecentActivities({ limit = 10 }: RecentActivitiesProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    loadActivities();
    // Refresh every 30 seconds
    const interval = setInterval(loadActivities, 30000);
    return () => clearInterval(interval);
  }, [limit, activityTypeFilter, startDate, endDate]);

  const loadActivities = async () => {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        page: "1",
      });

      if (activityTypeFilter && activityTypeFilter !== "all") {
        params.append("activity_type", activityTypeFilter);
      }
      if (startDate) {
        params.append("start_date", startDate);
      }
      if (endDate) {
        params.append("end_date", endDate);
      }

      const response = await fetch(`/api/activity-logs?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // If table doesn't exist, show helpful message
        if (errorData.error?.includes("does not exist") || errorData.error?.includes("relation") || errorData.error?.includes("Activity logs table")) {
          console.warn("Activity logs table not found. Please run create-activity-logs-table.sql in Supabase.");
          setTableMissing(true);
          setActivities([]);
          setLoading(false);
          return;
        }
        throw new Error(errorData.error || "Failed to fetch activities");
      }

      const result = await response.json();
      setActivities(result.data || []);
    } catch (error) {
      console.error("Error loading activities:", error);
      setActivities([]); // Set empty array on error to prevent UI breakage
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const [{ jsPDF }, { autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const doc = new jsPDF() as InstanceType<typeof jsPDF> & { lastAutoTable?: { finalY?: number } };
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let y = margin;

      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Activity Logs Report", pageWidth / 2, y, { align: "center" });
      y += 10;

      // Filter info
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const filterInfo: string[] = [];
      if (activityTypeFilter && activityTypeFilter !== "all") {
        filterInfo.push(`Activity Type: ${activityTypeFilter}`);
      }
      if (startDate) {
        filterInfo.push(`From: ${new Date(startDate).toLocaleDateString()}`);
      }
      if (endDate) {
        filterInfo.push(`To: ${new Date(endDate).toLocaleDateString()}`);
      }
      if (filterInfo.length > 0) {
        doc.text(`Filters: ${filterInfo.join(" | ")}`, margin, y);
        y += 5;
      }
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
      y += 10;

      // Prepare table data
      const tableData = activities.map((activity) => [
        new Date(activity.created_at).toLocaleString(),
        activity.user_email,
        activity.activity_type,
        activity.entity_type,
        activity.description.length > 60 ? activity.description.substring(0, 60) + "..." : activity.description,
      ]);

      // Table
      autoTable(doc, {
        head: [["Date/Time", "User", "Type", "Entity", "Description"]],
        body: tableData,
        startY: y,
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 40 },
          2: { cellWidth: 25 },
          3: { cellWidth: 30 },
          4: { cellWidth: 55 },
        },
      });

      // Footer
      const finalY = doc.lastAutoTable?.finalY || y;
      if (finalY < pageHeight - 20) {
        doc.setFontSize(8);
        doc.text(
          `Total Activities: ${activities.length}`,
          pageWidth / 2,
          finalY + 10,
          { align: "center" }
        );
      }

      doc.save(`Activity-Logs-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to export PDF";
      alert("Failed to export PDF: " + errorMessage);
    }
  };

  const clearFilters = () => {
    setActivityTypeFilter("all");
    setStartDate("");
    setEndDate("");
  };

  const hasActiveFilters = activityTypeFilter !== "all" || startDate || endDate;

  const getActivityIcon = (entityType: string) => {
    if (entityType.includes("equipment") || entityType.includes("product")) {
      return <Box className="w-4 h-4" />;
    }
    if (entityType === "proposal") {
      return <FileText className="w-4 h-4" />;
    }
    if (entityType === "client") {
      return <Users className="w-4 h-4" />;
    }
    if (entityType === "sales-order") {
      return <ShoppingCart className="w-4 h-4" />;
    }
    if (entityType === "item") {
      return <Tag className="w-4 h-4" />;
    }
    return <Activity className="w-4 h-4" />;
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case "create":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "update":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "delete":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "view":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      case "export":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "login":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
      case "logout":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "just now";
    }
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    }
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? "day" : "days"} ago`;
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
  };

  const getUserInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">Loading activities...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activities
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 min-w-[80px]">
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Filters:</span>
          </div>
          <Select value={activityTypeFilter} onValueChange={setActivityTypeFilter}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Activity Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="view">View</SelectItem>
              <SelectItem value="export">Export</SelectItem>
              <SelectItem value="import">Import</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="logout">Logout</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">From:</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-[140px] h-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">To:</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-[140px] h-9"
            />
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 text-xs ml-auto"
            >
              <X className="w-3 h-3 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {tableMissing ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Activity logs table not found
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Please run <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">create-activity-logs-table.sql</code> in your Supabase dashboard
            </p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            No activities found
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {activities.map((activity) => {
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-1">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 text-xs">
                          {getUserInitials(activity.user_email)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getActivityIcon(activity.entity_type)}
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {activity.user_email.split("@")[0]}
                            </span>
                            <Badge className={`${getActivityColor(activity.activity_type)} text-xs`}>
                              {activity.activity_type}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {activity.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(activity.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

