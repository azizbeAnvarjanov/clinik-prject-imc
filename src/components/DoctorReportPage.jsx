"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "./ui/button";
import { RefreshCw } from "lucide-react";
import BackBTN from "./BackBTN";

export default function DoctorReportPage() {
  const supabase = createClient();
  const [period, setPeriod] = useState("day");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);

  console.log(report);

  const fetchReport = async () => {
    setLoading(true);

    let fromDate = "";
    let toDate = "";
    const now = new Date();

    if (period === "day" && selectedDate) {
      fromDate = selectedDate;
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      toDate = nextDay.toISOString().split("T")[0];
    } else if (period === "month") {
      fromDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
      const nextMonth = new Date(selectedYear, selectedMonth, 1);
      toDate = nextMonth.toISOString().split("T")[0];
    } else if (period === "year") {
      fromDate = `${selectedYear}-01-01`;
      toDate = `${selectedYear + 1}-01-01`;
    }

    const { data: doctors, error: doctorErr } = await supabase
      .from("doctors")
      .select("id, full_name, bonus_percent");

    if (doctorErr) {
      console.error("Doctor error:", doctorErr);
      setLoading(false);
      return;
    }

    const { data: registrations, error: regErr } = await supabase
      .from("registrations")
      .select("id, doctor_id, paid, created_at")
      .gte("created_at", fromDate)
      .lt("created_at", toDate)
      .in("status", ["has_been_paid", "partially_paid"]);

    if (regErr) {
      console.error("Registrations error:", regErr);
      setLoading(false);
      return;
    }

    const reportData = doctors.map((doc) => {
      const doctorRegs = registrations.filter((r) => r.doctor_id === doc.id);
      const totalPaid = doctorRegs.reduce(
        (sum, r) => sum + (parseInt(r.paid) || 0),
        0
      );
      const bonus = (totalPaid * (doc.bonus_percent || 0)) / 100;

      return {
        name: `${doc.full_name}`,
        totalRegistrations: doctorRegs.length,
        totalPaid,
        bonusPercent: doc.bonus_percent,
        bonus: Math.round(bonus),
      };
    });

    setReport(reportData);
    setLoading(false);
  };

  useEffect(() => {
    if (period === "day" && !selectedDate) return;
    fetchReport();
  }, [period, selectedDate, selectedMonth, selectedYear]);

  return (
    <div className="pb-10 pt-2">
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <BackBTN />
        <Select onValueChange={(v) => setPeriod(v)} value={period}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Davrni tanlang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Kunlik</SelectItem>
            <SelectItem value="month">Oylik</SelectItem>
            <SelectItem value="year">Yillik</SelectItem>
          </SelectContent>
        </Select>

        {period === "day" && (
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-fit"
          />
        )}

        {period === "month" && (
          <>
            <Select
              value={selectedMonth.toString()}
              onValueChange={(v) => setSelectedMonth(parseInt(v))}
            >
              <SelectTrigger className="w-[120px]">
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

            <Select
              value={selectedYear.toString()}
              onValueChange={(v) => setSelectedYear(parseInt(v))}
            >
              <SelectTrigger className="w-[120px]">
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
          </>
        )}

        {period === "year" && (
          <Select
            value={selectedYear.toString()}
            onValueChange={(v) => setSelectedYear(parseInt(v))}
          >
            <SelectTrigger className="w-[120px]">
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
        <Button onClick={fetchReport}>
          Yangilash <RefreshCw className="ml-2 w-4 h-4" />
        </Button>
      </div>

      <div className="overflow-auto">
        {loading ? (
          <p>Yuklanmoqda...</p>
        ) : (
          <table className="min-w-full text-left border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100 dark:bg-[#1f1f1f]">
                <th className="border px-4 py-2">№</th>
                <th className="border px-4 py-2">Ism Familiya</th>
                <th className="border px-4 py-2">Qabul soni</th>
                <th className="border px-4 py-2">Tushum</th>
                <th className="border px-4 py-2">Bonus %</th>
                <th className="border px-4 py-2">Bonus summa</th>
              </tr>
            </thead>
            <tbody>
              {report.map((item, i) => (
                <tr
                  key={i}
                  className="border-t hover:bg-gray-50 dark:hover:bg-[#2c2c2c]"
                >
                  <td className="border px-4 py-2">{i + 1}</td>
                  <td className="border px-4 py-2">{item.name}</td>
                  <td className="border px-4 py-2">
                    {item.totalRegistrations}
                  </td>
                  <td className="border px-4 py-2">
                    {item.totalPaid.toLocaleString("uz-UZ")} so‘m
                  </td>
                  <td className="border px-4 py-2">{item.bonusPercent}%</td>
                  <td className="border px-4 py-2">
                    {item.bonus.toLocaleString("uz-UZ")} so‘m
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
