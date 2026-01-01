"use client";

import { usePathname } from "next/navigation";
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";

// Map pathnames to breadcrumb labels
const pathToLabel: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/product-list": "Product List",
  "/dashboard/supplier-list": "Suppliers",
  "/dashboard/supplier-profile": "Supplier Profile",
  "/dashboard/project-proposals": "Project Proposals",
  "/dashboard/client-directory": "Client Directory",
  "/dashboard/sales-order": "Sales Order",
  "/dashboard/parts-picker": "Parts Picker",
  "/dashboard/item": "Items",
  "/dashboard/item/borrow-form": "Borrow Form",
  "/dashboard/cost-update": "Cost Update",
  "/dashboard/equipment-details": "Equipment Details",
};

// Map child pages to their parent pages
const parentPages: Record<string, { href: string; label: string }> = {
  "/dashboard/equipment-details": { href: "/dashboard/product-list", label: "Product List" },
  "/dashboard/supplier-profile": { href: "/dashboard/supplier-list", label: "Suppliers" },
  "/dashboard/item/borrow-form": { href: "/dashboard/item", label: "Items" },
};

export default function Breadcrumbs() {
  const pathname = usePathname();

  // Don't show breadcrumbs on the main dashboard
  if (pathname === "/dashboard") {
    return null;
  }

  // Build breadcrumb items from pathname
  const items: BreadcrumbItem[] = [];
  
  // Check if current page has a parent page
  const parent = parentPages[pathname];
  if (parent) {
    // Add parent page
    items.push({
      label: parent.label,
      href: parent.href,
    });
  }

  // Get current page label
  const currentLabel = pathToLabel[pathname] || pathname
    .split("/")
    .filter(Boolean)
    .slice(-1)[0]
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Add current page (no href since it's the current page)
  items.push({
    label: currentLabel,
    href: undefined,
  });

  return <Breadcrumb items={items} />;
}

