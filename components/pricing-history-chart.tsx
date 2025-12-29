"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartConfig } from "@/components/ui/chart";

interface PricingHistoryItem {
  id: string;
  product_id: string;
  product_type: string;
  supplier_cost?: number;
  srp?: number;
  cost?: number;
  created_at: string;
}

interface PricingHistoryChartProps {
  productId: string;
  productType: string;
}

type ChartDataItem =
  | { date: string; "Supplier Cost": number | null; "SRP": number | null; fullDate: string }
  | { date: string; "Cost": number | null; "SRP": number | null; fullDate: string };

export default function PricingHistoryChart({ productId, productType }: PricingHistoryChartProps) {
  const [history, setHistory] = useState<PricingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(
          `/api/pricing-history?productId=${productId}&productType=${productType}`
        );
        if (!response.ok) throw new Error("Failed to fetch pricing history");

        const result = await response.json();
        setHistory(result.data || []);
      } catch (error) {
        console.error("Error fetching pricing history:", error);
      } finally {
        setLoading(false);
      }
    };

    if (productId && productType) {
      fetchHistory();
    }
  }, [productId, productType]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading pricing history...</div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">No pricing history available</div>
      </div>
    );
  }

  // Format data for chart
  const chartData = history.map((item) => {
    const date = new Date(item.created_at);
    const formattedDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });

    if (productType === "for-sale") {
      return {
        date: formattedDate,
        "Supplier Cost": item.supplier_cost ? Number(item.supplier_cost) : null,
        "SRP": item.srp ? Number(item.srp) : null,
        fullDate: item.created_at,
      };
    } else if (productType === "package") {
      return {
        date: formattedDate,
        "Cost": item.cost ? Number(item.cost) : null,
        "SRP": item.srp ? Number(item.srp) : null,
        fullDate: item.created_at,
      };
    }
    return null;
  }).filter((item): item is ChartDataItem => item !== null) as ChartDataItem[];

  const hasSupplierCost = productType === "for-sale" && chartData.some((d) => "Supplier Cost" in d && d["Supplier Cost"] !== null);
  const hasCost = productType === "package" && chartData.some((d) => "Cost" in d && d["Cost"] !== null);
  const hasSRP = chartData.some((d) => d["SRP"] !== null);

  // Calculate max value for Y-axis domain
  const allValues = chartData.flatMap((d) => {
    const values: (number | null)[] = [];
    if ("Supplier Cost" in d) {
      values.push(d["Supplier Cost"]);
    }
    if ("Cost" in d) {
      values.push(d["Cost"]);
    }
    values.push(d["SRP"]);
    return values.filter((v): v is number => v !== null && v !== undefined);
  });
  const maxValue = Math.max(...allValues, 0);

  // Chart configuration for shadcn
  const chartConfig: ChartConfig = {
    ...(hasSupplierCost && {
      "Supplier Cost": {
        label: "Supplier Cost",
        color: "#3b82f6", // Blue
      },
    }),
    ...(hasCost && {
      "Cost": {
        label: "Cost",
        color: "#10b981", // Green
      },
    }),
    ...(hasSRP && {
      "SRP": {
        label: "SRP",
        color: "#f59e0b", // Orange
      },
    }),
  };

  return (
    <div className="w-full h-80">
      <ChartContainer config={chartConfig} className="h-full">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
            domain={[0, maxValue * 1.1 || 1000]}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent
              formatter={(value) => {
                if (value === null || value === undefined) return "N/A";
                const numValue = Array.isArray(value) ? value[0] : value;
                return `$${Number(numValue).toLocaleString()}`;
              }}
            />}
          />
          <ChartLegend content={<ChartLegendContent />} />
          {hasSupplierCost && (
            <Line
              type="monotone"
              dataKey="Supplier Cost"
              stroke="var(--color-Supplier Cost)"
              strokeWidth={2}
              dot={{ r: 5, fill: "var(--color-Supplier Cost)" }}
              activeDot={{ r: 7 }}
              connectNulls={false}
            />
          )}
          {hasCost && (
            <Line
              type="monotone"
              dataKey="Cost"
              stroke="var(--color-Cost)"
              strokeWidth={2}
              dot={{ r: 5, fill: "var(--color-Cost)" }}
              activeDot={{ r: 7 }}
              connectNulls={false}
            />
          )}
          {hasSRP && (
            <Line
              type="monotone"
              dataKey="SRP"
              stroke="var(--color-SRP)"
              strokeWidth={2}
              dot={{ r: 5, fill: "var(--color-SRP)" }}
              activeDot={{ r: 7 }}
              connectNulls={false}
            />
          )}
        </LineChart>
      </ChartContainer>
    </div>
  );
}

