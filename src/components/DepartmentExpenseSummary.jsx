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
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const today = new Date();

  // Supabase'dan ma'lumotlarni olish
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

  // Sana bo‘yicha filtrlash
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const expDate = new Date(expense.created_at);
      const sameYear = expDate.getFullYear() === today.getFullYear();
      const sameMonth = expDate.getMonth() === today.getMonth();
      const sameDay = expDate.getDate() === today.getDate();

      if (period === "day") return sameYear && sameMonth && sameDay;
      if (period === "month") return sameYear && sameMonth;
      if (period === "year") return sameYear;

      return false;
    });
  }, [expenses, period]);

  // Bo‘lim bo‘yicha guruhlash
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

  return (
    <div className="">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <AlignHorizontalDistributeCenter color="red" />
          Xarajatlar (bo‘limlar bo‘yicha)
        </h2>

        <div className="mb-4">
          <Select value={period} onValueChange={(val) => setPeriod(val)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Davrni tanlang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Kunlik</SelectItem>
              <SelectItem value="month">Oylik</SelectItem>
              <SelectItem value="year">Yillik</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
          <p>Yuklanmoqda...</p>
        ) : Object.keys(groupedByDepartment).length === 0 ? (
          <p className="text-muted-foreground">Ushbu davrda xarajatlar yo‘q.</p>
        ) : (
          Object.entries(groupedByDepartment).map(([dep, total]) => (
            <div
              key={dep}
              className="flex justify-between py-2 border-b border-muted"
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
