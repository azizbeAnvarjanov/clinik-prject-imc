import {
  FileText,
  LayoutTemplate,
  LogOutIcon,
  PanelsTopLeft,
  UserRoundCog,
  Wallet,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/app/(login)/login/actions";
import getInitials from "@/app/hooks/getInitials";
import Link from "next/link";

export default function AvatarNavbar({ user, employee }) {
  const av = getInitials(employee.fio);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
          <Avatar className="flex items-center justify-center bg-muted dark:bg-[#1a1919] border-2 text-sm">
            <div className="">{av}</div>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-w-64">
        <DropdownMenuLabel className="flex min-w-0 flex-col">
          <span className="text-foreground truncate text-sm font-medium">
            {employee.fio}
          </span>
          <span className="text-muted-foreground truncate text-xs font-normal">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/caisher" className="flex items-center">
              <PanelsTopLeft
                size={16}
                className="opacity-60"
                aria-hidden="true"
              />
              <span>Asosiy sahifa</span>
            </Link>
          </DropdownMenuItem>
          {employee.role === "super_admin" && (
            <DropdownMenuItem asChild>
              <Link href="/admin-balance" className="flex items-center">
                <Wallet size={16} className="opacity-60" aria-hidden="true" />
                <span>Admin balans</span>
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link href="/balance" className="flex items-center">
              <Wallet size={16} className="opacity-60" aria-hidden="true" />
              <span>Balans</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/doctor-bonuses" className="flex items-center">
              <FileText size={16} className="opacity-60" aria-hidden="true" />
              <span>Shifokorlar hisoboti</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/analytics" className="flex items-center">
              <LayoutTemplate
                size={16}
                className="opacity-60"
                aria-hidden="true"
              />
              <span>Analitikalar</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuItem onClick={logout} className="cursor-pointer">
          <LogOutIcon size={16} className="opacity-60" aria-hidden="true" />
          <span>Tizimdan chiqish</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
