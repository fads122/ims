"use client";

import { Truck, Package, Archive, Wrench, Trophy } from "lucide-react";
import Link from "next/link";

export default function MetricsGrid() {
  const metrics = [
    {
      title: "Total Suppliers",
      value: "9",
      icon: Truck,
      iconColor: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-50 dark:bg-blue-900/20",
      linkText: "View All",
      href: "/dashboard/suppliers",
    },
    {
      title: "Total Products",
      value: "48",
      icon: Package,
      iconColor: "text-green-600 dark:text-green-400",
      iconBg: "bg-green-50 dark:bg-green-900/20",
      linkText: "View All",
      href: "/dashboard/product-list",
    },
    {
      title: "Borrowed",
      value: "0",
      icon: Archive,
      iconColor: "text-orange-600 dark:text-orange-400",
      iconBg: "bg-orange-50 dark:bg-orange-900/20",
      linkText: "View All",
      href: "/dashboard/borrowed",
    },
    {
      title: "Used in Projects",
      value: "25",
      icon: Wrench,
      iconColor: "text-purple-600 dark:text-purple-400",
      iconBg: "bg-purple-50 dark:bg-purple-900/20",
      linkText: "View All",
      href: "/dashboard/projects",
    },
    {
      title: "Top Ranked Supplier",
      value: "Supplier3",
      icon: Trophy,
      iconColor: "text-yellow-600 dark:text-yellow-400",
      iconBg: "bg-yellow-50 dark:bg-yellow-900/20",
      linkText: "View Ranking",
      href: "/dashboard/suppliers/ranking",
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
            className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 ${metric.iconBg} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${metric.iconColor}`} />
              </div>
            </div>
            <div className="mb-3">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">{metric.value}</p>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{metric.title}</p>
            </div>
            <div className="text-xs font-medium text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">
              {metric.linkText} →
            </div>
          </Link>
        );
      })}
    </div>
  );
}

