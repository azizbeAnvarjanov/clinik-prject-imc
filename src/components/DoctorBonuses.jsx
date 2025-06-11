"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";

export default function DoctorBonusesPage() {
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [bonuses, setBonuses] = useState({});
  const supabase = createClient();

  // Load doctors and services on mount
  useEffect(() => {
    const loadData = async () => {
      const { data: doctorsData } = await supabase
        .from("doctors")
        .select("id, full_name");
      const { data: servicesData } = await supabase
        .from("services")
        .select("id, name, price");
      if (doctorsData) setDoctors(doctorsData);
      if (servicesData) setServices(servicesData);
    };
    loadData();
  }, []);

  // Load bonuses for selected doctor
  useEffect(() => {
    const loadBonuses = async () => {
      if (!selectedDoctorId) return;

      const { data: bonusData } = await supabase
        .from("doctor_service_bonus")
        .select("service_id, bonus_percentage")
        .eq("doctor_id", selectedDoctorId);

      const bonusMap = {};
      bonusData?.forEach((b) => {
        bonusMap[b.service_id] = b.bonus_percentage;
      });

      setBonuses(bonusMap);
    };

    loadBonuses();
  }, [selectedDoctorId]);

  // Handle bonus change
  const handleBonusChange = (serviceId, value) => {
    setBonuses((prev) => ({
      ...prev,
      [serviceId]: Number(value),
    }));
  };
  const handleSave = async () => {
    const errors = [];

    await Promise.all(
      services.map(async (service) => {
        const bonus = parseFloat(bonuses[service.id]) || 0;

        const { data: existing, error: selectError } = await supabase
          .from("doctor_service_bonus")
          .select("id")
          .eq("doctor_id", selectedDoctorId)
          .eq("service_id", service.id)
          .single();

        if (selectError && selectError.code !== "PGRST116") {
          errors.push(
            `Xatolik (select): ${service.name} — ${selectError.message}`
          );
          return;
        }

        if (existing) {
          const { error: updateError } = await supabase
            .from("doctor_service_bonus")
            .update({ bonus_percentage: bonus })
            .eq("id", existing.id);

          if (updateError) {
            errors.push(
              `Xatolik (update): ${service.name} — ${updateError.message}`
            );
          }
        } else {
          const { error: insertError } = await supabase
            .from("doctor_service_bonus")
            .insert({
              doctor_id: selectedDoctorId,
              service_id: service.id,
              bonus_percentage: bonus,
            });

          if (insertError) {
            errors.push(
              `Xatolik (insert): ${service.name} — ${insertError.message}`
            );
          }
        }
      })
    );

    if (errors.length > 0) {
      alert("Xatoliklar:\n" + errors.join("\n"));
    } else {
      alert("Foizlar saqlandi ✅");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">
        Shifokorlar uchun xizmat bonus foizlari
      </h1>

      <div className="mb-6">
        <label className="block mb-2">Shifokorni tanlang:</label>
        <Select onValueChange={(val) => setSelectedDoctorId(val)}>
          <SelectTrigger>
            <SelectValue placeholder="Shifokor tanlang" />
          </SelectTrigger>
          <SelectContent>
            {doctors.map((doctor) => (
              <SelectItem key={doctor.id} value={doctor.id}>
                {doctor.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedDoctorId && (
        <>
          <div className="space-y-4 mb-6">
            {services.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between gap-4"
              >
                <span>{service.name}</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={bonuses[service.id] ?? ""}
                  onChange={(e) =>
                    handleBonusChange(service.id, e.target.value)
                  }
                  className="w-24"
                  placeholder="%"
                />
              </div>
            ))}
          </div>

          <Button onClick={handleSave}>Foizlarni saqlash</Button>
        </>
      )}
    </div>
  );
}
