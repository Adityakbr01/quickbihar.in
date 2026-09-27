import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      gcTime: 1000 * 60 * 60 * 24, // Keep unused data in cache for 24 hours
      staleTime: 1000 * 60 * 5,    // Data is considered fresh for 5 minutes
    },
  },
});
