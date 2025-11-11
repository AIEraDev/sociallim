import { ReactNode } from "react";
import { AuthGuard } from "@/components/auth";

export default function layout({ children }: { children: ReactNode }) {
  return <AuthGuard redirectTo="/auth/?screen=sign-in">{children}</AuthGuard>;
}
