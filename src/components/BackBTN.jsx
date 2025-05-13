"use client";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { ChevronLeft } from "lucide-react";

export default function BackBTN() {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/"); // yoki istalgan default sahifa
    }
  };

  return (
    <Button
      variant={"outline"}
      className={"w-[35px] h-[35px]"}
      onClick={handleBack}
      size={"sm"}
    >
      <ChevronLeft />
    </Button>
  );
}
