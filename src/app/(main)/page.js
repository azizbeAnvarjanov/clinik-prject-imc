// app/private/page.tsx

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
      <RegisterPage />
    </div>
  );
}
