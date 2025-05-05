// app/private/page.tsx

import DoctorBonusAnalytics from "@/components/DoctorBonusAnalytics";
import RegisterPage from "../(registrator)/register/page";
import { getCurrentUserWithStudent } from "../hooks/getCurrentUserWithStudent";
import { redirect } from "next/navigation";

export default async function PrivatePage() {
  const { user, employee } = await getCurrentUserWithStudent();

  if (employee.department === "Kassa") {
    redirect("/caisher");
  }

  return (
    <div>
      <h1>{employee.department}</h1>
      <h1>{employee.fio}</h1>
      {/* <RegisterPage /> */}
      {/* <DoctorBonusAnalytics /> */}
    </div>
  );
}
