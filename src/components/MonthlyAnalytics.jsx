"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const months = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentyabr",
  "Oktyabr",
  "Noyabr",
  "Dekabr",
];

export default function MonthlyChart() {
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const years = Array.from({ length: 5 }, (_, i) =>
    (new Date().getFullYear() - i).toString()
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: registrations, error: regError } = await supabase
        .from("registrations")
        .select("created_at, paid");

      const { data: expenses, error: expError } = await supabase
        .from("xarajatlar")
        .select("created_at, sum");

      if (regError || expError) {
        console.error("Error fetching data:", regError || expError);
        setLoading(false);
        return;
      }

      const monthlyStats = Array.from({ length: 12 }, (_, i) => ({
        month: months[i],
        count: 0,
        revenue: 0,
        expense: 0,
        netProfit: 0,
      }));

      registrations.forEach((r) => {
        const date = new Date(r.created_at);
        const year = date.getFullYear();
        const month = date.getMonth();

        if (year.toString() === selectedYear) {
          monthlyStats[month].count++;
          monthlyStats[month].revenue += Number(r.paid || 0);
        }
      });

      expenses.forEach((e) => {
        const date = new Date(e.created_at);
        const year = date.getFullYear();
        const month = date.getMonth();

        if (year.toString() === selectedYear) {
          monthlyStats[month].expense += Number(e.sum || 0);
        }
      });

      // Soff foyda (net profit) hisoblash
      monthlyStats.forEach((m) => {
        m.netProfit = m.revenue - m.expense;
      });

      setData(monthlyStats);
      setLoading(false);
    };

    fetchData();
  }, [selectedYear]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Yilni tanlang" />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <h2 className="text-2xl font-semibold">Yillik statistika</h2>
      </div>

      {loading ? (
        <Skeleton className="w-full h-64" />
      ) : (
        <ResponsiveContainer width="100%" height={500}>
          <BarChart
            data={data}
            margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
          >
            <XAxis dataKey="month" angle={-30} textAnchor="end" height={60} />

            <YAxis yAxisId="left" />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(value) => value.toLocaleString("uz-UZ")}
            />

            <Tooltip
              formatter={(value, name) =>
                typeof value === "number"
                  ? value.toLocaleString("uz-UZ")
                  : value
              }
            />
            <Legend />

            <Bar
              yAxisId="left"
              dataKey="count"
              fill="#3b82f6"
              name="Bemorlar soni"
              legendType="line"
            />
            <Bar
              legendType="line"
              yAxisId="right"
              dataKey="revenue"
              fill="#f59e0b"
              name="Tushum (so'm)"
            />
            <Bar
              legendType="line"
              yAxisId="right"
              dataKey="expense"
              fill="#dc2626"
              name="Xarajat (so'm)"
            />
            <Bar
              legendType="line"
              yAxisId="right"
              dataKey="netProfit"
              fill="#16a34a" // sariq rang
              name="Soff foyda (so'm)"
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
