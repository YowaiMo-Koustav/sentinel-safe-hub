import { LayoutDashboard, AlertTriangle, Radio, Map, Settings, Siren, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { SentinelLogo } from "./SentinelLogo";
import { useAuth } from "@/lib/useAuth";
import { clearAuth, roleLabel, type Role } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

type Item = { title: string; url: string; icon: typeof Siren; roles: Role[] };

const items: Item[] = [
  { title: "Guest SOS", url: "/sos", icon: Siren, roles: ["guest", "staff", "responder", "admin"] },
  { title: "Staff Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ["staff", "admin"] },
  { title: "Responder", url: "/responder", icon: Radio, roles: ["responder", "admin"] },
  { title: "Incidents", url: "/incidents/INC-2041", icon: AlertTriangle, roles: ["staff", "responder", "admin"] },
  { title: "Evacuation", url: "/evacuation", icon: Map, roles: ["guest", "staff", "responder", "admin"] },
  { title: "Settings", url: "/settings", icon: Settings, roles: ["admin"] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { role, name } = useAuth();
  const navigate = useNavigate();

  const visible = items.filter((i) => !role || i.roles.includes(role));

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        {collapsed ? <SentinelLogo showText={false} /> : <SentinelLogo />}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Operations</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {visible.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/sos"}
                      className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-base"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!collapsed && role && (
          <div className="mb-2 rounded-md bg-sidebar-accent/40 px-3 py-2">
            <p className="text-xs text-sidebar-foreground/70">Signed in as</p>
            <p className="truncate text-sm font-medium text-sidebar-accent-foreground">{name}</p>
            <p className="text-xs text-sidebar-primary">{roleLabel(role)}</p>
          </div>
        )}
        {role && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => {
              clearAuth();
              navigate("/");
            }}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Sign out</span>}
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
