import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { Siren } from "lucide-react";
import { StatusChip } from "./StatusChip";
import { useAuth } from "@/lib/useAuth";

export default function AppLayout() {
  const navigate = useNavigate();
  const { isAuthed } = useAuth();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />

        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b bg-background/85 px-3 backdrop-blur sm:px-6">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <div className="hidden items-center gap-2 sm:flex">
                <StatusChip label="Venue: Aurora Grand · Online" tone="success" pulse />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isAuthed && (
                <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
                  Sign in
                </Button>
              )}
              <Button
                size="sm"
                className="bg-emergency text-emergency-foreground hover:bg-emergency/90 shadow-emergency"
                onClick={() => navigate("/sos")}
              >
                <Siren className="h-4 w-4" />
                <span className="hidden sm:inline">Emergency SOS</span>
              </Button>
            </div>
          </header>

          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
