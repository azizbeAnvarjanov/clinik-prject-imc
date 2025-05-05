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
import { BanknoteArrowDown, RefreshCw } from "lucide-react";

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
  const [refundAmount, setRefundAmount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 11;
  const [totalCount, setTotalCount] = useState(0);

  const getStatusLabel = (value) => {
    const status = STATUSES.find((s) => s.value === value);
    return status ? status.label : value;
  };

  const fetchRegistrations = async () => {
    setLoading(true);

    let query = supabase.from("registrations").select(
      `id, order_number, total_amount, discount, paid, status, created_at,
        patient:patient_id (first_name, last_name),
        doctor:doctor_id (full_name)`,
      { count: "exact" }
    );

    if (orderSearch) {
      const parsedNumber = parseInt(orderSearch, 10);
      if (!isNaN(parsedNumber)) {
        query = query.eq("order_number", parsedNumber);
      }
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
      setLoading(false);
      return;
    }

    setRegistrations(data || []);
    setTotalCount(count || 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchRegistrations();
  }, [orderSearch, statusFilter, page]);

  const handlePayment = async (registration) => {
    const remaining =
      Number(registration.total_amount) - Number(registration.paid || 0);

    if (payAmount <= 0 || payAmount > remaining) return;

    setProcessing(true);

    const newPaid = Number(registration.paid || 0) + payAmount;
    const newStatus =
      newPaid >= Number(registration.total_amount)
        ? "has_been_paid"
        : "partially_paid";

    await supabase
      .from("registrations")
      .update({ paid: newPaid.toString(), status: newStatus })
      .eq("id", registration.id);

    setProcessing(false);
    setOpenSheetId(null);
    setPayAmount(0);
    fetchRegistrations();
  };

  const handleRefund = async (registration) => {
    if (refundAmount <= 0 || refundAmount > registration.paid) return;

    const newPaid = Number(registration.paid || 0) - refundAmount;

    await supabase
      .from("registrations")
      .update({ paid: newPaid.toString(), status: "refund" })
      .eq("id", registration.id);

    setOpenSheetId(null);
    setRefundAmount(0);
    fetchRegistrations();
  };

  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <div className="">
      <div className="flex flex-wrap gap-2 items-center mb-3 text-sm">
        <Button size={"sm"} onClick={fetchRegistrations}>
          Yangilash
          <RefreshCw />
        </Button>
        {(orderSearch || statusFilter) && (
          <Button
            size={"sm"}
            onClick={() => {
              setOrderSearch("");
              setStatusFilter("");
              setPage(1);
            }}
          >
            Filtrni tozalash
          </Button>
        )}
        <div className="ml-auto font-medium">Bemorlar soni {totalCount}</div>
      </div>

      <Table className="relative">
        <TableHeader className="sticky left-0 top-0">
          <TableRow>
            <TableCell className={"w-[50px]"}>ID</TableCell>
            <TableCell>Bemor</TableCell>
            <TableCell>Shifokor</TableCell>
            <TableCell>Jami</TableCell>
            <TableCell>Chegirma</TableCell>
            <TableCell>Tulangan</TableCell>
            <TableCell className="w-[150px]">Status</TableCell>
            <TableCell>Sana</TableCell>
            <TableCell className="w-[50px]">Amallar</TableCell>
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
            <TableCell></TableCell>
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
                    {new Date(reg.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      className={"w-full"}
                      variant="outline"
                      onClick={() => setOpenSheetId(reg.id)}
                    >
                      <BanknoteArrowDown />
                    </Button>
                    <Sheet
                      open={openSheetId === reg.id}
                      onOpenChange={() => setOpenSheetId(null)}
                    >
                      <SheetContent>
                        <SheetHeader>
                          <SheetTitle>To'lov yoki qaytarish</SheetTitle>
                          <div className="mt-4 space-y-2">
                            <p>
                              Jami to'lov: {reg.total_amount?.toLocaleString()}{" "}
                              so'm
                            </p>
                            <p>
                              Tulangan:{" "}
                              {Number(reg.paid)?.toLocaleString() || 0} so'm
                            </p>
                            <p>
                              Qoldiq:{" "}
                              {(reg.total_amount - reg.paid)?.toLocaleString()}{" "}
                              so'm
                            </p>
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
                            {reg.paid > 0 && (
                              <>
                                <Input
                                  type="number"
                                  placeholder="Qancha qaytarilmoqda"
                                  className={
                                    refundAmount > reg.paid
                                      ? "border-red-500"
                                      : ""
                                  }
                                  value={refundAmount || ""}
                                  onChange={(e) =>
                                    setRefundAmount(
                                      e.target.value === ""
                                        ? 0
                                        : parseInt(e.target.value)
                                    )
                                  }
                                />
                                <Button
                                  disabled={
                                    refundAmount <= 0 || refundAmount > reg.paid
                                  }
                                  onClick={() => handleRefund(reg)}
                                  className="w-full"
                                >
                                  To'lovni qaytarish
                                </Button>
                              </>
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

      <div className="flex justify-between items-center mt-6">
        <Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Ortga
        </Button>
        <div className="flex gap-2 items-center">
          {Array.from({ length: totalPages }, (_, i) => (
            <Button
              key={i + 1}
              variant={page === i + 1 ? "default" : "outline"}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
        </div>
        <Button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Keyingi
        </Button>
      </div>
    </div>
  );
}
