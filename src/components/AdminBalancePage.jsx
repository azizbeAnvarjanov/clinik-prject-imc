"use client";

import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import {
  Banknote,
  Wallet,
  TrendingDown,
  PiggyBank,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";

export default function AdminBalancePage() {
  const [expected, setExpected] = useState(0);
  const [received, setReceived] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState("day");
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [selectedMonth, setSelectedMonth] = useState(
    () => new Date().getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState(() =>
    new Date().getFullYear()
  );

  const supabase = createClient();

  const fetchData = async () => {
    setLoading(true);

    let fromDate, toDate;
    const now = new Date();

    if (period === "day") {
      fromDate = new Date(selectedDate);
      toDate = new Date(selectedDate);
      toDate.setDate(toDate.getDate() + 1);
    } else if (period === "month") {
      fromDate = new Date(selectedYear, selectedMonth - 1, 1);
      toDate = new Date(selectedYear, selectedMonth, 1);
    } else if (period === "year") {
      fromDate = new Date(selectedYear, 0, 1);
      toDate = new Date(selectedYear + 1, 0, 1);
    }

    const fromString = fromDate.toISOString().split("T")[0];
    const toString = toDate.toISOString().split("T")[0];

    const { data: registrations, error: regError } = await supabase
      .from("registrations")
      .select("total_amount, paid, created_at")
      .gte("created_at", fromString)
      .lt("created_at", toString);

    if (regError) {
      setLoading(false);
      console.error("Registrations error:", regError);
      return;
    }

    let totalExpected = 0;
    let totalReceived = 0;
    registrations.forEach((item) => {
      totalExpected += parseInt(item.total_amount || 0);
      totalReceived += parseInt(item.paid || 0);
    });
    setExpected(totalExpected);
    setReceived(totalReceived);

    const { data: expensesData, error: expError } = await supabase
      .from("xarajatlar")
      .select("sum, created_at")
      .gte("created_at", fromString)
      .lt("created_at", toString);

    if (expError) {
      console.error("Xarajatlar error:", expError);
      return;
    }

    let totalExpenses = 0;
    expensesData.forEach((item) => {
      totalExpenses += parseInt(item.sum || 0);
    });
    setExpenses(totalExpenses);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [period, selectedDate, selectedMonth, selectedYear]);

  const balance = received - expenses;

  const cards = [
    {
      title: "Kutilayotgan summa",
      value: expected.toLocaleString("uz-UZ") + " so'm",
      icon: <Banknote className="text-green-600 w-10 h-10" />,
    },
    {
      title: "Qabul qilingan summa",
      value: received.toLocaleString("uz-UZ") + " so'm",
      icon: <Wallet className="text-blue-600 w-10 h-10" />,
    },
    {
      title: "Xarajatlar",
      value: expenses.toLocaleString("uz-UZ") + " so'm",
      icon: <TrendingDown className="text-red-600 w-10 h-10" />,
    },
    {
      title: "Kassa qoldiq",
      value: balance.toLocaleString("uz-UZ") + " so'm",
      icon: <PiggyBank className="text-yellow-600 w-10 h-10" />,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Balans hisoboti</h1>
        <Button onClick={fetchData}>
          Yangilash <RefreshCw className="ml-2 w-4 h-4" />
        </Button>
      </div>
      <div className="flex items-center gap-4">
        {/* Period Select */}
        <Select onValueChange={setPeriod} value={period}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Davrni tanlang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Kunlik</SelectItem>
            <SelectItem value="month">Oylik</SelectItem>
            <SelectItem value="year">Yillik</SelectItem>
          </SelectContent>
        </Select>

        {/* Day Picker */}
        {period === "day" && (
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white dark:bg-[#171717] w-fit"
          />
        )}

        {/* Month Select */}
        {period === "month" && (
          <Select
            value={selectedMonth.toString()}
            onValueChange={(value) => setSelectedMonth(parseInt(value))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Oy" />
            </SelectTrigger>
            <SelectContent>
              {[...Array(12)].map((_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {i + 1}-oy
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Year Select */}
        {(period === "month" || period === "year") && (
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Yil" />
            </SelectTrigger>
            <SelectContent>
              {[...Array(5)].map((_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
          <Skeleton className="h-24 border rounded-xl w-full" />
          <Skeleton className="h-24 border rounded-xl w-full" />
          <Skeleton className="h-24 border rounded-xl w-full" />
          <Skeleton className="h-24 border rounded-xl w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
          {cards.map((card, idx) => (
            <Card key={idx} className="shadow-md rounded-2xl">
              <CardContent className="flex items-center gap-4">
                <div>{card.icon}</div>
                <div>
                  <div className="text-sm text-gray-500">{card.title}</div>
                  <div className="text-xl font-bold">{card.value}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
