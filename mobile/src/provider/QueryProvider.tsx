import { QueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import React from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      gcTime: 1000 * 60 * 60 * 24, // Keep unused data in cache for 24 hours
      staleTime: 1000 * 60 * 5,    // Data is considered fresh for 5 minutes
    },
  },
});

// Shared instance so auth flows (login/logout) can purge per-user cached
// queries outside of React components.
export { queryClient };

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

export const QueryProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      {children}
    </PersistQueryClientProvider>
  );
};
