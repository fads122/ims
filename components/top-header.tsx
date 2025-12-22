"use client";

import { Bell, Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/core/components/theme-toggle";

interface TopHeaderProps {
  userEmail?: string;
}

export default function TopHeader({ userEmail }: TopHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-md px-3 py-2 flex-1 max-w-md">
        <Search className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <input
          type="text"
          placeholder="Search inventory..."
          className="bg-transparent outline-none text-sm w-full text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
        />
      </div>
      <div className="flex items-center gap-4 ml-auto">
        <button className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}

