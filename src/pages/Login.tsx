import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SentinelLogo } from "@/components/SentinelLogo";
import { setRole, type Role } from "@/lib/auth";
import { User, ShieldCheck, Radio, Settings2 } from "lucide-react";
import { toast } from "sonner";

const roles: { id: Role; title: string; desc: string; icon: typeof User; redirect: string }[] = [
  { id: "guest", title: "Guest", desc: "Trigger SOS, get safe route", icon: User, redirect: "/sos" },
  { id: "staff", title: "Staff", desc: "Monitor incidents live", icon: ShieldCheck, redirect: "/dashboard" },
  { id: "responder", title: "Responder", desc: "Receive & resolve incidents", icon: Radio, redirect: "/responder" },
  { id: "admin", title: "Admin", desc: "Configure venue & policies", icon: Settings2, redirect: "/settings" },
];

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("demo@sentinel.app");
  const [name, setName] = useState("Olivia Carter");
  const [selected, setSelected] = useState<Role>("guest");

  const handleEnter = () => {
    const r = roles.find((x) => x.id === selected)!;
    setRole(selected, name || email);
    toast.success(`Signed in as ${r.title}`);
    navigate(r.redirect);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: brand panel */}
      <div className="relative hidden bg-gradient-hero p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <SentinelLogo />
        <div className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">A calm system for the worst moments.</h2>
          <p className="max-w-md text-primary-foreground/80">
            Sentinel coordinates guests, staff, and responders into one fast, reliable response — so your team can focus on people, not phones.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/60">Demo mode · no real account required</p>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-elegant">
          <CardHeader>
            <div className="mb-2 lg:hidden"><SentinelLogo /></div>
            <CardTitle className="text-2xl">Sign in to Sentinel</CardTitle>
            <CardDescription>Pick a role to explore the prototype.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((r) => {
                  const active = selected === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelected(r.id)}
                      className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-base ${
                        active
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border hover:border-primary/40 hover:bg-muted/40"
                      }`}
                    >
                      <r.icon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{r.title}</span>
                      <span className="text-[11px] text-muted-foreground">{r.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={handleEnter}>
              Continue
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              By continuing you agree to demo terms. No data leaves your browser.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
