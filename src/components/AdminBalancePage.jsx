"use client";

import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import {
  Banknote,
  Wallet,
  TrendingDown,
  PiggyBank,
  RefreshCw,
  Tickets,
  CreditCard,
  OctagonAlert,
  Building2,
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
import BackBTN from "./BackBTN";

export default function AdminBalancePage() {
  const [cash, setCash] = useState(0);
  const [card, setCard] = useState(0);
  const [expected, setExpected] = useState(0);
  const [received, setReceived] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState("day");
  const [expectedCount, setExpectedCount] = useState(0);
  const [receivedCount, setReceivedCount] = useState(0);
  const [expensesCont, setExpensesCont] = useState(0);
  const [refundCount, setRefundCount] = useState(0);
  const [refundAmount, setRefundAmount] = useState(0);

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
  const refundSumm = expected - received;

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
      .select("total_amount, paid, created_at, cash, card, status")
      .gte("created_at", fromString)
      .lt("created_at", toString);

    if (regError) {
      setLoading(false);
      console.error("Registrations error:", regError);
      return;
    }

    let totalExpected = 0;
    let totalReceived = 0;
    let totalCash = 0;
    let totalCard = 0;
    let totalExpectedCount = 0;
    let totalReceivedCount = 0;
    let refundCount = 0;
    let refundAmount = 0;

    registrations.forEach((item) => {
      const amount = parseInt(item.total_amount || 0);
      const paid = parseInt(item.paid || 0);
      const cash = parseInt(item.cash || 0);
      const card = parseInt(item.card || 0);
      const status = item.status || "";

      totalExpected += amount;
      totalCash += cash;
      totalCard += card;

      totalExpectedCount += 1;
      if (paid > 0) {
        totalReceived += paid;
        totalReceivedCount += 1;
      }
      if (status.toLowerCase() === "refund") {
        refundCount += 1;
        refundAmount += amount; // yoki amount, agar refund miqdori `paid` emas, balki `total_amount` bo‘lsa
      }
    });

    setExpected(totalExpected);
    setReceived(totalReceived);
    setCash(totalCash);
    setCard(totalCard);
    setExpectedCount(totalExpectedCount);
    setReceivedCount(totalReceivedCount);
    setRefundCount(refundCount);
    setRefundAmount(refundAmount);

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
    setExpensesCont(expensesData.length);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [period, selectedDate, selectedMonth, selectedYear]);

  const balance = received - expenses;
  const foyda = expected - expenses;

  const cards = [
    {
      title: "Kutilayotgan summa",
      count: expectedCount,
      value: expected.toLocaleString("uz-UZ") + " so'm",
      icon: <Banknote className="text-green-600 w-10 h-10" />,
      icon2: <Banknote className="text-green-600 w-20 h-20" />,
    },
    {
      title: "Tushum farqi",
      count: expectedCount - receivedCount,
      value: refundSumm.toLocaleString("uz-UZ") + " so'm",
      icon: <OctagonAlert className="text-yellow-600 w-10 h-10" />,
      icon2: <OctagonAlert className="text-yellow-600 w-20 h-20" />,
    },
    {
      title: "Qabul qilingan summa",
      count: receivedCount,
      value: received.toLocaleString("uz-UZ") + " so'm",
      icon: <Wallet className="text-blue-600 w-10 h-10" />,
      icon2: <Wallet className="text-blue-600 w-20 h-20" />,
    },
    {
      title: "Kassadagi pul",
      count: 0,
      value: balance.toLocaleString("uz-UZ") + " so'm",
      icon: <PiggyBank className="text-yellow-600 w-10 h-10" />,
      icon2: <PiggyBank className="text-yellow-600 w-20 h-20" />,
    },
    {
      title: "Xarajatlar",
      count: expensesCont,
      value: expenses.toLocaleString("uz-UZ") + " so'm",
      icon: <TrendingDown className="text-red-600 w-10 h-10" />,
      icon2: <TrendingDown className="text-red-600 w-20 h-20" />,
    },
    {
      title: "Naxt",
      count: 0,
      value: cash.toLocaleString("uz-UZ") + " so'm",
      icon: <Tickets className="text-yellow-600 w-10 h-10" />,
      icon2: <Tickets className="text-yellow-600 w-20 h-20" />,
    },
    {
      title: "Plastik",
      count: 0,
      value: card.toLocaleString("uz-UZ") + " so'm",
      icon: <CreditCard className="text-blue-600 w-10 h-10" />,
      icon2: <CreditCard className="text-blue-600 w-20 h-20" />,
    },
    {
      title: "Soff foyda",
      count: 0,
      value: foyda.toLocaleString("uz-UZ") + " so'm",
      icon: <Building2 className="text-blue-600 w-10 h-10" />,
      icon2: <Building2 className="text-blue-600 w-20 h-20" />,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BackBTN />
          <h1 className="text-2xl font-bold">Balans hisoboti</h1>
        </div>
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
          <Skeleton className="h-28 border rounded-xl w-full" />
          <Skeleton className="h-28 border rounded-xl w-full" />
          <Skeleton className="h-28 border rounded-xl w-full" />
          <Skeleton className="h-28 border rounded-xl w-full" />
          <Skeleton className="h-28 border rounded-xl w-full" />
          <Skeleton className="h-28 border rounded-xl w-full" />
          <Skeleton className="h-28 border rounded-xl w-full" />
          <Skeleton className="h-28 border rounded-xl w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
          {cards.map((card, idx) => (
            <Card
              key={idx}
              className="shadow-md rounded-2xl relative overflow-hidden"
            >
              <CardContent className="flex items-center gap-4">
                <div className="absolute right-0 bottom-0 -rotate-30 blur-2xl">
                  {card.icon2}
                </div>
                <div className="">{card.icon}</div>
                <div>
                  <div className="text-sm text-gray-500">{card.title}</div>
                  <div className="text-xl font-bold">{card.value}</div>
                  <div className="text-sm text-gray-500">
                    Soni: {card.count}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
