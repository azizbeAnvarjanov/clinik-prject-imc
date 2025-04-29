"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createClient } from "@/utils/supabase/client";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search } from "lucide-react";

export default function RegisterPage() {
  const supabase = createClient();
  const [services, setServices] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderNumber, setOrderNumber] = useState(0);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    middle_name: "",
    phone: "",
    birth_date: "",
    gender: "male",
    region: "Namangan",
    district: "Norin",
    area: "",
    doctor_id: "",
    discount: 0,
  });
  const [navbat, setNavbat] = useState(0);

  const [total, setTotal] = useState(0);
  const [existingPatient, setExistingPatient] = useState(null);
  const [showCheckDialog, setShowCheckDialog] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const { data: serviceData } = await supabase.from("services").select();
      const { data: doctorData } = await supabase.from("doctors").select();
      setServices(serviceData || []);
      setDoctors(doctorData || []);
    };
    loadData();
  }, []);

  useEffect(() => {
    const selected = services.filter((s) => selectedServices.includes(s.id));
    const rawSum = selected.reduce((acc, cur) => acc + (cur.price || 0), 0);
    const discounted = rawSum * (1 - Number(formData.discount) / 100);
    setTotal(Math.round(discounted));
  }, [selectedServices, formData.discount, services]);

  useEffect(() => {
    const fetchNavbat = async () => {
      const doctor = doctors.find((d) => d.id === formData.doctor_id);
      if (doctor) {
        const { data, error } = await supabase
          .from("today_doctor_stats")
          .select("*")
          .eq("doctor_name", doctor?.full_name);
        setNavbat(data[0].patient_count);
      }
    };
    fetchNavbat();
  }, [formData.doctor_id]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleCheckboxChange = (id) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSearch = async () => {
    if (!formData.phone) {
      toast.error("Telefon raqam kiriting");
      return;
    }
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("phone", formData.phone)
      .single();

    if (error || !data) {
      toast.error("Bu mijoz bazada mavjud emas");
      setExistingPatient(null);
    } else {
      setExistingPatient(data);
      setFormData((prev) => ({
        ...prev,
        ...data,
      }));
    }
  };

  const handleSubmit = async () => {
    if (
      !formData.first_name ||
      !formData.last_name ||
      !formData.phone ||
      !formData.birth_date ||
      !formData.gender ||
      selectedServices.length === 0 ||
      !formData.doctor_id
    ) {
      toast.error("Majburiy maydonlarni to‘ldiring");
      return;
    }

    // Bemorni tekshirish yoki yaratish
    let patient = existingPatient;
    if (!patient) {
      const { data, error } = await supabase
        .from("patients")
        .insert({
          phone: formData.phone,
          first_name: formData.first_name,
          last_name: formData.last_name,
          middle_name: formData.middle_name,
          birth_date: formData.birth_date,
          gender: formData.gender,
          region: formData.region,
          district: formData.district,
          area: formData.area,
        })
        .select()
        .single();

      if (error || !data) {
        toast.error("Bemorni saqlashda xatolik");
        return;
      }

      patient = data;
    }

    // Bitta umumiy order_number olish
    const { data: lastReg } = await supabase
      .from("registrations")
      .select("order_number")
      .order("order_number", { ascending: false })
      .limit(1)
      .single();

    const orderNumber = (lastReg?.order_number || 0) + 1;

    // Har bir xizmat uchun registratsiya qilish, lekin order_number bir xil bo‘lishi kerak
    for (const service_id of selectedServices) {
      const service = services.find((s) => s.id === service_id);
      const originalPrice = service?.price || 0;
      const discountedPrice = Math.round(
        originalPrice * (1 - Number(formData.discount) / 100)
      );

      setOrderNumber(orderNumber);

      const { data: registration, error: regError } = await supabase
        .from("registrations")
        .insert({
          patient_id: patient.id,
          doctor_id: formData.doctor_id,
          total_amount: discountedPrice,
          discount: Number(formData.discount),
          status: "to'lanmagan",
          order_number: orderNumber, // Hamma xizmatlarga bitta raqam
          service_id: service_id,
        })
        .select()
        .single();

      if (regError || !registration) {
        toast.error(`Registratsiyada xatolik (${service?.name})`);
        return;
      }
    }

    toast.success("Barcha xizmatlar uchun ro‘yxatdan o‘tkazildi!");
  };

  const handleClear = () => {
    setFormData({
      first_name: "",
      last_name: "",
      middle_name: "",
      phone: "",
      birth_date: "",
      gender: "male",
      region: "Namangan",
      district: "Norin",
      area: "",
      doctor_id: "",
      discount: 0,
    });
    setSelectedServices([]);
    setExistingPatient(null);
    setTotal(0);
  };

  return (
    <div className="flex items-start">
      <div className="w-[60%] mx-auto space-y-4 p-4">
        <h1 className="text-2xl font-bold">
          Bemorni ro‘yxatdan o‘tkazish - {navbat + 1} - order_number - {orderNumber}
        </h1>

        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Label>Telefon</Label>
            <Input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          <Button onClick={handleSearch}>
            <Search />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Ismi *</Label>
            <Input
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>Familiyasi *</Label>
            <Input
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>Otasining ismi</Label>
            <Input
              name="middle_name"
              value={formData.middle_name}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>Tug‘ilgan sana *</Label>
            <Input
              type="date"
              name="birth_date"
              value={formData.birth_date}
              onChange={handleChange}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Jinsi *</Label>
              <Select
                value={formData.gender}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, gender: val }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Erkak</SelectItem>
                  <SelectItem value="female">Ayol</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Shifokor *</Label>
              <Select
                value={formData.doctor_id}
                onValueChange={(val) => {
                  setFormData((prev) => ({ ...prev, doctor_id: val }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Viloyat</Label>
              <Select
                value={formData.region}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, region: val }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Namangan">Namangan</SelectItem>
                  <SelectItem value="Farg'ona">Farg'ona</SelectItem>
                  <SelectItem value="Andijon">Andijon</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full">
              <Label>Tuman</Label>
              <Select
                value={formData.district}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, district: val }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Norin">Norin</SelectItem>
                  <SelectItem value="Pop">Pop</SelectItem>
                  <SelectItem value="Chortoq">Chortoq</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="col-span-2">
            <Label>Hudud</Label>
            <Input name="area" value={formData.area} onChange={handleChange} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 items-end">
          <div>
            <Label>Chegirma (%)</Label>
            <Input
              type="number"
              name="discount"
              value={formData.discount}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>Umumiy narx (so‘m)</Label>
            <div className="text-lg font-semibold mt-2">
              {total?.toLocaleString()} so‘m
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSubmit}>Ro‘yxatdan o‘tkazish</Button>
          <Button variant="outline" onClick={handleClear}>
            Tozalash
          </Button>
          <Button variant="secondary" onClick={() => setShowCheckDialog(true)}>
            Check chiqarish
          </Button>
        </div>

        {/* Check dialog */}
        <Dialog open={showCheckDialog} onOpenChange={setShowCheckDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Check</DialogTitle>
            </DialogHeader>
            <div>
              <p>
                <strong>Ism, Familiya:</strong> {formData.first_name}{" "}
                {formData.last_name}
              </p>
              <p>
                <strong>Telefon:</strong> {formData.phone}
              </p>
              <p>
                <strong>Xizmatlar:</strong>
              </p>
              <ul className="list-disc list-inside">
                {services
                  .filter((s) => selectedServices.includes(s.id))
                  .map((s) => (
                    <li key={s.id}>
                      {s.name} - {s.price} so'm
                    </li>
                  ))}
              </ul>
              <p>
                <strong>Chegirma:</strong> {formData.discount}%
              </p>
              <p>
                <strong>To‘lanadigan summa:</strong> {total?.toLocaleString()}{" "}
                so‘m
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="p-3 w-[40%]">
        <div className="flex flex-col">
          <Label>Xizmatlar *</Label>
          <div>
            <Input
              type="text"
              placeholder="Qidirish...."
              onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
            />
          </div>
          <div className="flex flex-wrap flex-col">
            {services
              .filter((s) => s.name.toLowerCase().includes(searchTerm))
              .map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-2 cursor-pointer border-b p-2 hover:bg-muted"
                >
                  <Checkbox
                    checked={selectedServices.includes(s.id)}
                    onCheckedChange={() => handleCheckboxChange(s.id)}
                  />
                  <div className="flex items-center justify-between w-full">
                    <span>{s.name}</span>
                    {s.price?.toLocaleString()}
                  </div>
                </label>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
