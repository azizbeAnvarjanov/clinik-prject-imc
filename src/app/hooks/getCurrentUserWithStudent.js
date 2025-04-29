// app/lib/getCurrentUserWithStudent.ts
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function getCurrentUserWithStudent() {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    redirect("/login"); // foydalanuvchi login qilmagan bo‘lsa
  }

  const { data: employeeData, error: studentError } = await supabase
    .from("employees")
    .select("*")
    .eq("employee_id", userData.user.id)
    .single();
    console.log(employeeData?.fio);
    

  if (studentError || !employeeData) {
    redirect("/error"); // student topilmasa yoki xatolik bo‘lsa
  }

  return {
    user: userData.user,
    employee: employeeData,
  };
}
