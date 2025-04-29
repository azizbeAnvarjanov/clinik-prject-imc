"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";

export default function RegistrationsTable() {
  const supabase = createClient();
  const [registrations, setRegistrations] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);

  const [filters, setFilters] = useState({
    name: "",
    phone: "",
    doctor: "",
    service: "",
    startDate: "",
    endDate: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalRegistrations, setTotalRegistrations] = useState(0);
  const registrationsPerPage = 20;

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      name: "",
      phone: "",
      doctor: "",
      service: "",
      startDate: "",
      endDate: "",
    });
    setCurrentPage(1);
  };

  const loadData = async () => {
    const offset = (currentPage - 1) * registrationsPerPage;

    const { count } = await supabase
      .from("registrations")
      .select("*", { count: "exact", head: true });

    setTotalRegistrations(count || 0);

    const { data: regData, error: regError } = await supabase
      .from("registrations")
      .select(
        "id, patient_id, doctor_id, order_number, total_amount, discount, status, created_at, service_id"
      )
      .order("order_number", { ascending: false })
      .range(offset, offset + registrationsPerPage - 1);

    if (regError) {
      toast.error("Registratsiyalarni olishda xatolik yuz berdi.");
      return;
    }

    setRegistrations(regData || []);

    const [
      { data: patientData },
      { data: doctorData },
      { data: serviceData },
    ] = await Promise.all([
      supabase.from("patients").select(),
      supabase.from("doctors").select(),
      supabase.from("services").select(),
    ]);

    setPatients(patientData || []);
    setDoctors(doctorData || []);
    setServices(serviceData || []);
  };

  useEffect(() => {
    loadData();
  }, [currentPage]);

  const getServicesForRegistration = (registrationId) => {
    console.log(services.filter((s) => s.id === registrationId));

    return services.filter((s) => s.id === registrationId);
  };

  const filteredRegistrations = registrations.filter((reg) => {
    const patient = patients.find((p) => p.id === reg.patient_id);
    const doctor = doctors.find((d) => d.id === reg.doctor_id);
    const service = services.find((s) => s.id === reg.service_id);

    const dateMatch =
      (!filters.startDate ||
        new Date(reg.created_at) >= new Date(filters.startDate)) &&
      (!filters.endDate ||
        new Date(reg.created_at) <= new Date(filters.endDate));

    const serviceMatch = filters.service
      ? service &&
        service.name.toLowerCase().includes(filters.service.toLowerCase())
      : true;

    return (
      patient &&
      (patient.first_name + " " + patient.last_name)
        .toLowerCase()
        .includes(filters.name.toLowerCase()) &&
      patient.phone.toLowerCase().includes(filters.phone.toLowerCase()) &&
      (!filters.doctor ||
        doctor?.full_name.toLowerCase() === filters.doctor.toLowerCase()) &&
      serviceMatch &&
      dateMatch
    );
  });

  return (
    <div className="pb-5">
      <div className="flex gap-4 mb-6 justify-end">
        <Input
          type="date"
          name="startDate"
          className={"w-fit"}
          value={filters.startDate}
          onChange={handleFilterChange}
        />
        <Input
          type="date"
          className={"w-fit"}
          name="endDate"
          value={filters.endDate}
          onChange={handleFilterChange}
        />
        <Button variant="outline" onClick={handleClearFilters}>
          Filtrlarni tozalash
        </Button>
        {/* <div className="mb-2 text-sm text-muted-foreground">
          <p>Umumiy zakazlar soni: {totalRegistrations}</p>
          <p>Filtrlangan zakazlar: {filteredRegistrations.length}</p>
        </div> */}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Ism</TableHead>
            <TableHead>Telefon</TableHead>
            <TableHead>Shifokor</TableHead>
            <TableHead>Xizmatlar</TableHead>
            <TableHead>Summa</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sana</TableHead>
          </TableRow>
          <TableRow className={"!py-2"}>
            <TableHead>№</TableHead>
            <TableHead>Buyurtma ID</TableHead>
            <TableHead>
              <Input
                placeholder="Ism Familiya"
                name="name"
                value={filters.name}
                onChange={handleFilterChange}
              />
            </TableHead>
            <TableHead>
              <Input
                placeholder="Telefon"
                name="phone"
                value={filters.phone}
                onChange={handleFilterChange}
              />
            </TableHead>
            <TableHead>
              <Select
                value={filters.doctor}
                onValueChange={(val) =>
                  setFilters((prev) => ({ ...prev, doctor: val }))
                }
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Shifokor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.full_name}>
                      {doctor.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableHead>
            <TableHead>
              <Input
                placeholder="Xizmat"
                name="service"
                value={filters.service}
                onChange={handleFilterChange}
              />
            </TableHead>
            <TableHead>Summa</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sana</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRegistrations.map((reg, i) => {
            const patient = patients.find((p) => p.id === reg.patient_id);
            const doctor = doctors.find((d) => d.id === reg.doctor_id);
            const service = services.find((s) => s.id === reg.service_id);

            return (
              <TableRow key={reg.id}>
                <TableCell>{i + 1}</TableCell>
                <TableCell>{reg.order_number}</TableCell>
                <TableCell>
                  {patient?.first_name} {patient?.last_name}
                </TableCell>
                <TableCell>{patient?.phone}</TableCell>
                <TableCell>{doctor?.full_name}</TableCell>
                <TableCell>{service?.name}</TableCell>
                <TableCell>{reg.total_amount?.toLocaleString()} so‘m</TableCell>
                <TableCell>{reg.status}</TableCell>
                <TableCell>
                  {new Date(
                    new Date(reg.created_at).getTime() + 5 * 60 * 60 * 1000
                  ).toLocaleString("uz-UZ", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <Button
          variant="outline"
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
        >
          Oldingi
        </Button>
        <span className="flex gap-4">
          Sahifa: {currentPage} /{" "}
          {Math.ceil(totalRegistrations / registrationsPerPage)}
          <p>Umumiy zakazlar soni: {filteredRegistrations.length}</p>
        </span>
        <Button
          variant="outline"
          onClick={() =>
            setCurrentPage((p) =>
              p * registrationsPerPage < totalRegistrations ? p + 1 : p
            )
          }
          disabled={currentPage * registrationsPerPage >= totalRegistrations}
        >
          Keyingi
        </Button>
      </div>
    </div>
  );
}
