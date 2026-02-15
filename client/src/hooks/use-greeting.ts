import { useQuery } from "@tanstack/react-query";

// Define the API contract locally since shared/routes might not be fully populated in this context
// In a real scenario, we would import from @shared/routes
const API_ENDPOINT = "/api/greeting";

interface GreetingResponse {
  message: string;
}

export function useGreeting() {
  return useQuery({
    queryKey: [API_ENDPOINT],
    queryFn: async () => {
      const res = await fetch(API_ENDPOINT);
      if (!res.ok) {
        throw new Error("Failed to fetch greeting");
      }
      return (await res.json()) as GreetingResponse;
    },
    // Keep data fresh but don't refetch too aggressively
    staleTime: 1000 * 60, 
  });
}
