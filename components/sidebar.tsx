"use client";

import { useState } from "react";
import { Home, List, Truck, FileText, Users, ShoppingCart, Box, Tag, ChevronLeft, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const router = useRouter();
  const [activeItem, setActiveItem] = useState("home");

  const menuItems = [
    { id: "home", label: "Home", icon: Home, href: "/dashboard" },
    { id: "product-list", label: "Product List", icon: List, href: "/dashboard/product-list" },
    { id: "suppliers", label: "Suppliers", icon: Truck, href: "/dashboard/suppliers" },
    { id: "project-proposals", label: "Project Proposals", icon: FileText, href: "/dashboard/project-proposals" },
    { id: "client-directory", label: "Client Directory", icon: Users, href: "/dashboard/client-directory" },
    { id: "sales-order", label: "Sales Order", icon: ShoppingCart, href: "/dashboard/sales-order" },
    { id: "parts-picker", label: "Parts Picker", icon: Box, href: "/dashboard/parts-picker" },
    { id: "item", label: "Item", icon: Tag, href: "/dashboard/item" },
  ];

  const handleItemClick = (id: string, href: string) => {
    setActiveItem(id);
    router.push(href);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <>
      <aside
        className={`${
          open ? "w-64" : "w-20"
        } bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out flex flex-col h-screen fixed left-0 top-0 z-40 shadow-lg`}
      >
        {/* Header */}
        <div className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
          {open && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white truncate">QSales</span>
            </div>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${!open ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id, item.href)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                }`}
                title={open ? "" : item.label}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className={`truncate transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0 w-0"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            title={open ? "" : "Logout"}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className={`truncate transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0 w-0"}`}>
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30 transition-opacity duration-300"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}

