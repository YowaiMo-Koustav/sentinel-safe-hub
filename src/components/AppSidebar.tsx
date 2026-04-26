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
import { useExpressAuth, ROLE_LABELS, type AppRole } from "@/lib/ExpressAuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "./RoleBadge";

type Item = { title: string; url: string; icon: typeof Siren; roles: AppRole[] };

const items: Item[] = [
  { title: "Guest SOS", url: "/sos", icon: Siren, roles: ["guest", "staff", "responder", "admin"] },
  { title: "Staff Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ["staff", "admin"] },
  { title: "Responder", url: "/responder", icon: Radio, roles: ["responder", "admin"] },
  { title: "Incidents", url: "/dashboard", icon: AlertTriangle, roles: ["staff", "responder", "admin"] },
  { title: "Evacuation", url: "/evacuation", icon: Map, roles: ["guest", "staff", "responder", "admin"] },
  { title: "Settings", url: "/settings", icon: Settings, roles: ["admin"] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { roles, primaryRole, displayName, signOut } = useExpressAuth();
  const navigate = useNavigate();

  const visible = items.filter((i) =>
    roles.length === 0 ? false : i.roles.some((r) => roles.includes(r)),
  );

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
        {!collapsed && primaryRole && (
          <div className="mb-2 rounded-md bg-sidebar-accent/40 px-3 py-2">
            <p className="text-xs text-sidebar-foreground/70">Signed in as</p>
            <p className="truncate text-sm font-medium text-sidebar-accent-foreground">
              {displayName || "User"}
            </p>
            <p className="text-xs text-sidebar-primary">{ROLE_LABELS[primaryRole]}</p>
          </div>
        )}
        {primaryRole && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={async () => {
              await signOut();
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
