import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { StatusChip } from "@/components/StatusChip";
import { toast } from "sonner";

const Settings = () => {
  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Venue & policy settings"
        description="Configure your venue, escalation, and integrations."
        actions={<StatusChip label="Aurora Grand · 412 guests" tone="info" />}
      />

      <div className="grid gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Venue profile</CardTitle>
            <CardDescription>Basic information shown to staff and responders.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Venue name</Label>
              <Input defaultValue="Aurora Grand Hotel & Spa" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Floors</Label>
                <Input defaultValue="22" />
              </div>
              <div className="space-y-2">
                <Label>Rooms</Label>
                <Input defaultValue="486" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Primary assembly point</Label>
              <Input defaultValue="Garden Lawn · East entrance" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Escalation policy</CardTitle>
            <CardDescription>Auto-escalate when responders don't acknowledge.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Toggle label="Auto-dispatch nearest responder" defaultChecked />
            <Toggle label="Escalate to duty manager after 60s" defaultChecked />
            <Toggle label="Notify external emergency services on critical" defaultChecked />
            <Toggle label="Broadcast evacuation route to all guests" />
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Integrations</CardTitle>
            <CardDescription>Connect sensors, PMS, and communication tools.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: "Smoke & CO sensors", status: "184 online", tone: "success" as const },
              { name: "Door access system", status: "Connected", tone: "success" as const },
              { name: "Property Management System", status: "Connected", tone: "success" as const },
              { name: "Local emergency dispatch", status: "Standby", tone: "warning" as const },
            ].map((i) => (
              <div key={i.name} className="flex items-center justify-between rounded-lg border bg-card p-3">
                <p className="text-sm font-medium">{i.name}</p>
                <StatusChip label={i.status} tone={i.tone} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Demo mode</CardTitle>
            <CardDescription>Run a scripted scenario for presentations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Toggle label="Enable demo data" defaultChecked />
            <Toggle label="Auto-resolve incidents after 5 min" />
            <Button onClick={() => toast.success("Demo scenario armed")}>Run demo scenario</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function Toggle({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-3">
      <span className="text-sm">{label}</span>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}

export default Settings;
