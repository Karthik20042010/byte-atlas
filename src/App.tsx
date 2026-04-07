import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import StorageDetail from "./pages/StorageDetail.tsx";
import DrivesDetail from "./pages/DrivesDetail.tsx";
import DuplicatesDetail from "./pages/DuplicatesDetail.tsx";
import VersionsDetail from "./pages/VersionsDetail.tsx";
import SharedFilesDetail from "./pages/SharedFilesDetail.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/storage" element={<StorageDetail />} />
          <Route path="/drives" element={<DrivesDetail />} />
          <Route path="/duplicates" element={<DuplicatesDetail />} />
          <Route path="/versions" element={<VersionsDetail />} />
          <Route path="/shared" element={<SharedFilesDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
