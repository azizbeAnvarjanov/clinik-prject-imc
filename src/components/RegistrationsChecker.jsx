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

export default function DoctorBonusReport() {
  const [report, setReport] = useState([]);
  const [filter, setFilter] = useState("daily");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const supabase = createClient();

  useEffect(() => {
    fetchReport();
  }, [filter, startDate, endDate]);

  const fetchReport = async () => {
    setLoading(true);
    setErrorMessage(null);
    setReport([]);

    try {
      // 1. Foydalanuvchi autentifikatsiyasini tekshirish
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      console.log("Authenticated User:", user);
      if (authError || !user) {
        console.error("Auth Error:", authError);
        setErrorMessage("Foydalanuvchi autentifikatsiyasi muvaffaqiyatsiz");
        setLoading(false);
        return;
      }

      // 2. Doctor service bonuses
      console.log("Fetching bonuses...");
      const { data: bonuses, error: bonusesError } = await supabase
        .from("doctor_service_bonus")
        .select("doctor_id, service_id, bonus_percentage");

      if (bonusesError) {
        console.error("Bonuses Error:", bonusesError);
        setErrorMessage("Bonuslarni olishda xato: " + bonusesError.message);
        setLoading(false);
        return;
      }

      if (!bonuses || bonuses.length === 0) {
        console.warn("No bonuses found");
        setErrorMessage("Bonus ma'lumotlari topilmadi");
        setLoading(false);
        return;
      }
      console.log("Bonuses:", bonuses);

      // 3. Registration services
      console.log("Fetching registration services...");
      const serviceIds = bonuses
        .map((b) => b.service_id)
        .filter((id) => Number.isInteger(id));
      if (serviceIds.length === 0) {
        console.warn("No valid service IDs");
        setErrorMessage("Xizmat ID'lari topilmadi");
        setLoading(false);
        return;
      }
      console.log("Service IDs:", serviceIds);

      const { data: regServices, error: regServicesError } = await supabase
        .from("registrations_services")
        .select("registration_id, service_id, doctor_id")
        .in("service_id", serviceIds);

      if (regServicesError) {
        console.error("RegServices Error:", regServicesError);
        setErrorMessage(
          "Registratsiya xizmatlarini olishda xato: " + regServicesError.message
        );
        setLoading(false);
        return;
      }

      if (!regServices || regServices.length === 0) {
        console.warn("No registration services found");
        setErrorMessage("Registratsiya xizmatlari topilmadi");
        setLoading(false);
        return;
      }
      console.log("Registration Services:", regServices);

      // 4. Registrations
      const regIds = regServices
        .map((rs) => rs.registration_id)
        .filter((id) => Number.isInteger(id));
      console.log("Registration IDs:", regIds);

      if (!regIds || regIds.length === 0) {
        console.warn("No valid registration IDs");
        setErrorMessage("Registratsiya ID'lari topilmadi");
        setLoading(false);
        return;
      }

      console.log("Fetching registrations...");
      const { data: registrations, error: regError } = await supabase
        .from("registrations")
        .select("id, paid, created_at, order_number")
        .in("id", regIds);

      if (regError) {
        console.error("Registrations Error:", regError);
        setErrorMessage("Registratsiyalarni olishda xato: " + regError.message);
        setLoading(false);
        return;
      }

      if (!registrations || registrations.length === 0) {
        console.warn("No registrations found");
        setErrorMessage("Registratsiyalar topilmadi");
        setLoading(false);
        return;
      }
      console.log("Registrations:", registrations);

      // 5. Filter registrations by date
      const filteredRegs = registrations.filter((reg) => {
        if (!reg.created_at) {
          console.warn("Invalid created_at for registration:", reg);
          return false;
        }
        const date = dayjs(reg.created_at);
        const today = dayjs();
        let isValidDate = false;

        if (filter === "daily") {
          isValidDate = date.isSame(today, "day");
        } else if (filter === "monthly") {
          isValidDate = date.isSame(today, "month");
        } else if (filter === "yearly") {
          isValidDate = date.isSame(today, "year");
        } else if (filter === "range" && startDate && endDate) {
          const start = dayjs(startDate).startOf("day");
          const end = dayjs(endDate).endOf("day");
          isValidDate = date.isAfter(start) && date.isBefore(end);
        }

        return isValidDate && reg.paid > 0;
      });

      if (filteredRegs.length === 0) {
        console.warn("No registrations after filtering");
        setErrorMessage("Tanlangan filtrga mos registratsiyalar topilmadi");
        setLoading(false);
        return;
      }
      console.log("Filtered Registrations:", filteredRegs);

      // 6. Fetch doctors
      const doctorIds = [
        ...new Set(
          regServices
            .map((r) => r.doctor_id)
            .filter((id) => Number.isInteger(id))
        ),
      ];
      console.log("Fetching doctors for IDs:", doctorIds);
      const { data: doctors, error: doctorsError } = await supabase
        .from("doctors")
        .select("id, full_name")
        .in("id", doctorIds);

      if (doctorsError) {
        console.error("Doctors Error:", doctorsError);
        setErrorMessage("Shifokorlarni olishda xato: " + doctorsError.message);
        setLoading(false);
        return;
      }

      if (!doctors || doctors.length === 0) {
        console.warn("No doctors found");
        setErrorMessage("Shifokorlar topilmadi");
        setLoading(false);
        return;
      }
      console.log("Doctors:", doctors);

      // 7. Fetch services
      console.log("Fetching services for IDs:", serviceIds);
      const { data: services, error: servicesError } = await supabase
        .from("services")
        .select("id, name, price")
        .in("id", serviceIds);

      if (servicesError) {
        console.error("Services Error:", servicesError);
        setErrorMessage("Xizmatlarni olishda xato: " + servicesError.message);
        setLoading(false);
        return;
      }

      if (!services || services.length === 0) {
        console.warn("No services found");
        setErrorMessage("Xizmatlar topilmadi");
        setLoading(false);
        return;
      }
      console.log("Services:", services);

      // 8. Process data
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
            const bonusAmount = (service?.price || 0) * (bonusPercentage / 100);

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

      if (rows.length === 0) {
        console.warn("No valid rows after processing");
        setErrorMessage("Qayta ishlashdan keyin bonus ma'lumotlari topilmadi");
        setLoading(false);
        return;
      }
      console.log("Processed Rows:", rows);

      // 9. Group by doctor
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
      console.log("Final Report:", Object.values(grouped));
    } catch (error) {
      console.error("Unexpected Error:", error);
      setErrorMessage("Kutilmagan xato yuz berdi: " + error.message);
    } finally {
      setLoading(false);
    }
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
        "Bonus foizi": d.bonus_percentage,
        "Bonus summasi (so‘m)": d.bonus_sum,
      }))
    );

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bonuslar");
    XLSX.writeFile(workbook, "doctor_bonus_report.xlsx");
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Sarlavha va orqaga tugmasi */}
      <div className="flex items-center gap-3 mb-6">
        <BackBTN />
        <h1 className="text-3xl font-bold text-gray-800">Shifokor Bonuslari</h1>
      </div>

      {/* Filtrlar va Excel yuklab olish */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          {["daily", "monthly", "yearly", "range"].map((key) => (
            <Button
              key={key}
              variant={filter === key ? "default" : "outline"}
              onClick={() => setFilter(key)}
              className="text-sm"
            >
              {key === "daily"
                ? "Kunlik"
                : key === "monthly"
                ? "Oylik"
                : key === "yearly"
                ? "Yillik"
                : "Sana oralig‘i"}
            </Button>
          ))}

          {filter === "range" && (
            <div className="flex gap-2 items-center flex-wrap">
              <Input
                type="date"
                value={startDate ? dayjs(startDate).format("YYYY-MM-DD") : ""}
                onChange={(e) =>
                  setStartDate(e.target.value ? new Date(e.target.value) : null)
                }
                className="w-40"
                placeholder="Boshlang‘ich sana"
              />
              <span className="text-sm text-gray-600">dan</span>
              <Input
                type="date"
                value={endDate ? dayjs(endDate).format("YYYY-MM-DD") : ""}
                onChange={(e) =>
                  setEndDate(e.target.value ? new Date(e.target.value) : null)
                }
                className="w-40"
                placeholder="Tugash sana"
              />
            </div>
          )}

          <Button
            variant="default"
            onClick={fetchReport}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Ko‘rish
          </Button>
        </div>

        <Button
          onClick={downloadExcel}
          disabled={report.length === 0 || loading}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Excelga yuklab olish
        </Button>
      </div>

      {/* Xato xabari yoki ma’lumotlar */}
      <div className="space-y-4">
        {errorMessage && (
          <div className="text-center text-red-500 font-medium bg-red-50 p-4 rounded-lg">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        ) : report.length === 0 ? (
          <div className="text-center text-gray-500 font-medium bg-gray-50 p-6 rounded-lg">
            Maʼlumot topilmadi
          </div>
        ) : (
          <Accordion type="multiple" className="w-full space-y-2">
            {report.map((doctor, i) => (
              <AccordionItem
                value={`item-${i}`}
                key={i}
                className="border rounded-lg bg-white shadow-sm"
              >
                <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex justify-between w-full text-left items-center">
                    <span className="font-semibold text-gray-800">
                      {doctor.doctor_name}
                    </span>
                    <span className="text-sm text-gray-600 text-right">
                      <p>Qabul soni: {doctor.details.length}</p>
                      <p className="font-medium">
                        {doctor.total_bonus.toLocaleString()} so‘m
                      </p>
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border px-3 py-2 text-left font-medium">
                            Sanasi
                          </th>
                          <th className="border px-3 py-2 text-left font-medium">
                            Buyurtma raqami
                          </th>
                          <th className="border px-3 py-2 text-left font-medium">
                            Xizmat
                          </th>
                          <th className="border px-3 py-2 text-left font-medium">
                            Xizmat narxi
                          </th>
                          <th className="border px-3 py-2 text-left font-medium">
                            Bonus foizi
                          </th>
                          <th className="border px-3 py-2 text-left font-medium">
                            Bonus summasi
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {doctor.details.map((d, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="border px-3 py-2">{d.date}</td>
                            <td className="border px-3 py-2">
                              {d.order_number}
                            </td>
                            <td className="border px-3 py-2">
                              {d.service_name}
                            </td>
                            <td className="border px-3 py-2">
                              {Number(d.service_price).toLocaleString()}
                            </td>
                            <td className="border px-3 py-2">
                              {d.bonus_percentage}%
                            </td>
                            <td className="border px-3 py-2">
                              {Number(d.bonus_sum).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}
