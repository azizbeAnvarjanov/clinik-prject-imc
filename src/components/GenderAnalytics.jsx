"use client";

import { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";
import { Mars, Venus } from "lucide-react";

export default function GenderAnalytics() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("all");

  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDay, setSelectedDay] = useState("");

  const supabase = createClient();

  const now = new Date();
  const currentYear = now.getFullYear();
  const years = Array.from({ length: 5 }, (_, i) =>
    (currentYear - i).toString()
  );
  const months = Array.from({ length: 12 }, (_, i) =>
    (i + 1).toString().padStart(2, "0")
  );
  const days = Array.from({ length: 31 }, (_, i) =>
    (i + 1).toString().padStart(2, "0")
  );

  const getDateFilter = () => {
    if (
      filterType === "daily" &&
      selectedYear &&
      selectedMonth &&
      selectedDay
    ) {
      return new Date(
        Number(selectedYear),
        Number(selectedMonth) - 1,
        Number(selectedDay)
      );
    }
    if (filterType === "monthly" && selectedYear && selectedMonth) {
      return new Date(Number(selectedYear), Number(selectedMonth) - 1, 1);
    }
    if (filterType === "yearly" && selectedYear) {
      return new Date(Number(selectedYear), 0, 1);
    }
    return null;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: registrations, error } = await supabase
        .from("registrations")
        .select("id, created_at, patient:patient_id (gender)")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      const fromDate = getDateFilter();

      const filtered = fromDate
        ? registrations.filter((r) => new Date(r.created_at) >= fromDate)
        : registrations;

      const genderCounts = {};

      filtered.forEach((r) => {
        const gender = r.patient?.gender || "Nomaʼlum";
        genderCounts[gender] = (genderCounts[gender] || 0) + 1;
      });

      const result = Object.entries(genderCounts).map(([gender, count]) => ({
        gender,
        count,
      }));

      setData(result.sort((a, b) => b.count - a.count));
      setLoading(false);
    };

    fetchData();
  }, [filterType, selectedYear, selectedMonth, selectedDay]);

  const max = data[0]?.count || 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <div className="flex items-center">
            <Mars color="#155dfc" />
            <Venus color="#e60076" />
          </div>
          Jins bo‘yicha analitika
        </h2>

        {/* <div className="flex flex-wrap gap-4">
          <Select
            value={filterType}
            onValueChange={(v) => {
              setFilterType(v);
              setSelectedYear("");
              setSelectedMonth("");
              setSelectedDay("");
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrni tanlang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Kunlik</SelectItem>
              <SelectItem value="monthly">Oylik</SelectItem>
              <SelectItem value="yearly">Yillik</SelectItem>
              <SelectItem value="all">Barchasi</SelectItem>
            </SelectContent>
          </Select>

          {(filterType === "daily" ||
            filterType === "monthly" ||
            filterType === "yearly") && (
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Yil" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {(filterType === "daily" || filterType === "monthly") && (
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Oy" />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {filterType === "daily" && (
            <Select value={selectedDay} onValueChange={setSelectedDay}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Kun" />
              </SelectTrigger>
              <SelectContent>
                {days.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div> */}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div className="flex items-center gap-2" key={i}>
              <Skeleton className="w-32 h-4" />
              <Skeleton className="flex-1 h-4" />
              <Skeleton className="w-10 h-4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((item) => (
            <div key={item.gender} className="flex items-center gap-3">
              <div className="w-32 text-sm font-medium">
                {item.gender === "male" ? "Erkak" : "Ayol"}
              </div>
              <div className="flex-1 bg-gray-200 h-2 rounded-md relative">
                <div
                  className={`h-2 rounded-md ${
                    item.gender === "male" ? "bg-blue-600" : "bg-pink-600"
                  } `}
                  style={{ width: `${(item.count / max) * 100}%` }}
                ></div>
              </div>
              <div className="w-10 text-right text-sm font-semibold">
                {item.count}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
