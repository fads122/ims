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
          <div
            key={metric.title}
            className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-blue-500/50 dark:hover:border-blue-400/50 hover:shadow-lg transition-all duration-200 flex flex-col"
          >
            <div className={`w-12 h-12 ${metric.iconBg} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
              <Icon className={`w-6 h-6 ${metric.iconColor}`} />
            </div>
            <div className="flex-1 mb-4">
              <p className="text-3xl font-semibold text-gray-900 dark:text-white mb-1.5 leading-tight">{metric.value}</p>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 leading-snug">{metric.title}</p>
            </div>
            <Link
              href={metric.href}
              className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-semibold transition-colors group/link"
            >
              <span>{metric.linkText}</span>
              <span className="group-hover/link:translate-x-0.5 transition-transform duration-200">→</span>
            </Link>
          </div>
        );
      })}
    </div>
  );
}

