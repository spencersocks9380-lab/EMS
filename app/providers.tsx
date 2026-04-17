"use client";

import type { ReactNode } from "react";
import { SaasProvider } from "@saas-ui/react";

export function Providers({ children }: { children: ReactNode }) {
  return <SaasProvider>{children}</SaasProvider>;
}
