"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserStatus } from "@/app/generated/prisma/enums";

interface PlayersToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: UserStatus | "ALL";
  onStatusChange: (value: UserStatus | "ALL") => void;
}

export function PlayersToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
}: PlayersToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[var(--ops-text-faint)]" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search username, email, or name…"
          className="pl-8"
        />
      </div>

      <Select
        value={status}
        onValueChange={(v) => onStatusChange(v as UserStatus | "ALL")}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All statuses</SelectItem>
          <SelectItem value={UserStatus.ACTIVE}>Active</SelectItem>
          <SelectItem value={UserStatus.BANNED}>Banned</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
