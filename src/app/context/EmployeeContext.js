"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const EmployeeContext = createContext(null);
// employee

export function EmployeeProvider({ children }) {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchEmployee() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setUser(user);
          const { data: employeeData, error } = await supabase
            .from("employees")
            .select("*")
            .eq("employee_id", user.id)
            .single();

          if (error) {
            console.error("Error fetching employee:", error);
          } else {
            setEmployee(employeeData);
          }
        }
      } catch (error) {
        console.error("Error in fetchEmployee:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchEmployee();
  }, []);

  return (
    <EmployeeContext.Provider value={{ user, employee, loading }}>
      {children}
    </EmployeeContext.Provider>
  );
}

export function useEmployee() {
  const context = useContext(EmployeeContext);
  if (context === undefined) {
    throw new Error("useStudent must be used within a EmployeeProvider");
  }
  return context;
}
