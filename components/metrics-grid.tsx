"use client";

import { useState, useEffect } from "react";
import { Truck, Package, Archive, Wrench, Trophy } from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  total_suppliers: number;
  total_products: number;
  borrowed: number;
  used_in_projects: number;
  top_supplier: string;
}

export default function MetricsGrid() {
  const [stats, setStats] = useState<DashboardStats>({
    total_suppliers: 0,
    total_products: 0,
    borrowed: 0,
    used_in_projects: 0,
    top_supplier: "N/A",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats");
      if (response.ok) {
        const result = await response.json();
        setStats(result.data || {
          total_suppliers: 0,
          total_products: 0,
          borrowed: 0,
          used_in_projects: 0,
          top_supplier: "N/A",
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const metrics = [
    {
      title: "Total Suppliers",
      value: loading ? "..." : stats.total_suppliers.toString(),
      icon: Truck,
      iconColor: "text-gray-600 dark:text-gray-400",
      iconBg: "bg-gray-50 dark:bg-gray-800/50",
      linkText: "View All",
      href: "/dashboard/supplier-list",
    },
    {
      title: "Total Products",
      value: loading ? "..." : stats.total_products.toString(),
      icon: Package,
      iconColor: "text-gray-600 dark:text-gray-400",
      iconBg: "bg-gray-50 dark:bg-gray-800/50",
      linkText: "View All",
      href: "/dashboard/product-list",
    },
    {
      title: "Borrowed",
      value: loading ? "..." : stats.borrowed.toString(),
      icon: Archive,
      iconColor: "text-gray-600 dark:text-gray-400",
      iconBg: "bg-gray-50 dark:bg-gray-800/50",
      linkText: "View All",
      href: "/dashboard/item",
    },
    {
      title: "Used in Projects",
      value: loading ? "..." : stats.used_in_projects.toString(),
      icon: Wrench,
      iconColor: "text-gray-600 dark:text-gray-400",
      iconBg: "bg-gray-50 dark:bg-gray-800/50",
      linkText: "View All",
      href: "/dashboard/project-proposals",
    },
    {
      title: "Top Ranked Supplier",
      value: loading ? "..." : stats.top_supplier,
      icon: Trophy,
      iconColor: "text-gray-600 dark:text-gray-400",
      iconBg: "bg-gray-50 dark:bg-gray-800/50",
      linkText: "View Ranking",
      href: "/dashboard/supplier-list",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Link
            key={metric.title}
            href={metric.href}
            className="group relative bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 rounded-lg p-5 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all duration-200"
          >
            <div className="flex flex-col h-full">
              {/* Icon - More subtle */}
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 ${metric.iconBg} rounded-lg flex items-center justify-center border border-gray-200/50 dark:border-gray-700/50`}>
                  <Icon className={`w-5 h-5 ${metric.iconColor}`} strokeWidth={1.5} />
                </div>
              </div>
              
              {/* Value */}
              <div className="mb-1.5">
                <p className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
                  {metric.value}
                </p>
              </div>
              
              {/* Title */}
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-3.5 uppercase tracking-wide">
                {metric.title}
              </p>
              
              {/* Link - More subtle */}
              <div className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors mt-auto pt-3 border-t border-gray-100 dark:border-gray-700/50">
                <span>{metric.linkText}</span>
                <span className="ml-1.5 group-hover:translate-x-0.5 transition-transform duration-200 inline-block">→</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

