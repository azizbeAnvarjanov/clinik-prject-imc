import { Printer, X } from "lucide-react";
import React from "react";

const PrintableDialog = ({
  registerDate,
  formData,
  orderNumber,
  navbat,
  doctor,
  selectedServiceDetails,
  total,
  open,
  onOpenChange,
}) => {
  return (
    <div
      className="fixed top-0 left-0 w-full h-full dark:bg-black/90 bg-white/90 z-50"
      hidden={!open}
    >
      <div className="flex items-center justify-center h-full">
        <div
          id="printableDiv"
          className="print-area  mx-auto bg-white dark:bg-black p-5 rounded-lg border"
        >
          <div className="flex items-center justify-end">
            <button
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4" />
            </button>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
          <div className="p-2 gap-2 items-center justify-items-center">
            <div className="w-[100px] h-[100px] relative">
              <img src={"/logo.png"} alt="" className="object-contain" />
            </div>
            <div className="text-sm font-bold text-center">
              <p>Direkotor: +998 97 812 46 46</p>
              <p>Call Center: +998 95 120 61 61</p>
              <p>Namangan, Norin, Norinkapa MFY, Mustaqilliq 67-uy</p>
            </div>
          </div>
          <div className="border-y border-dashed border-gray-300 dark:border-gray-700 text-sm text-center py-2">
            {registerDate && registerDate}
            <p className="font-bold">
              Bemor: {formData.first_name} {formData.last_name}
            </p>
            <p className="font-bold mb-1">
              Bemor tug'ilgan sana: {formData.birth_date}
            </p>
            <p className="font-bold">ID: {orderNumber}</p>
            <p className="font-bold">Navbat: {navbat + 1}</p>
            <p className="font-bold">Telefon raqami: {formData.phone}</p>
          </div>
          <div className="py-2">
            <p className="font-bold mt-1">Shifokor: {doctor?.full_name}</p>
            <p className="font-bold mt-1">Chegirma:{formData.discount}%</p>
            <div className="flex item-center justify-between font-bold">
              <h1>Xizmatlar</h1>
              <h1>Sum</h1>
            </div>
            {selectedServiceDetails.map((item, idx) => (
              <div
                className="border-b py-2 flex items-center justify-between border-gray-300 dark:border-gray-700"
                key={idx}
              >
                <p>{item.name}</p>
                <p>{item.price?.toLocaleString()} so'm</p>
              </div>
            ))}
          </div>
          <p className="">
            <strong>Jami narx:</strong> {total?.toLocaleString()}
            so‘m
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrintableDialog;
