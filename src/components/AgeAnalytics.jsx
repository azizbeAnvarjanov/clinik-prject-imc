"use client";

import { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { ChartColumnBig } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function AgeAnalytics() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: registrations, error } = await supabase
        .from("registrations")
        .select("id, created_at, patient:patient_id (birth_date)");

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      const today = new Date();
      const ageGroups = {};
      let unknownAgeCount = 0;

      registrations.forEach((r) => {
        const birthdate = r.patient?.birth_date;
        if (!birthdate) {
          unknownAgeCount++;
          return;
        }

        const birth = new Date(birthdate);
        if (isNaN(birth.getTime())) {
          unknownAgeCount++;
          return;
        }

        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        const dayDiff = today.getDate() - birth.getDate();

        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
          age--;
        }

        const lowerBound = Math.floor(age / 5) * 5;
        const upperBound = lowerBound + 5;
        const label = `${lowerBound}-${upperBound}`;

        ageGroups[label] = (ageGroups[label] || 0) + 1;
      });

      const result = Object.entries(ageGroups)
        .map(([range, count]) => ({ range, count }))
        .sort((a, b) => {
          const aStart = parseInt(a.range.split("-")[0], 10);
          const bStart = parseInt(b.range.split("-")[0], 10);
          return aStart - bStart;
        });

      if (unknownAgeCount > 0) {
        result.push({ range: "Nomaʼlum", count: unknownAgeCount });
      }

      setData(result);
      setLoading(false);
    };

    fetchData();
  }, []);

  const max = data[0]?.count || 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <ChartColumnBig color="#155dfc" />
          Yoshlarga ko‘ra analitika
        </h2>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div className="flex items-center gap-2" key={i}>
              <Skeleton className="w-32 h-4" />
              <Skeleton className="flex-1 h-4" />
              <Skeleton className="w-10 h-4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3 overflow-hidden">
          {data.map((item) => (
            <div
              key={item.range}
              className="flex items-center justify-between p-2 gap-3 border-b"
            >
              <div className="w-32 text-sm font-medium">{item.range} yosh</div>

              <div className="w-10 text-right text-sm font-semibold">
                {item.count}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
