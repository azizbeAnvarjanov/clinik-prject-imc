"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  TableHeader,
} from "@/components/ui/table";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { createClient } from "@/utils/supabase/client";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { DialogTitle } from "@/components/ui/dialog";

export default function CashierPage() {
  const [groupedRegistrations, setGroupedRegistrations] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchGroupedRegistrations();
  }, []);

  const fetchGroupedRegistrations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("registrations")
      .select(
        "*, patients(first_name,last_name), doctors(full_name, bonus_percent), services(name, price)"
      )
      .in("status", ["to'lanmagan", "kam to'landi"]);

    if (error) {
      console.error(error);
      toast.error("Xatolik: Ma'lumotlar olinmadi");
      setLoading(false);
      return;
    }

    const grouped = Object.values(
      data.reduce((acc, item) => {
        const key = item.order_number;
        if (!acc[key]) {
          acc[key] = {
            order_number: key,
            patient: item.patients,
            discount: item.discount || 0,
            items: [],
            doctors: [],
          };
        }
        acc[key].items.push(item);
        acc[key].doctors.push(item.doctors);
        return acc;
      }, {})
    );

    setGroupedRegistrations(grouped);
    setLoading(false);
  };

  const handlePayment = async () => {
    const group = selectedGroup;
    if (!group || !amountPaid || amountPaid <= 0) {
      return toast.error("To‘lov summasi noto‘g‘ri kiritilgan");
    }

    const total = group.items.reduce((sum, r) => sum + r.total_amount, 0);
    const discountAmount = (total * (group.discount || 0)) / 100;
    const amountToPay = total - discountAmount;
    const remainingAmount = amountToPay - amountPaid;

    const { error: paymentError } = await supabase.from("payments").insert({
      order_number: group.order_number,
      amount_paid: amountPaid,
      payment_method: paymentMethod,
      paid_at: new Date().toISOString(),
    });

    if (paymentError) {
      console.error(paymentError);
      return toast.error("To‘lovni yozishda xatolik");
    }

    const status = remainingAmount <= 0 ? "paid" : "kam to'landi";

    for (const r of group.items) {
      await supabase
        .from("registrations")
        .update({ status, paid: new Date().toISOString() })
        .eq("id", r.id);

      const bonusAmount = (r.services.price * r.doctors.bonus_percent) / 100;
      await supabase.from("bonuses").insert({
        registration_id: r.id,
        doctor_id: r.doctor_id,
        service_id: r.service_id,
        bonus_amount: bonusAmount,
        calculated_at: new Date().toISOString(),
        paid: false,
      });
    }

    toast.success("To‘lov qabul qilindi");
    setSelectedGroup(null);
    fetchGroupedRegistrations();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">💳 Kassir sahifasi</h1>

      {loading ? (
        <p>Yuklanmoqda...</p>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Bemor</TableCell>
                  <TableCell>Xizmatlar</TableCell>
                  <TableCell>Chegirma</TableCell>
                  <TableCell>To‘lash kerak</TableCell>
                  <TableCell>Amal</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedRegistrations.map((group, index) => {
                  const total = group.items.reduce(
                    (sum, r) => sum + r.total_amount,
                    0
                  );
                  const discountAmount = (total * (group.discount || 0)) / 100;
                  const toPay = total - discountAmount;
                  return (
                    <TableRow key={group.order_number}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{group.order_number}</TableCell>
                      <TableCell>
                        {group.patient.first_name} {group.patient.last_name}
                      </TableCell>
                      <TableCell>
                        <ul className="list-disc pl-4">
                          {group.items.map((r) => (
                            <li key={r.id}>
                              {r.services.name} (
                              {r.total_amount?.toLocaleString()} so'm)
                            </li>
                          ))}
                        </ul>
                      </TableCell>
                      <TableCell>{group.discount}%</TableCell>
                      <TableCell>{toPay.toLocaleString()} so'm</TableCell>
                      <TableCell>
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button onClick={() => setSelectedGroup(group)}>
                              To‘lov qilish
                            </Button>
                          </SheetTrigger>
                          <SheetContent>
                            <DialogTitle></DialogTitle>
                            <div className="space-y-4">
                              <h2 className="text-lg font-semibold">
                                To‘lov ma'lumotlari
                              </h2>
                              <p>
                                To‘lash kerak:{" "}
                                <strong>{toPay.toLocaleString()} so'm</strong>
                              </p>
                              <Label>To‘lov usuli</Label>
                              <Select
                                value={paymentMethod}
                                onValueChange={setPaymentMethod}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="cash">Naqd</SelectItem>
                                  <SelectItem value="card">Plastik</SelectItem>
                                </SelectContent>
                              </Select>

                              <Label>Qancha to‘landi</Label>
                              <Input
                                type="number"
                                value={amountPaid}
                                onChange={(e) =>
                                  setAmountPaid(parseInt(e.target.value))
                                }
                              />

                              <p>
                                Qoldiq:{" "}
                                <strong>
                                  {Math.max(
                                    0,
                                    toPay - amountPaid
                                  ).toLocaleString()}{" "}
                                  so'm
                                </strong>
                              </p>

                              <Button onClick={handlePayment}>
                                To‘lovni qabul qilish
                              </Button>
                            </div>
                          </SheetContent>
                        </Sheet>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
