"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { columns, Expense } from "@/components/columns";
import { DataTable } from "@/components/DataTable";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

function getStartAndEndDate(filterType, startDate, endDate) {
  const now = new Date();
  let fromDate = new Date();
  let toDate = new Date();

  switch (filterType) {
    case "today":
      fromDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0
      );
      toDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59
      );
      break;
    case "month":
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;
    case "year":
      fromDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      toDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      break;
    case "custom":
      fromDate = new Date(startDate || now);
      toDate = new Date(endDate || now);
      break;
  }

  return {
    from: fromDate.toISOString(),
    to: toDate.toISOString(),
  };
}

const AxpencesPage = () => {
  const supabase = createClient();
  const [expenses, setExpenses] = useState([]);
  const [filterType, setFilterType] = useState("today");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    const fetchExpenses = async () => {
      const { from, to } = getStartAndEndDate(filterType, startDate, endDate);

      const { data, error } = await supabase
        .from("xarajatlar")
        .select("*")
        .gte("created_at", from)
        .lte("created_at", to);

      if (error) {
        console.error("Xatolik:", error);
      } else {
        const expensesData = data || [];
        setExpenses(expensesData);

        console.log(expensesData);

        // Summani hisoblash:
        const total = expensesData.reduce(
          (sum, item) => sum + (item.sum || 0),
          0
        );
        setTotalAmount(total);
      }
    };

    fetchExpenses();
  }, [filterType, startDate, endDate]);

  // Format sum to "1 234 567 so'm"
  const formatSum = (num) =>
    num.toLocaleString("uz-UZ", { maximumFractionDigits: 0 }) + " so'm";

  return (
    <div className="py-4">
      <div className="flex items-center gap-4 mb-4 justify-between">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtr tanlang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Bugun</SelectItem>
            <SelectItem value="month">Bu oy</SelectItem>
            <SelectItem value="year">Bu yil</SelectItem>
            <SelectItem value="custom">Maxsus</SelectItem>
          </SelectContent>
        </Select>

        {filterType === "custom" && (
          <>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </>
        )}
        <div className="mb-2 text-lg font-semibold ">
          Umumiy summa: {formatSum(totalAmount)}
        </div>
      </div>

      <DataTable columns={columns} data={expenses} />
    </div>
  );
};

export default AxpencesPage;
