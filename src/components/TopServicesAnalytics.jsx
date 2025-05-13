"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";
import { Input } from "./ui/input";

const filterOptions = [
  { label: "Kunlik", value: "daily" },
  { label: "Oylik", value: "monthly" },
  { label: "Yillik", value: "yearly" },
];

export default function TopServicesAnalytics() {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState("monthly");
  const [date, setDate] = useState(new Date());
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, [filter, date]);

  async function fetchData() {
    const { data: registrations, error } = await supabase
      .from("registrations_services")
      .select("service_id, created_at, services(name)");

    if (error) {
      console.error(error);
      return;
    }

    const filtered = registrations.filter((item) => {
      const createdAt = new Date(item.created_at);
      const selected = new Date(date);

      if (filter === "daily") {
        return (
          createdAt.getFullYear() === selected.getFullYear() &&
          createdAt.getMonth() === selected.getMonth() &&
          createdAt.getDate() === selected.getDate()
        );
      }

      if (filter === "monthly") {
        return (
          createdAt.getFullYear() === selected.getFullYear() &&
          createdAt.getMonth() === selected.getMonth()
        );
      }

      if (filter === "yearly") {
        return createdAt.getFullYear() === selected.getFullYear();
      }

      return true;
    });

    const serviceCount = {};
    filtered.forEach((item) => {
      const name = item.services?.name || "Noma'lum";
      if (!serviceCount[item.service_id]) {
        serviceCount[item.service_id] = { count: 0, name };
      }
      serviceCount[item.service_id].count += 1;
    });

    const total = filtered.length;
    const result = Object.entries(serviceCount)
      .map(([id, { count, name }]) => ({
        service_id: id,
        name,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.percentage - a.percentage);

    setData(result);
  }

  const handleDateChange = (e) => {
    const value = e.target.value;
    if (filter === "yearly") {
      setDate(new Date(`${value}-01-01`));
    } else {
      setDate(new Date(value));
    }
  };

  return (
    <div className="py-4 space-y-4 max-w-lg">
      <h1 className="text-3xl font-medium">Top xizmatlar</h1>
      <div className="flex items-center gap-4">
        <Select value={filter} onValueChange={(val) => setFilter(val)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {filterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type={
            filter === "daily"
              ? "date"
              : filter === "monthly"
              ? "month"
              : "number"
          }
          value={
            filter === "yearly"
              ? date.getFullYear()
              : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
                  2,
                  "0"
                )}${
                  filter === "daily"
                    ? `-${String(date.getDate()).padStart(2, "0")}`
                    : ""
                }`
          }
          onChange={handleDateChange}
          className="border rounded px-2 py-1 w-fit"
        />
      </div>

      <div className="space-y-3">
        {data.length === 0 && (
          <p className="text-muted-foreground">Ma'lumotlar topilmadi</p>
        )}
        {data.map((item) => (
          <div key={item.service_id}>
            <div className="flex justify-between text-sm mb-1">
              <span>{item.name}</span>
              <span>
                {item.percentage}% ({item.count} ta)
              </span>
            </div>
            <Progress value={item.percentage} />
          </div>
        ))}
      </div>
    </div>
  );
}
