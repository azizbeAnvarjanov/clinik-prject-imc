// app/private/page.tsx

import DoctorBonusAnalytics from "@/components/DoctorBonusAnalytics";
import RegisterPage from "../(registrator)/register/page";
import { getCurrentUserWithStudent } from "../hooks/getCurrentUserWithStudent";

export default async function PrivatePage() {
  const { user, employee } = await getCurrentUserWithStudent();

  return (
    <div>
      <RegisterPage />
      <DoctorBonusAnalytics />
    </div>
  );
}
