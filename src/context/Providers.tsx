"use client";

import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import ProviderSession from "./ProviderSession";
import { SocketProvider } from "./SocketContext";
import Snowfall from "react-snowfall";

interface Props {
  children: ReactNode;
}

export default function Providers({ children }: Props) {
  // Using useState ensures QueryClient is only initialized once per browser session
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            // Adding retry: false or 1 can be helpful for debugging socket-related queries
            retry: 1, 
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ProviderSession>
        {/* SocketProvider must be inside ProviderSession to access useSession() */}
        <SocketProvider>
<Snowfall 
        snowflakeCount={150} // 1000 might be heavy on performance, 200-400 is usually plenty
        color="#fff" 
        style={{
          position: 'fixed',
          width: '100vw',
          height: '100vh',
          zIndex: 0, // Set to 0 and ensure card is z-10
        }} 
      />          {children}
        </SocketProvider>
      </ProviderSession>
    </QueryClientProvider>
  );
}