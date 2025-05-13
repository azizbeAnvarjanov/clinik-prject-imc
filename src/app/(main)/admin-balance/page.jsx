import AdminBalancePage from "@/components/AdminBalancePage";
import DoctorReportPage from "@/components/DoctorReportPage";
import TopServicesAnalytics from "@/components/TopServicesAnalytics";
import React from "react";

const Admin = () => {
  return (
    <div>
      <AdminBalancePage />
      <DoctorReportPage />
      <TopServicesAnalytics />
    </div>
  );
};

export default Admin;
