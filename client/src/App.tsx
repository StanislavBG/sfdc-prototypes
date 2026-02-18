import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Layout from "@/components/salesforce/Layout";
import AuthGate from "@/components/AuthGate";

function App() {
  return (
    <AuthGate>
      <QueryClientProvider client={queryClient}>
        <Toaster />
        <Layout />
      </QueryClientProvider>
    </AuthGate>
  );
}

export default App;
