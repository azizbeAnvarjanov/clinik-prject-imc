import React from "react";
import { Checkbox } from "./ui/checkbox";

const ServicesPageComponent = ({
  services,
  searchTerm,
  loading,
  selectedServices,
  handleCheckboxChange,
  doctor,
}) => {
  const filteredServices = services
    .filter((s) =>
      !doctor?.department_id || s.department === doctor.department_id
    )
    .filter((s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="flex flex-wrap flex-col">
      {filteredServices.map((s) => (
        <label
          key={s.id}
          className="flex items-center gap-2 cursor-pointer border-b p-2 hover:bg-muted"
        >
          <Checkbox
            disabled={loading}
            checked={selectedServices.includes(s.id)}
            onCheckedChange={() => handleCheckboxChange(s.id)}
          />
          <div className="flex items-center justify-between w-full">
            <span>{s.name}</span>
            {s.price?.toLocaleString()}
          </div>
        </label>
      ))}
    </div>
  );
};

export default ServicesPageComponent;
