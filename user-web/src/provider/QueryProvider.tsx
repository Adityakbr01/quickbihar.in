import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import React from "react";
import { queryClient } from "./queryClient";

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
