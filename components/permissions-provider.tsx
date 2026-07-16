"use client";

import { createContext, useContext } from "react";
import type { PermMap } from "@/lib/permissions";
import type { ModuleId } from "@/lib/modules";

type Ctx = { permissions: PermMap; isAdmin: boolean };
const PermissionsContext = createContext<Ctx>({ permissions: {}, isAdmin: false });

export function PermissionsProvider({
  permissions,
  isAdmin,
  children,
}: {
  permissions: PermMap;
  isAdmin: boolean;
  children: React.ReactNode;
}) {
  return (
    <PermissionsContext.Provider value={{ permissions, isAdmin }}>
      {children}
    </PermissionsContext.Provider>
  );
}

// can(module, cap): user có quyền đó không (admin luôn có)
export function useCan() {
  const { permissions, isAdmin } = useContext(PermissionsContext);
  return (module: ModuleId, cap: string) =>
    isAdmin || (permissions[module] ?? []).includes(cap);
}

// Câu tooltip khi nút bị khóa do thiếu quyền
export const NO_PERM = "Bạn không có quyền thực hiện thao tác này";
