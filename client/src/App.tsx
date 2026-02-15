import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Layout from "@/components/salesforce/Layout";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Layout />
    </QueryClientProvider>
  );
}

export default App;
