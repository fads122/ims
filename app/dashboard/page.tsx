"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import TopHeader from "@/components/top-header";
import MetricsGrid from "@/components/metrics-grid";
import InventoryTable from "@/components/inventory-table";
import { AnimatedBackground } from "@/core/components/AnimatedBackground";

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
        <AnimatedBackground />
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
        <AnimatedBackground />
        <AppSidebar />
        <SidebarInset className="flex flex-col bg-transparent">
          <TopHeader userEmail={user.email} />
          <div className="flex-1 overflow-auto">
            <div className="p-6 lg:p-8 space-y-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Inventory Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage and monitor your inventory in real-time
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
