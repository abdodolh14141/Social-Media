"use client";

import { SessionProvider } from "next-auth/react";
import { Session } from "next-auth";

interface ProviderSessionProps {
  children: React.ReactNode;
  session?: Session | null;
}

export default function ProviderSession({ children, session }: ProviderSessionProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
