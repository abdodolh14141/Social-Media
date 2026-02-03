"use client";

import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import ProviderSession from "./ProviderSession";
import { SocketProvider } from "./SocketContext";

interface Props {
  children: ReactNode;
}

export default function Providers({ children }: Props) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ProviderSession>
        <SocketProvider>
          {/* 1. Main Application Content */}
          {children}
        </SocketProvider>
      </ProviderSession>
    </QueryClientProvider>
  );
}
