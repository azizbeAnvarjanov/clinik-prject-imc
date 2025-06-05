"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";
import { DialogTitle } from "./ui/dialog";
import { CircleFadingPlus } from "lucide-react";
import toast from "react-hot-toast";

function CostSheet() {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [sum, setSum] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const bolimlar = [
    {
      name: "AXO",
      id: "001",
    },
    {
      name: "Oshxona",
      id: "002",
    },
    {
      name: "Labaratoriya",
      id: "003",
    },
    {
      name: "Ish haqqi",
      id: "004",
    },
    {
      name: "Elektrik",
      id: "005",
    },
    {
      name: "Musr",
      id: "006",
    },
    {
      name: "Kassa",
      id: "007",
    },
    {
      name: "Registratura",
      id: "008",
    },
    {
      name: "Boshqa chiqimlar",
      id: "009",
    },
  ];

  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase.from("departments").select("*");
      if (data) setDepartments(data);
    };
    fetchDepartments();
  }, []);

  const handleSubmit = async () => {
    if (!selectedDept || !sum || !description) {
      toast.error("Bo'lim va summa to'ldirilishi kerak.");
      return;
    }

    setLoading(true);

    // Step 1: Bugungi to‘langan summa (VIEW orqali)
    const { data: summary, error: summaryError } = await supabase
      .from("daily_registration_summary")
      .select("total_paid")
      .single();

    if (summaryError) {
      toast.error("Mablag'ni olishda xatolik: " + summaryError.message);
      setLoading(false);
      return;
    }

    const totalPaid = parseFloat(summary?.total_paid || 0);

    // Step 2: Bugungi xarajatlar yig'indisini olish
    const today = new Date().toISOString().split("T")[0]; // faqat sana qismi
    const { data: expenses, error: expenseError } = await supabase
      .from("xarajatlar")
      .select("sum, created_at");

    if (expenseError) {
      toast.error("Xarajatlarni olishda xatolik: " + expenseError.message);
      setLoading(false);
      return;
    }

    // Bugungi kunlik xarajatlarni filtrlash
    const todayExpensesTotal =
      expenses
        ?.filter((x) => x.created_at.startsWith(today))
        .reduce((acc, curr) => acc + parseFloat(curr.sum || 0), 0) || 0;

    // Qolgan mablag‘ni hisoblash
    const remainingFunds = totalPaid - todayExpensesTotal;
    const expenseAmount = parseFloat(sum);

    if (expenseAmount > remainingFunds) {
      toast.error(
        `Yetarli mablag‘ yo‘q. Mavjud: ${remainingFunds.toLocaleString()} so‘m`
      );
      setLoading(false);
      return;
    }

    // Step 3: Xarajatni qo‘shish
    const { error } = await supabase.from("xarajatlar").insert({
      department_id: selectedDept,
      sum: expenseAmount,
      description,
    });

    if (error) {
      toast.error("Xatolik: " + error.message);
    } else {
      toast.success("Xarajat muvaffaqiyatli qo'shildi!");
      setSum("");
      setDescription("");
      setSelectedDept("");
    }

    setLoading(false);
  };

  return (
    <Sheet className="">
      <SheetTrigger asChild>
        <Button variant="outline">
          Xarajat qo‘shish <CircleFadingPlus />{" "}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] p-3">
        <DialogTitle>Yangi xarajat</DialogTitle>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Bo‘lim</Label>

            <Select onValueChange={setSelectedDept} value={selectedDept}>
              <SelectTrigger>
                <SelectValue placeholder="Bo‘limni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {bolimlar.map((item, i) => (
                  <SelectItem
                    key={i}
                    className={"hover:bg-muted"}
                    value={item.name}
                  >
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Xarajat summasi (so‘m)</Label>
            <Input
              type="number"
              value={sum}
              onChange={(e) => setSum(e.target.value)}
              placeholder="100000"
            />
          </div>

          <div className="space-y-2">
            <Label>Izoh</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Xarajat haqida qo‘shimcha"
            />
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? "Yuklanmoqda..." : "Saqlash"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default CostSheet;
