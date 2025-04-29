import RegistrationsTable from "@/components/RegistrationsTable";
import { createClient } from "@/utils/supabase/client";
import React from "react";

const REGUSERS = async () => {
  const supabase = createClient();

//   const { data, error } = await supabase.from("today_doctor_stats").select("*");
//   const { data: analiticData, error: analiticDataError } = await supabase
//     .from("doctor_registration_analytics")
//     .select("*");
//   console.log(data);

  return (
    <div>
      {/* <div className="grid items-center grid-cols-3 gap-2 mb-4">
        {data?.map((doc) => (
          <div
            key={doc.doctor_id}
            className="border p-3 rounded-md flex items-center justify-between"
          >
            <p>{doc.doctor_name}</p> {doc.patient_count}
          </div>
        ))}
        {analiticData?.map((doc) => (
          <div key={doc.doctor_id} className="p-4 border rounded mb-2">
            <h2 className="font-bold">{doc.doctor_name}</h2>
            <p>Bugungi qabul: {doc.today_count}</p>
            <p>So‘nggi 7 kun: {doc.last_7_days_count}</p>
            <p>Joriy oyda: {doc.this_month_count}</p>
          </div>
        ))}
      </div> */}

      <RegistrationsTable />
    </div>
  );
};

export default REGUSERS;
