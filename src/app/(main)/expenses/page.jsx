import AxpencesPage from "@/components/AxpencesPage";
import BackBTN from "@/components/BackBTN";
import React from "react";

const page = () => {
  return (
    <div>
      <header className="flex items-center gap-3">
        <BackBTN />
        <h1 className="font-medium text-2xl">Harajatlar</h1>
      </header>
      <AxpencesPage />
    </div>
  );
};

export default page;
