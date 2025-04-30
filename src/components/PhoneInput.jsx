"use client";
import React, { useId, useState } from "react";
import { ChevronDownIcon, PhoneIcon } from "lucide-react";
import * as RPNInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import flags from "react-phone-number-input/flags";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PhoneInput({ value, onChange }) {
  const id = useId();

  return (
    <div className="*:not-first:mt-2" dir="ltr">
      <Label htmlFor={id}>Telefon raqam</Label>
      <RPNInput.default
        className="flex rounded-md shadow-xs"
        international
        defaultCountry="UZ"
        country="UZ"
        flagComponent={FlagComponent}
        countrySelectComponent={CountrySelect}
        inputComponent={PhoneInputField}
        id={id}
        placeholder="Telefon raqamni kiriting"
        value={value}
        onChange={(newValue) => onChange?.(newValue ?? "")}
      />
    </div>
  );
}

const PhoneInputField = ({ className, ...props }) => {
  return (
    <Input
      data-slot="phone-input"
      className={cn("-ms-px rounded-s-none shadow-none focus-visible:z-10", className)}
      {...props}
    />
  );
};

PhoneInputField.displayName = "PhoneInputField";

const CountrySelect = ({ disabled, value, onChange, options }) => {
  const handleSelect = (event) => {
    onChange(event.target.value);
  };

  return (
    <div className="border-input bg-background text-muted-foreground focus-within:border-ring focus-within:ring-ring/50 hover:bg-accent hover:text-foreground relative inline-flex items-center self-stretch rounded-s-md border py-2 ps-3 pe-2 transition outline-none focus-within:z-10 focus-within:ring-[3px] has-disabled:pointer-events-none has-disabled:opacity-50">
      <div className="inline-flex items-center gap-1" aria-hidden="true">
        <FlagComponent country={value} countryName={value} />
        <span className="text-muted-foreground/80">
          <ChevronDownIcon size={16} aria-hidden="true" />
        </span>
      </div>
      <select
        disabled={disabled}
        value={value}
        onChange={handleSelect}
        className="absolute bg-white dark:bg-[#0a0a0a] inset-0 text-sm opacity-0"
        aria-label="Select country">
        <option key="default" value="">
          Select a country
        </option>
        {options
          .filter((x) => x.value)
          .map((option, i) => (
            <option key={option.value ?? `empty-${i}`} value={option.value}>
              {option.label} +{RPNInput.getCountryCallingCode(option.value)}
            </option>
          ))}
      </select>
    </div>
  );
};

const FlagComponent = ({ country, countryName }) => {
  const Flag = flags[country];
  return (
    <span className="w-5 overflow-hidden rounded-sm">
      {Flag ? <Flag title={countryName} /> : <PhoneIcon size={16} />}
    </span>
  );
};
