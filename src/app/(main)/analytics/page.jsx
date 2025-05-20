import BackBTN from "@/components/BackBTN";
import DepartmentExpenseSummary from "@/components/DepartmentExpenseSummary";
import DistrictAnalytics from "@/components/DistrictAnalytics";
import GenderAnalytics from "@/components/GenderAnalytics";
import MonthlyAnalytics from "@/components/MonthlyAnalytics";
import RegionAnalytics from "@/components/RegionAnalytics";
import TopServicesAnalytics from "@/components/TopServicesAnalytics";
import React from "react";
// RegionAnalytics
const AnalyticsPage = () => {
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <BackBTN />
        <h1 className="text-3xl font-medium">Top xizmatlar</h1>
      </div>
      <div className="grid grid-cols-2 gap-10">
        <TopServicesAnalytics />
        <div className="space-y-10">
          <RegionAnalytics />
          <DistrictAnalytics />
          <GenderAnalytics />
        </div>
      </div>
      <br />
      <DepartmentExpenseSummary />
      <br />
      <MonthlyAnalytics />
      <br />
    </div>
  );
};

export default AnalyticsPage;
