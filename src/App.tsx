import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "./components/AppLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import GuestSOS from "./pages/GuestSOS";
import StaffDashboard from "./pages/StaffDashboard";
import ResponderView from "./pages/ResponderView";
import IncidentDetail from "./pages/IncidentDetail";
import Evacuation from "./pages/Evacuation";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route element={<AppLayout />}>
            <Route path="/sos" element={<GuestSOS />} />
            <Route path="/dashboard" element={<StaffDashboard />} />
            <Route path="/responder" element={<ResponderView />} />
            <Route path="/incidents/:id" element={<IncidentDetail />} />
            <Route path="/evacuation" element={<Evacuation />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
