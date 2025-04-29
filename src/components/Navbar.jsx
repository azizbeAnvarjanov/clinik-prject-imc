"use client";

import { useEmployee } from "@/app/context/EmployeeContext";
import AvatarNavbar from "./AvatarNavbar";
import { Skeleton } from "./ui/skeleton";
import Link from "next/link";
import Image from "next/image";
import { ModeToggle } from "./ModeToggle";

export default function Navbar() {
  const { user, employee, loading } = useEmployee();

  if (loading) return <Skeleton className="h-16 border-b"></Skeleton>;
  if (!employee) return <div>No student data</div>;

  return (
    <nav className="bg-white dark:bg-[#0a0a0a] shadow-sm fixed left-0 top-0 w-full z-50 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="w-full border-gray-300 h-[7vh] flex items-center px-2">
            <Link href={"/"} className="w-[50px] h-[50px] flex relative">
              <Image src={"/logo.png"} alt="" fill className="object-contain" />
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <AvatarNavbar user={user} employee={employee} />
            <ModeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
