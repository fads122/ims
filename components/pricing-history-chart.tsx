"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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
  }).filter(Boolean);

  const hasSupplierCost = productType === "for-sale" && chartData.some((d: any) => d["Supplier Cost"] !== null);
  const hasCost = productType === "package" && chartData.some((d: any) => d["Cost"] !== null);
  const hasSRP = chartData.some((d: any) => d["SRP"] !== null);

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
            formatter={(value: any) => value !== null ? `$${Number(value).toFixed(2)}` : "N/A"}
          />
          <Legend />
          {hasSupplierCost && (
            <Line
              type="monotone"
              dataKey="Supplier Cost"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}
          {hasCost && (
            <Line
              type="monotone"
              dataKey="Cost"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}
          {hasSRP && (
            <Line
              type="monotone"
              dataKey="SRP"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

