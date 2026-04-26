import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
import P2PTest from "./components/test/P2PTest";
import EvacuationTest from "./components/test/EvacuationTest";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />

            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* All signed-in users */}
              <Route path="/sos" element={<GuestSOS />} />
              <Route path="/evacuation" element={<Evacuation />} />
              <Route path="/test-evacuation" element={<EvacuationTest />} />
              <Route path="/test-p2p" element={<P2PTest />} />

              {/* Staff + admin */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allow={["staff"]}>
                    <StaffDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Responder + admin */}
              <Route
                path="/responder"
                element={
                  <ProtectedRoute allow={["responder"]}>
                    <ResponderView />
                  </ProtectedRoute>
                }
              />

              {/* Staff, responder, admin */}
              <Route
                path="/incidents/:id"
                element={
                  <ProtectedRoute allow={["staff", "responder"]}>
                    <IncidentDetail />
                  </ProtectedRoute>
                }
              />

              {/* Admin only */}
              <Route
                path="/settings"
                element={
                  <ProtectedRoute allow={["admin"]}>
                    <Settings />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
