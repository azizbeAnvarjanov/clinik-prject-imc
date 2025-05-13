"use client";

import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import {
  Banknote,
  Wallet,
  TrendingDown,
  PiggyBank,
  RefreshCw,
  CreditCard,
  Tickets,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

export default function BalancePage() {
  const [cash, setCash] = useState(0);
  const [card, setCard] = useState(0);
  const [expected, setExpected] = useState(0);
  const [received, setReceived] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [loading, setLoading] = useState(0);
  const supabase = createClient();

  const fetchData = async () => {
    setLoading(true);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Ertangi sana

    const todayString = today.toISOString().split("T")[0]; // Bugungi sana
    const tomorrowString = tomorrow.toISOString().split("T")[0]; // Ertangi sana

    // Registrations - total_amount va paid faqat bugungi kundan
    const { data: registrations, error: regError } = await supabase
      .from("registrations")
      .select("total_amount, paid, created_at, cash, card")
      .gte("created_at", todayString) // Bugungi sana
      .lt("created_at", tomorrowString); // Ertangi sanadan oldingi sana

    if (regError) {
      setLoading(false);
      console.error("Registrations error:", regError);
      return;
    }

    let totalExpected = 0;
    let totalReceived = 0;
    let totalCash = 0;
    let totalCard = 0;

    registrations.forEach((item) => {
      totalExpected += parseInt(item.total_amount || 0);
      totalReceived += parseInt(item.paid || 0);
      totalCash += parseInt(item.cash || 0);
      totalCard += parseInt(item.card || 0);
    });

    setExpected(totalExpected);
    setReceived(totalReceived);
    setCash(totalCash);
    setCard(totalCard);

    

    // Xarajatlar faqat bugungi kundan
    const { data: expensesData, error: expError } = await supabase
      .from("xarajatlar")
      .select("sum, created_at")
      .gte("created_at", todayString) // Bugungi sana
      .lt("created_at", tomorrowString); // Ertangi sanadan oldingi sana

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
  }, []);

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
    {
      title: "Naxt",
      value: cash.toLocaleString("uz-UZ") + " so'm",
      icon: <Tickets className="text-yellow-600 w-10 h-10" />,
    },
    {
      title: "Plastik",
      value: card.toLocaleString("uz-UZ") + " so'm",
      icon: <CreditCard className="text-blue-600 w-10 h-10" />,
    },
  ];

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-3 justify-between">
          <Skeleton className="h-4 border w-[300px]" />
          <Skeleton className="h-10 w-20 border" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
          <Skeleton className="h-24 border rounded-xl w-full" />
          <Skeleton className="h-24 border rounded-xl w-full" />
          <Skeleton className="h-24 border rounded-xl w-full" />
          <Skeleton className="h-24 border rounded-xl w-full" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 justify-between">
        <h1 className="text-2xl font-bold">Bugungi balans</h1>
        <Button onClick={fetchData}>
          Yangilash <RefreshCw />
        </Button>
      </div>
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
    </div>
  );
}
