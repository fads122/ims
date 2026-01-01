"use client";

import { useState, useEffect, useMemo } from "react";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp } from "lucide-react";

interface EquipmentOption {
  id: string;
  name: string;
  type: "for-sale" | "package";
  supplierCost?: number;
  cost?: number;
  srp?: number;
}

export default function CostHistoryDashboard() {
  const [equipment, setEquipment] = useState<EquipmentOption[]>([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("summary");
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentOption | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };

    checkDarkMode();

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Fetch all equipment with pricing (for-sale and package)
  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/products");
        if (!response.ok) throw new Error("Failed to fetch products");

        const result = await response.json();
        const equipmentList: EquipmentOption[] = [];

        // Add for-sale products
        if (result.data.forSale) {
          result.data.forSale.forEach((item: any) => {
            equipmentList.push({
              id: item.id,
              name: `${item.product_brand || ""} ${item.product_model || ""}`.trim() || "Unknown Product",
              type: "for-sale",
              supplierCost: item.supplier_cost ? Number(item.supplier_cost) : undefined,
              srp: item.srp ? Number(item.srp) : undefined,
            });
          });
        }

        // Add package products
        if (result.data.packages) {
          result.data.packages.forEach((item: any) => {
            equipmentList.push({
              id: item.id,
              name: item.package_name || "Unknown Package",
              type: "package",
              cost: item.cost ? Number(item.cost) : undefined,
              srp: item.srp ? Number(item.srp) : undefined,
            });
          });
        }

        setEquipment(equipmentList);
      } catch (error) {
        console.error("Error fetching equipment:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEquipment();
  }, []);

  // Fetch pricing history - aggregate when "summary" is selected, or specific equipment when selected
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setChartLoading(true);
        let response;
        
        if (selectedEquipmentId === "summary") {
          // Fetch aggregate data
          response = await fetch("/api/pricing-history?aggregate=true");
        } else {
          // Fetch specific equipment data
          if (!selectedEquipment) {
            setHistory([]);
            return;
          }
          response = await fetch(
            `/api/pricing-history?productId=${selectedEquipment.id}&productType=${selectedEquipment.type}`
          );
        }

        if (!response.ok) throw new Error("Failed to fetch pricing history");

        const result = await response.json();
        setHistory(result.data || []);
      } catch (error) {
        console.error("Error fetching pricing history:", error);
        setHistory([]);
      } finally {
        setChartLoading(false);
      }
    };

    fetchHistory();
  }, [selectedEquipment, selectedEquipmentId]);

  // Handle equipment selection
  const handleEquipmentChange = (equipmentId: string) => {
    setSelectedEquipmentId(equipmentId);
    if (equipmentId === "summary") {
      setSelectedEquipment(null);
    } else {
      const eq = equipment.find((e) => e.id === equipmentId);
      setSelectedEquipment(eq || null);
    }
  };

  // Calculate price changes and trends
  const priceTrends = useMemo(() => {
    if (!selectedEquipment || history.length === 0) {
      return {
        supplierCostChange: null,
        costChange: null,
        srpChange: null,
        supplierCostPercent: null,
        costPercent: null,
        srpPercent: null,
      };
    }

    const firstEntry = history[0];
    const lastEntry = history[history.length - 1];

    if (selectedEquipment.type === "for-sale") {
      const supplierCostChange = selectedEquipment.supplierCost
        ? (selectedEquipment.supplierCost - (firstEntry.supplier_cost || 0))
        : null;
      const supplierCostPercent = firstEntry.supplier_cost && selectedEquipment.supplierCost
        ? ((supplierCostChange! / firstEntry.supplier_cost) * 100)
        : null;

      const srpChange = selectedEquipment.srp
        ? (selectedEquipment.srp - (firstEntry.srp || 0))
        : null;
      const srpPercent = firstEntry.srp && selectedEquipment.srp
        ? ((srpChange! / firstEntry.srp) * 100)
        : null;

      return {
        supplierCostChange,
        costChange: null,
        srpChange,
        supplierCostPercent,
        costPercent: null,
        srpPercent,
      };
    } else {
      const costChange = selectedEquipment.cost
        ? (selectedEquipment.cost - (firstEntry.cost || 0))
        : null;
      const costPercent = firstEntry.cost && selectedEquipment.cost
        ? ((costChange! / firstEntry.cost) * 100)
        : null;

      const srpChange = selectedEquipment.srp
        ? (selectedEquipment.srp - (firstEntry.srp || 0))
        : null;
      const srpPercent = firstEntry.srp && selectedEquipment.srp
        ? ((srpChange! / firstEntry.srp) * 100)
        : null;

      return {
        supplierCostChange: null,
        costChange,
        srpChange,
        supplierCostPercent: null,
        costPercent,
        srpPercent,
      };
    }
  }, [history, selectedEquipment]);

  // Format data for chart
  const chartData = useMemo(() => {
    if (history.length === 0) return [];

    // Format all history data points chronologically
    const data = history.map((item) => {
      const date = new Date(item.created_at || item.date);
      const formattedDate = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
      });

      if (selectedEquipmentId === "summary") {
        // Aggregate mode: show both supplier cost and cost (from packages) as "Total Cost"
        const totalCost = (item.supplier_cost || 0) + (item.cost || 0);
        return {
          date: formattedDate,
          "Total Cost": totalCost > 0 ? totalCost : null,
          "SRP": item.srp ? Number(item.srp) : null,
          fullDate: item.created_at || item.date,
        };
      } else {
        // Equipment-specific mode
        if (selectedEquipment?.type === "for-sale") {
          return {
            date: formattedDate,
            "Supplier Cost": item.supplier_cost ? Number(item.supplier_cost) : null,
            "SRP": item.srp ? Number(item.srp) : null,
            fullDate: item.created_at,
          };
        } else {
          return {
            date: formattedDate,
            "Cost": item.cost ? Number(item.cost) : null,
            "SRP": item.srp ? Number(item.srp) : null,
            fullDate: item.created_at,
          };
        }
      }
    });

    // Ensure data is sorted by date (chronological order, left to right)
    data.sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

    return data;
  }, [history, selectedEquipment, selectedEquipmentId]);

  const maxValue = useMemo(() => {
    if (chartData.length === 0) return 1000;
    return Math.max(
      ...chartData.flatMap(d => [
        selectedEquipmentId === "summary" ? d["Total Cost"] || 0 : (selectedEquipment?.type === "for-sale" ? d["Supplier Cost"] || 0 : d["Cost"] || 0),
        d["SRP"] || 0
      ])
    );
  }, [chartData, selectedEquipment, selectedEquipmentId]);

  const hasSupplierCost = selectedEquipmentId !== "summary" && selectedEquipment?.type === "for-sale" && chartData.some((d: any) => d["Supplier Cost"] !== null);
  const hasCost = selectedEquipmentId !== "summary" && selectedEquipment?.type === "package" && chartData.some((d: any) => d["Cost"] !== null);
  const hasTotalCost = selectedEquipmentId === "summary" && chartData.some((d: any) => d["Total Cost"] !== null);
  const hasSRP = chartData.some((d: any) => d["SRP"] !== null);

  // Chart configuration with dark mode support
  const chartConfig: ChartConfig = {
    ...(hasTotalCost && {
      "Total Cost": {
        label: "Total Cost",
        color: isDarkMode ? "#60a5fa" : "#386FA4",
      },
    }),
    ...(hasSupplierCost && {
      "Supplier Cost": {
        label: "Supplier Cost",
        color: isDarkMode ? "#60a5fa" : "#386FA4",
      },
    }),
    ...(hasCost && {
      "Cost": {
        label: "Cost",
        color: isDarkMode ? "#34d399" : "#10b981",
      },
    }),
    ...(hasSRP && {
      "SRP": {
        label: "SRP",
        color: isDarkMode ? "#fbbf24" : "#FCCA46",
      },
    }),
  };

  // Calculate aggregate stats for summary mode
  const aggregateStats = useMemo(() => {
    if (selectedEquipmentId !== "summary" || history.length === 0) {
      return { totalCost: 0, totalSRP: 0, costChange: null, srpChange: null, costPercent: null, srpPercent: null };
    }

    const firstEntry = history[0];
    const lastEntry = history[history.length - 1];
    
    const firstTotalCost = (firstEntry.supplier_cost || 0) + (firstEntry.cost || 0);
    const lastTotalCost = (lastEntry.supplier_cost || 0) + (lastEntry.cost || 0);
    const firstSRP = lastEntry.srp || 0;
    const lastSRP = lastEntry.srp || 0;

    const costChange = lastTotalCost - firstTotalCost;
    const costPercent = firstTotalCost > 0 ? (costChange / firstTotalCost) * 100 : null;
    const srpChange = lastSRP - firstSRP;
    const srpPercent = firstSRP > 0 ? (srpChange / firstSRP) * 100 : null;

      return {
      totalCost: lastTotalCost,
      totalSRP: lastSRP,
      costChange,
      srpChange,
      costPercent,
      srpPercent,
    };
  }, [history, selectedEquipmentId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
        <div className="text-gray-600 dark:text-gray-400">Loading equipment...</div>
      </div>
    );
  }

  const getTrendClassName = (change: number | null) => {
    if (change === null) return "";
    return change >= 0
      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <TrendingUp className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Cost History</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {selectedEquipmentId === "summary" ? "Overall pricing trends" : "Track pricing changes over time"}
              </p>
            </div>
          </div>
          <div className="w-full sm:w-72">
            <Select value={selectedEquipmentId} onValueChange={handleEquipmentChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Summary</SelectItem>
                {equipment.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">No equipment available</div>
                ) : (
                  equipment.map((eq) => (
                    <SelectItem key={eq.id} value={eq.id}>
                      {eq.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {chartLoading ? (
          <div className="flex items-center justify-center h-96 text-gray-500 dark:text-gray-400">
            Loading pricing history...
          </div>
        ) : selectedEquipmentId !== "summary" && !selectedEquipment ? (
          <div className="flex items-center justify-center h-96 text-gray-500 dark:text-gray-400">
            Please select an equipment to view cost history
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Cards */}
            {selectedEquipmentId === "summary" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Total Cost</p>
                    {aggregateStats.costChange !== null && (
                      <span className={`text-xs font-medium px-2 py-1 rounded ${getTrendClassName(aggregateStats.costChange)}`}>
                        {aggregateStats.costChange >= 0 ? "+" : ""}{aggregateStats.costPercent !== null && `${aggregateStats.costPercent.toFixed(1)}%`}
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold" style={{ color: "#386FA4" }}>
                    ${aggregateStats.totalCost.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Total SRP</p>
                    {aggregateStats.srpChange !== null && (
                      <span className={`text-xs font-medium px-2 py-1 rounded ${getTrendClassName(aggregateStats.srpChange)}`}>
                        {aggregateStats.srpChange >= 0 ? "+" : ""}{aggregateStats.srpPercent !== null && `${aggregateStats.srpPercent.toFixed(1)}%`}
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold" style={{ color: "#FCCA46" }}>
                    ${aggregateStats.totalSRP.toLocaleString()}
                  </p>
                </div>
              </div>
            ) : selectedEquipment && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedEquipment.type === "for-sale" ? (
                  <>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Supplier Cost</p>
                        {priceTrends.supplierCostChange !== null && (
                          <span className={`text-xs font-medium px-2 py-1 rounded ${getTrendClassName(priceTrends.supplierCostChange)}`}>
                            {priceTrends.supplierCostChange! >= 0 ? "+" : ""}{priceTrends.supplierCostPercent !== null && `${priceTrends.supplierCostPercent.toFixed(1)}%`}
                          </span>
                        )}
                      </div>
                      <p className="text-2xl font-bold" style={{ color: "#386FA4" }}>
                        ${(selectedEquipment.supplierCost || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">SRP</p>
                        {priceTrends.srpChange !== null && (
                          <span className={`text-xs font-medium px-2 py-1 rounded ${getTrendClassName(priceTrends.srpChange)}`}>
                            {priceTrends.srpChange! >= 0 ? "+" : ""}{priceTrends.srpPercent !== null && `${priceTrends.srpPercent.toFixed(1)}%`}
                          </span>
                        )}
                      </div>
                      <p className="text-2xl font-bold" style={{ color: "#FCCA46" }}>
                        ${(selectedEquipment.srp || 0).toLocaleString()}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Cost</p>
                        {priceTrends.costChange !== null && (
                          <span className={`text-xs font-medium px-2 py-1 rounded ${getTrendClassName(priceTrends.costChange)}`}>
                            {priceTrends.costChange! >= 0 ? "+" : ""}{priceTrends.costPercent !== null && `${priceTrends.costPercent.toFixed(1)}%`}
                          </span>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        ${(selectedEquipment.cost || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">SRP</p>
                        {priceTrends.srpChange !== null && (
                          <span className={`text-xs font-medium px-2 py-1 rounded ${getTrendClassName(priceTrends.srpChange)}`}>
                            {priceTrends.srpChange! >= 0 ? "+" : ""}{priceTrends.srpPercent !== null && `${priceTrends.srpPercent.toFixed(1)}%`}
                          </span>
                        )}
                      </div>
                      <p className="text-2xl font-bold" style={{ color: "#FCCA46" }}>
                        ${(selectedEquipment.srp || 0).toLocaleString()}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Chart */}
            <div className="pt-4">
              <div className="w-full" style={{ height: '500px', minHeight: '500px' }}>
                <ChartContainer config={chartConfig} className="h-full w-full" style={{ height: '100%', width: '100%' }}>
                  <AreaChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                  >
                    <defs>
                      <linearGradient id="colorSupplierCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isDarkMode ? "#60a5fa" : "#386FA4"} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={isDarkMode ? "#60a5fa" : "#386FA4"} stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isDarkMode ? "#34d399" : "#10b981"} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={isDarkMode ? "#34d399" : "#10b981"} stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorSRP" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isDarkMode ? "#fbbf24" : "#FCCA46"} stopOpacity={0.9}/>
                        <stop offset="95%" stopColor={isDarkMode ? "#fbbf24" : "#FCCA46"} stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDarkMode ? "#374151" : "#e5e7eb"}
                      horizontal={true}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fill: isDarkMode ? "#9ca3af" : "#6b7280", fontSize: 12 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                      domain={[0, maxValue * 1.1 || 1000]}
                      tick={{ fill: isDarkMode ? "#9ca3af" : "#6b7280", fontSize: 12 }}
                    />
                    <ChartTooltip
                      cursor={true}
                      content={<ChartTooltipContent
                        formatter={(value: unknown) => {
                          const formattedValue = value !== null && value !== undefined
                            ? `$${Number(value).toLocaleString()}`
                            : "N/A";
                          return formattedValue;
                        }}
                        labelFormatter={(label) => label}
                      />}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    {hasTotalCost && (
                      <Area
                        type="monotone"
                        dataKey="Total Cost"
                        stackId="1"
                        stroke={isDarkMode ? "#60a5fa" : "#386FA4"}
                        strokeWidth={1.5}
                        fill="url(#colorSupplierCost)"
                        fillOpacity={1}
                      />
                    )}
                    {hasSupplierCost && (
                      <Area
                        type="monotone"
                        dataKey="Supplier Cost"
                        stackId="1"
                        stroke={isDarkMode ? "#60a5fa" : "#386FA4"}
                        strokeWidth={1.5}
                        fill="url(#colorSupplierCost)"
                        fillOpacity={1}
                      />
                    )}
                    {hasCost && (
                      <Area
                        type="monotone"
                        dataKey="Cost"
                        stackId="1"
                        stroke={isDarkMode ? "#34d399" : "#10b981"}
                        strokeWidth={1.5}
                        fill="url(#colorCost)"
                        fillOpacity={1}
                      />
                    )}
                    {hasSRP && (
                      <Area
                        type="monotone"
                        dataKey="SRP"
                        stackId="1"
                        stroke={isDarkMode ? "#fbbf24" : "#FCCA46"}
                        strokeWidth={1.5}
                        fill="url(#colorSRP)"
                        fillOpacity={1}
                      />
                    )}
                  </AreaChart>
                </ChartContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
