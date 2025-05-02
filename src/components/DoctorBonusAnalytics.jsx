"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MONTHS = [
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

export default function DoctorBonusAnalytics() {
  const supabase = createClient();
  const [data, setData] = useState([]);
  const [year, setYear] = useState("2025");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [loading, setLoading] = useState(false); // Loading holati

  const fetchData = async () => {
    setLoading(true); // Yuklanishni boshlash

    let query = supabase
      .from("doctor_bonus_analytics")
      .select("*")
      .eq("year", year);

    if (month !== "") query = query.eq("month", Number(month));

    if (day !== "") {
      // To‘liq sanani YYYY-MM-DD formatida yasaymiz
      const formattedDay = `${year}-${month.padStart(2, "0")}-${day.padStart(
        2,
        "0"
      )}`;
      query = query.eq("day", formattedDay); // bu yerda "day" — sana ustuni
    }

    const { data, error } = await query;

    if (error) {
      console.error("Xatolik:", error.message);
    } else {
      setData(data);
    }
    setLoading(false); // Yuklanishni tugatish
  };

  useEffect(() => {
    fetchData();
  }, [year, month, day]);

  const resetFilters = () => {
    setYear("2025");
    setMonth("");
    setDay("");
  };

  return (
    <Card className="p-4">
      <CardContent>
        <h2 className="text-xl font-semibold mb-4">
          Shifokorlar Bonus Analitikasi
        </h2>

        <div className="flex flex-wrap gap-4 mb-4 items-center">
          <Select onValueChange={setYear} defaultValue={year}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Yil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={setMonth} value={month}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Oy" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((name, index) => (
                <SelectItem key={index + 1} value={(index + 1).toString()}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={setDay} value={day}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Kun" />
            </SelectTrigger>
            <SelectContent>
              {[...Array(31)].map((_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {i + 1}-kun
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={resetFilters}>
            Filtrni tozalash
          </Button>
        </div>

        {/* Loading animatsiyasi */}
        {loading ? (
          <div className="flex justify-center items-center py-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sana</TableHead>
                <TableHead>Shifokor</TableHead>
                <TableHead>Bemorlar</TableHead>
                <TableHead>Xizmatlar</TableHead>
                <TableHead>Bonus (so‘m)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>Ma'lumot topilmadi.</TableCell>
                </TableRow>
              ) : (
                data.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {new Date(row.day).toLocaleDateString("uz-UZ")}
                    </TableCell>
                    <TableCell>{row.full_name}</TableCell>
                    <TableCell>{row.patient_count}</TableCell>
                    <TableCell>{row.service_count}</TableCell>
                    <TableCell>
                      {Number(row.total_bonus).toLocaleString("uz-UZ")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
