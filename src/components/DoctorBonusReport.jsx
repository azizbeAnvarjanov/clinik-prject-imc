"use client";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { createClient } from "@/utils/supabase/client";
import * as XLSX from "xlsx";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Download } from "lucide-react";
import BackBTN from "./BackBTN";

export default function AllDoctorsBonusReport() {
  const [report, setReport] = useState([]);
  const [filter, setFilter] = useState("daily");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchReport();
  }, [filter]);

  console.log();

  const fetchReport = async () => {
    setLoading(true);

    const today = dayjs();
    const { data: bonuses } = await supabase
      .from("doctor_service_bonus_duplicate")
      .select("doctor_id, service_id, bonus_percentage");

    if (!bonuses) {
      setReport([]);
      setLoading(false);
      return;
    }

    const { data: regServices } = await supabase
      .from("registrations_services_duplicate")
      .select("registration_id, service_id, doctor_id")
      .in(
        "service_id",
        bonuses.map((b) => b.service_id)
      );

    if (!regServices) {
      setReport([]);
      setLoading(false);
      return;
    }

    const regIds = regServices.map((rs) => rs.registration_id);
    const { data: registrations } = await supabase
      .from("registrations_duplicate")
      .select("id, paid, created_at, order_number")
      .in("id", regIds);

    if (!registrations) {
      setReport([]);
      setLoading(false);
      return;
    }

    const filteredRegs = registrations.filter((reg) => {
      const date = new Date(reg.created_at);
      const today = new Date();

      let isValidDate = false;

      if (filter === "daily") {
        isValidDate =
          date.getFullYear() === today.getFullYear() &&
          date.getMonth() === today.getMonth() &&
          date.getDate() === today.getDate();
      } else if (filter === "monthly") {
        isValidDate =
          date.getFullYear() === today.getFullYear() &&
          date.getMonth() === today.getMonth();
      } else if (filter === "yearly") {
        isValidDate = date.getFullYear() === today.getFullYear();
      } else if (filter === "range" && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        start.setHours(0, 0, 0, 0); // vaqtni tozalash
        end.setHours(23, 59, 59, 999); // kun oxirigacha qo‘yish
        isValidDate = date >= start && date <= end;
      }

      return isValidDate && reg.paid > 0;
    });

    const doctorIds = [...new Set(regServices.map((r) => r.doctor_id))];
    const serviceIds = [...new Set(regServices.map((r) => r.service_id))];

    const { data: doctors } = await supabase
      .from("doctors")
      .select("id, full_name")
      .in("id", doctorIds);

    const { data: services } = await supabase
      .from("services")
      .select("id, name, price")
      .in("id", serviceIds);

    const rows = filteredRegs
      .flatMap((reg) => {
        const servicesForReg = regServices.filter(
          (rs) => rs.registration_id === reg.id
        );

        return servicesForReg.map((rs) => {
          const doctor = doctors.find((d) => d.id === rs.doctor_id);
          const service = services.find((s) => s.id === rs.service_id);

          const bonusInfo = bonuses.find(
            (b) =>
              b.doctor_id === rs.doctor_id && b.service_id === rs.service_id
          );
          const bonusPercentage = bonusInfo?.bonus_percentage || 0;
          const bonusAmount = (service.price * bonusPercentage) / 100;

          if (bonusAmount === 0) return null;

          return {
            doctor_id: rs.doctor_id,
            doctor_name: doctor?.full_name || "Noma'lum",
            registration_id: reg.id,
            order_number: reg.order_number,
            service_name: service?.name || "Noma'lum",
            service_price: service?.price || 0,
            bonus_percentage: bonusPercentage,
            paid: reg.paid,
            bonus_sum: bonusAmount,
            date: dayjs(reg.created_at).format("YYYY-MM-DD"),
          };
        });
      })
      .filter(Boolean);

    const grouped = rows.reduce((acc, row) => {
      if (!acc[row.doctor_id]) {
        acc[row.doctor_id] = {
          doctor_name: row.doctor_name,
          total_bonus: 0,
          details: [],
        };
      }
      acc[row.doctor_id].total_bonus += row.bonus_sum;
      acc[row.doctor_id].details.push(row);
      return acc;
    }, {});

    setReport(Object.values(grouped));
    setLoading(false);
  };

  const downloadExcel = () => {
    const data = report.flatMap((doctor) =>
      doctor.details.map((d) => ({
        Shifokor: doctor.doctor_name,
        Sanasi: d.date,
        "Buyurtma raqami": d.order_number,
        Xizmat: d.service_name,
        "Xizmat narxi": d.service_price,
        "To‘lov": d.paid,
        "Bonus %": d.bonus_percentage,
        "Bonus (so‘m)": d.bonus_sum,
      }))
    );

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bonuslar");

    XLSX.writeFile(workbook, "bonus_report.xlsx");
  };

  console.log(report);

  return (
    <div className="p-4">
      <div className="flex items-centers gap-2 mb-3">
        <BackBTN />
        <h1 className="text-2xl font-bold">Bonuslar</h1>
      </div>
      <div className="flex gap-4 mb-4 items-center flex-wrap justify-between">
        <div className="flex gap-2">
          {["daily", "monthly", "yearly", "range"].map((key) => (
            <Button
              key={key}
              variant={filter === key ? "default" : "outline"}
              onClick={() => setFilter(key)}
            >
              {key === "daily"
                ? "Bugungi"
                : key === "monthly"
                ? "Shu oy"
                : key === "yearly"
                ? "Shu yil"
                : "Sana oralig‘i"}
            </Button>
          ))}

          {filter === "range" && (
            <div className="flex gap-2 items-center">
              <Input
                type="date"
                value={startDate ? dayjs(startDate).format("YYYY-MM-DD") : ""}
                onChange={(e) => setStartDate(new Date(e.target.value))}
              />
              <span className="text-sm">dan</span>
              <Input
                type="date"
                value={endDate ? dayjs(endDate).format("YYYY-MM-DD") : ""}
                onChange={(e) => setEndDate(new Date(e.target.value))}
              />
            </div>
          )}

          <Button variant="default" onClick={fetchReport}>
            Ko‘rish
          </Button>
        </div>
        <Button onClick={downloadExcel}>
          <Download className="mr-2 h-4 w-4" /> Excelga yuklab olish
        </Button>
      </div>

      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))
        ) : report.length === 0 ? (
          <div className="text-center text-gray-500 font-medium">
            Maʼlumot topilmadi
          </div>
        ) : (
          <Accordion type="multiple" className="w-full">
            {report.map((doctor, i) => (
              <AccordionItem
                value={`item-${i}`}
                key={i}
                className="border rounded-lg mb-2"
              >
                <AccordionTrigger className="px-4 py-2">
                  <div className="flex justify-between w-full text-left items-center">
                    <span>{doctor.doctor_name}</span>
                    <span className="text-sm text-right">
                      <p>Qabul soni: {doctor.details.length}</p>
                      {doctor.total_bonus.toLocaleString()} so‘m
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <table className="w-full border-collapse border text-sm mt-2 rounded-lg">
                    <thead>
                      <tr>
                        <th className="border px-2 py-1">Sanasi</th>
                        <th className="border px-2 py-1">ID raqami</th>
                        <th className="border px-2 py-1">Xizmat</th>
                        <th className="border px-2 py-1">Xizmat narxi</th>
                        <th className="border px-2 py-1">Bonus foizi</th>
                        <th className="border px-2 py-1">Bonus (so‘m)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doctor.details.map((d, idx) => (
                        <tr key={idx}>
                          <td className="border px-2 py-1">{d.date}</td>
                          <td className="border px-2 py-1">{d.order_number}</td>
                          <td className="border px-2 py-1">{d.service_name}</td>
                          <td className="border px-2 py-1">
                            {Number(d.service_price).toLocaleString()}
                          </td>
                          <td className="border px-2 py-1">
                            {d.bonus_percentage}%
                          </td>
                          <td className="border px-2 py-1">
                            {Number(d.bonus_sum).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}
