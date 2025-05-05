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
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/utils/supabase/client";
import toast from "react-hot-toast";

import { CopyX, Printer, Search } from "lucide-react";
import LoaderComponent from "@/components/LoaderComponent";
import PhoneInput from "@/components/PhoneInput";

export default function RegisterPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderNumber, setOrderNumber] = useState(0);
  const [registerDate, setRegisterDate] = useState("");

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    middle_name: "",
    phone: "+998",
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

  const fetchNavbat = async (id) => {
    setLoading(true);
    const doctor = doctors.find((d) => d.id === id);
    if (doctor) {
      const { data, error } = await supabase
        .from("today_doctor_stats")
        .select("*")
        .eq("doctor_id", id);

      if (error) {
        setLoading(false);
        console.error("Supabase error:", error);
        return;
      }

      if (data && data.length > 0) {
        setNavbat(data[0].patient_count);
        setLoading(false);
      } else {
        setLoading(false);
        setNavbat(0); // yoki null, agar kerak bo‘lsa
        console.warn("Doctor stats topilmadi:", doctor.full_name);
      }
    }
  };

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
    setLoading(true);
    if (!formData.phone) {
      toast.error("Telefon raqam kiriting");
      setLoading(false);
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
      setLoading(false);
    } else {
      setExistingPatient(data);
      setLoading(false);

      setFormData((prev) => ({
        ...prev,
        ...data,
      }));
    }
  };

  // const handleSubmit = async () => {
  //   if (
  //     !formData.first_name ||
  //     !formData.last_name ||
  //     !formData.phone ||
  //     !formData.birth_date ||
  //     !formData.gender ||
  //     selectedServices.length === 0 ||
  //     !formData.doctor_id
  //   ) {
  //     toast.error("Majburiy maydonlarni to‘ldiring");
  //     return;
  //   }

  //   setLoading(true);

  //   // Bemorni tekshirish yoki yaratish
  //   let patient = existingPatient;
  //   if (!patient) {
  //     const { data, error } = await supabase
  //       .from("patients")
  //       .insert({
  //         phone: formData.phone,
  //         first_name: formData.first_name,
  //         last_name: formData.last_name,
  //         middle_name: formData.middle_name,
  //         birth_date: formData.birth_date,
  //         gender: formData.gender,
  //         region: formData.region,
  //         district: formData.district,
  //         area: formData.area,
  //       })
  //       .select()
  //       .single();

  //     if (error || !data) {
  //       toast.error("Bemorni saqlashda xatolik");
  //       setLoading(false);
  //       return;
  //     }

  //     patient = data;
  //   }

  //   // Bitta umumiy order_number olish
  //   const { data: lastReg } = await supabase
  //     .from("registrations")
  //     .select("order_number")
  //     .order("order_number", { ascending: false })
  //     .limit(1)
  //     .single();

  //   const orderNumber = (lastReg?.order_number || 0) + 1;

  //   // Har bir xizmat uchun registratsiya qilish, lekin order_number bir xil bo‘lishi kerak
  //   for (const service_id of selectedServices) {
  //     const service = services.find((s) => s.id === service_id);
  //     const originalPrice = service?.price || 0;
  //     const discountedPrice = Math.round(
  //       originalPrice * (1 - Number(formData.discount) / 100)
  //     );

  //     setOrderNumber(orderNumber);

  //     const { data: registration, error: regError } = await supabase
  //       .from("registrations")
  //       .insert({
  //         patient_id: patient.id,
  //         doctor_id: formData.doctor_id,
  //         total_amount: discountedPrice,
  //         discount: Number(formData.discount),
  //         status: "to'lanmagan",
  //         order_number: orderNumber, // Hamma xizmatlarga bitta raqam
  //         service_id: service_id,
  //       })
  //       .select()
  //       .single();

  //     if (regError || !registration) {
  //       toast.error(`Registratsiyada xatolik (${service?.name})`);
  //       setLoading(false);

  //       return;
  //     }
  //   }
  //   setLoading(false);
  //   toast.success("Muvafaqiyatli ro'yhatdan o'tdi!");
  // };

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

    setLoading(true);

    // 1. Bemorni tekshirish yoki yaratish
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
        setLoading(false);
        return;
      }

      patient = data;
    }

    // 2. Yangi order_number aniqlash
    const { data: lastReg } = await supabase
      .from("registrations")
      .select("order_number")
      .order("order_number", { ascending: false })
      .limit(1)
      .single();

    const orderNumber = (lastReg?.order_number || 0) + 1;
    setOrderNumber(orderNumber); // Agar kerak bo‘lsa, state uchun

    // 3. Umumiy summa hisoblash
    let totalAmount = 0;
    const servicesToInsert = [];

    for (const service_id of selectedServices) {
      const service = services.find((s) => s.id === service_id); // <-- MUHIM

      if (!service) {
        toast.error(`Xizmat topilmadi (ID: ${service_id})`);
        setLoading(false);
        return;
      }

      console.log(service.id);

      const originalPrice = service.price || 0;
      const discountedPrice = Math.round(
        originalPrice * (1 - Number(formData.discount) / 100)
      );

      totalAmount += discountedPrice;

      servicesToInsert.push({
        service_id: service.id,
        original_price: originalPrice,
        discounted_price: discountedPrice,
        doctor_id: formData.doctor_id,
      });
    }

    // 4. Registratsiya yozuvi yaratish (faqat bitta)
    const { data: registration, error: regError } = await supabase
      .from("registrations")
      .insert({
        patient_id: patient.id,
        total_amount: totalAmount,
        discount: Number(formData.discount),
        order_number: orderNumber,
        doctor_id: formData.doctor_id,
      })
      .select()
      .single();

    console.log(registration);
    if (regError || !registration) {
      toast.error("Registratsiyani yaratishda xatolik");
      setLoading(false);
      return;
    }

    // 5. register_services jadvaliga xizmatlarni yozish (order_number bilan)
    const registerServicesPayload = servicesToInsert.map((item) => ({
      order_id: orderNumber, // Bu foreign key bo'lishi uchun registrations.order_number unikal bo'lishi kerak
      service_id: item.service_id,
      service_price: item.original_price,
      doctor_id: item.doctor_id,
      registration_id: registration.id,
    }));

    const { error: rsError } = await supabase
      .from("registrations_services")
      .insert(registerServicesPayload);

    if (rsError) {
      toast.error("Xizmatlarni saqlashda xatolik 350");
      console.error(rsError);
      setLoading(false);
      return;
    }

    setLoading(false);
    toast.success("Muvafaqiyatli ro'yhatdan o'tdi!");
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

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    const localTimeOffset = date.getTimezoneOffset() * 60000; // Offsetni millisekundga o‘girish
    const localDate = new Date(date.getTime() - localTimeOffset);

    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, "0");
    const day = String(localDate.getDate()).padStart(2, "0");
    const hours = String(localDate.getHours()).padStart(2, "0");
    const minutes = String(localDate.getMinutes()).padStart(2, "0");
    const seconds = String(localDate.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const handlePrint = () => {
    const printContent = document.getElementById("printableDiv");

    if (!printContent) {
      console.error("printableDiv topilmadi!");
      return;
    }

    const printWindow = window.open("", "_blank");

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Chek</title>
          <link rel="stylesheet" href="/your-global-styles.css"> 
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            @media print {
              body * { visibility: hidden; }
              #printableDiv, #printableDiv * { visibility: visible; }
              #printableDiv { position: absolute; left: 0; top: 0; }
            }
          </style>
        </head>
        <body>
          <div id="printableDiv">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
  };

  const getSelectedServiceDetails = (selectedIds, allServices) => {
    return selectedIds
      .map((sel) => {
        const id = typeof sel === "object" ? sel.id : sel;
        return allServices.find((service) => service.id === id);
      })
      .filter(Boolean); // undefined bo‘lganlarni chiqarib tashlash
  };

  const selectedServiceDetails = getSelectedServiceDetails(
    selectedServices,
    services
  );

  return (
    <div className="flex flex-col lg:flex-row items-start gap-4">
      {loading && (
        <div className="fixed bg-white/50 dark:bg-black/70 backdrop-blur-sm grid place-items-center w-full h-screen left-0 top-0 z-50">
          <LoaderComponent />
        </div>
      )}
      <div className="w-full lg:w-[60%] mx-auto space-y-4 p-4">
        <div className="flex gap-2 items-end flex-wrap">
          <PhoneInput
            value={formData.phone}
            onChange={(val) => setFormData((prev) => ({ ...prev, phone: val }))}
          />
          <Button
            disabled={loading}
            className={"bg-[#013ca6] text-white hover:bg-[#013ca6]"}
            onClick={handleSearch}
          >
            <Search />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>
              Ismi <span className="text-red-500">*</span>
            </Label>
            <Input
              disabled={loading}
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>
              Familiyasi <span className="text-red-500">*</span>
            </Label>
            <Input
              disabled={loading}
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>Otasining ismi</Label>
            <Input
              disabled={loading}
              name="middle_name"
              value={formData.middle_name}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>
              Tug‘ilgan sana <span className="text-red-500">*</span>
            </Label>
            <Input
              disabled={loading}
              type="date"
              name="birth_date"
              value={formData.birth_date}
              onChange={handleChange}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>
                Jinsi <span className="text-red-500">*</span>
              </Label>
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
              <Label>
                Shifokor <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.doctor_id}
                onValueChange={(val) => {
                  setFormData((prev) => ({ ...prev, doctor_id: val }));
                  fetchNavbat(val);
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
                  <SelectItem value="Uchqo'rg'on">Uchqo'rg'on</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="">
            <Label>Hudud</Label>
            <Input name="area" value={formData.area} onChange={handleChange} />
          </div>
          <div>
            <div>
              <Label>Chegirma (%)</Label>
              <Input
                type="number"
                name="discount"
                value={formData.discount}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
          <div>
            <Label>Umumiy narx (so‘m)</Label>
            <div className="text-lg font-semibold mt-2">
              {total?.toLocaleString()} so‘m
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            className="bg-[#013ca6] text-white hover:bg-[#013ca6]"
            onClick={handleSubmit}
          >
            Ro‘yxatdan o‘tkazish
          </Button>
          <Button disabled={loading} variant="outline" onClick={handleClear}>
            <CopyX />
            Tozalash
          </Button>
          <Button disabled={loading} variant="outline" onClick={handlePrint}>
            <Printer />
            Check chiqarish
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">№</TableHead>
              <TableHead>Xizmat nomi</TableHead>
              <TableHead>Narxi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedServiceDetails.map((item, i) => (
              <TableRow key={i}>
                <TableCell>{i + 1}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.price?.toLocaleString()} so'm</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2}>Umumiy narx (so‘m)</TableCell>
              <TableCell>{total?.toLocaleString()} so‘m</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      <div className="w-full lg:w-[40%] max-h-[90vh] min-h-[90vh] overflow-auto relative">
        <div className="sticky left-0 top-0 bg-white dark:bg-[#0a0a0a] px-3 py-2 z-10">
          <Label>
            Xizmatlar <span className="text-red-500">*</span>
          </Label>
          <div className="mb-3">
            <Input
              type="text"
              disabled={loading}
              placeholder="Qidirish...."
              onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
            />
          </div>
        </div>
        <div className="flex flex-col px-3 space-y-2">
          <div className="flex flex-wrap flex-col ">
            {services
              .filter((s) => s.name.toLowerCase().includes(searchTerm))
              .map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-2 cursor-pointer border-b p-2 hover:bg-muted"
                >
                  <Checkbox
                    disabled={loading}
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
      <div id="printableDiv" className="print-area  mx-auto hidden">
        <div className="p-2 gap-2 items-center justify-items-center">
          <div className="w-[100px] h-[100px] relative">
            <img src={"/logo.png"} alt="" className="object-contain" />
          </div>
          <div className="text-sm font-bold text-center">
            <p>Tel: 998 88 254 77 75</p>
            <p>Namangan, Norin, Norinkapa MFY, Mustaqilliq 67-uy</p>
          </div>
        </div>
        <div className="border-y border-dashed text-sm text-center py-2">
          {registerDate && formatDate(registerDate)}
          <p className="font-bold">
            {formData.first_name} {formData.last_name}
          </p>
          <p className="font-bold">ID: {orderNumber}</p>
          <p className="font-bold">Navbat: {navbat + 1}</p>
          <p className="font-bold">{formData.phone}</p>
        </div>
        <div className="py-2">
          <strong>Chegirma</strong>: {formData.discount}%
          <div className="flex item-center justify-between font-bold">
            <h1>Xizmatlar</h1>
            <h1>Sum</h1>
          </div>
          {selectedServiceDetails.map((item, idx) => (
            <div
              className="border-b py-2 flex items-center justify-between"
              key={idx}
            >
              <p>{item.name}</p>
              <p>{item.price?.toLocaleString()} so'm</p>
            </div>
          ))}
        </div>
        <p className="">
          <strong>Jami narx:</strong> {total?.toLocaleString()}
          so‘m
        </p>
      </div>
    </div>
  );
}
