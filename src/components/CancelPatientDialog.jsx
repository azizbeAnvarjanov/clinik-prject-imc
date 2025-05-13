"use client";
import { useEffect, useState } from "react";
import { Copy, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";

export function CancelPatientDialog({
  fetchRegistrations,
  setOpenSheetId,
  reg,
}) {
  const [refundDescription, setRefundDescription] = useState("");
  const supabase = createClient();

  const handleRefund = async (registration) => {
    if (!refundDescription) {
      toast.error("Qaytarish sababini yozing !");
      return;
    }

    await supabase
      .from("registrations")
      .update({
        paid: 0,
        status: "refund",
        refund_description: refundDescription,
        cash: 0,
        card: 0,
      })
      .eq("id", registration.id);

    setOpenSheetId(null);
    setRefundDescription("");
    fetchRegistrations();
  };
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={"w-[40px] h-[40px] !border-red-500 border-2 rounded-xl"}
        >
          {" "}
          <X />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bekor qilish</DialogTitle>
          <DialogDescription>
            Bekor qilishni sababini kiriting
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Input
              value={refundDescription}
              onChange={(e) => setRefundDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-start">
          <Button
            disabled={!refundDescription}
            onClick={() => handleRefund(reg)}
            type="button"
          >
            Bekor qilish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
