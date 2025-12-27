"use client";

import * as React from "react";
import Link from "next/link";
import { Home, List, Truck, FileText, Users, ShoppingCart, Box, Tag, LogOut, ChevronsUpDown } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const menuItems = [
  { id: "home", label: "Home", icon: Home, href: "/dashboard" },
  { id: "product-list", label: "Product List", icon: List, href: "/dashboard/product-list" },
  { id: "suppliers", label: "Suppliers", icon: Truck, href: "/dashboard/supplier-list" },
  { id: "project-proposals", label: "Project Proposals", icon: FileText, href: "/dashboard/project-proposals" },
  { id: "client-directory", label: "Client Directory", icon: Users, href: "/dashboard/client-directory" },
  { id: "sales-order", label: "Sales Order", icon: ShoppingCart, href: "/dashboard/sales-order" },
  { id: "parts-picker", label: "Parts Picker", icon: Box, href: "/dashboard/parts-picker" },
  { id: "item", label: "Item", icon: Tag, href: "/dashboard/item" },
];

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  // Get user from localStorage
  const [user, setUser] = React.useState<{ email: string } | null>(null);

  React.useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
  }, []);

  const userInitials = user?.email ? user.email.charAt(0).toUpperCase() : "U";
  const userName = user?.email?.split("@")[0] || "User";

  return (
    <Sidebar collapsible="icon" className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <span className="font-bold text-sm">Q</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">QSales</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">Inventory</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href === "/dashboard" && pathname === "/dashboard");

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton tooltip={item.label} isActive={isActive} asChild>
                      <Link href={item.href}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src="" alt={userName} />
                    <AvatarFallback className="rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{userName}</span>
                    <span className="truncate text-xs text-sidebar-foreground/70">{user?.email || ""}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src="" alt={userName} />
                      <AvatarFallback className="rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{userName}</span>
                      <span className="truncate text-xs text-sidebar-foreground/70">{user?.email || ""}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

