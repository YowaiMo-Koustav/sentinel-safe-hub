import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { useAuth, defaultRouteForRole, type AppRole } from "@/lib/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SentinelLogo } from "@/components/SentinelLogo";
import { User, ShieldCheck, Radio, Settings2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

const roleOptions: { id: AppRole; title: string; desc: string; icon: typeof User }[] = [
  { id: "guest", title: "Guest", desc: "Trigger SOS", icon: User },
  { id: "staff", title: "Staff", desc: "Monitor incidents", icon: ShieldCheck },
  { id: "responder", title: "Responder", desc: "Resolve incidents", icon: Radio },
  { id: "admin", title: "Admin", desc: "Full control", icon: Settings2 },
];

const signInSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(72),
});

const signUpSchema = signInSchema.extend({
  name: z.string().trim().min(1, "Name required").max(100),
  role: z.enum(["guest", "staff", "responder", "admin"]),
});

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const { user, primaryRole, loading, signIn } = useAuth();

  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [submitting, setSubmitting] = useState(false);

  // Sign in
  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");

  // Sign up
  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suRole, setSuRole] = useState<AppRole>("guest");

  // Redirect if already signed in
  useEffect(() => {
    if (!loading && user && primaryRole) {
      navigate(location.state?.from || defaultRouteForRole(primaryRole), { replace: true });
    }
  }, [loading, user, primaryRole, navigate, location.state]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signInSchema.safeParse({ email: siEmail, password: siPassword });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    try {
      await signIn(parsed.data.email, parsed.data.password);
      toast.success("Welcome back");
    } catch (error) {
      toast.error("Wrong email or password");
    }
    setSubmitting(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signUpSchema.safeParse({
      name: suName, email: suEmail, password: suPassword, role: suRole,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    try {
      // Real signup using our API
      const response = await apiClient.register(
        parsed.data.email, 
        parsed.data.password, 
        parsed.data.name, 
        parsed.data.role
      );
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // After successful registration, sign in
      await signIn(parsed.data.email, parsed.data.password);
      toast.success("Account created and logged in");
    } catch (error) {
      toast.error("Failed to create account");
    }
    setSubmitting(false);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden bg-gradient-hero p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <SentinelLogo />
        <div className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">A calm system for the worst moments.</h2>
          <p className="max-w-md text-primary-foreground/80">
            Sentinel coordinates guests, staff, and responders into one fast, reliable response — so your team can focus on people, not phones.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/60">Project Sentinel · Google Solution Challenge 2026</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-elegant">
          <CardHeader>
            <div className="mb-2 lg:hidden"><SentinelLogo /></div>
            <CardTitle className="text-2xl">Sentinel access</CardTitle>
            <CardDescription>Sign in or create an account to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-5">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="si-email">Email</Label>
                    <Input id="si-email" type="email" autoComplete="email"
                      value={siEmail} onChange={(e) => setSiEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="si-pass">Password</Label>
                    <Input id="si-pass" type="password" autoComplete="current-password"
                      value={siPassword} onChange={(e) => setSiPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Sign in
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-5">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="su-name">Name</Label>
                    <Input id="su-name" value={suName} onChange={(e) => setSuName(e.target.value)} required maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-email">Email</Label>
                    <Input id="su-email" type="email" autoComplete="email"
                      value={suEmail} onChange={(e) => setSuEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-pass">Password</Label>
                    <Input id="su-pass" type="password" autoComplete="new-password" minLength={6}
                      value={suPassword} onChange={(e) => setSuPassword(e.target.value)} required />
                    <p className="text-xs text-muted-foreground">At least 6 characters.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {roleOptions.map((r) => {
                        const active = suRole === r.id;
                        return (
                          <button
                            type="button"
                            key={r.id}
                            onClick={() => setSuRole(r.id)}
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
                  <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Create account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
