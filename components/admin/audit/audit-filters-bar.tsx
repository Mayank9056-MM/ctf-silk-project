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

import {
  AUDIT_CATEGORY_LIST,
  AUDIT_CATEGORY_METADATA,
  type AuditCategory,
} from "@/modules/audit/constants/audit.categories";
import { AuditSeverity } from "@/modules/audit/types/audit.enums";

export interface AuditFilterState {
  searchText: string;
  category: AuditCategory | "ALL";
  severity: AuditSeverity | "ALL";
  success: "ALL" | "true" | "false";
}

interface AuditFiltersBarProps {
  value: AuditFilterState;
  onChange: (value: AuditFilterState) => void;
}

/**
 * Deliberately single-select for category/severity in this pass, even
 * though getAuditSchema accepts arrays for both — a multi-select
 * control (checkboxes-in-a-popover) is real additional UI surface with
 * no spec given for it; single-select covers the common "show me just
 * SECURITY events" triage case without guessing at that design.
 *
 * Each <Select> below is given an explicit generic type argument
 * (<Select<...>>). Base UI's Select.Root is generic over its value
 * type and infers that generic from the value/onValueChange props
 * passed to Root itself. Left unannotated, that inference was
 * collapsing to a single literal member of the union (e.g. just
 * AuditCategory.AUTHENTICATION) instead of the full
 * `AuditCategory | "ALL"` union — a known sharp edge with generic
 * compound-component primitives, not a real narrowing of the data.
 * Pinning the generic explicitly removes the ambiguity.
 *
 * Base UI's Select.Root.onValueChange is always typed as
 * `(value: Value | null) => void`, regardless of the pinned generic —
 * it accommodates selects that support clearing to no selection. None
 * of the three selects below actually offer a clear affordance (every
 * SelectItem, including the "ALL" sentinel, has a real value), so
 * `null` shouldn't occur in practice — but each handler still falls
 * back to "ALL" on `v ?? "ALL"` rather than assuming it away with a
 * cast.
 */
export function AuditFiltersBar({ value, onChange }: AuditFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[var(--ops-text-faint)]" />
        <Input
          value={value.searchText}
          onChange={(e) => onChange({ ...value, searchText: e.target.value })}
          placeholder="Search actor, resource, reason…"
          className="pl-8"
        />
      </div>

      <Select<AuditCategory | "ALL">
        value={value.category}
        onValueChange={(v) => onChange({ ...value, category: v ?? "ALL" })}
      >
        <SelectTrigger className="w-[170px]">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All categories</SelectItem>
          {AUDIT_CATEGORY_LIST.map((category) => (
            <SelectItem key={category} value={category}>
              {AUDIT_CATEGORY_METADATA[category].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select<AuditSeverity | "ALL">
        value={value.severity}
        onValueChange={(v) => onChange({ ...value, severity: v ?? "ALL" })}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="All severities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All severities</SelectItem>
          <SelectItem value={AuditSeverity.INFO}>Info</SelectItem>
          <SelectItem value={AuditSeverity.WARNING}>Warning</SelectItem>
          <SelectItem value={AuditSeverity.CRITICAL}>Critical</SelectItem>
        </SelectContent>
      </Select>

      <Select<"ALL" | "true" | "false">
        value={value.success}
        onValueChange={(v) => onChange({ ...value, success: v ?? "ALL" })}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Outcome" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Any outcome</SelectItem>
          <SelectItem value="true">Succeeded</SelectItem>
          <SelectItem value="false">Failed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}