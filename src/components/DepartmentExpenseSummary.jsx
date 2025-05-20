"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";
import { AlignHorizontalDistributeCenter } from "lucide-react";

export default function DepartmentExpenseSummary() {
  const [expenses, setExpenses] = useState([]);
  const [period, setPeriod] = useState("month");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const today = new Date();

  useEffect(() => {
    const fetchExpenses = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("xarajatlar").select("*");
      if (error) {
        console.error("Xatolik:", error);
      } else {
        setExpenses(Array.isArray(data) ? data : []);
      }
      setLoading(false);
    };

    fetchExpenses();
  }, []);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const expDate = new Date(expense.created_at);
      const year = expDate.getFullYear();
      const month = expDate.getMonth();
      const day = expDate.getDate();

      if (period === "year") return year === Number(selectedYear);
      if (period === "month")
        return (
          year === Number(selectedYear) && month === Number(selectedMonth)
        );
      if (period === "day")
        return (
          year === Number(selectedYear) &&
          month === Number(selectedMonth) &&
          day === Number(selectedDay)
        );

      return false;
    });
  }, [expenses, period, selectedYear, selectedMonth, selectedDay]);

  const groupedByDepartment = useMemo(() => {
    const result = {};
    filteredExpenses.forEach((expense) => {
      const dep = expense.department_id || "Noma'lum";
      if (!result[dep]) {
        result[dep] = 0;
      }
      result[dep] += Number(expense.sum) || 0;
    });
    return result;
  }, [filteredExpenses]);

  const years = useMemo(() => {
    const allYears = expenses.map((e) =>
      new Date(e.created_at).getFullYear()
    );
    return Array.from(new Set(allYears)).sort((a, b) => b - a);
  }, [expenses]);

  const months = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
  ];

  const daysInMonth = useMemo(() => {
    return new Date(Number(selectedYear), Number(selectedMonth) + 1, 0).getDate();
  }, [selectedYear, selectedMonth]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <AlignHorizontalDistributeCenter color="red" />
          Xarajatlar (bo‘limlar bo‘yicha)
        </h2>
        <div className="mb-4 flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Davr" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Kunlik</SelectItem>
              <SelectItem value="month">Oylik</SelectItem>
              <SelectItem value="year">Yillik</SelectItem>
            </SelectContent>
          </Select>

          {/* Yil tanlash */}
          {(period === "year" || period === "month" || period === "day") && (
            <Select
              value={String(selectedYear)}
              onValueChange={(val) => setSelectedYear(Number(val))}
            >
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Yil" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Oy tanlash */}
          {(period === "month" || period === "day") && (
            <Select
              value={String(selectedMonth)}
              onValueChange={(val) => setSelectedMonth(Number(val))}
            >
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Oy" />
              </SelectTrigger>
              <SelectContent>
                {months.map((m, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Kun tanlash */}
          {period === "day" && (
            <Select
              value={String(selectedDay)}
              onValueChange={(val) => setSelectedDay(Number(val))}
            >
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Kun" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: daysInMonth }, (_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="">
        {loading ? (
          <p>Yuklanmoqda...</p>
        ) : Object.keys(groupedByDepartment).length === 0 ? (
          <p className="text-muted-foreground">Ushbu davrda xarajatlar yo‘q.</p>
        ) : (
          Object.entries(groupedByDepartment).map(([dep, total]) => (
            <div
              key={dep}
              className="flex justify-between p-2 border-b border-muted hover:bg-muted"
            >
              <span className="font-medium">{dep}</span>
              <span>{total.toLocaleString("uz-UZ")} so‘m</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
