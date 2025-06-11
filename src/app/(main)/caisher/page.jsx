"use client";
import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableHeader,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import {
  BanknoteArrowDown,
  BanknoteArrowUp,
  ChartArea,
  ChartCandlestick,
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  PanelRightOpen,
  RefreshCw,
  Wallet,
  X,
} from "lucide-react";
import CostSheet from "@/components/CostSheet";
import toast from "react-hot-toast";
import { CancelPatientDialog } from "@/components/CancelPatientDialog";
import Link from "next/link";

const statusColors = {
  unpaid: "text-red-500",
  has_been_paid: "text-green-500",
  partially_paid: "text-yellow-500",
  refund: "text-gray-500",
};

const STATUSES = [
  { value: "unpaid", label: "To‘lanmagan" },
  { value: "has_been_paid", label: "To‘liq to‘langan" },
  { value: "partially_paid", label: "Qisman to‘langan" },
  { value: "refund", label: "Qaytarilgan" },
];

export default function CashierPage() {
  const supabase = createClient();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSheetId, setOpenSheetId] = useState(null);
  const [payAmount, setPayAmount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(""); // "cash" yoki "card"
  const [page, setPage] = useState(1);
  const [doctorFilter, setDoctorFilter] = useState("");
  const [doctors, setDoctors] = useState([]);
  const perPage = 11;
  const [totalCount, setTotalCount] = useState(0);

  const getStatusLabel = (value) => {
    const status = STATUSES.find((s) => s.value === value);
    return status ? status.label : value;
  };

  const fetchRegistrations = async () => {
    let query = supabase.from("registrations").select(
      `
      id, order_number, total_amount, discount, paid, status, created_at, cash, card, refund_description,
      registrations_services:id (*),
      patient:patient_id (first_name, last_name),
      doctor:doctor_id (full_name)
      `,
      { count: "exact" }
    );

    if (orderSearch) {
      const parsedNumber = parseInt(orderSearch, 10);
      if (!isNaN(parsedNumber)) {
        query = query.eq("order_number", parsedNumber);
      }
    }

    if (doctorFilter) {
      query = query.eq("doctor_id", doctorFilter);
    }

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    query = query
      .order("created_at", { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error(error);
      return;
    }

    setRegistrations(data || []);
    setTotalCount(count || 0);
  };

  const fetchDoctors = async () => {
    const { data, error } = await supabase.from("doctors").select("*");

    if (error) {
      console.error(error);
      return;
    }

    setDoctors(data || []);
  };

  // 🔁 Ma'lumotni birinchi yuklash
  useEffect(() => {
    setLoading(false);
    fetchRegistrations();
    fetchDoctors();
  }, [orderSearch, statusFilter, page, doctorFilter]);

  // 🔔 Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("realtime:registrations")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "registrations",
        },
        (payload) => {
          console.log("Yangi yozuv qo‘shildi:", payload.new);
          // Yangi yozuv qo‘shilganda ro'yxatni qayta yuklaymiz
          fetchRegistrations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handlePayment = async (registration) => {
    const remaining =
      Number(registration.total_amount) - Number(registration.paid || 0);

    if (
      payAmount <= 0 ||
      payAmount > remaining ||
      (paymentMethod !== "cash" && paymentMethod !== "card")
    )
      return;

    setProcessing(true);

    const prevPaid = Number(registration.paid || 0);
    const newPaid = prevPaid + payAmount;

    const updateData = {
      paid: newPaid,
      status:
        newPaid >= Number(registration.total_amount)
          ? "has_been_paid"
          : "partially_paid",
      payment_method: paymentMethod,
    };

    if (paymentMethod === "cash") {
      updateData.cash = Number(registration.cash || 0) + payAmount;
    } else if (paymentMethod === "card") {
      updateData.card = Number(registration.card || 0) + payAmount;
    }

    const { error } = await supabase
      .from("registrations")
      .update(updateData)
      .eq("id", registration.id);

    setProcessing(false);
    setPayAmount(0);
    setPaymentMethod("");

    if (!error) {
      setOpenSheetId(null); // Sheet yopilsin
      fetchRegistrations(); // Yangilansin
    }
  };

  const totalPages = Math.ceil(totalCount / perPage);

  console.log(registrations);

  return (
    <div className="pb-10">
      <div className="flex flex-wrap gap-2 items-center mb-3 text-sm">
        <Button onClick={fetchRegistrations}>
          Yangilash
          <RefreshCw />
        </Button>
        {(orderSearch || statusFilter || doctorFilter) && (
          <Button
            variant={"destructive"}
            onClick={() => {
              setOrderSearch("");
              setStatusFilter("");
              setDoctorFilter("");
              setPage(1);
            }}
          >
            <X />
            Filtrni tozalash
          </Button>
        )}
        <CostSheet />
        <div className="ml-auto flex items-center gap-3">
          <Link
            className="py-1.5 px-3 rounded-md border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 cursor-pointer flex items-center gap-1"
            href={"/balance"}
          >
            <Wallet size={16} className="opacity-60" aria-hidden="true" />
            Balans
          </Link>
          <Link
            className="py-1.5 px-3 rounded-md border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 cursor-pointer flex items-center gap-1"
            href={"/doctor-bonuses"}
          >
            <ChartArea size={16} className="opacity-60" aria-hidden="true" />
            Shifokorlar hisoboti
          </Link>
          <Link
            className="py-1.5 px-3 rounded-md border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 cursor-pointer flex items-center gap-1"
            href={"/analytics"}
          >
            <ChartNoAxesCombined
              size={16}
              className="opacity-60"
              aria-hidden="true"
            />
            Analitika
          </Link>
          <Link
            className="py-1.5 px-3 rounded-md border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 cursor-pointer flex items-center gap-1"
            href={"/expenses"}
          >
            <ChartCandlestick
              size={16}
              className="opacity-60"
              aria-hidden="true"
            />
            Xarajatlar
          </Link>
        </div>
      </div>

      <Table className="relative">
        <TableHeader className="sticky left-0 top-0">
          <TableRow>
            <TableCell className={"w-[50px]"}>ID</TableCell>
            <TableCell>Bemor</TableCell>
            <TableCell>Shifokor</TableCell>
            <TableCell>Jami</TableCell>
            <TableCell>Chegirma</TableCell>
            <TableCell>To'langan</TableCell>
            <TableCell className="w-[150px]">Status</TableCell>
            <TableCell>Sana</TableCell>
            <TableCell className="w-[60px]">Amallar</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className={"w-[50px]"}>
              <Input
                size={"sm"}
                placeholder="0"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-[50px] text-sm"
              />
            </TableCell>
            <TableCell></TableCell>
            <TableCell>
              <Select
                size={"sm"}
                value={doctorFilter}
                onValueChange={(val) => setDoctorFilter(val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Shifokor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
            <TableCell>
              <Select
                size={"sm"}
                value={statusFilter}
                onValueChange={(val) => setStatusFilter(val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={9}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            : registrations.map((reg) => (
                <TableRow key={reg.id}>
                  <TableCell>{reg.order_number}</TableCell>
                  <TableCell>
                    {reg.patient?.first_name} {reg.patient?.last_name}
                  </TableCell>
                  <TableCell>{reg.doctor?.full_name}</TableCell>
                  <TableCell>
                    {reg.total_amount?.toLocaleString()} so'm
                  </TableCell>
                  <TableCell>{reg.discount || 0}%</TableCell>
                  <TableCell>
                    {Number(reg.paid)?.toLocaleString() || 0} so'm
                  </TableCell>
                  <TableCell className={cn(statusColors[reg.status] || "")}>
                    {getStatusLabel(reg.status)}
                  </TableCell>
                  <TableCell>
                    {new Date(reg.created_at).toLocaleString("uz-UZ", {
                      timeZone: "Asia/Tashkent",
                    })}
                  </TableCell>
                  <TableCell className={"flex items-center gap-2"}>
                    <Button
                      className={"w-[40px] h-[40px] border-2 rounded-xl"}
                      variant="outline"
                      onClick={() => setOpenSheetId(reg.id)}
                    >
                      <PanelRightOpen />
                    </Button>
                    {reg.status !== "refund" && (
                      <CancelPatientDialog
                        fetchRegistrations={fetchRegistrations}
                        setOpenSheetId={setOpenSheetId}
                        reg={reg}
                      />
                    )}

                    <Sheet
                      open={openSheetId === reg.id}
                      onOpenChange={() => setOpenSheetId(null)}
                    >
                      <SheetContent>
                        <SheetHeader>
                          <SheetTitle>To'lov yoki qaytarish</SheetTitle>
                          <div className="mt-4 text-sm">
                            <p className="flex items-center justify-between border-b p-2">
                              <span>Bemor ID:</span> {reg.order_number}
                            </p>
                            <p className="flex items-center justify-between border-b p-2">
                              <span>Jami to'lov:</span>{" "}
                              {reg.total_amount?.toLocaleString()} so'm
                            </p>
                            <p className="flex items-center justify-between border-b p-2">
                              <span>To'langan: </span>
                              {Number(reg.paid)?.toLocaleString() || 0} so'm
                            </p>
                            <p className="flex items-center justify-between border-b p-2">
                              <span>Qoldiq: </span>
                              {(
                                reg.total_amount - reg.paid
                              )?.toLocaleString()}{" "}
                              so'm
                            </p>
                            <br />

                            {reg.status === "refund" && (
                              <div>
                                <h1 className="text-gray-500 mb-1 text-xl">
                                  Qaytarilgan sababi:
                                </h1>
                                {reg.refund_description}
                              </div>
                            )}

                            {["unpaid", "partially_paid"].includes(
                              reg.status
                            ) && (
                              <div className="space-y-2">
                                <h1 className="flex gap-3 items-center">
                                  Qabul qilish{" "}
                                  <BanknoteArrowDown color="green" />
                                </h1>
                                <p>To'lov turi</p>
                                <Select
                                  value={paymentMethod}
                                  onValueChange={setPaymentMethod}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="To'lov turini tanlang" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem
                                      value="cash"
                                      className={"hover:bg-muted"}
                                    >
                                      Naqd
                                    </SelectItem>
                                    <SelectItem
                                      value="card"
                                      className={"hover:bg-muted"}
                                    >
                                      Plastik
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <p>To'lov miqdori</p>

                                <Input
                                  type="number"
                                  placeholder="Qancha to'lov qabul qilinmoqda"
                                  className={
                                    payAmount > reg.total_amount - reg.paid
                                      ? "border-red-500"
                                      : ""
                                  }
                                  value={payAmount || ""}
                                  onChange={(e) =>
                                    setPayAmount(
                                      e.target.value === ""
                                        ? 0
                                        : parseInt(e.target.value)
                                    )
                                  }
                                />
                                <Button
                                  disabled={
                                    processing ||
                                    payAmount <= 0 ||
                                    payAmount > reg.total_amount - reg.paid
                                  }
                                  onClick={() => handlePayment(reg)}
                                  className="w-full mt-2"
                                >
                                  {processing
                                    ? "Yuklanmoqda..."
                                    : "To'lovni qabul qilish"}
                                </Button>
                              </div>
                            )}
                          </div>
                        </SheetHeader>
                      </SheetContent>
                    </Sheet>
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
      <br />
      <div className="font-medium text-center">Bemorlar soni {totalCount}</div>

      <div className="flex gap-2 items-center justify-center mt-3">
        <Button
          className="w-[37px] h-[37px]"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          <ChevronLeft />
        </Button>

        <div className="flex gap-2 items-center">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const startPage = Math.max(1, Math.min(page - 2, totalPages - 4));
            const pageNumber = startPage + i;

            return (
              <Button
                key={pageNumber}
                className={"w-[37px] h-[37px]"}
                variant={page === pageNumber ? "default" : "outline"}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </Button>
            );
          })}
        </div>

        <Button
          className="w-[37px] h-[37px]"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
