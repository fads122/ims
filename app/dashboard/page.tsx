"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import TopHeader from "@/components/top-header";
import MetricsGrid from "@/components/metrics-grid";
import InventoryTable from "@/components/inventory-table";

interface User {
  id: string;
  email: string;
  createdAt: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-900 transition-colors relative">
        <AppSidebar />
        <SidebarInset className="flex flex-col bg-transparent">
          <TopHeader userEmail={user.email} />
          <div className="flex-1 overflow-auto bg-gray-50/50 dark:bg-gray-950">
            <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
              {/* Header Section */}
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
                  Dashboard
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Overview of your inventory management system
                </p>
              </div>

              <MetricsGrid />

              <InventoryTable />
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
