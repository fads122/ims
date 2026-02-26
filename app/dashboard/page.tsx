"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Package, Truck, FileText, ArrowUpRight } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import TopHeader from "@/components/top-header";
import Breadcrumbs from "@/components/breadcrumbs";
import MetricsGrid from "@/components/metrics-grid";
import CostHistoryDashboard from "@/components/cost-history-dashboard";
import RecentActivities from "@/components/recent-activities";

interface User {
  id: string;
  email: string;
  createdAt: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
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
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

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
          <div className="flex-1 overflow-auto bg-transparent">
            <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
              {/* Breadcrumbs */}
              <Breadcrumbs />
              {/* Header Section */}
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/50 backdrop-blur-md p-6">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-transparent blur-3xl"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-gradient-to-tr from-emerald-500/10 via-sky-500/10 to-transparent blur-3xl"
                />

                <div className="flex items-start justify-between gap-4 relative">
                  <div>
                    <div className="inline-flex items-center rounded-full border border-gray-200/70 dark:border-gray-700 bg-gray-50/90 dark:bg-gray-800/80 px-3 py-1 text-[11px] font-medium tracking-wider text-gray-600 dark:text-gray-300 uppercase">
                      Inventory Overview
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white tracking-tight mt-4">
                      Dashboard
                    </h1>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 max-w-3xl">
                      A focused snapshot of your suppliers, stock, and recent activity across projects.
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                      Signed in as <span className="font-medium text-gray-700 dark:text-gray-200">{user.email}</span>
                    </p>
                  </div>

                  <div className="hidden sm:flex flex-col items-end gap-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Today</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{todayLabel}</div>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 relative">
                  <Button
                    variant="outline"
                    className="h-11 justify-between bg-white/70 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-900/40"
                    onClick={() => router.push("/dashboard/product-list")}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Manage products
                    </span>
                    <ArrowUpRight className="h-4 w-4 opacity-60" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 justify-between bg-white/70 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-900/40"
                    onClick={() => router.push("/dashboard/supplier-list")}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      View suppliers
                    </span>
                    <ArrowUpRight className="h-4 w-4 opacity-60" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 justify-between bg-white/70 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-900/40"
                    onClick={() => router.push("/dashboard/project-proposals")}
                  >
                    <span className="inline-flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Project proposals
                    </span>
                    <ArrowUpRight className="h-4 w-4 opacity-60" />
                  </Button>
                </div>
              </div>

              {/* Key metrics */}
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
                    Key metrics
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Track suppliers, inventory, and project utilization at a glance.
                  </p>
                </div>
              </div>
              <MetricsGrid />

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
                    Analytics
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Cost trends and pricing history over time.
                  </p>
                </div>
                <CostHistoryDashboard />

                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
                    Activity feed
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Latest actions across products, proposals, and records.
                  </p>
                </div>
                <RecentActivities limit={15} />
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
